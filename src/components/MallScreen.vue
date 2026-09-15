<script setup lang="ts">
import { computed } from "vue";
import { mallFilters } from "@/data/catalog";
import { resolveSupplyVisual, resolveWishVisual } from "@/data/visuals";
import type { WageClawStore } from "@/composables/useWageClaw";

const props = defineProps<{ wc: WageClawStore }>();

const inventoryTotal = computed(() => props.wc.inventoryItems.reduce((total, entry) => total + entry.quantity, 0) + props.wc.earnedGoods.length);
const inventoryCategoryCount = computed(() => props.wc.inventoryItems.length);
const activeMallFilterLabel = computed(() => mallFilters.find((filter) => filter.key === props.wc.state.mallFilter)?.label || "全部");
const wishShopEmptySlotCount = computed(() => Math.max(0, props.wc.MALL_PAGE_SIZE - props.wc.pagedWishShopItems.items.length));
const supplyShopEmptySlotCount = computed(() => Math.max(0, props.wc.MALL_PAGE_SIZE - props.wc.pagedSupplyShopItems.items.length));
const inventoryEmptySlotCount = computed(() => Math.max(0, props.wc.MALL_PAGE_SIZE - props.wc.pagedInventoryItems.items.length));
const supplyFilters = computed(() => mallFilters.filter((filter) => filter.key !== "real"));
const supplyHubTabs = computed(() => [
  {
    key: "wishShop",
    label: "心愿商城",
    hint: "工资余额兑换实体礼物",
    count: `${shopPhysicalCount.value} 件`
  },
  {
    key: "supplyShop",
    label: "供销社",
    hint: "爪币购买桌宠日常",
    count: `${shopSupplyCount.value} 件`
  },
  {
    key: "inventory",
    label: "背包",
    hint: "桌宠物品与最近使用",
    count: `${inventoryTotal.value} 件`
  }
] as const);
const shopPhysicalCount = computed(() => props.wc.mallItems.filter((item) => item.kind === "physical").length);
const shopSupplyCount = computed(() => props.wc.mallItems.filter((item) => item.kind !== "physical").length);

function openWishWorkbench(tab: "split" | "realized" = "split") {
  props.wc.accountTab = tab;
  props.wc.setActiveScreen("converter");
}

function getWishVisual(itemId?: string) {
  return resolveWishVisual(itemId || props.wc.state.activeWishId);
}

function getSupplyVisual(itemId: string) {
  return resolveSupplyVisual(itemId);
}
</script>

<template>
<section v-show="wc.activeScreen === 'mall'" class="screen-grid mall-screen supply-hub-screen">
  <article class="supply-hub-bar" aria-label="补给仓分区">
    <div class="supply-hub-tabs">
      <button
        v-for="tab in supplyHubTabs"
        :key="tab.key"
        type="button"
        :class="{ active: wc.mallTab === tab.key }"
        @click="wc.mallTab = tab.key"
      >
        <strong>{{ tab.label }}</strong>
        <small>{{ tab.hint }}</small>
        <em>{{ tab.count }}</em>
      </button>
    </div>
    <div class="supply-hub-resources" aria-label="补给仓钱包">
      <div class="supply-wallet-card">
        <i class="wallet-emblem" aria-hidden="true"></i>
        <div class="wallet-ledger">
          <div class="wallet-row wallet-row-wage">
            <span>工资余额</span>
            <strong>{{ wc.formatBalance(wc.walletCoins, 2) }}</strong>
          </div>
          <div class="wallet-row wallet-row-paw">
            <span>爪币余额</span>
            <strong>{{ wc.formatPawCoins(wc.state.pawBalance) }}</strong>
          </div>
        </div>
      </div>
    </div>
  </article>

  <section v-show="wc.mallTab === 'wishShop'" class="panel-block supply-module wish-market-panel">
    <header class="supply-module-head">
      <div>
        <h3>心愿商城</h3>
        <span>工资余额只用于实体目标，不再和桌宠补给混账。</span>
      </div>
      <button type="button" class="soft-pill" @click="openWishWorkbench('split')">查看拆分台</button>
    </header>
    <div class="wish-market-layout">
      <div class="wish-market-grid">
        <article
          v-for="item in wc.pagedWishShopItems.items"
          :key="item.id"
          class="wish-shop-card"
          tabindex="0"
          :aria-describedby="`wish-shop-detail-${item.id}`"
        >
          <div class="wish-shop-visual asset-macbook complete" aria-hidden="true">
            <img :src="getWishVisual(item.id).full" class="macbook-full-render" alt="" draggable="false" />
            <span>{{ item.tag }}</span>
          </div>
          <div class="wish-shop-body">
            <div class="wish-shop-title">
              <strong>{{ item.name }}</strong>
            </div>
            <span class="wish-shop-meta">{{ item.tag }}</span>
            <p>{{ item.description }}</p>
            <div class="wish-shop-progress" :class="{ active: wc.state.activeWishId === item.id }">
              <i :style="{ width: `${wc.state.activeWishId === item.id ? wc.wishProgress * 100 : 0}%` }"></i>
            </div>
          </div>
          <footer class="wish-shop-foot">
            <div class="wish-shop-state">
              <span>{{ wc.state.activeWishId === item.id ? `${Math.round(wc.wishProgress * 100)}% 点亮中` : '可设为实体心愿' }}</span>
              <em class="wish-shop-price">{{ wc.formatMoney(item.price, 0) }}</em>
            </div>
            <button
              type="button"
              class="primary-button"
              @click="wc.state.activeWishId === item.id ? wc.setActiveScreen('converter') : wc.setWishItem(item)"
            >
              {{ wc.state.activeWishId === item.id ? '查看拆分' : '设为心愿' }}
            </button>
          </footer>
          <div :id="`wish-shop-detail-${item.id}`" class="wish-shop-detail-popover" role="tooltip">
            <strong>{{ item.name }}</strong>
            <span>{{ wc.formatMoney(item.price, 0) }} · {{ item.tag }}</span>
            <p>{{ item.description }}</p>
            <small>{{ item.effect }}</small>
          </div>
        </article>
        <article
          v-for="slot in wishShopEmptySlotCount"
          :key="`wish-shop-empty-${wc.pagedWishShopItems.current}-${slot}`"
          class="wish-shop-card wish-shop-empty-card"
          aria-hidden="true"
        >
        </article>
      </div>
    </div>
    <footer class="supply-module-footer">
      <span>{{ wc.pagedWishShopItems.totalItems }} 件心愿礼物</span>
      <div class="pager compact">
        <button type="button" @click="wc.setPage('wishShop', -1)">上一页</button>
        <span>{{ wc.pagedWishShopItems.current }} / {{ wc.pagedWishShopItems.totalPages }}</span>
        <button type="button" @click="wc.setPage('wishShop', 1)">下一页</button>
      </div>
    </footer>
  </section>

  <section v-show="wc.mallTab === 'supplyShop'" class="panel-block supply-module supply-market-panel">
    <header class="supply-module-head">
      <div>
        <h3>供销社</h3>
        <span>桌宠需要的吃喝、恢复和训练物资，统一走爪币余额。</span>
      </div>
      <div class="filter-row shelf-filter supply-filter">
        <button
          v-for="filter in supplyFilters"
          :key="filter.key"
          type="button"
          :class="{ active: wc.state.mallFilter === filter.key || (filter.key === 'all' && wc.state.mallFilter === 'real') }"
          @click="wc.setMallFilter(filter.key)"
        >
          {{ filter.label }}
        </button>
      </div>
    </header>
    <div class="supply-market-grid">
      <article v-for="item in wc.pagedSupplyShopItems.items" :key="item.id" class="supply-shop-card">
        <div class="supply-item-icon">
          <img :src="getSupplyVisual(item.id)" :alt="item.name" draggable="false" />
        </div>
        <div class="supply-shop-copy">
          <div>
            <strong>{{ item.name }}</strong>
            <span>{{ item.tag }}</span>
          </div>
          <small>{{ item.description }}</small>
          <p>{{ item.effect }}</p>
        </div>
        <footer>
          <em>{{ wc.formatPawCoins(item.price) }}</em>
          <button type="button" @click="wc.buyMallItem(item)">兑换</button>
        </footer>
      </article>
      <article
        v-for="slot in supplyShopEmptySlotCount"
        :key="`supply-shop-empty-${wc.pagedSupplyShopItems.current}-${wc.state.mallFilter}-${slot}`"
        class="supply-shop-card supply-shop-empty-card"
        aria-hidden="true"
      >
      </article>
    </div>
    <footer class="supply-module-footer">
      <span>{{ activeMallFilterLabel }} · {{ wc.pagedSupplyShopItems.totalItems }} 件供销社商品</span>
      <div class="pager compact">
        <button type="button" @click="wc.setPage('supplyShop', -1)">上一页</button>
        <span>{{ wc.pagedSupplyShopItems.current }} / {{ wc.pagedSupplyShopItems.totalPages }}</span>
        <button type="button" @click="wc.setPage('supplyShop', 1)">下一页</button>
      </div>
    </footer>
  </section>

  <section v-show="wc.mallTab === 'inventory'" class="panel-block supply-module inventory-panel">
    <header class="supply-module-head">
      <div>
        <h3>背包</h3>
        <span>这里只放给桌宠买的东西；实体心愿转到已实现心愿陈列。</span>
      </div>
      <button type="button" class="soft-pill" @click="wc.mallTab = 'supplyShop'">去供销社</button>
    </header>
    <div class="inventory-workbench">
      <div class="inventory-slot-grid" :class="{ empty: wc.pagedInventoryItems.totalItems === 0 }">
        <article v-for="entry in wc.pagedInventoryItems.items" :key="entry.item.id" class="inventory-slot-card">
          <div class="inventory-slot-icon">
            <img :src="getSupplyVisual(entry.item.id)" :alt="entry.item.name" draggable="false" />
            <em>x{{ entry.quantity }}</em>
          </div>
          <strong>{{ entry.item.name }}</strong>
          <small>{{ entry.item.effect }}</small>
          <button type="button" @click="wc.useItem(entry.item)">使用</button>
        </article>
        <article
          v-for="slot in inventoryEmptySlotCount"
          :key="`empty-inventory-${wc.pagedInventoryItems.current}-${slot}`"
          class="inventory-slot-card inventory-slot-empty"
          aria-hidden="true"
        >
        </article>
      </div>
    </div>
    <footer class="supply-module-footer">
      <span>{{ inventoryTotal }} 件物品 · {{ inventoryCategoryCount }} 类</span>
      <div class="pager compact">
        <button type="button" @click="wc.setPage('inventory', -1)">上一页</button>
        <span>{{ wc.pagedInventoryItems.current }} / {{ wc.pagedInventoryItems.totalPages }}</span>
        <button type="button" @click="wc.setPage('inventory', 1)">下一页</button>
      </div>
    </footer>
  </section>

</section>
</template>
