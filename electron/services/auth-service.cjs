const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { app, safeStorage } = require("electron");

function createAuthService(config) {
  const sessionPath = path.join(app.getPath("userData"), "auth-session.bin");
  let session = null;
  let sessionLoaded = false;

  function isConfigured() {
    return Boolean(config.supabaseUrl && config.supabaseAnonKey);
  }

  function isLocalTestAuthEnabled() {
    return Boolean(config.localTestAuth) && !isConfigured();
  }

  function publicUser(user) {
    if (!user) return null;
    return {
      id: String(user.id || ""),
      email: String(user.email || ""),
      createdAt: user.created_at || null,
      lastSignInAt: user.last_sign_in_at || null,
      emailConfirmedAt: user.email_confirmed_at || user.confirmed_at || null
    };
  }

  function publicSession(authenticated, extra = {}) {
    return {
      configured: isConfigured(),
      localTestAuthEnabled: isLocalTestAuthEnabled(),
      authMode: isLocalTestAuthEnabled() || session?.localTest ? "local-test" : "cloud",
      authenticated: Boolean(authenticated),
      user: authenticated ? publicUser(session?.user) : null,
      ...extra
    };
  }

  function clearPersistedSession() {
    session = null;
    sessionLoaded = true;
    try {
      fs.rmSync(sessionPath, { force: true });
    } catch {
      // A failed cleanup should not keep the renderer signed in.
    }
  }

  function persistSession() {
    if (!session || !safeStorage.isEncryptionAvailable()) return;
    fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
    const encrypted = safeStorage.encryptString(JSON.stringify(session));
    fs.writeFileSync(sessionPath, encrypted);
  }

  function loadPersistedSession() {
    if (sessionLoaded) return session;
    sessionLoaded = true;
    if (!safeStorage.isEncryptionAvailable()) return null;
    try {
      const encrypted = fs.readFileSync(sessionPath);
      session = JSON.parse(safeStorage.decryptString(encrypted));
    } catch {
      session = null;
    }
    return session;
  }

  function normalizeSession(payload) {
    if (!payload?.access_token || !payload?.refresh_token) return null;
    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresAt: Number(payload.expires_at) || Math.floor(Date.now() / 1000) + Number(payload.expires_in || 3600),
      tokenType: payload.token_type || "bearer",
      user: payload.user || null
    };
  }

  function createLocalTestSession(email) {
    const normalizedEmail = String(email || "tester@wageclaw.local").trim().toLowerCase();
    const now = new Date().toISOString();
    const stableId = crypto.createHash("sha256").update(normalizedEmail).digest("hex").slice(0, 16);
    return {
      localTest: true,
      accessToken: `local-test.${stableId}`,
      refreshToken: `local-test-refresh.${stableId}`,
      expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
      tokenType: "bearer",
      user: {
        id: `local-test-${stableId}`,
        email: normalizedEmail,
        created_at: now,
        last_sign_in_at: now,
        email_confirmed_at: now
      }
    };
  }

  async function request(pathname, options = {}) {
    if (!isConfigured()) {
      throw new Error("云端登录尚未配置，请先填写 electron/app-config.json。");
    }

    const response = await fetch(`${config.supabaseUrl}/auth/v1${pathname}`, {
      ...options,
      headers: {
        apikey: config.supabaseAnonKey,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(
        data.msg
          || data.message
          || data.error_description
          || data.error
          || `身份服务请求失败 (${response.status})`
      );
    }
    return data;
  }

  async function refreshSession() {
    loadPersistedSession();
    if (!session?.refreshToken) return publicSession(false);
    const data = await request("/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: session.refreshToken })
    });
    session = normalizeSession(data);
    if (!session) throw new Error("身份服务没有返回有效会话。");
    persistSession();
    return publicSession(true);
  }

  async function validateSession() {
    loadPersistedSession();
    if (!session?.accessToken) return publicSession(false);

    if (session.localTest) {
      if (!isLocalTestAuthEnabled()) {
        clearPersistedSession();
        return publicSession(false);
      }
      return publicSession(true);
    }

    if (session.expiresAt <= Math.floor(Date.now() / 1000) + 60) {
      return refreshSession();
    }

    try {
      const user = await request("/user", {
        method: "GET",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      session.user = user;
      persistSession();
      return publicSession(true);
    } catch (error) {
      if (!session.refreshToken) throw error;
      return refreshSession();
    }
  }

  async function getSession() {
    if (!isConfigured() && !isLocalTestAuthEnabled()) return publicSession(false);
    try {
      return await validateSession();
    } catch (error) {
      return publicSession(false, { error: error.message });
    }
  }

  async function signUp({ email, password }) {
    if (isLocalTestAuthEnabled()) {
      if (!String(email || "").trim() || String(password || "").length < 6) {
        throw new Error("Local test login requires an email and a password with at least 6 characters.");
      }
      session = createLocalTestSession(email);
      sessionLoaded = true;
      persistSession();
      return publicSession(true, { localTest: true });
    }

    const data = await request("/signup", {
      method: "POST",
      body: JSON.stringify({
        email: String(email || "").trim(),
        password: String(password || "")
      })
    });
    const nextSession = normalizeSession(data);
    if (nextSession) {
      session = nextSession;
      sessionLoaded = true;
      persistSession();
      return publicSession(true, { requiresEmailConfirmation: false });
    }
    return publicSession(false, {
      user: publicUser(data.user),
      requiresEmailConfirmation: Boolean(data.user)
    });
  }

  async function signIn({ email, password }) {
    if (isLocalTestAuthEnabled()) {
      if (!String(email || "").trim() || String(password || "").length < 6) {
        throw new Error("Local test login requires an email and a password with at least 6 characters.");
      }
      session = createLocalTestSession(email);
      sessionLoaded = true;
      persistSession();
      return publicSession(true, { localTest: true });
    }

    const data = await request("/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({
        email: String(email || "").trim(),
        password: String(password || "")
      })
    });
    session = normalizeSession(data);
    sessionLoaded = true;
    if (!session) throw new Error("登录成功，但身份服务没有返回有效会话。");
    persistSession();
    return publicSession(true);
  }

  async function signOut() {
    loadPersistedSession();
    try {
      if (session?.accessToken && isConfigured()) {
        await request("/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
      }
    } finally {
      clearPersistedSession();
    }
    return publicSession(false);
  }

  async function requestPasswordReset(email) {
    if (isLocalTestAuthEnabled()) {
      return { ok: true, localTest: true };
    }

    await request("/recover", {
      method: "POST",
      body: JSON.stringify({ email: String(email || "").trim() })
    });
    return { ok: true };
  }

  return {
    getSession,
    signUp,
    signIn,
    signOut,
    requestPasswordReset
  };
}

module.exports = { createAuthService };
