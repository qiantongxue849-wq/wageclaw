import base64
import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock

import yaml

spec = importlib.util.spec_from_file_location("publish_github", Path(__file__).resolve().parents[1] / "scripts/publish-github.py")
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class GitHubPublishTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        data = b"installer"
        name = "WageClaw-Setup-0.3.2.exe"
        (self.root / name).write_bytes(data)
        (self.root / (name + ".blockmap")).write_bytes(b"blockmap")
        manifest = {"version": "0.3.2", "files": [{"url": name, "sha512": base64.b64encode(hashlib.sha512(data).digest()).decode(), "size": len(data)}]}
        (self.root / "latest.yml").write_text(yaml.safe_dump(manifest))
        self.bad_digest = False
        self.command = Mock(side_effect=self.reply)

    def reply(self, args, **_kwargs):
        if args[0] == "api" and "?per_page=100" in args[1]:
            assets = [{"name": file.name, "size": file.stat().st_size, "state": "uploaded", "digest": "sha256:" + hashlib.sha256(file.read_bytes()).hexdigest()} for file in self.root.iterdir()]
            if self.bad_digest:
                assets[0]["digest"] = "bad"
            return [{"tag_name": "unrelated", "draft": True, "assets": []}, {"tag_name": "desktop-v0.3.2", "draft": True, "assets": assets}]
        return None

    def publish(self):
        release.publish(self.root, "owner/repo", "test-commit", self.command)

    def test_publishes_only_after_validating_all_draft_assets(self):
        self.publish()
        calls = self.command.call_args_list
        self.assertIn("--draft", calls[1].args[0])
        self.assertIn("test-commit", calls[1].args[0])
        self.assertEqual(calls[-1].args[0][:3], ["release", "edit", "desktop-v0.3.2"])
        self.assertIn("--draft=false", calls[-1].args[0])
        manifest = yaml.safe_load((self.root / "latest.yml").read_text())
        self.assertEqual(manifest["files"][0]["url"], "https://github.com/owner/repo/releases/download/desktop-v0.3.2/WageClaw-Setup-0.3.2.exe")

    def test_failed_upload_does_not_publish(self):
        self.command.side_effect = [None, RuntimeError("upload failed")]
        with self.assertRaises(RuntimeError):
            self.publish()
        self.assertEqual(self.command.call_count, 2)

    def test_missing_draft_does_not_publish(self):
        self.command.side_effect = [None, "", []]
        with self.assertRaises(ValueError):
            self.publish()
        self.assertEqual(self.command.call_count, 3)

    def test_invalid_remote_asset_does_not_publish(self):
        self.bad_digest = True
        with self.assertRaises(ValueError):
            self.publish()
        self.assertEqual(self.command.call_count, 3)

    def test_old_version_does_not_create_a_release(self):
        self.command.side_effect = [{"tag_name": "desktop-v0.3.3"}]
        with self.assertRaises(ValueError):
            self.publish()
        self.assertEqual(self.command.call_count, 1)

    def test_corrupt_local_installer_never_contacts_github(self):
        (self.root / "WageClaw-Setup-0.3.2.exe").write_bytes(b"corrupt")
        with self.assertRaises(ValueError):
            self.publish()
        self.command.assert_not_called()


if __name__ == "__main__":
    unittest.main()
