<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { AuthSessionState } from "./auth-types";

const mode = ref<"login" | "register">("login");
const form = reactive({
  email: "",
  password: "",
  confirmPassword: ""
});
const busy = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const sessionState = ref<AuthSessionState | null>(null);

const canSubmit = computed(() => {
  if (!form.email.trim() || form.password.length < 6) return false;
  return mode.value === "login" || form.password === form.confirmPassword;
});

const localTestAuthEnabled = computed(() => Boolean(sessionState.value?.localTestAuthEnabled));

onMounted(async () => {
  if (!window.wageclawDesktop) return;
  sessionState.value = await window.wageclawDesktop.authGetSession();
});

function switchMode(nextMode: "login" | "register") {
  mode.value = nextMode;
  errorMessage.value = "";
  successMessage.value = "";
}

async function submit() {
  if (!window.wageclawDesktop || !canSubmit.value || busy.value) return;
  errorMessage.value = "";
  successMessage.value = "";
  busy.value = true;
  try {
    const payload = { email: form.email.trim(), password: form.password };
    const result = mode.value === "login"
      ? await window.wageclawDesktop.authSignIn(payload)
      : await window.wageclawDesktop.authSignUp(payload);

    if (result.authenticated) {
      window.location.reload();
      return;
    }

    if (result.requiresEmailConfirmation) {
      switchMode("login");
      successMessage.value = "注册成功。请先打开邮箱完成验证，再回来登录。";
      return;
    }
    errorMessage.value = result.error || "身份校验没有完成，请稍后重试。";
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "身份服务暂时不可用。";
  } finally {
    busy.value = false;
  }
}

async function quickLocalLogin() {
  if (!window.wageclawDesktop || busy.value) return;
  errorMessage.value = "";
  successMessage.value = "";
  busy.value = true;
  try {
    const result = await window.wageclawDesktop.authSignIn({
      email: "tester@wageclaw.local",
      password: "test1234"
    });
    if (result.authenticated) {
      window.location.reload();
      return;
    }
    errorMessage.value = result.error || "本地测试登录失败。";
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "本地测试登录失败。";
  } finally {
    busy.value = false;
  }
}

async function resetPassword() {
  if (!window.wageclawDesktop || !form.email.trim() || busy.value) {
    errorMessage.value = "请先填写注册邮箱。";
    return;
  }
  busy.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    await window.wageclawDesktop.authRequestPasswordReset(form.email.trim());
    successMessage.value = localTestAuthEnabled.value
      ? "本地测试模式不需要重置密码。"
      : "重置邮件已发送，请检查邮箱。";
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "重置邮件发送失败。";
  } finally {
    busy.value = false;
  }
}

function minimizeWindow() {
  window.wageclawDesktop?.minimizeMainWindow();
}

function closeWindow() {
  window.wageclawDesktop?.closeMainWindow();
}
</script>

<template>
  <main class="auth-shell">
    <div class="auth-window-controls">
      <button type="button" title="最小化" @click="minimizeWindow">-</button>
      <button type="button" title="关闭" @click="closeWindow">×</button>
    </div>

    <section class="auth-brand">
      <div class="auth-logo">W</div>
      <span>WAGECLAW DESKTOP</span>
      <h1>先确认是你，再开始记录这一班。</h1>
      <p>账号只用于云端身份校验。工资、心愿、账本和桌宠进度仍然保存在这台电脑，并按账号彼此隔离。</p>
      <div class="auth-privacy-note">
        <strong>本地优先</strong>
        <span>业务数据不会随登录自动上传。</span>
      </div>
    </section>

    <section class="auth-card">
      <header>
        <span>{{ mode === "login" ? "欢迎回来" : "创建账号" }}</span>
        <h2>{{ mode === "login" ? "登录 WageClaw" : "注册 WageClaw" }}</h2>
      </header>

      <div class="auth-tabs">
        <button type="button" :class="{ active: mode === 'login' }" @click="switchMode('login')">登录</button>
        <button type="button" :class="{ active: mode === 'register' }" @click="switchMode('register')">注册</button>
      </div>

      <div v-if="localTestAuthEnabled" class="auth-message success" role="status">
        本地测试登录已启用：不会连接云端，任意邮箱 + 6 位以上密码都可进入。
      </div>

      <form @submit.prevent="submit">
        <label>
          <span>邮箱</span>
          <input v-model="form.email" type="email" autocomplete="email" placeholder="name@example.com" required />
        </label>
        <label>
          <span>密码</span>
          <input
            v-model="form.password"
            type="password"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            placeholder="至少 6 位"
            minlength="6"
            required
          />
        </label>
        <label v-if="mode === 'register'">
          <span>确认密码</span>
          <input v-model="form.confirmPassword" type="password" autocomplete="new-password" minlength="6" required />
        </label>

        <p v-if="errorMessage" class="auth-message error" role="alert">{{ errorMessage }}</p>
        <p v-if="successMessage" class="auth-message success" role="status">{{ successMessage }}</p>

        <button class="auth-submit" type="submit" :disabled="!canSubmit || busy">
          {{ busy ? "正在校验..." : mode === "login" ? "登录并进入" : "注册账号" }}
        </button>
      </form>

      <button
        v-if="localTestAuthEnabled"
        class="auth-reset"
        type="button"
        :disabled="busy"
        @click="quickLocalLogin"
      >
        使用本地测试账号进入
      </button>

      <button v-if="mode === 'login'" class="auth-reset" type="button" :disabled="busy" @click="resetPassword">
        忘记密码？发送重置邮件
      </button>
    </section>
  </main>
</template>
