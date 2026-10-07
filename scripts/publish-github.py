"""Use the runner's GitHub CLI to publish a verified release atomically."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess

import yaml

spec = importlib.util.spec_from_file_location("publish_oss", Path(__file__).with_name("publish-oss.py"))
shared = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shared)


def gh(args, optional=False):
    result = subprocess.run(["gh", *args], capture_output=True, text=True, check=False)
    if result.returncode:
        if optional and "404" in result.stderr:
            return None
        raise RuntimeError(result.stderr.strip() or "GitHub CLI failed")
    return json.loads(result.stdout) if result.stdout.strip().startswith(("{", "[")) else result.stdout.strip()


def publish(directory, repository, commit, command=gh):
    manifest = yaml.safe_load((directory / "latest.yml").read_text(encoding="utf8"))
    artifacts = [*shared.payloads(directory, manifest), directory / "latest.yml"]
    version = manifest["version"]
    previous = command(["api", f"repos/{repository}/releases/latest"], optional=True)
    if previous:
        previous_version = previous["tag_name"].removeprefix("desktop-v")
        if shared.version_tuple(previous_version) >= shared.version_tuple(version):
            raise ValueError("This version is already published or older than the latest release")
    tag = f"desktop-v{version}"
    # Pin the installer to its release tag. The /latest redirect may move while
    # an installed client is waiting for the user to accept an earlier update.
    installer_url = f"https://github.com/{repository}/releases/download/{tag}/{artifacts[0].name}"
    manifest["files"][0]["url"] = installer_url
    manifest["path"] = installer_url
    (directory / "latest.yml").write_text(yaml.safe_dump(manifest, sort_keys=False), encoding="utf8")
    # A failed upload leaves a draft. A new commit/run gets a fresh version/tag.
    command(["release", "create", tag, *map(str, artifacts), "--repo", repository,
             "--draft", "--target", commit, "--title", f"WageClaw {version}",
             "--notes", f"Windows x64 desktop release {version}. Source commit: {commit}. Install the setup EXE; existing configured clients receive an update notification."])
    # GitHub has not created the tag for a draft yet; the tag endpoint returns
    # 404. Find the just-created draft through the authenticated release list.
    releases = command(["api", f"repos/{repository}/releases?per_page=100"])
    drafts = [item for item in releases if item["tag_name"] == tag and item["draft"]]
    if len(drafts) != 1:
        raise ValueError("Expected exactly one matching draft release")
    release = drafts[0]
    assets = {asset["name"]: asset for asset in release["assets"]}
    if set(assets) != {artifact.name for artifact in artifacts}:
        raise ValueError("Draft release assets are incomplete")
    for artifact in artifacts:
        asset = assets[artifact.name]
        digest = "sha256:" + hashlib.sha256(artifact.read_bytes()).hexdigest()
        if asset["size"] != artifact.stat().st_size or asset.get("digest") != digest or asset["state"] != "uploaded":
            raise ValueError(f"Draft asset integrity check failed: {artifact.name}")
    command(["release", "edit", tag, "--repo", repository, "--draft=false", "--latest"])
    print(f"Published https://github.com/{repository}/releases/tag/{tag}")


if __name__ == "__main__":
    if not os.environ.get("GH_TOKEN"):
        raise ValueError("GH_TOKEN is required")
    publish(Path("release"), os.environ["GITHUB_REPOSITORY"], os.environ["GITHUB_SHA"])
