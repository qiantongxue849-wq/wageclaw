const fs = require("fs");
const path = require("path");
const ResEdit = require("resedit");

function normalizeVersion(version) {
  const parts = String(version || "0.0.0")
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));

  while (parts.length < 4) {
    parts.push(0);
  }

  return parts.slice(0, 4).join(".");
}

function updateVersionInfo(resource, appInfo, exeName) {
  const versionInfo = ResEdit.Resource.VersionInfo.fromEntries(resource.entries)[0];
  if (!versionInfo) {
    return;
  }

  const language = versionInfo.getAvailableLanguages()[0] || { lang: 1033, codepage: 1200 };
  const appVersion = normalizeVersion(appInfo.version || appInfo.buildVersion);

  versionInfo.setFileVersion(appVersion, language.lang);
  versionInfo.setProductVersion(appVersion, language.lang);
  versionInfo.setStringValues(language, {
    CompanyName: appInfo.companyName || appInfo.author || appInfo.productName,
    FileDescription: appInfo.productName,
    FileVersion: appVersion,
    InternalName: exeName,
    LegalCopyright: appInfo.copyright || "",
    OriginalFilename: exeName,
    ProductName: appInfo.productName,
    ProductVersion: appVersion,
  });
  versionInfo.outputToResourceEntries(resource.entries);
}

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") {
    return;
  }

  const appInfo = context.packager.appInfo;
  const exeName = `${appInfo.productFilename}.exe`;
  const exePath = path.join(context.appOutDir, exeName);
  const iconPath = path.join(context.packager.projectDir, "electron", "assets", "app-icon.ico");

  const executable = ResEdit.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
  const resource = ResEdit.NtExecutableResource.from(executable);
  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconPath));
  const iconGroups = ResEdit.Resource.IconGroupEntry.fromEntries(resource.entries);
  const iconGroup = iconGroups[0] || { id: 1, lang: 1033 };

  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    resource.entries,
    iconGroup.id,
    iconGroup.lang,
    iconFile.icons.map((icon) => icon.data)
  );

  updateVersionInfo(resource, appInfo, exeName);
  resource.outputResource(executable);
  fs.writeFileSync(exePath, Buffer.from(executable.generate()));
};
