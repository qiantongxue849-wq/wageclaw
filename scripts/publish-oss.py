"""Publish immutable NSIS payloads before atomically replacing the update feed."""
import base64
import hashlib
import os
from pathlib import Path
import re
from urllib.request import Request, urlopen

import oss2
import yaml


def version_tuple(value):
    if not re.fullmatch(r"\d+\.\d+\.\d+", str(value)):
        raise ValueError("Only stable numeric versions can be published")
    return tuple(map(int, str(value).split(".")))


def payloads(directory, manifest):
    version_tuple(manifest["version"])
    files = manifest.get("files", [])
    if len(files) != 1:
        raise ValueError("Expected exactly one Windows x64 installer")
    entry = files[0]
    name = entry["url"]
    if name != f'WageClaw-Setup-{manifest["version"]}.exe':
        raise ValueError("Installer filename must match manifest version")
    installer = directory / name
    digest = hashlib.sha512()
    with installer.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    checksum = base64.b64encode(digest.digest()).decode()
    if checksum != entry["sha512"] or installer.stat().st_size != entry["size"]:
        raise ValueError("Installer hash or size does not match latest.yml")
    blockmap = directory / (name + ".blockmap")
    if not blockmap.is_file():
        raise ValueError("Missing installer blockmap")
    return [installer, blockmap]


def publish(bucket, directory, prefix, public_url, probe=None):
    manifest_path = directory / "latest.yml"
    manifest = yaml.safe_load(manifest_path.read_text(encoding="utf8"))
    artifacts = payloads(directory, manifest)
    prefix = prefix.strip("/")
    if not prefix or any(part in (".", "..") for part in prefix.split("/")):
        raise ValueError("OSS_PREFIX must be an explicit folder")
    if not public_url.startswith("https://"):
        raise ValueError("Update URL must use HTTPS")
    key = lambda name: f"{prefix}/{name}"
    manifest_key = key("latest.yml")
    try:
        previous = yaml.safe_load(bucket.get_object(manifest_key).read())
    except oss2.exceptions.NoSuchKey:
        previous = None
    if previous and version_tuple(previous["version"]) > version_tuple(manifest["version"]):
        raise ValueError("Refusing to replace the feed with an older version")
    for artifact in artifacts:
        digest = hashlib.sha512(artifact.read_bytes()).hexdigest()
        artifact_key = key(artifact.name)
        if bucket.object_exists(artifact_key):
            headers = bucket.head_object(artifact_key).headers
            if headers.get("x-oss-meta-sha512") != digest:
                raise ValueError(f"Immutable artifact already exists with different bytes: {artifact.name}")
        else:
            bucket.put_object_from_file(artifact_key, str(artifact), headers={
                "Cache-Control": "public, max-age=31536000, immutable",
                "Content-Type": "application/octet-stream",
                "x-oss-meta-sha512": digest,
            })
        # Check the public route before announcing a version to installed clients.
        url = public_url.rstrip("/") + "/" + artifact.name
        if probe:
            probe(url, artifact.stat().st_size)
        else:
            with urlopen(Request(url, method="HEAD"), timeout=30) as response:
                if response.status != 200 or int(response.headers.get("Content-Length", -1)) != artifact.stat().st_size:
                    raise ValueError(f"Public download route is not ready: {artifact.name}")
    bucket.put_object_from_file(manifest_key, str(manifest_path), headers={
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/yaml; charset=utf-8",
    })
    print(f'Published Windows version {manifest["version"]}')


def main():
    required = ["OSS_ENDPOINT", "OSS_BUCKET", "OSS_PREFIX", "WAGECLAW_UPDATE_URL", "OSS_ACCESS_KEY_ID", "OSS_ACCESS_KEY_SECRET"]
    config = {name: os.environ.get(name, "").strip() for name in required}
    missing = [name for name, value in config.items() if not value]
    if missing:
        raise ValueError("Missing release configuration: " + ", ".join(missing))
    if not config["OSS_ENDPOINT"].startswith("https://"):
        raise ValueError("OSS_ENDPOINT must use HTTPS")
    bucket = oss2.Bucket(oss2.Auth(config["OSS_ACCESS_KEY_ID"], config["OSS_ACCESS_KEY_SECRET"]), config["OSS_ENDPOINT"], config["OSS_BUCKET"])
    publish(bucket, Path("release"), config["OSS_PREFIX"], config["WAGECLAW_UPDATE_URL"])


if __name__ == "__main__":
    main()
