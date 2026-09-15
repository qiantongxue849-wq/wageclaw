const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function trimTrailingSlash(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function readBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function loadRuntimeConfig({ app, resourcesPath = process.resourcesPath }) {
  const bundledConfig = readJson(path.join(__dirname, "app-config.json"));
  const externalConfig = app.isPackaged
    ? readJson(path.join(resourcesPath, "app-config.json"))
    : {};

  return {
    supabaseUrl: trimTrailingSlash(
      process.env.WAGECLAW_SUPABASE_URL
        || externalConfig.supabaseUrl
        || bundledConfig.supabaseUrl
    ),
    supabaseAnonKey: String(
      process.env.WAGECLAW_SUPABASE_ANON_KEY
        || externalConfig.supabaseAnonKey
        || bundledConfig.supabaseAnonKey
        || ""
    ).trim(),
    localTestAuth: readBoolean(
      process.env.WAGECLAW_LOCAL_TEST_AUTH
        ?? externalConfig.localTestAuth
        ?? bundledConfig.localTestAuth,
      false
    ),
    updateUrl: trimTrailingSlash(
      process.env.WAGECLAW_UPDATE_URL
        || externalConfig.updateUrl
        || bundledConfig.updateUrl
    ),
    updateChannel: String(
      process.env.WAGECLAW_UPDATE_CHANNEL
        || externalConfig.updateChannel
        || bundledConfig.updateChannel
        || "latest"
    ).trim()
  };
}

module.exports = { loadRuntimeConfig };
