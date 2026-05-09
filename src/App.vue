<script setup lang="ts">
import { computed, reactive } from "vue";
import { mallFilters, navItems, petTouchProfiles, transactionFilters } from "@/data/catalog";
import { useWageClaw } from "@/composables/useWageClaw";
import PetSprite from "@/components/PetSprite.vue";
import rageBlobPreview from "@/assets/pet-stages-preview.png";
import capybaraZenPreview from "@/assets/pet-previews/capybara-zen.png";
import lazyCatPreview from "@/assets/pet-previews/lazy-cat.png";
import lazyDogPreview from "@/assets/pet-previews/lazy-dog.png";
import honestCowPreview from "@/assets/pet-previews/honest-cow.png";
import walletCardArt from "@/assets/ui-art/wallet-paw-coins.png";
import supplyCardArt from "@/assets/ui-art/supply-cache.png";
import type { Mood, PetStyle } from "@/types";

const wc = reactive(useWageClaw());

const rootClass = computed(() => ({
  "pet-only": wc.viewMode === "pet",
  "float-only": wc.viewMode === "float"
}));
const isMainView = computed(() => wc.viewMode === "main");
const activeTitle = computed(() => wc.screenTitles[wc.activeScreen]);

const wishParts = computed(() =>
  wc.parts.map((part) => ({
    ...part,
    price: wc.getPartPrice(part.id),
    unlocked: wc.state.unlockedParts.includes(part.id)
  }))
);

const moodEntries = computed(() => Object.entries(wc.moodCopy) as Array<[Mood, (typeof wc.moodCopy)[Mood]]>);
const themeEntries = computed(() => Object.entries(wc.themeLabels));
const petStyleEntries = computed(() => Object.entries(wc.petStyleLabels) as Array<[PetStyle, string]>);
const modeEntries = computed(() => Object.entries(wc.modeLabels));
const touchEntries = computed(() => Object.entries(petTouchProfiles));
const petStylePreview = {
  rageBlob: {
    image: rageBlobPreview,
    summary: "原始怨气软团，适合战斗感和职场反击感。"
  },
  capybaraZen: {
    image: capybaraZenPreview,
    summary: "卡皮巴拉佛系路线，越升级越稳、越无争。"
  },
  lazyCat: {
    image: lazyCatPreview,
    summary: "可爱但摆烂，主打午睡、躺平和反内耗。"
  },
  lazyDog: {
    image: lazyDogPreview,
    summary: "慵懒陪伴犬系，温吞守护、慢速回血。"
  },
  honestCow: {
    image: honestCowPreview,
    summary: "老实巴交牛牛系，黑白斑纹、凶眉护主，嘴上很怂但眼神很硬。"
  }
} satisfies Record<PetStyle, { image: string; summary: string }>;

const inventoryTotal = computed(() => wc.inventoryItems.reduce((total, entry) => total + entry.quantity, 0));
const dailyRagePercent = computed(() => Math.min(100, Math.round((wc.state.dailyRage.value / 500) * 100)));
const monthlyProgressPercent = computed(() => Math.min(100, Math.round((wc.walletCoins / Math.max(1, wc.state.salary)) * 100)));
const homeSupplyItems = computed(() => wc.mallItems.slice(0, 4));
const homeStories = computed(() => wc.pagedCommunity.items.slice(0, 4));
const navIconMap = {
  converter: "home",
  mall: "cup",
  pet: "pet",
  ninja: "ninja",
  community: "tree",
  sync: "calendar",
  settings: "gear"
} as const;
const screenMoodLine = computed(() => {
  if (wc.activeScreen === "converter") return "把每一分钟硬扛都换成看得见的进度。";
  if (wc.activeScreen === "mall") return "买一点能回血的东西，不用每次都靠意志力。";
  if (wc.activeScreen === "pet") return "把糟心事丢给软团，它负责记仇，你负责喘气。";
  if (wc.activeScreen === "ninja") return "先稳住情绪，再把边界说得像一份正式纪要。";
  if (wc.activeScreen === "community") return "可以吐槽，但先把姓名、公司和地点藏好。";
  if (wc.activeScreen === "sync") return "倒计时不是焦虑，是把今天切成能走完的小段。";
  return "把资料调成适合自己的节奏，别让应用反过来消耗你。";
});
const pageLabels = {
  transactions: "交易",
  mall: "商品",
  inventory: "背包",
  usage: "使用记录",
  petSupply: "供品",
  petLog: "日志",
  community: "帖子"
} as const;
</script>

<template>
  <div class="app-root" :class="rootClass" :data-theme="wc.state.theme" :data-pet-style="wc.state.petStyle">
    <div class="surface-grid" aria-hidden="true"></div>

    <section v-if="wc.notification" class="toast" role="status">{{ wc.notification }}</section>

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
        @dblclick="wc.showPetDialog"
      >
        <div class="pet-bubble" v-if="wc.summonedBubble">{{ wc.summonedBubble }}</div>
        <div class="pet-dialog" v-if="wc.petDialog" v-html="wc.petDialog"></div>
        <PetSprite :stage="wc.currentPetStage" mode="compact" />
      </div>
    </template>

    <div v-if="wc.goldRush" class="gold-rush" aria-hidden="true">
      <span v-for="n in 12" :key="n" class="gold-coin" :style="{ animationDelay: `${(n - 1) * 0.06}s`, left: `${40 + Math.random() * 20}%` }">🪙</span>
    </div>

    <section v-if="wc.viewMode === 'pet'" class="summoned-pet embedded">
      <div class="pet-bubble" v-if="wc.summonedBubble">{{ wc.summonedBubble }}</div>
      <button type="button" class="pet-avatar-button" @click="wc.handlePetTouch('head')" @dblclick="wc.openScreenFromPet('pet')">
        <PetSprite :stage="wc.currentPetStage" :mode="wc.viewMode === 'pet' ? 'hero' : 'compact'" />
      </button>
      <div class="pet-identity">
        <strong>{{ wc.currentPetStage.name }} Lv.{{ wc.currentPetStage.level }}</strong>
        <small>{{ wc.currentPetStage.title }}</small>
        <em>{{ wc.state.pet.touchMood }} · {{ wc.formatRage(wc.state.rageBalance) }}</em>
      </div>
      <p v-if="wc.viewMode === 'pet'" class="pet-desktop-line">{{ wc.currentPetStage.line }}</p>
      <div v-if="wc.viewMode === 'pet'" class="pet-core-actions">
        <button type="button" @click="wc.openScreenFromPet('converter')">控制台</button>
        <button type="button" @click="wc.openScreenFromPet('mall')">补给</button>
        <button type="button" @click="wc.openScreenFromPet('pet')">养成</button>
        <button type="button" @click="wc.openScreenFromPet('ninja')">参谋</button>
        <button type="button" @click="wc.openScreenFromPet('community')">树洞</button>
        <button type="button" @click="wc.openScreenFromPet('sync')">提醒</button>
      </div>
      <div class="pet-radial-actions">
        <button v-if="wc.viewMode !== 'pet'" type="button" @click="wc.setPetSummoned(false)">收回</button>
        <button v-else type="button" @click="wc.openScreenFromPet('settings')">设置</button>
        <button type="button" @click="wc.triggerBlackoutSkill()">结界</button>
        <button type="button" @click="wc.startDuel()">对练</button>
        <button type="button" @click="wc.startGomoku()">五子棋</button>
        <button type="button" @click="wc.startRunner()">闯关</button>
      </div>
    </section>

    <template v-if="isMainView">
      <div class="desktop-shell">
        <div class="title-bar">
          <span class="title-drag">忍了吧 WageClaw</span>
          <div class="title-tools">
            <button class="window-tool calendar-tool" title="倒计时" @click="wc.setActiveScreen('sync')"></button>
            <button class="window-tool bell-tool" title="提醒"></button>
            <button class="window-tool pet-tool" title="桌宠" @click="wc.setActiveScreen('pet')"></button>
            <button class="title-btn" @click="wc.minimizeMainWindow()" title="最小化"><svg width="10" height="10" viewBox="0 0 10 10"><rect y="4.5" width="10" height="1" fill="currentColor"/></svg></button>
            <button class="title-btn" @click="wc.maximizeMainWindow()" title="最大化"><svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></button>
            <button class="title-btn title-btn-close" @click="wc.closeMainWindow()" title="关闭"><svg width="10" height="10" viewBox="0 0 10 10"><line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.4"/><line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.4"/></svg></button>
          </div>
        </div>
        <aside class="sidebar">
          <div class="brand-block">
            <span class="brand-mark" aria-hidden="true">
              <i class="paw-pad"></i>
              <i class="paw-toe toe-a"></i>
              <i class="paw-toe toe-b"></i>
              <i class="paw-toe toe-c"></i>
              <i class="paw-toe toe-d"></i>
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
              <span class="eyebrow">忍了吧 WageClaw</span>
              <h1>{{ wc.activeScreen === 'converter' ? `晚上好，${wc.state.nickname}` : activeTitle }}</h1>
              <p>{{ screenMoodLine }}</p>
            </div>
            <div class="top-metrics">
              <article>
                <span>账户</span>
                <strong>{{ wc.formatBalance(wc.walletCoins, 2) }}</strong>
              </article>
              <article>
                <span>怨气</span>
                <strong>{{ Math.round(wc.state.rageBalance) }}</strong>
              </article>
              <article>
                <span>心愿</span>
                <strong>{{ wc.unlockedCount }} / {{ wc.parts.length }}</strong>
              </article>
              <article>
                <span>下班</span>
                <strong>{{ wc.countdowns.offWorkText }}</strong>
              </article>
            </div>
          </header>

          <section v-show="wc.activeScreen === 'converter'" class="screen-grid">
            <section class="home-hero-grid">
              <article class="hero-wallet-card">
                <div>
                  <span class="eyebrow">WageClaw 余额</span>
                  <h2>{{ wc.formatBalance(wc.walletCoins, 2) }}</h2>
                  <p>本轮可用额度</p>
                </div>
                <div class="wallet-object" aria-hidden="true">
                  <img class="wallet-card-art" :src="walletCardArt" alt="" draggable="false" />
                </div>
                <footer>
                  <span>本月累计 <strong class="plus">{{ wc.formatMoney(wc.monthlyStats.income) }}</strong></span>
                  <span>目标进度 <strong>{{ wc.unlockedCount }}/{{ wc.parts.length }}</strong></span>
                </footer>
              </article>

              <article class="salary-progress-card">
                <div class="salary-progress-content">
                  <header class="salary-progress-head">
                    <div>
                      <span class="eyebrow">忍耐进度</span>
                      <p>本月工资转化</p>
                    </div>
                    <strong>{{ monthlyProgressPercent }}<small>%</small></strong>
                  </header>
                  <div class="salary-meter" aria-label="本月工资进度">
                    <i><b :style="{ width: `${monthlyProgressPercent}%` }"></b></i>
                    <div>
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <footer class="salary-progress-foot">
                    <span>{{ wc.formatBalance(wc.walletCoins, 2) }} / {{ wc.formatMoney(wc.state.salary, 2) }}</span>
                    <button type="button" class="soft-pill" @click="wc.claimDailyWallet">
                      领取
                    </button>
                  </footer>
                </div>
                <div class="patience-pet-scene" :style="wc.petStageStyle()" aria-hidden="true">
                  <span class="patience-light"></span>
                  <PetSprite :stage="wc.currentPetStage" mode="mini" />
                  <div class="patience-stage-base">
                    <i><b :style="{ width: `${monthlyProgressPercent}%` }"></b></i>
                  </div>
                </div>
              </article>
            </section>

            <section class="home-cards">
              <article class="home-soft-card soft-rage" @click="wc.setActiveScreen('pet')">
                <span class="soft-avatar" @click.stop="wc.handleConsolePetSummonClick">
                  <PetSprite :stage="wc.currentPetStage" mode="mini" />
                </span>
                <div>
                  <h3>怨气软团</h3>
                  <p>今日怨气值 <strong>{{ Math.round(wc.state.dailyRage.value) }}</strong> / 500</p>
                  <small>心情状态：{{ wc.state.pet.touchMood }}</small>
                </div>
                <button type="button" @click.stop="wc.handlePetTouch('head')">捏一捏</button>
              </article>

              <article class="home-supply-card">
                <header>
                  <h3>情绪补给</h3>
                  <button type="button" @click="wc.setActiveScreen('mall')">换一批</button>
                </header>
                <div class="supply-cache-art" aria-hidden="true">
                  <img :src="supplyCardArt" alt="" draggable="false" />
                </div>
                <div class="supply-mini-list">
                  <button v-for="item in homeSupplyItems" :key="item.id" type="button" @click="wc.buyMallItem(item)">
                    <span>{{ item.icon }}</span>
                    <strong>{{ item.name }}</strong>
                    <small>{{ item.tag }}</small>
                    <em><b></b>{{ item.currency === 'rage' ? Math.round(item.price) : item.price }}</em>
                  </button>
                </div>
              </article>

              <article class="home-wish-card">
                <h3>愿望碎片</h3>
                <div class="jar-object" aria-hidden="true">
                  <span v-for="part in wishParts" :key="`jar-${part.id}`" :class="{ on: part.unlocked }"></span>
                </div>
                <p>已收集 <strong>{{ Math.round(wc.wishProgress * 100) }}</strong> / 100</p>
                <button type="button" @click="wc.setActiveScreen('converter')">去合成愿望</button>
              </article>
            </section>

            <section class="home-treehole">
              <header>
                <h3>匿名树洞</h3>
                <button type="button" @click="wc.setActiveScreen('community')">写一写</button>
              </header>
              <article v-for="story in homeStories" :key="`home-${story.title}`">
                <span>{{ story.title }}</span>
                <p>{{ story.content }}</p>
                <small>{{ story.reactions[0] }}</small>
              </article>
            </section>

            <section class="two-column">
              <article class="panel-block">
                <header class="panel-header">
                  <div>
                    <span class="eyebrow">心愿碎片</span>
                    <h3>{{ wc.state.wish }}</h3>
                  </div>
                  <strong>{{ wc.formatMoney(wc.wishRemaining) }} 待点亮</strong>
                </header>
                <div class="wish-progress">
                  <i :style="{ width: `${wc.wishProgress * 100}%` }"></i>
                </div>
                <div class="wish-object" aria-hidden="true">
                  <span v-for="part in wishParts" :key="`object-${part.id}`" :class="{ on: part.unlocked }"></span>
                </div>
                <div class="part-grid">
                  <button
                    v-for="part in wishParts"
                    :key="part.id"
                    type="button"
                    :class="{ unlocked: part.unlocked }"
                    :disabled="part.unlocked"
                    @click="wc.buyPart(part.id)"
                  >
                    <span>{{ part.name }}</span>
                    <strong>{{ part.unlocked ? "已点亮" : wc.formatMoney(part.price, 0) }}</strong>
                    <small>{{ part.narrative }}</small>
                  </button>
                </div>
              </article>

              <article class="panel-block">
                <header class="panel-header">
                  <div>
                    <span class="eyebrow">账本</span>
                    <h3>交易记录</h3>
                  </div>
                  <span>{{ wc.pagedTransactions.totalItems }} 笔</span>
                </header>
                <div class="filter-row">
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
                <div class="list-stack">
                  <article v-for="item in wc.pagedTransactions.items" :key="item.id" class="list-item">
                    <div class="badge">{{ wc.transactionCategories[item.category].icon }}</div>
                    <div>
                      <strong>{{ item.title }}</strong>
                      <small>{{ item.note }} · {{ item.time }}</small>
                    </div>
                    <em :class="item.amount >= 0 ? 'plus' : 'minus'">{{ wc.formatMoney(item.amount) }}</em>
                  </article>
                </div>
                <footer class="pager">
                  <button type="button" @click="wc.setPage('transactions', -1)">上一页</button>
                  <span>{{ wc.pagedTransactions.current }} / {{ wc.pagedTransactions.totalPages }} · {{ pageLabels.transactions }}</span>
                  <button type="button" @click="wc.setPage('transactions', 1)">下一页</button>
                </footer>
              </article>
            </section>
          </section>

          <section v-show="wc.activeScreen === 'mall'" class="screen-grid">
            <article class="hero-panel compact supply-hero">
              <div>
                <span class="eyebrow">情绪补给仓</span>
                <h2>正式采购台</h2>
                <p>账户 {{ wc.formatBalance(wc.walletCoins) }} · 怨气 {{ wc.formatRage(wc.state.rageBalance) }} · 背包 {{ inventoryTotal }} 件</p>
              </div>
              <div class="procurement-desk" aria-hidden="true">
                <img :src="supplyCardArt" alt="" draggable="false" />
                <span class="procurement-ledger"></span>
                <span class="procurement-terminal"></span>
                <span class="procurement-stamp"></span>
                <span class="procurement-counter"></span>
              </div>
              <div class="segmented">
                <button type="button" :class="{ active: wc.mallTab === 'inventory' }" @click="wc.mallTab = 'inventory'">背包</button>
                <button type="button" :class="{ active: wc.mallTab === 'shop' }" @click="wc.mallTab = 'shop'">商城</button>
              </div>
            </article>

            <section v-show="wc.mallTab === 'inventory'" class="panel-block">
              <header class="panel-header">
                <h3>背包物品</h3>
                <span>{{ wc.pagedInventoryItems.totalItems }} 类</span>
              </header>
              <div class="segmented wide-tabs">
                <button type="button" :class="{ active: wc.inventorySubTab === 'items' }" @click="wc.inventorySubTab = 'items'">物品</button>
                <button type="button" :class="{ active: wc.inventorySubTab === 'log' }" @click="wc.inventorySubTab = 'log'">
                  最近使用 <em>{{ wc.pagedUsageLog.totalItems }}</em>
                </button>
              </div>
              <div v-show="wc.inventorySubTab === 'items'" class="card-grid catalogue">
                <article v-for="entry in wc.pagedInventoryItems.items" :key="entry.item.id" class="product-card">
                  <span class="product-icon">{{ entry.item.icon }}</span>
                  <strong>{{ entry.item.name }}</strong>
                  <small>{{ entry.item.effect }}</small>
                  <div class="card-actions">
                    <em>x{{ entry.quantity }}</em>
                    <button type="button" @click="wc.useItem(entry.item)">使用</button>
                  </div>
                </article>
              </div>
              <div v-show="wc.inventorySubTab === 'log'" class="card-grid catalogue">
                <article v-for="item in wc.pagedUsageLog.items" :key="`${item.id}-${item.time}`" class="product-card">
                  <span class="product-icon">{{ item.icon }}</span>
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.effect }} · {{ item.time }}</small>
                </article>
                <p v-if="wc.pagedUsageLog.totalItems === 0" class="empty-state">还没有使用记录。</p>
              </div>
              <footer class="pager">
                <button type="button" @click="wc.setPage(wc.inventorySubTab === 'items' ? 'inventory' : 'usage', -1)">上一页</button>
                <span v-if="wc.inventorySubTab === 'items'">{{ wc.pagedInventoryItems.current }} / {{ wc.pagedInventoryItems.totalPages }}</span>
                <span v-else>{{ wc.pagedUsageLog.current }} / {{ wc.pagedUsageLog.totalPages }}</span>
                <button type="button" @click="wc.setPage(wc.inventorySubTab === 'items' ? 'inventory' : 'usage', 1)">下一页</button>
              </footer>
            </section>

            <section v-show="wc.mallTab === 'shop'" class="panel-block">
              <header class="panel-header">
                <h3>商城货架</h3>
                <span>{{ wc.pagedMallItems.totalItems }} 件商品</span>
              </header>
              <div class="filter-row">
                <button
                  v-for="filter in mallFilters"
                  :key="filter.key"
                  type="button"
                  :class="{ active: wc.state.mallFilter === filter.key }"
                  @click="wc.setMallFilter(filter.key)"
                >
                  {{ filter.label }}
                </button>
              </div>
              <div class="card-grid catalogue">
                <article v-for="item in wc.pagedMallItems.items" :key="item.id" class="product-card">
                  <span class="product-icon">{{ item.icon }}</span>
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.description }}</small>
                  <div class="tag-row">
                    <span>{{ item.tag }}</span>
                    <em>{{ item.currency === 'rage' ? wc.formatRage(item.price) : wc.formatMoney(item.price, 0) }}</em>
                  </div>
                  <button type="button" class="secondary-button full" @click="wc.buyMallItem(item)">购买</button>
                </article>
              </div>
              <footer class="pager">
                <button type="button" @click="wc.setPage('mall', -1)">上一页</button>
                <span>{{ wc.pagedMallItems.current }} / {{ wc.pagedMallItems.totalPages }}</span>
                <button type="button" @click="wc.setPage('mall', 1)">下一页</button>
              </footer>
            </section>
          </section>

          <section v-show="wc.activeScreen === 'pet'" class="screen-grid">
            <article class="hero-panel pet-hero">
              <div class="large-pet" :style="wc.petStageStyle()" @click="wc.handleConsolePetSummonClick">
                <PetSprite :stage="wc.currentPetStage" mode="hero" />
                <div class="pet-tooltips" v-if="wc.state.pet.summoned">
                  <span class="pet-tip" :style="{ color: wc.petHungerLabel.color }">{{ wc.petHungerLabel.label }}</span>
                  <span class="pet-tip" :style="{ color: wc.petPressureLabel.color }">{{ wc.petPressureLabel.label }}</span>
                </div>
              </div>
              <div>
                <span class="eyebrow">怨气桌宠</span>
                <h2>{{ wc.currentPetStage.name }} Lv.{{ wc.currentPetStage.level }}</h2>
                <p>{{ wc.state.pet.lastLine }}</p>
                <div class="tag-row">
                  <span>{{ wc.currentPetStage.title }}</span>
                  <span>{{ wc.petAffinity.label }}</span>
                  <span>{{ wc.state.pet.touchMood }}</span>
                  <span>修炼 {{ wc.state.pet.cultivation }} 重</span>
                </div>
              </div>
              <div class="pet-aura" :style="wc.petStageStyle()" aria-hidden="true">
                <div class="evolution-vessel">
                  <i><b :style="{ height: `${wc.petProgress * 100}%` }"></b></i>
                  <PetSprite :stage="wc.currentPetStage" mode="mini" />
                </div>
                <div class="evolution-markers">
                  <span
                    v-for="stage in wc.petStages"
                    :key="`pet-progress-${stage.id}`"
                    :class="{ active: wc.state.pet.rage >= stage.threshold, current: wc.currentPetStage.id === stage.id }"
                  ></span>
                </div>
                <span>进化进度 {{ Math.round(wc.petProgress * 100) }}%</span>
              </div>
              <div class="button-stack">
                <button type="button" class="primary-button" @click="wc.setPetSummoned()">{{ wc.state.pet.summoned ? "收回软团" : "召唤软团" }}</button>
                <button type="button" class="secondary-button" @click="wc.startDuel()">桌面对练</button>
              </div>
            </article>

            <section class="metric-row">
              <article>
                <span>怨气</span>
                <strong>{{ wc.formatRage(wc.state.pet.rage) }}</strong>
              </article>
              <article>
                <span>灵力</span>
                <strong>{{ wc.formatLight(wc.state.pet.light) }}</strong>
              </article>
              <article>
                <span>法力</span>
                <strong>{{ Math.round(wc.state.pet.mana) }} / {{ wc.petManaMax }}</strong>
              </article>
              <article>
                <span>战绩</span>
                <strong>{{ wc.state.pet.battleWins }} 胜 / {{ wc.state.pet.battleLosses }} 负</strong>
              </article>
              <article>
                <span>饥饿度</span>
                <strong>{{ wc.petHungerLabel.label }}</strong>
              </article>
              <article>
                <span>血压</span>
                <strong>{{ wc.petPressureLabel.label }}</strong>
              </article>
            </section>

            <div class="segmented wide-tabs">
              <button type="button" :class="{ active: wc.petTab === 'status' }" @click="wc.petTab = 'status'">状态</button>
              <button type="button" :class="{ active: wc.petTab === 'refine' }" @click="wc.petTab = 'refine'">炼化</button>
              <button type="button" :class="{ active: wc.petTab === 'feed' }" @click="wc.petTab = 'feed'">投喂</button>
              <button type="button" :class="{ active: wc.petTab === 'log' }" @click="wc.petTab = 'log'">日志</button>
            </div>

            <section v-show="wc.petTab === 'status'" class="two-column">
              <article class="panel-block">
                <header class="panel-header">
                  <h3>成长进度</h3>
                  <span>{{ wc.nextPetStage ? `距 ${wc.nextPetStage.name}` : "已达顶阶" }}</span>
                </header>
                <div class="wish-progress">
                  <i :style="{ width: `${wc.petProgress * 100}%` }"></i>
                  <span class="bar-label">{{ Math.round(wc.petProgress * 100) }}%</span>
                </div>
                <div class="stat-bars">
                  <label><span>饱食</span><i><b :style="{ width: `${wc.state.pet.satiety}%` }"></b><span class="bar-label">{{ wc.state.pet.satiety }}%</span></i></label>
                  <label><span>亲密</span><i><b :style="{ width: `${wc.state.pet.affection}%` }"></b><span class="bar-label">{{ wc.state.pet.affection }}%</span></i></label>
                  <label><span>饥饿</span><i><b :style="{ width: `${wc.state.pet.hunger}%`, background: wc.petHungerLabel.color }"></b><span class="bar-label">{{ Math.round(wc.state.pet.hunger) }}%</span></i></label>
                  <label><span>血压</span><i><b :style="{ width: `${wc.state.pet.bloodPressure}%`, background: wc.petPressureLabel.color }"></b><span class="bar-label">{{ Math.round(wc.state.pet.bloodPressure) }}%</span></i></label>
                </div>
              </article>
              <article class="panel-block">
                <header class="panel-header">
                  <h3>互动</h3>
                  <span>触摸热度 {{ wc.state.pet.touchHeat }}</span>
                </header>
                <div class="touch-grid">
                  <button v-for="[key, touch] in touchEntries" :key="key" type="button" @click="wc.handlePetTouch(key)">
                    <strong>{{ touch.label }}</strong>
                    <small>{{ touch.mood }} · 怨气 +{{ touch.rage }}</small>
                  </button>
                </div>
                <div class="action-row">
                  <button type="button" class="secondary-button" @click="wc.cultivatePet">怨气修炼</button>
                  <button type="button" class="secondary-button" @click="wc.triggerBlackoutSkill()">黑屏结界</button>
                  <button type="button" class="secondary-button" @click="wc.previewOnlineBattle">联机预演</button>
                </div>
              </article>
            </section>

            <section v-show="wc.petTab === 'status'" class="panel-block evolution-codex">
              <header class="panel-header">
                <div>
                  <span class="eyebrow">十阶形象图鉴</span>
                  <h3>从怨息雾团到玄怨邪仙</h3>
                </div>
                <span>{{ wc.petStageLore }}</span>
              </header>
              <div class="stage-grid">
                <article
                  v-for="stage in wc.petStages"
                  :key="stage.id"
                  :class="{ current: wc.currentPetStage.id === stage.id, locked: wc.state.pet.rage < stage.threshold }"
                >
                  <PetSprite :stage="stage" mode="mini" />
                  <strong>Lv.{{ stage.level }} {{ stage.name }}</strong>
                  <small>{{ stage.title }}</small>
                  <p>{{ stage.visual }}</p>
                </article>
              </div>
            </section>

            <section v-show="wc.petTab === 'refine'" class="panel-block">
              <header class="panel-header">
                <h3>糟心事炼化炉</h3>
                <span>今日怨气 {{ Math.round(wc.state.dailyRage.value) }}</span>
              </header>
              <textarea v-model="wc.rantText" rows="8" placeholder="例：老板把临时起意说成我的成长机会，还问我为什么不够主动。"></textarea>
              <div class="action-row">
                <button type="button" class="primary-button" @click="wc.refineRageFromRant">炼化为怨气</button>
                <button type="button" class="secondary-button" @click="wc.refineLightFromRant">转化为灵力</button>
              </div>
            </section>

            <section v-show="wc.petTab === 'feed'" class="panel-block">
              <header class="panel-header">
                <h3>可投喂供品</h3>
                <span>{{ wc.pagedPetSupplyItems.totalItems }} 类</span>
              </header>
              <div class="list-stack empty-ok">
                <article v-for="entry in wc.pagedPetSupplyItems.items" :key="entry.item.id" class="list-item">
                  <div class="badge">{{ entry.item.icon }}</div>
                  <div>
                    <strong>{{ entry.item.name }} x{{ entry.quantity }}</strong>
                    <small>{{ wc.formatPetBoost(entry.item.petBoost) }}</small>
                  </div>
                  <button type="button" @click="wc.useItem(entry.item)">投喂</button>
                </article>
                <p v-if="wc.pagedPetSupplyItems.totalItems === 0" class="empty-state">背包里暂时没有桌宠供品。</p>
              </div>
              <footer class="pager">
                <button type="button" @click="wc.setPage('petSupply', -1)">上一页</button>
                <span>{{ wc.pagedPetSupplyItems.current }} / {{ wc.pagedPetSupplyItems.totalPages }}</span>
                <button type="button" @click="wc.setPage('petSupply', 1)">下一页</button>
              </footer>
            </section>

            <section v-show="wc.petTab === 'log'" class="panel-block">
              <header class="panel-header">
                <h3>软团日志</h3>
                <span>{{ wc.pagedPetLog.totalItems }} 条</span>
              </header>
              <div class="list-stack">
                <article v-for="item in wc.pagedPetLog.items" :key="`${item.title}-${item.time}`" class="list-item">
                  <div>
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.detail }} · {{ item.time }}</small>
                  </div>
                </article>
              </div>
              <footer class="pager">
                <button type="button" @click="wc.setPage('petLog', -1)">上一页</button>
                <span>{{ wc.pagedPetLog.current }} / {{ wc.pagedPetLog.totalPages }}</span>
                <button type="button" @click="wc.setPage('petLog', 1)">下一页</button>
              </footer>
            </section>
          </section>

          <section v-show="wc.activeScreen === 'ninja'" class="two-column">
            <article class="panel-block">
              <header class="panel-header">
                <h3>AI 工位参谋</h3>
                <span>{{ wc.moodCopy[wc.state.mood].label }}</span>
              </header>
              <div class="filter-row">
                <button v-for="[key, mood] in moodEntries" :key="key" type="button" :class="{ active: wc.state.mood === key }" @click="wc.state.mood = key">
                  {{ mood.short }}
                </button>
              </div>
              <textarea v-model="wc.coachInput" rows="10" placeholder="把今天遇到的工位问题写下来，参谋会按情绪确认、目标锚定、战术建议三段输出。"></textarea>
              <button type="button" class="primary-button full" @click="wc.generateCoach">生成三段式回复</button>
            </article>
            <article class="panel-block response-panel">
              <header class="panel-header">
                <h3>回复草案</h3>
                <span>可直接改写后发送</span>
              </header>
              <pre>{{ wc.coachResponse || "还没有生成内容。" }}</pre>
            </article>
          </section>

          <section v-show="wc.activeScreen === 'community'" class="two-column">
            <article class="panel-block">
              <header class="panel-header">
                <h3>匿名树洞</h3>
                <span>{{ wc.pagedCommunity.totalItems }} 条</span>
              </header>
              <div class="list-stack">
                <article v-for="story in wc.pagedCommunity.items" :key="story.title" class="story-card">
                  <strong>{{ story.title }}</strong>
                  <p>{{ story.content }}</p>
                  <small>{{ story.goal }}</small>
                  <div class="tag-row">
                    <span v-for="reaction in story.reactions" :key="reaction">{{ reaction }}</span>
                  </div>
                </article>
              </div>
              <footer class="pager">
                <button type="button" @click="wc.setPage('community', -1)">上一页</button>
                <span>{{ wc.pagedCommunity.current }} / {{ wc.pagedCommunity.totalPages }}</span>
                <button type="button" @click="wc.setPage('community', 1)">下一页</button>
              </footer>
            </article>
            <article class="panel-block">
              <header class="panel-header">
                <h3>安全发布预览</h3>
                <span>自动脱敏</span>
              </header>
              <textarea v-model="wc.communityDraft" rows="8"></textarea>
              <div class="safe-preview">
                <span>脱敏后</span>
                <p>{{ wc.safePost }}</p>
              </div>
              <button type="button" class="primary-button full" @click="wc.publishCommunityDraft">使用脱敏版本</button>
            </article>
          </section>

          <section v-show="wc.activeScreen === 'sync'" class="screen-grid">
            <article class="hero-panel compact">
              <div>
                <span class="eyebrow">多端联动</span>
                <h2>倒计时与推送文案</h2>
                <p>保留原型里的多端提醒能力，后续可以接系统通知、语音输入或真实账号同步。</p>
              </div>
            </article>
            <section class="metric-row">
              <article><span>距下班</span><strong>{{ wc.countdowns.offWorkText }}</strong></article>
              <article><span>距周六</span><strong>{{ wc.countdowns.saturday.natural }} 天 / {{ wc.countdowns.saturday.workday }} 工</strong></article>
              <article><span>距发薪</span><strong>{{ wc.countdowns.holiday.natural }} 天 / {{ wc.countdowns.holiday.workday }} 工</strong></article>
            </section>
            <section class="three-column">
              <article class="panel-block"><h3>早间推送</h3><p>{{ wc.pushCopies.morning }}</p></article>
              <article class="panel-block"><h3>晚间推送</h3><p>{{ wc.pushCopies.evening }}</p></article>
              <article class="panel-block"><h3>情绪跟进</h3><p>{{ wc.pushCopies.followUp }}</p></article>
            </section>
          </section>

          <section v-show="wc.activeScreen === 'settings'" class="screen-grid">
            <article class="hero-panel compact">
              <div>
                <span class="eyebrow">基础设置</span>
                <h2>{{ wc.state.nickname }}</h2>
                <p>{{ wc.themeLabels[wc.state.theme] }} · {{ wc.petStyleLabels[wc.state.petStyle] }} · {{ wc.modeLabels[wc.state.countMode] }} · {{ wc.state.startTime }} - {{ wc.state.endTime }}</p>
              </div>
            </article>
            <div class="segmented wide-tabs">
              <button type="button" :class="{ active: wc.settingsTab === 'profile' }" @click="wc.settingsTab = 'profile'">资料</button>
              <button type="button" :class="{ active: wc.settingsTab === 'appearance' }" @click="wc.settingsTab = 'appearance'">外观</button>
              <button type="button" :class="{ active: wc.settingsTab === 'schedule' }" @click="wc.settingsTab = 'schedule'">时间</button>
              <button type="button" :class="{ active: wc.settingsTab === 'data' }" @click="wc.settingsTab = 'data'">数据</button>
            </div>
            <article v-show="wc.settingsTab === 'profile'" class="panel-block form-grid">
              <label>称呼<input v-model="wc.state.nickname" type="text" /></label>
              <label>月薪<input v-model.number="wc.state.salary" type="number" min="1" /></label>
              <label>心愿礼物<input v-model="wc.state.wish" type="text" /></label>
              <label>目标价格<input v-model.number="wc.state.price" type="number" min="1" /></label>
              <label>今日被折磨分钟<input v-model.number="wc.state.rageMinutes" type="number" min="0" /></label>
            </article>
            <article v-show="wc.settingsTab === 'appearance'" class="panel-block form-grid">
              <label>主题
                <select v-model="wc.state.theme">
                  <option v-for="[key, label] in themeEntries" :key="key" :value="key">{{ label }}</option>
                </select>
              </label>
              <label>桌宠系列
                <select v-model="wc.state.petStyle">
                  <option v-for="[key, label] in petStyleEntries" :key="key" :value="key">{{ label }}</option>
                </select>
              </label>
              <label>倒计时口径
                <select v-model="wc.state.countMode">
                  <option v-for="[key, label] in modeEntries" :key="key" :value="key">{{ label }}</option>
                </select>
              </label>
              <div class="pet-style-switcher">
                <button
                  v-for="[key, label] in petStyleEntries"
                  :key="key"
                  type="button"
                  :class="{ active: wc.state.petStyle === key }"
                  @click="wc.state.petStyle = key"
                >
                  <img :src="petStylePreview[key].image" :alt="label" draggable="false" />
                  <strong>{{ label }}</strong>
                  <small>{{ petStylePreview[key].summary }}</small>
                </button>
              </div>
              <label class="switch-label">
                <span>薪资隐私</span>
                <span class="switch-track" :class="{ on: wc.state.privacyMode }" @click="wc.state.privacyMode = !wc.state.privacyMode">
                  <span class="switch-knob"></span>
                </span>
                <small>{{ wc.state.privacyMode ? '已隐藏具体数额' : '公开显示' }}</small>
              </label>
            </article>
            <article v-show="wc.settingsTab === 'schedule'" class="panel-block form-grid">
              <label>上班时间<input v-model="wc.state.startTime" type="time" /></label>
              <label>下班时间<input v-model="wc.state.endTime" type="time" /></label>
              <label>发薪日<input v-model.number="wc.state.payday" type="number" min="1" max="31" /></label>
            </article>
            <article v-show="wc.settingsTab === 'data'" class="panel-block">
              <h3>数据管理</h3>
              <p>Vue 版继续使用原来的本地存储 key：wageclaw-state-v3。</p>
              <button type="button" class="danger-button" @click="wc.resetAllData">重置所有数据</button>
            </article>
          </section>
        </main>
      </div>
    </template>

    <section v-if="wc.duel.visible" class="modal-layer">
      <div class="game-modal duel-modal">
        <header class="panel-header">
          <h3>桌面对练</h3>
          <button type="button" class="icon-button" @click="wc.duel.visible = false">×</button>
        </header>
        <div class="duel-bars">
          <label><span>你</span><i><b :style="{ width: `${wc.duel.playerHp}%` }"></b></i><em>{{ wc.duel.playerHp }}/100</em></label>
          <label><span>老板怨念体</span><i><b :style="{ width: `${wc.duel.enemyHp}%` }"></b></i><em>{{ wc.duel.enemyHp }}/100</em></label>
          <label><span>爆发</span><i><b :style="{ width: `${wc.duel.energy}%` }"></b></i><em>{{ wc.duel.energy }}/100</em></label>
        </div>
        <div class="duel-stage">
          <div class="fighter player">你</div>
          <div>
            <strong>{{ wc.duel.phase }}</strong>
            <p>{{ wc.duel.status }}</p>
            <em>连击 x{{ wc.duel.combo }}</em>
          </div>
          <div class="fighter enemy"><PetSprite :stage="wc.currentPetStage" mode="mini" /></div>
        </div>
        <div class="skill-grid">
          <button type="button" @click="wc.performDuelSkill('punch')">J 普通拳</button>
          <button type="button" @click="wc.performDuelSkill('kick')">K 反弹脚</button>
          <button type="button" @click="wc.performDuelSkill('uppercut')">I 嘴替暴击</button>
          <button type="button" @click="wc.performDuelSkill('blast')">L 怨气波</button>
          <button type="button" @click="wc.performDuelSkill('heal')">H 安抚回血</button>
          <button type="button" @click="wc.performDuelSkill('guard')">Shift 格挡</button>
        </div>
        <footer class="action-row">
          <button type="button" class="primary-button" @click="wc.startDuel">再开一局</button>
          <button type="button" class="secondary-button" @click="wc.previewOnlineBattle">联机预演</button>
        </footer>
      </div>
    </section>

    <section v-if="wc.gomoku.visible" class="modal-layer">
      <div class="game-modal">
        <header class="panel-header">
          <h3>五子棋</h3>
          <span>胜 {{ wc.gomoku.wins }} / 负 {{ wc.gomoku.losses }} / 平 {{ wc.gomoku.draws }}</span>
          <button type="button" class="icon-button" @click="wc.stopGomoku">×</button>
        </header>
        <div class="gomoku-board">
          <button
            v-for="(_, index) in wc.gomoku.size * wc.gomoku.size"
            :key="index"
            type="button"
            :class="{
              black: wc.gomoku.board[Math.floor(index / wc.gomoku.size)][index % wc.gomoku.size] === 1,
              white: wc.gomoku.board[Math.floor(index / wc.gomoku.size)][index % wc.gomoku.size] === 2
            }"
            @click="wc.handleGomokuMove(Math.floor(index / wc.gomoku.size), index % wc.gomoku.size)"
          ></button>
        </div>
        <p class="game-result">{{ wc.gomoku.result || (wc.gomoku.playerTurn ? "轮到你落子。" : "软团思考中。") }}</p>
        <button type="button" class="primary-button full" @click="wc.startGomoku">重新开始</button>
      </div>
    </section>

    <section v-if="wc.runner.visible" class="modal-layer">
      <div class="game-modal runner-modal">
        <header class="panel-header">
          <h3>怨气闯关</h3>
          <span>得分 {{ wc.runner.score }} · 最佳 {{ wc.runner.best }}</span>
          <button type="button" class="icon-button" @click="wc.stopRunner()">×</button>
        </header>
        <div class="runner-stage" :class="wc.runner.pose">
          <div class="runner-track"></div>
          <div class="runner-player"><PetSprite :stage="wc.currentPetStage" mode="mini" /></div>
          <div class="runner-obstacle">{{ wc.runner.obstacle }}</div>
        </div>
        <p class="game-result">{{ wc.runner.result || "空格/↑ 跳跃，↓ 下蹲，躲避老板的怨念攻击。" }}</p>
        <footer class="action-row">
          <button type="button" class="primary-button" @click="wc.runnerAction('jump')">跳跃</button>
          <button type="button" class="secondary-button" @click="wc.runnerAction('duck')">下蹲</button>
          <button type="button" class="secondary-button" @click="wc.startRunner">重新开始</button>
        </footer>
      </div>
    </section>
  </div>
</template>
