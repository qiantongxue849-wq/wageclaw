import base64
import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock

import oss2
import yaml

spec = importlib.util.spec_from_file_location("publish_oss", Path(__file__).resolve().parents[1] / "scripts/publish-oss.py")
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class PublishTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        self.addCleanup(self.directory.cleanup)
        name = "WageClaw-Setup-0.3.2.exe"
        self.data = b"installer fixture"
        (self.root / name).write_bytes(self.data)
        (self.root / (name + ".blockmap")).write_bytes(b"blockmap fixture")
        manifest = {"version": "0.3.2", "files": [{"url": name, "sha512": base64.b64encode(hashlib.sha512(self.data).digest()).decode(), "size": len(self.data)}]}
        (self.root / "latest.yml").write_text(yaml.safe_dump(manifest))
        self.bucket = Mock()
        self.bucket.get_object.side_effect = oss2.exceptions.NoSuchKey(404, {}, b"", {})
        self.bucket.object_exists.return_value = False

    def publish(self, probe=None):
        release.publish(self.bucket, self.root, "wageclaw/windows", "https://example.com/wageclaw/windows", probe or Mock())

    def test_manifest_is_uploaded_last_with_no_cache(self):
        self.publish()
        calls = self.bucket.put_object_from_file.call_args_list
        self.assertEqual([call.args[0] for call in calls], ["wageclaw/windows/WageClaw-Setup-0.3.2.exe", "wageclaw/windows/WageClaw-Setup-0.3.2.exe.blockmap", "wageclaw/windows/latest.yml"])
        self.assertIn("no-store", calls[-1].kwargs["headers"]["Cache-Control"])

    def test_corrupt_installer_is_rejected_before_any_upload(self):
        (self.root / "WageClaw-Setup-0.3.2.exe").write_bytes(b"broken")
        with self.assertRaises(ValueError):
            self.publish()
        self.bucket.put_object_from_file.assert_not_called()

    def test_failed_upload_keeps_previous_feed(self):
        self.bucket.put_object_from_file.side_effect = RuntimeError("upload failed")
        with self.assertRaises(RuntimeError):
            self.publish()
        self.assertEqual(self.bucket.put_object_from_file.call_count, 1)

    def test_failed_public_route_keeps_previous_feed(self):
        with self.assertRaises(RuntimeError):
            self.publish(Mock(side_effect=RuntimeError("download unavailable")))
        self.assertEqual(self.bucket.put_object_from_file.call_count, 1)

    def test_older_version_cannot_replace_newer_feed(self):
        self.bucket.get_object.side_effect = None
        self.bucket.get_object.return_value.read.return_value = b"version: 0.3.3"
        with self.assertRaises(ValueError):
            self.publish()
        self.bucket.put_object_from_file.assert_not_called()

    def test_retry_reuses_identical_artifacts(self):
        self.bucket.object_exists.return_value = True
        self.bucket.head_object.side_effect = lambda key: Mock(headers={"x-oss-meta-sha512": hashlib.sha512((self.root / key.split("/")[-1]).read_bytes()).hexdigest()})
        self.publish()
        self.assertEqual(self.bucket.put_object_from_file.call_count, 1)

    def test_retry_cannot_overwrite_different_installer(self):
        self.bucket.object_exists.return_value = True
        self.bucket.head_object.return_value.headers = {"x-oss-meta-sha512": "different"}
        with self.assertRaises(ValueError):
            self.publish()
        self.bucket.put_object_from_file.assert_not_called()


if __name__ == "__main__":
    unittest.main()
