<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { navItems, transactionFilters } from "@/data/catalog";
import { petStylePreview } from "@/data/pet-style-previews";
import { useWageClaw } from "@/composables/useWageClaw";
import { useAccountAndUpdates } from "@/composables/useAccountAndUpdates";
import { resolveWishVisual } from "@/data/visuals";
import PetSprite from "@/components/PetSprite.vue";
import GameModals from "@/components/GameModals.vue";
import RealizedDialog from "@/components/RealizedDialog.vue";
import SettingsScreen from "@/components/SettingsScreen.vue";
import MallScreen from "@/components/MallScreen.vue";
import PetScreen from "@/components/PetScreen.vue";
import ConverterScreen from "@/components/ConverterScreen.vue";
import headerProgressArt from "@/assets/ui-art/header-progress.png";
import headerSettingsArt from "@/assets/ui-art/header-settings.png";
import headerSupplyArt from "@/assets/ui-art/header-supply.png";
import headerPetArt from "@/assets/ui-art/header-pet.png";
import type { PetStyle, Theme } from "@/types";

const wc = reactive(useWageClaw());
const account = reactive(useAccountAndUpdates());
const ledgerDialogOpen = ref(false);
const ledgerMode = ref<"wallet" | "paw">("wallet");
const realizedDialogOpen = ref(false);
const appIconUrl = new URL("../electron/assets/app-icon.png", import.meta.url).href;
const ONBOARDING_WISHES_PER_PAGE = 4;
const onboardingWishPage = ref(0);
const onboardingWishTotalPages = computed(() =>
  Math.max(1, Math.ceil(wc.wishShopItems.length / ONBOARDING_WISHES_PER_PAGE))
);
const onboardingWishCurrentPage = computed(() =>
  Math.min(onboardingWishPage.value, onboardingWishTotalPages.value - 1)
);
const onboardingWishPageItems = computed(() => {
  const start = onboardingWishCurrentPage.value * ONBOARDING_WISHES_PER_PAGE;
  return wc.wishShopItems.slice(start, start + ONBOARDING_WISHES_PER_PAGE);
});

function changeOnboardingWishPage(delta: number) {
  onboardingWishPage.value = Math.min(
    onboardingWishTotalPages.value - 1,
    Math.max(0, onboardingWishCurrentPage.value + delta)
  );
}

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

const activeWishVisual = computed(() => resolveWishVisual(wc.state.activeWishId));

function getWishVisual(itemId?: string) {
  return resolveWishVisual(itemId || wc.state.activeWishId);
}



const rootClass = computed(() => ({
  "pet-only": wc.viewMode === "pet",
  "float-only": wc.viewMode === "float"
}));
const isMainView = computed(() => wc.viewMode === "main");
const activeTitle = computed(() => wc.screenTitles[wc.activeScreen]);
const topbarArt = computed(() => {
  if (wc.activeScreen === "mall") return headerSupplyArt;
  if (wc.activeScreen === "pet") return headerPetArt;
  if (wc.activeScreen === "settings") return headerSettingsArt;
  return headerProgressArt;
});





const themeEntries = computed(() => Object.entries(wc.themeLabels) as Array<[Theme, string]>);
const petStyleEntries = computed(() => Object.entries(wc.petStyleLabels) as Array<[PetStyle, string]>);
const petMotionAction = computed(() => (wc.petReaction === "play" || wc.petReaction === "sleep" ? wc.petReaction : "idle"));
const transactionLedgerEmptyRowCount = computed(() => Math.max(0, wc.PAGE_SIZE - wc.pagedTransactions.items.length));
const pawLedgerEmptyRowCount = computed(() => Math.max(0, wc.PAGE_SIZE - wc.pagedPawLedger.items.length));
const dailyRagePercent = computed(() => Math.min(100, Math.round((wc.state.dailyRage.value / 500) * 100)));
const navIconMap = {
  converter: "home",
  mall: "cup",
  pet: "pet",
  settings: "gear"
} as const;
const screenMoodLine = computed(() => {
  if (wc.activeScreen === "converter") return "把每一分钟硬扛都换成看得见的进度。";
  if (wc.activeScreen === "mall") return "工资余额只对实体目标负责，桌宠补给交给爪币小金库。";
  if (wc.activeScreen === "pet") return "把糟心事丢给软团，它负责记仇，你负责喘气。";
  return "把资料调成适合自己的节奏，别让应用反过来消耗你。";
});
const pageLabels = {
  transactions: "交易",
  pawLedger: "爪币",
  mall: "商品",
  wishShop: "心愿商城",
  supplyShop: "供销社",
  inventory: "背包",
  usage: "使用记录",
  petSupply: "供品",
  petLog: "记录"
} as const;
const pawBucketLabels = {
  attendance: "出勤",
  interaction: "互动",
  event: "事件",
  supply: "补给"
} as const;

function formatPawLedgerAmount(amount: number) {
  const rounded = Math.round(amount || 0);
  return `${rounded >= 0 ? "+" : "-"}${wc.formatPawCoins(Math.abs(rounded))}`;
}


function openSupplyShop() {
  wc.mallTab = "supplyShop";
  wc.setActiveScreen("mall");
}


function openLedgerDialog() {
  ledgerDialogOpen.value = true;
}

function closeLedgerDialog() {
  ledgerDialogOpen.value = false;
}

function dismissUpdatePrompt() {
  if (account.updateState.status === "available") {
    account.updatePromptVisible = false;
  }
}
</script>


<template>
  <div class="app-root" :class="rootClass" :data-theme="wc.state.theme" :data-pet-style="wc.state.petStyle">
    <div class="surface-grid" aria-hidden="true"></div>

    <transition name="toast">
      <section v-if="wc.notification" class="toast" role="status">{{ wc.notification }}</section>
    </transition>

    <section
      v-if="account.updatePromptVisible"
      class="modal-layer update-modal-layer"
      aria-modal="true"
      role="dialog"
      @click.self="dismissUpdatePrompt"
    >
      <div class="update-modal">
        <span class="eyebrow">版本更新</span>
        <h2 v-if="account.updateState.status === 'available'">发现新版本 {{ account.updateState.availableVersion }}</h2>
        <h2 v-else-if="account.updateState.status === 'downloading'">正在下载更新</h2>
        <h2 v-else-if="account.updateState.status === 'error'">更新没有完成</h2>
        <h2 v-else>准备安装新版本</h2>
        <p v-if="account.updateState.status === 'available'">
          当前版本 {{ account.updateState.currentVersion }}。确认后会自动下载，完成时重启并安装。
        </p>
        <p v-else>{{ account.updateState.message }}</p>
        <div v-if="account.updateState.status === 'downloading'" class="update-progress">
          <span :style="{ width: `${account.updateState.progress}%` }"></span>
        </div>
        <footer>
          <button
            v-if="account.updateState.status === 'available'"
            type="button"
            class="secondary-button"
            @click="account.updatePromptVisible = false"
          >
            稍后
          </button>
          <button
            v-if="account.updateState.status === 'available'"
            type="button"
            class="primary-button"
            @click="account.downloadAndInstallUpdate"
          >
            一键更新
          </button>
          <button
            v-if="account.updateState.status === 'error'"
            type="button"
            class="secondary-button"
            @click="account.updatePromptVisible = false"
          >
            关闭
          </button>
        </footer>
      </div>
    </section>

    <section v-if="wc.blackoutActive" class="blackout-layer" @click="wc.blackoutActive = false">
      <div>
        <strong>黑屏结界</strong>
        <span>离谱需求临时隔离，先呼吸。</span>
      </div>
    </section>

    <template v-if="wc.viewMode === 'float'">
      <div
        class="floating-pet float-mode"
        :class="wc.petReaction"
        @mousedown="wc.startPetDrag"
        @dblclick="wc.handleFloatPetDoubleClick"
      >
        <div class="pet-bubble" v-if="wc.summonedBubble">{{ wc.summonedBubble }}</div>
        <div class="pet-dialog" v-if="wc.petDialog" v-html="wc.petDialog"></div>
        <PetSprite :stage="wc.currentPetStage" :ascension="wc.petAscension" mode="compact" :action="petMotionAction" :motion-key="wc.petMotionKey" />
      </div>
    </template>

    <div v-if="wc.goldRush" class="gold-rush" aria-hidden="true">
      <span v-for="n in 12" :key="n" class="gold-coin" :style="{ animationDelay: `${(n - 1) * 0.06}s`, left: `${40 + Math.random() * 20}%` }">🪙</span>
    </div>

    <section v-if="wc.viewMode === 'pet'" class="summoned-pet embedded">
      <div class="pet-bubble" v-if="wc.summonedBubble">{{ wc.summonedBubble }}</div>
      <button type="button" class="pet-avatar-button" @click="wc.handlePetTouch('head')" @dblclick="wc.openScreenFromPet('pet')">
        <PetSprite :stage="wc.currentPetStage" :ascension="wc.petAscension" :mode="wc.viewMode === 'pet' ? 'hero' : 'compact'" :action="petMotionAction" :motion-key="wc.petMotionKey" />
      </button>
      <div class="pet-identity">
        <strong>{{ wc.currentPetStage.name }} Lv.{{ wc.currentPetStage.level }}</strong>
        <small>{{ wc.currentPetStage.title }}</small>
        <em>{{ wc.state.pet.touchMood }} · {{ wc.formatPawCoins(wc.state.pawBalance) }}</em>
      </div>
      <p v-if="wc.viewMode === 'pet'" class="pet-desktop-line">{{ wc.currentPetStage.line }}</p>
      <div v-if="wc.viewMode === 'pet'" class="pet-core-actions">
        <button type="button" @click="wc.openScreenFromPet('converter')">控制台</button>
        <button type="button" @click="wc.openScreenFromPet('mall')">补给</button>
        <button type="button" @click="wc.openScreenFromPet('pet')">养成</button>
        <button type="button" @click="wc.openScreenFromPet('settings')">设置</button>
      </div>
      <div class="pet-radial-actions">
        <button v-if="wc.viewMode !== 'pet'" type="button" @click="wc.setPetSummoned(false)">收回</button>
        <button v-else type="button" @click="wc.openScreenFromPet('settings')">设置</button>
        <button type="button" @click="wc.triggerBlackoutSkill()">结界</button>
        <button type="button" @click="openSupplyShop">补给</button>
        <button type="button" @click="wc.startGomoku()">五子棋</button>
        <button type="button" @click="wc.startRunner()">闯关</button>
        <button type="button" @click="wc.startDuel()">切磋</button>
      </div>
    </section>

    <template v-if="isMainView">
      <div class="desktop-shell">
        <div class="title-bar">
          <div class="title-tools">
            <button class="window-tool pet-tool" title="桌宠" @click="wc.setActiveScreen('pet')"></button>
            <button class="title-btn" @click="wc.minimizeMainWindow()" title="最小化"><svg width="10" height="10" viewBox="0 0 10 10"><rect y="4.5" width="10" height="1" fill="currentColor"/></svg></button>
            <button class="title-btn" @click="wc.maximizeMainWindow()" title="最大化"><svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
            <button class="title-btn title-btn-close" @click="wc.closeMainWindow()" title="关闭"><svg width="10" height="10" viewBox="0 0 10 10"><line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.4"/><line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.4"/></svg></button>
          </div>
        </div>
        <section v-if="!wc.state.onboardingDone" class="modal-layer onboarding-layer" aria-modal="true" role="dialog">
          <div class="onboarding-modal">
            <header>
              <span class="eyebrow">首次设置</span>
              <h2>先把你的下班雷达校准好</h2>
              <p>先选好主题和桌宠，再设置作息、月薪与心愿。完成后，工资进度才会开始记录。</p>
            </header>
            <div class="onboarding-preferences">
              <section class="onboarding-choice-group" aria-label="选择主题">
                <header>
                  <strong>主题</strong>
                  <span>{{ wc.themeLabels[wc.state.theme] }}</span>
                </header>
                <div class="onboarding-theme-grid">
                  <button
                    v-for="[key, label] in themeEntries"
                    :key="`onboarding-theme-${key}`"
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
              <section class="onboarding-choice-group" aria-label="选择桌宠">
                <header>
                  <strong>桌宠</strong>
                  <span>{{ wc.petStyleLabels[wc.state.petStyle] }}</span>
                </header>
                <div class="onboarding-pet-grid">
                  <button
                    v-for="[key, label] in petStyleEntries"
                    :key="`onboarding-pet-${key}`"
                    type="button"
                    :class="{ active: wc.state.petStyle === key }"
                    :aria-pressed="wc.state.petStyle === key"
                    @click="wc.state.petStyle = key"
                  >
                    <img :src="petStylePreview[key].image" :alt="label" draggable="false" />
                    <strong>{{ label }}</strong>
                  </button>
                </div>
              </section>
            </div>
            <div class="onboarding-grid">
              <section class="onboarding-form" aria-label="工资与作息">
                <header>
                  <strong>工资与作息</strong>
                  <button
                    type="button"
                    class="onboarding-privacy-toggle"
                    :class="{ active: wc.state.privacyMode }"
                    :aria-pressed="wc.state.privacyMode"
                    @click="wc.state.privacyMode = !wc.state.privacyMode"
                  >
                    <span class="onboarding-privacy-copy">
                      <strong>薪资隐私</strong>
                      <small>{{ wc.state.privacyMode ? '金额已隐藏' : '金额正常显示' }}</small>
                    </span>
                    <span class="onboarding-switch-track" aria-hidden="true">
                      <span class="onboarding-switch-knob"></span>
                    </span>
                  </button>
                </header>
                <div class="onboarding-field-grid">
                  <label class="number-field" @pointerdown.stop="focusNumberField"><span>月薪</span><input v-model.number="wc.state.salary" type="number" min="1" inputmode="decimal" placeholder="12000" /></label>
                  <label class="number-field" @pointerdown.stop="focusNumberField"><span>发薪日</span><input v-model.number="wc.state.payday" type="number" min="1" max="31" inputmode="numeric" /></label>
                  <label class="time-field" @pointerdown.stop="openTimeFieldPicker"><span>上班时间</span><input v-model="wc.state.startTime" type="time" /></label>
                  <label class="time-field" @pointerdown.stop="openTimeFieldPicker"><span>下班时间</span><input v-model="wc.state.endTime" type="time" /></label>
                </div>
                <div class="onboarding-pet-preview" aria-live="polite">
                  <div class="onboarding-pet-stage" aria-hidden="true">
                    <span class="onboarding-pet-aura"></span>
                    <PetSprite :stage="wc.currentPetStage" :ascension="wc.petAscension" mode="compact" />
                  </div>
                  <div class="onboarding-pet-preview-copy">
                    <span>你的桌宠</span>
                    <strong>{{ wc.petStyleLabels[wc.state.petStyle] }}</strong>
                    <p>{{ petStylePreview[wc.state.petStyle].summary }}</p>
                  </div>
                </div>
              </section>
              <section class="onboarding-wishes" aria-label="选择心愿">
                <header>
                  <strong>选择一个心愿</strong>
                  <span>{{ wc.activeWishItem ? wc.formatMoney(wc.activeWishItem.price, 0) : '还没选择' }}</span>
                </header>
                <div class="onboarding-wish-grid">
                  <button
                    v-for="item in onboardingWishPageItems"
                    :key="`onboarding-wish-${item.id}`"
                    type="button"
                    :class="{ active: wc.state.activeWishId === item.id }"
                    @click="wc.state.activeWishId = item.id"
                  >
                    <img :src="getWishVisual(item.id).full" alt="" draggable="false" />
                    <span>{{ item.name }}</span>
                    <small>{{ wc.formatMoney(item.price, 0) }}</small>
                  </button>
                </div>
                <div class="onboarding-wish-pager" aria-label="心愿分页">
                  <button type="button" class="secondary-button" :disabled="onboardingWishCurrentPage === 0" @click="changeOnboardingWishPage(-1)">上一页</button>
                  <span>{{ onboardingWishCurrentPage + 1 }} / {{ onboardingWishTotalPages }}</span>
                  <button type="button" class="secondary-button" :disabled="onboardingWishCurrentPage >= onboardingWishTotalPages - 1" @click="changeOnboardingWishPage(1)">下一页</button>
                </div>
              </section>
            </div>
            <footer>
              <p v-if="!wc.hasValidWorkTime">请确认下班时间晚于上班时间。</p>
              <p v-else-if="wc.state.salary <= 0">请填写月薪。</p>
              <p v-else-if="!wc.activeWishItem">请选择一个心愿。</p>
              <p v-else>准备好了，今天的进度会从空账本开始。</p>
              <button type="button" class="primary-button" :disabled="!wc.isProfileReady" @click="wc.completeOnboarding">开始使用</button>
            </footer>
          </div>
        </section>
        <aside class="sidebar">
          <div class="brand-block">
            <span class="brand-mark" aria-hidden="true">
              <img :src="appIconUrl" alt="" draggable="false" />
            </span>
            <div>
              <strong>忍了吧</strong>
              <small>WageClaw · 怨气管理器</small>
            </div>
          </div>

          <div class="nav-scroll">
            <section class="desk-note" aria-label="今日工位状态">
              <span>今日情绪气压</span>
              <strong>{{ wc.moodCopy[wc.state.mood].label }}</strong>
              <i><b :style="{ width: `${dailyRagePercent}%` }"></b></i>
              <small>怨气 {{ Math.round(wc.state.dailyRage.value) }} / 500</small>
            </section>

            <nav class="nav-list" aria-label="主导航">
              <button
                v-for="item in navItems"
                :key="item.key"
                type="button"
                :class="{ active: wc.activeScreen === item.key }"
                @click="wc.setActiveScreen(item.key)"
              >
                <i class="nav-icon" :class="`nav-${navIconMap[item.key]}`" aria-hidden="true"></i>
                <span>{{ item.label }}</span>
                <small>{{ item.hint }}</small>
              </button>
            </nav>
          </div>

          <section class="sidebar-summary">
            <span>今日可领</span>
            <strong>{{ wc.formatBalance(wc.claimableToday) }}</strong>
            <small>{{ wc.countdowns.offWorkText }} 后下班，别把终点前的时间白送出去。</small>
            <button type="button" class="primary-button full" @click="wc.claimDailyWallet">
              领取 {{ wc.formatBalance(wc.claimableToday) }}
            </button>
          </section>
        </aside>

        <main class="workspace">
          <header class="topbar">
            <div class="topbar-title">
              <h1>{{ wc.activeScreen === 'converter' ? `晚上好，${wc.state.nickname}` : activeTitle }}</h1>
              <p v-if="wc.activeScreen === 'mall'">
                工资买心愿，爪币养桌宠，背包只放补给。
              </p>
              <p v-else>{{ screenMoodLine }}</p>
            </div>
            <div class="topbar-art" aria-hidden="true">
              <img :src="topbarArt" alt="" draggable="false" />
            </div>
            <div class="top-metrics">
              <article>
                <span>账户</span>
                <strong>{{ wc.formatBalance(wc.walletCoins, 2) }}</strong>
              </article>
              <article>
                <span>爪币</span>
                <strong>{{ Math.round(wc.state.pawBalance) }}</strong>
              </article>
              <article>
                <span>今日怨气</span>
                <strong>{{ Math.round(wc.state.dailyRage.value) }}</strong>
              </article>
              <article>
                <span>下班</span>
                <strong>{{ wc.countdowns.offWorkText }}</strong>
              </article>
            </div>
          </header>

          <ConverterScreen v-show="wc.activeScreen === 'converter'" :wc="wc" @open-ledger="openLedgerDialog" />

          <section
            v-if="ledgerDialogOpen"
            class="modal-layer ledger-modal-layer"
            role="dialog"
            aria-modal="true"
            aria-label="交易账本"
            @click.self="closeLedgerDialog"
          >
            <div class="panel-block ledger-modal">
              <header class="panel-header">
                <div>
                  <span class="eyebrow">账本</span>
                  <h3>{{ ledgerMode === 'wallet' ? '工资账本' : '爪币账本' }}</h3>
                </div>
                <span>{{ ledgerMode === 'wallet' ? wc.pagedTransactions.totalItems : wc.pagedPawLedger.totalItems }} 笔</span>
                <button type="button" class="icon-button" @click="closeLedgerDialog">×</button>
              </header>
              <div class="segmented ledger-type-tabs">
                <button type="button" :class="{ active: ledgerMode === 'wallet' }" @click="ledgerMode = 'wallet'">
                  工资账本<em>{{ wc.state.transactions.length }}</em>
                </button>
                <button type="button" :class="{ active: ledgerMode === 'paw' }" @click="ledgerMode = 'paw'">
                  爪币账本<em>{{ wc.pawLedgerItems.length }}</em>
                </button>
              </div>
              <div v-if="ledgerMode === 'wallet'" class="filter-row ledger-modal-filters">
                <button
                  v-for="filter in transactionFilters"
                  :key="filter.key"
                  type="button"
                  :class="{ active: wc.state.transactionFilter === filter.key }"
                  @click="wc.setTransactionFilter(filter.key)"
                >
                  {{ filter.label }}
                </button>
              </div>
              <div v-else class="ledger-modal-filters ledger-paw-overview">
                <article>
                  <span>本月入账</span>
                  <strong class="plus">{{ wc.formatPawCoins(wc.monthlyPawStats.earned) }}</strong>
                </article>
                <article>
                  <span>本月支出</span>
                  <strong class="minus">{{ wc.formatPawCoins(wc.monthlyPawStats.spent) }}</strong>
                </article>
                <article>
                  <span>爪币净额</span>
                  <strong :class="wc.monthlyPawStats.net >= 0 ? 'plus' : 'minus'">{{ formatPawLedgerAmount(wc.monthlyPawStats.net) }}</strong>
                </article>
              </div>
              <div v-if="ledgerMode === 'wallet'" class="list-stack ledger-modal-list">
                <article v-for="item in wc.pagedTransactions.items" :key="item.id" class="list-item">
                  <div class="badge">{{ wc.transactionCategories[item.category].icon }}</div>
                  <div>
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.note }} · {{ item.time }}</small>
                  </div>
                  <em :class="item.amount >= 0 ? 'plus' : 'minus'">{{ wc.formatMoney(item.amount) }}</em>
                </article>
                <article
                  v-for="slot in transactionLedgerEmptyRowCount"
                  :key="`transaction-ledger-empty-${wc.pagedTransactions.current}-${wc.state.transactionFilter}-${slot}`"
                  class="list-item ledger-placeholder-row"
                  aria-hidden="true"
                >
                </article>
              </div>
              <div v-else class="list-stack ledger-modal-list paw-ledger-list">
                <article v-for="item in wc.pagedPawLedger.items" :key="item.id" class="list-item">
                  <div class="badge paw-badge">{{ pawBucketLabels[item.bucket] }}</div>
                  <div>
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.note }} · {{ item.time }}</small>
                  </div>
                  <em :class="item.amount >= 0 ? 'plus' : 'minus'">{{ formatPawLedgerAmount(item.amount) }}</em>
                </article>
                <article
                  v-for="slot in pawLedgerEmptyRowCount"
                  :key="`paw-ledger-empty-${wc.pagedPawLedger.current}-${slot}`"
                  class="list-item ledger-placeholder-row"
                  aria-hidden="true"
                >
                </article>
              </div>
              <footer class="pager">
                <button v-if="ledgerMode === 'wallet'" type="button" @click="wc.setPage('transactions', -1)">上一页</button>
                <button v-else type="button" @click="wc.setPage('pawLedger', -1)">上一页</button>
                <span v-if="ledgerMode === 'wallet'">{{ wc.pagedTransactions.current }} / {{ wc.pagedTransactions.totalPages }} · {{ pageLabels.transactions }}</span>
                <span v-else>{{ wc.pagedPawLedger.current }} / {{ wc.pagedPawLedger.totalPages }} · {{ pageLabels.pawLedger }}</span>
                <button v-if="ledgerMode === 'wallet'" type="button" @click="wc.setPage('transactions', 1)">下一页</button>
                <button v-else type="button" @click="wc.setPage('pawLedger', 1)">下一页</button>
              </footer>
            </div>
          </section>

          <MallScreen v-show="wc.activeScreen === 'mall'" :wc="wc" />

          <PetScreen v-show="wc.activeScreen === 'pet'" :wc="wc" />


          <SettingsScreen v-show="wc.activeScreen === 'settings'" :wc="wc" :account="account" />
        </main>
      </div>
    </template>

    <section v-if="wc.assembly.visible" class="modal-layer wish-assembly-layer">
      <div class="wish-assembly-modal">
        <div class="assembly-glow" aria-hidden="true"></div>
        <div class="macbook-split asset-macbook assembly complete" aria-hidden="true">
          <img :src="activeWishVisual.full" class="macbook-full-render" alt="" draggable="false" />
          <em>ASSEMBLED</em>
        </div>
        <div class="assembly-copy">
          <span class="eyebrow">心愿达成</span>
          <h3>{{ wc.state.wish }} 拼装完成</h3>
          <p>{{ wc.assembly.line }}</p>
        </div>
        <button type="button" class="primary-button full" @click="wc.closeAssembly">收进背包</button>
      </div>
    </section>

    <RealizedDialog :wc="wc" :open="realizedDialogOpen" @close="realizedDialogOpen = false" />

    <GameModals :wc="wc" />


  </div>
</template>
