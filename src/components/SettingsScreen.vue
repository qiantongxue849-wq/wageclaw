<script setup lang="ts">
import { computed, ref } from "vue";
import type { WageClawStore } from "@/composables/useWageClaw";
import type { AccountStore } from "@/composables/useAccountAndUpdates";
import { petStylePreview } from "@/data/pet-style-previews";
import { profileAvatarCopy } from "@/data/profile-avatars";
import type { PetStyle, Theme } from "@/types";
import settingsAppearanceIcon from "@/assets/settings-icons/settings-appearance.png";
import settingsDataIcon from "@/assets/settings-icons/settings-data.png";
import settingsPawIcon from "@/assets/settings-icons/settings-paw.png";
import settingsProfileIcon from "@/assets/settings-icons/settings-profile.png";
import settingsResetIcon from "@/assets/settings-icons/settings-reset.png";
import settingsWalletIcon from "@/assets/settings-icons/settings-wallet.png";

const props = defineProps<{ wc: WageClawStore; account: AccountStore }>();

const profileAvatar = computed(() => profileAvatarCopy[props.wc.state.theme]);

const backupFileInput = ref<HTMLInputElement | null>(null);

function onBackupFileChange(event: Event) {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  if (file) void props.wc.importBackup(file);
  input.value = "";
}

const themeEntries = computed(() => Object.entries(props.wc.themeLabels) as Array<[Theme, string]>);
const petStyleEntries = computed(() => Object.entries(props.wc.petStyleLabels) as Array<[PetStyle, string]>);
const modeEntries = computed(() => Object.entries(props.wc.modeLabels));

function focusNumberField(event: Event) {
  const host = event.currentTarget as HTMLElement | null;
  const input = host instanceof HTMLInputElement
    ? host
    : host?.querySelector<HTMLInputElement>('input[type="number"]');
  input?.focus({ preventScroll: true });
}

function openTimeFieldPicker(event: Event) {
  const host = event.currentTarget as HTMLElement | null;
  const input = host instanceof HTMLInputElement
    ? host
    : host?.querySelector<HTMLInputElement>('input[type="time"]');
  if (!input) return;
  input.focus({ preventScroll: true });
  try {
    (input as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
  } catch {
    // Older Electron builds only allow native pickers during direct pointer activation.
  }
}

function handleUpdateAction() {
  if (props.account.updateState.status === "available") {
    void props.account.downloadAndInstallUpdate();
    return;
  }
  void props.account.checkForUpdates();
}

function formatAccountDate(value: string | null | undefined) {
  if (!value) return "暂无记录";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "暂无记录" : date.toLocaleString("zh-CN");
}
</script>

<template>
<section v-show="wc.activeScreen === 'settings'" class="screen-grid settings-screen">
  <article class="settings-hero-panel">
    <div class="settings-hero-copy">
      <span class="eyebrow">基础设置</span>
      <h2>工位调校台</h2>
      <p>把工资、作息、主题和本地数据调成自己的节奏，别让应用反过来消耗你。</p>
    </div>
    <div class="settings-hero-profile">
      <img :src="profileAvatar.image" :alt="profileAvatar.title" draggable="false" />
      <div>
        <span>{{ wc.state.nickname }}</span>
        <strong>{{ profileAvatar.status }}</strong>
      </div>
    </div>
    <div class="settings-quick-grid" aria-label="当前设置摘要">
      <article>
        <span>工作节奏</span>
        <strong>{{ wc.state.startTime }} - {{ wc.state.endTime }}</strong>
      </article>
      <article>
        <span>计时口径</span>
        <strong>{{ wc.modeLabels[wc.state.countMode] }}</strong>
      </article>
      <article>
        <span>钱包余额</span>
        <strong>{{ wc.formatBalance(wc.walletCoins, 2) }}</strong>
      </article>
      <article>
        <span>爪币库存</span>
        <strong>{{ wc.formatPawCoins(wc.state.pawBalance) }}</strong>
      </article>
    </div>
  </article>

  <div class="segmented wide-tabs settings-tabs" aria-label="设置分组">
    <button type="button" :class="{ active: wc.settingsTab === 'account' }" @click="wc.settingsTab = 'account'">
      <span class="settings-tab-icon" aria-hidden="true">
        <img :src="settingsProfileIcon" alt="" draggable="false" />
      </span>
      <span>账号</span>
      <small>登录与版本</small>
    </button>
    <button type="button" :class="{ active: wc.settingsTab === 'profile' }" @click="wc.settingsTab = 'profile'">
      <span class="settings-tab-icon" aria-hidden="true">
        <img :src="settingsProfileIcon" alt="" draggable="false" />
      </span>
      <span>资料</span>
      <small>工资与作息</small>
    </button>
    <button type="button" :class="{ active: wc.settingsTab === 'appearance' }" @click="wc.settingsTab = 'appearance'">
      <span class="settings-tab-icon" aria-hidden="true">
        <img :src="settingsAppearanceIcon" alt="" draggable="false" />
      </span>
      <span>外观</span>
      <small>主题与桌宠</small>
    </button>
    <button type="button" :class="{ active: wc.settingsTab === 'prompts' }" @click="wc.settingsTab = 'prompts'">
      <span class="settings-tab-icon" aria-hidden="true">
        <img :src="settingsPawIcon" alt="" draggable="false" />
      </span>
      <span>提示</span>
      <small>语料与资讯</small>
    </button>
    <button type="button" :class="{ active: wc.settingsTab === 'data' }" @click="wc.settingsTab = 'data'">
      <span class="settings-tab-icon" aria-hidden="true">
        <img :src="settingsDataIcon" alt="" draggable="false" />
      </span>
      <span>数据</span>
      <small>余额与重置</small>
    </button>
  </div>

  <article v-show="wc.settingsTab === 'account'" class="panel-block settings-account-panel">
    <header class="settings-panel-head">
      <div>
        <span>账号与安全</span>
        <h3>云端校验，本地留存</h3>
      </div>
      <strong>{{ account.authSession.authenticated ? '已登录' : '未登录' }}</strong>
    </header>
    <div class="account-management-grid">
      <section class="account-management-card">
        <span>当前账号</span>
        <h4>{{ account.authSession.user?.email || '正在读取账号…' }}</h4>
        <dl>
          <div>
            <dt>用户 ID</dt>
            <dd>{{ account.authSession.user?.id || '—' }}</dd>
          </div>
          <div>
            <dt>注册时间</dt>
            <dd>{{ formatAccountDate(account.authSession.user?.createdAt) }}</dd>
          </div>
          <div>
            <dt>最近登录</dt>
            <dd>{{ formatAccountDate(account.authSession.user?.lastSignInAt) }}</dd>
          </div>
        </dl>
        <p>退出不会删除本机数据。再次登录同一账号后，会继续读取这个账号在本机的独立数据仓。</p>
        <button type="button" class="secondary-button" :disabled="account.accountBusy" @click="account.signOut">
          {{ account.accountBusy ? '正在退出…' : '退出登录' }}
        </button>
      </section>

      <section class="account-management-card update-management-card">
        <span>版本管理</span>
        <h4>WageClaw {{ account.updateState.currentVersion || '开发版' }}</h4>
        <div class="version-status-row">
          <strong>{{ account.updateState.message || '等待检查' }}</strong>
          <em v-if="account.updateState.availableVersion">v{{ account.updateState.availableVersion }}</em>
        </div>
        <div v-if="account.updateState.status === 'downloading'" class="update-progress">
          <span :style="{ width: `${account.updateState.progress}%` }"></span>
        </div>
        <p>软件启动后会自动检查版本。发现新版本时先征求确认，点击一次即可下载、重启并安装。</p>
        <button
          type="button"
          class="primary-button"
          :disabled="['checking', 'downloading', 'downloaded', 'disabled', 'dev'].includes(account.updateState.status)"
          @click="handleUpdateAction"
        >
          {{ account.updateState.status === 'available' ? '一键更新' : account.updateState.status === 'checking' ? '正在检查…' : '检查更新' }}
        </button>
      </section>
    </div>
  </article>

  <article v-show="wc.settingsTab === 'profile'" class="panel-block profile-layout-panel settings-profile-panel">
    <div class="profile-settings-column">
      <header class="settings-panel-head">
        <div>
          <span>个人资料</span>
          <h3>工资、作息、发薪日</h3>
        </div>
        <strong>{{ wc.state.privacyMode ? '隐私模式已开' : '金额公开显示' }}</strong>
      </header>
      <div class="form-grid settings-form-grid settings-profile-grid">
        <label class="settings-field">
          <span>称呼</span>
          <input v-model="wc.state.nickname" type="text" />
        </label>
        <label class="settings-field number-field" @pointerdown.stop="focusNumberField">
          <span>月薪</span>
          <input v-model.number="wc.state.salary" type="number" min="1" />
        </label>
        <label class="settings-field">
          <span>倒计时口径</span>
          <select v-model="wc.state.countMode">
            <option v-for="[key, label] in modeEntries" :key="key" :value="key">{{ label }}</option>
          </select>
        </label>
        <label class="settings-field number-field" @pointerdown.stop="focusNumberField">
          <span>今日被折磨分钟</span>
          <input v-model.number="wc.state.rageMinutes" type="number" min="0" />
        </label>
        <label class="settings-field time-field" @pointerdown.stop="openTimeFieldPicker">
          <span>上班时间</span>
          <input v-model="wc.state.startTime" type="time" />
        </label>
        <label class="settings-field time-field" @pointerdown.stop="openTimeFieldPicker">
          <span>下班时间</span>
          <input v-model="wc.state.endTime" type="time" />
        </label>
        <label class="settings-field number-field" @pointerdown.stop="focusNumberField">
          <span>发薪日</span>
          <input v-model.number="wc.state.payday" type="number" min="1" max="31" />
        </label>
        <button
          type="button"
          class="profile-switch-button settings-privacy-switch"
          :class="{ active: wc.state.privacyMode }"
          :aria-pressed="wc.state.privacyMode"
          @click="wc.state.privacyMode = !wc.state.privacyMode"
        >
          <span>
            <strong>薪资隐私</strong>
            <small>{{ wc.state.privacyMode ? '余额、工资和心愿金额会低调处理' : '金额按原样展示' }}</small>
          </span>
          <span class="switch-track" :class="{ on: wc.state.privacyMode }">
            <span class="switch-knob"></span>
          </span>
        </button>
      </div>
    </div>
    <aside class="profile-avatar-panel settings-avatar-panel" aria-label="用户形象">
      <header>
        <span>当前形象</span>
        <strong>{{ profileAvatar.title }}</strong>
        <small>{{ wc.themeLabels[wc.state.theme] }} · {{ wc.petStyleLabels[wc.state.petStyle] }}</small>
      </header>
      <div class="profile-avatar-frame">
        <img class="profile-avatar-image" :src="profileAvatar.image" :alt="profileAvatar.title" draggable="false" />
      </div>
      <p>{{ profileAvatar.detail }}</p>
      <div class="profile-avatar-meta">
        <span>{{ wc.modeLabels[wc.state.countMode] }}</span>
        <span>{{ wc.state.payday }} 号发薪</span>
        <span>{{ wc.state.privacyMode ? '隐私已开' : '金额可见' }}</span>
      </div>
    </aside>
  </article>

  <article v-show="wc.settingsTab === 'appearance'" class="panel-block settings-appearance-panel">
    <header class="settings-panel-head">
      <div>
        <span>视觉系统</span>
        <h3>主题和桌宠形象</h3>
      </div>
      <strong>{{ wc.themeLabels[wc.state.theme] }} · {{ wc.petStyleLabels[wc.state.petStyle] }}</strong>
    </header>

    <section class="settings-theme-section" aria-label="主题选择">
      <div class="settings-section-label">
        <span>主题</span>
        <select v-model="wc.state.theme" aria-label="主题">
          <option v-for="[key, label] in themeEntries" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div class="settings-theme-grid">
        <button
          v-for="[key, label] in themeEntries"
          :key="`settings-theme-${key}`"
          type="button"
          class="theme-option"
          :class="{ active: wc.state.theme === key }"
          :data-theme-option="key"
          :aria-pressed="wc.state.theme === key"
          @click="wc.state.theme = key"
        >
          <span class="theme-swatch" aria-hidden="true"><i></i><b></b><em></em></span>
          <strong>{{ label }}</strong>
        </button>
      </div>
    </section>

    <section class="settings-pet-section" aria-label="桌宠系列选择">
      <div class="settings-section-label">
        <span>桌宠系列</span>
        <select v-model="wc.state.petStyle" aria-label="桌宠系列">
          <option v-for="[key, label] in petStyleEntries" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div class="pet-style-switcher settings-pet-style-switcher">
        <button
          v-for="[key, label] in petStyleEntries"
          :key="key"
          type="button"
          :class="{ active: wc.state.petStyle === key }"
          :aria-pressed="wc.state.petStyle === key"
          @click="wc.state.petStyle = key"
        >
          <img :src="petStylePreview[key].image" :alt="label" draggable="false" />
          <strong>{{ label }}</strong>
          <small>{{ petStylePreview[key].summary }}</small>
        </button>
      </div>
    </section>

  </article>

  <article v-show="wc.settingsTab === 'prompts'" class="panel-block settings-prompts-panel">
    <header class="settings-panel-head">
      <div>
        <span>交互提示</span>
        <h3>提醒、报时与资讯语料</h3>
      </div>
      <strong>{{ wc.state.interactionPrompts.newsEnabled ? '资讯源已启用' : '资讯源已关闭' }}</strong>
    </header>

    <div class="prompt-module-grid">
      <section class="prompt-module-card prompt-module-card--wide" aria-label="健康与专注提示">
        <header class="prompt-card-head">
          <div>
            <span>健康与专注</span>
            <strong>活动提醒语料</strong>
          </div>
          <button type="button" class="secondary-button compact" @click="wc.markStretchBreak">我刚活动过</button>
        </header>
        <div class="settings-reminder-grid prompt-reminder-grid">
          <article class="settings-reminder-card">
            <button
              type="button"
              class="profile-switch-button"
              :class="{ active: wc.state.sedentaryReminderEnabled }"
              :aria-pressed="wc.state.sedentaryReminderEnabled"
              @click="wc.state.sedentaryReminderEnabled = !wc.state.sedentaryReminderEnabled"
            >
              <span>
                <strong>久坐活动</strong>
                <small>{{ wc.state.sedentaryReminderEnabled ? `每 ${wc.state.sedentaryReminderMinutes} 分钟` : '已关闭' }}</small>
              </span>
              <span class="switch-track" :class="{ on: wc.state.sedentaryReminderEnabled }">
                <span class="switch-knob"></span>
              </span>
            </button>
            <label class="settings-field number-field" @pointerdown.stop="focusNumberField">
              <span>间隔分钟</span>
              <input v-model.number="wc.state.sedentaryReminderMinutes" type="number" min="20" max="180" step="5" />
            </label>
          </article>
          <article class="settings-reminder-card">
            <button
              type="button"
              class="profile-switch-button"
              :class="{ active: wc.state.petFocusReminderEnabled }"
              :aria-pressed="wc.state.petFocusReminderEnabled"
              @click="wc.state.petFocusReminderEnabled = !wc.state.petFocusReminderEnabled"
            >
              <span>
                <strong>专注冷却</strong>
                <small>{{ wc.state.petFocusReminderEnabled ? `${wc.state.petFocusReminderMinutes} 分钟未互动` : '已关闭' }}</small>
              </span>
              <span class="switch-track" :class="{ on: wc.state.petFocusReminderEnabled }">
                <span class="switch-knob"></span>
              </span>
            </button>
            <label class="settings-field number-field" @pointerdown.stop="focusNumberField">
              <span>冷落分钟</span>
              <input v-model.number="wc.state.petFocusReminderMinutes" type="number" min="15" max="180" step="5" />
            </label>
          </article>
        </div>
        <div class="prompt-row-list">
          <div v-for="item in wc.state.interactionPrompts.healthPrompts" :key="item.id" class="prompt-row">
            <button type="button" class="prompt-enable-button" :class="{ active: item.enabled }" @click="item.enabled = !item.enabled">
              {{ item.enabled ? '启用' : '停用' }}
            </button>
            <label>
              <span>标题</span>
              <input v-model="item.label" type="text" />
            </label>
            <label class="prompt-text-field">
              <span>文案</span>
              <input v-model="item.text" type="text" />
            </label>
            <label>
              <span>权重</span>
              <input v-model.number="item.weight" type="number" min="1" max="12" />
            </label>
            <button v-if="item.custom" type="button" class="prompt-delete-button" @click="wc.removeInteractionPrompt('health', item.id)">删除</button>
          </div>
        </div>
        <button type="button" class="secondary-button compact prompt-add-button" @click="wc.addInteractionPrompt('health')">新增健康提示</button>
      </section>

      <section class="prompt-module-card" aria-label="桌宠报时语料">
        <header class="prompt-card-head">
          <div>
            <span>桌宠报时</span>
            <strong>播报语料库</strong>
          </div>
          <button type="button" class="secondary-button compact" @click="wc.addInteractionPrompt('clock')">新增</button>
        </header>
        <div class="prompt-row-list">
          <div v-for="item in wc.state.interactionPrompts.clockPrompts" :key="item.id" class="prompt-row prompt-row--stack">
            <div class="prompt-row-top">
              <button type="button" class="prompt-enable-button" :class="{ active: item.enabled }" @click="item.enabled = !item.enabled">
                {{ item.enabled ? '启用' : '停用' }}
              </button>
              <label>
                <span>标题</span>
                <input v-model="item.label" type="text" />
              </label>
              <label>
                <span>权重</span>
                <input v-model.number="item.weight" type="number" min="1" max="12" />
              </label>
              <button v-if="item.custom" type="button" class="prompt-delete-button" @click="wc.removeInteractionPrompt('clock', item.id)">删除</button>
            </div>
            <label class="prompt-text-field">
              <span>文案</span>
              <input v-model="item.text" type="text" />
            </label>
          </div>
        </div>
      </section>

      <section class="prompt-module-card" aria-label="桌宠触摸语料">
        <header class="prompt-card-head">
          <div>
            <span>触摸反馈</span>
            <strong>桌宠互动文字</strong>
          </div>
          <button type="button" class="secondary-button compact" @click="wc.addInteractionPrompt('touch')">新增</button>
        </header>
        <div class="prompt-row-list">
          <div v-for="item in wc.state.interactionPrompts.touchPrompts" :key="item.id" class="prompt-row prompt-row--stack">
            <div class="prompt-row-top">
              <button type="button" class="prompt-enable-button" :class="{ active: item.enabled }" @click="item.enabled = !item.enabled">
                {{ item.enabled ? '启用' : '停用' }}
              </button>
              <label>
                <span>标题</span>
                <input v-model="item.label" type="text" />
              </label>
              <label>
                <span>权重</span>
                <input v-model.number="item.weight" type="number" min="1" max="12" />
              </label>
              <button v-if="item.custom" type="button" class="prompt-delete-button" @click="wc.removeInteractionPrompt('touch', item.id)">删除</button>
            </div>
            <label class="prompt-text-field">
              <span>文案</span>
              <input v-model="item.text" type="text" />
            </label>
          </div>
        </div>
      </section>

      <section class="prompt-module-card prompt-module-card--wide" aria-label="新闻资讯 API">
        <header class="prompt-card-head">
          <div>
            <span>新闻资讯</span>
            <strong>API 源与权重</strong>
          </div>
          <button
            type="button"
            class="profile-switch-button prompt-news-switch"
            :class="{ active: wc.state.interactionPrompts.newsEnabled }"
            :aria-pressed="wc.state.interactionPrompts.newsEnabled"
            @click="wc.state.interactionPrompts.newsEnabled = !wc.state.interactionPrompts.newsEnabled"
          >
            <span>
              <strong>{{ wc.state.interactionPrompts.newsEnabled ? '启用' : '停用' }}</strong>
              <small>资讯接口</small>
            </span>
            <span class="switch-track" :class="{ on: wc.state.interactionPrompts.newsEnabled }">
              <span class="switch-knob"></span>
            </span>
          </button>
        </header>
        <div class="news-source-list">
          <div v-for="source in wc.state.interactionPrompts.newsSources" :key="source.id" class="news-source-row">
            <button type="button" class="prompt-enable-button" :class="{ active: source.enabled }" @click="source.enabled = !source.enabled">
              {{ source.enabled ? '启用' : '停用' }}
            </button>
            <label>
              <span>名称</span>
              <input v-model="source.name" type="text" />
            </label>
            <label class="news-url-field">
              <span>API 地址</span>
              <input v-model="source.url" type="url" />
            </label>
            <label>
              <span>权重</span>
              <input v-model.number="source.weight" type="number" min="1" max="12" />
            </label>
            <label>
              <span>Key Header</span>
              <input v-model="source.apiKeyHeader" type="text" placeholder="Authorization" />
            </label>
            <label>
              <span>Key</span>
              <input v-model="source.apiKeyValue" type="password" />
            </label>
            <label class="news-note-field">
              <span>备注</span>
              <input v-model="source.note" type="text" />
            </label>
            <button v-if="source.custom" type="button" class="prompt-delete-button" @click="wc.removeNewsSource(source.id)">删除</button>
          </div>
        </div>
        <button type="button" class="secondary-button compact prompt-add-button" @click="wc.addNewsSource">新增新闻源</button>
      </section>
    </div>
  </article>

  <article v-show="wc.settingsTab === 'data'" class="panel-block data-management-panel settings-data-panel">
    <header class="settings-panel-head">
      <div>
        <span>本地数据</span>
        <h3>余额仓库与重置</h3>
      </div>
      <strong>wageclaw-state-v3</strong>
    </header>
    <div class="settings-data-console">
      <p>数据保存在本机浏览器存储里。清余额会保留账本记录，桌宠状态可单独恢复，完整重置会回到初始状态。</p>
      <div class="settings-data-meter">
        <article>
          <span>工资余额</span>
          <strong>{{ wc.formatBalance(wc.walletCoins, 2) }}</strong>
        </article>
        <article>
          <span>爪币余额</span>
          <strong>{{ wc.formatPawCoins(wc.state.pawBalance) }}</strong>
        </article>
      </div>
      <div class="data-action-list settings-data-list">
        <div class="data-action-row settings-data-row">
          <span class="data-row-icon" aria-hidden="true">
            <img :src="settingsWalletIcon" alt="" draggable="false" />
          </span>
          <div>
            <span>工资余额</span>
            <strong>{{ wc.formatBalance(wc.walletCoins, 2) }}</strong>
            <small>只清当前余额，流水保留。</small>
          </div>
          <button type="button" class="secondary-button" @click="wc.clearWalletBalance">清除余额</button>
        </div>
        <div class="data-action-row settings-data-row">
          <span class="data-row-icon" aria-hidden="true">
            <img :src="settingsPawIcon" alt="" draggable="false" />
          </span>
          <div>
            <span>爪币余额</span>
            <strong>{{ wc.formatPawCoins(wc.state.pawBalance) }}</strong>
            <small>只清当前余额，爪币账本保留。</small>
          </div>
          <button type="button" class="secondary-button" @click="wc.clearPawBalance">清除爪币</button>
        </div>
        <div class="data-action-row settings-data-row">
          <span class="data-row-icon" aria-hidden="true">
            <img :src="settingsPawIcon" alt="" draggable="false" />
          </span>
          <div>
            <span>桌宠状态</span>
            <strong>{{ wc.currentPetStage.name }}</strong>
            <small>恢复属性、热度和互动状态，保留背包与余额。</small>
          </div>
          <button type="button" class="secondary-button" @click="wc.resetPetStatus">重置桌宠</button>
        </div>
        <div class="data-action-row settings-data-row">
          <span class="data-row-icon" aria-hidden="true">
            <img :src="settingsDataIcon" alt="" draggable="false" />
          </span>
          <div>
            <span>备份与恢复</span>
            <strong>导出 / 导入 JSON 存档</strong>
            <small>导出生成完整存档文件；导入会覆盖当前全部数据。</small>
          </div>
          <span class="backup-action-group">
            <button type="button" class="secondary-button" @click="wc.exportBackup">导出备份</button>
            <button type="button" class="secondary-button" @click="backupFileInput?.click()">导入备份</button>
          </span>
        </div>
        <div class="data-danger-row settings-danger-row">
          <span class="data-row-icon danger-icon" aria-hidden="true">
            <img :src="settingsResetIcon" alt="" draggable="false" />
          </span>
          <div>
            <span>完整重置</span>
            <small>清除本地存储并恢复默认数据，此操作不可撤销。</small>
          </div>
          <button type="button" class="danger-button" @click="wc.resetAllData">重置所有数据</button>
        </div>
      </div>
    </div>
  </article>
    <input ref="backupFileInput" type="file" accept="application/json,.json" class="backup-file-input" @change="onBackupFileChange" />
</section>
</template>
