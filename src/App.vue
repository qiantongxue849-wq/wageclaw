<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useLite } from './lite/useLite';
import LiteSettings from './lite/LiteSettings.vue';
const app = reactive(useLite());
const dateLabel = computed(() => app.now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }));
const springText = computed(() => ({ unset: '留一个回家的盼头', started: '春节假期开始了', active: '春节假期中', ended: '这次假期已结束', upcoming: '距离我的春节放假' })[app.spring.state]);
const bonusText = computed(() => ({ unset: '留一个收获的盼头', received: '年终奖已收到', today: '预计今天发放', past: '预计日期已到', upcoming: '距离预计发放' })[app.bonus.state]);
</script>

<template>
  <div class="lite-root" :data-theme="app.settings.theme">
    <div class="page-shell">
      <header class="app-header">
        <a class="brand" href="#" aria-label="忍了吧首页" @click.prevent="app.settingsOpen = false">
          <span class="brand-mark">忍</span>
          <strong>
            忍了吧
            <span>每一天，都有盼头</span>
          </strong>
        </a>
        <nav class="header-actions" aria-label="页面操作">
          <button class="icon-button privacy-button" :aria-pressed="app.settings.privacy" :aria-label="app.settings.privacy ? '显示金额' : '隐藏金额'" @click="app.patch({ privacy: !app.settings.privacy })">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
              <circle cx="12" cy="12" r="3"/>
              <path v-if="app.settings.privacy" d="m3 3 18 18"/>
            </svg>
          </button>
          <button class="settings-button" @click="app.settingsOpen = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
              <path d="M4 7h16M4 17h16"/>
              <circle cx="9" cy="7" r="3" fill="var(--paper)"/>
              <circle cx="16" cy="17" r="3" fill="var(--paper)"/>
            </svg>
            设置
          </button>
        </nav>
      </header>
      <div v-if="app.notice && !app.settingsOpen" class="notice" role="status">
        <span>{{ app.notice }}</span>
        <button aria-label="关闭提示" @click="app.notice = ''">×</button>
      </div>
      <main>
        <section class="greeting">
          <div>
            <p class="eyebrow">{{ dateLabel }}</p>
            <h1>{{ app.income.status === 'after' && app.settings.configured ? '今天辛苦了，时间归你了。' : app.income.status === 'rest' && app.settings.configured ? '今天，安心休息。' : '每一分钟，都在靠近好日子。' }}</h1>
          </div>
          <span class="quiet-tag">
            <i class="status-dot"></i>
            {{ app.settings.configured ? '按自己的节奏来' : '从你的作息开始' }}
          </span>
        </section>
        <section class="hero-grid" aria-label="今日收入与下班时间">
          <article class="earnings-card">
            <div class="card-top">
              <span>今日已赚</span>
              <span class="subtle-label">{{ app.settings.configured ? '实时估算' : '等待设置' }}</span>
            </div>
            <div class="income-number" data-testid="today-income">{{ app.settings.configured ? app.money(app.income.today) : '¥ —' }}</div>
            <p class="income-caption">{{ app.income.status === 'rest' ? '休息也很重要，今天不用赶进度。' : app.income.status === 'after' ? '今天的付出，已经看得见。' : '你的付出，正在一点点变成回报。' }}</p>
            <footer class="income-footer">
              <div>
                <span>本月已赚</span>
                <strong data-testid="month-income">{{ app.settings.configured ? app.money(app.income.monthly) : '¥ —' }}</strong>
              </div>
              <span class="payday-note">{{ app.payday ? app.payday.days === 0 ? '今天发薪' : `距发薪还有 ${app.payday.days} 天` : '每一步，都算数' }}</span>
            </footer>
          </article>
          <article class="offwork-card">
            <div class="card-top">
              <span>{{ app.income.status === 'working' && app.settings.configured ? '距离下班' : '今日状态' }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div class="clock-number" :class="{ 'clock-words': app.income.status !== 'working' || !app.settings.configured }" data-testid="offwork">{{ app.offLabel }}</div>
            <p class="clock-caption">{{ !app.settings.configured ? '填好工资和作息，让盼头开始。' : app.income.status === 'after' ? '剩下的时间，留给自己的生活。' : app.income.status === 'rest' ? '慢一点也没关系。' : `${app.shift.startTime} — ${app.shift.endTime}${app.shift.summer ? ' · 夏季作息' : ''} · 今天也有终点` }}</p>
            <footer class="shift-footer">
              <div>
                <span>今日班次进度</span>
                <strong>{{ app.settings.configured ? Math.round(app.income.progress * 100) : 0 }}%</strong>
              </div>
              <div class="progress-track" role="progressbar" aria-label="今日班次进度" :aria-valuenow="Math.round(app.income.progress * 100)" aria-valuemin="0" aria-valuemax="100">
                <i :style="{ width: `${app.income.progress * 100}%` }"></i>
              </div>
            </footer>
          </article>
        </section>
        <section class="anticipation-section" aria-labelledby="anticipation-title">
          <header class="section-heading">
            <h2 id="anticipation-title">接下来的盼头</h2>
            <span>日子向前，好事渐近</span>
          </header>
          <div class="anticipation-grid">
            <article class="event-card holiday-card">
              <span class="event-icon" aria-hidden="true">☀</span>
              <span class="event-kicker">{{ app.holidays && app.holidays.days <= 0 ? '正在放假' : '下一个节假日' }}</span>
              <h3>{{ app.holidays?.name || '假期安排待公布' }}</h3>
              <div v-if="app.holidays" class="event-number">
                <strong>{{ app.holidays.days > 0 ? app.holidays.days : app.holidays.remaining }}</strong>
                <span>{{ app.holidays.days > 0 ? '天后放假' : '天假期剩余' }}</span>
              </div>
              <p v-else class="event-empty">有了确定的日期，再开始期待。</p>
              <footer>{{ app.holidays ? `${app.holidays.start.slice(5).replace('-', '.')} — ${app.holidays.end.slice(5).replace('-', '.')} · 共 ${app.holidays.length} 天假` : '已收录 2026 年官方安排' }}</footer>
            </article>
            <article class="event-card spring-card">
              <span class="event-icon" aria-hidden="true">⌂</span>
              <span class="event-kicker">我的春节假期</span>
              <h3>{{ app.spring.state === 'upcoming' ? '离回家，又近了一天' : springText }}</h3>
              <div v-if="['upcoming', 'active'].includes(app.spring.state)" class="event-number">
                <strong>{{ app.spring.days }}</strong>
                <span>{{ app.spring.state === 'active' ? '天假期剩余' : '天后放假' }}</span>
              </div>
              <button v-else class="text-action event-empty" @click="app.settingsOpen = true">
                {{ app.spring.state === 'unset' ? '设置你的春节假期' : '调整假期日期' }}
                <span>↗</span>
              </button>
              <footer>{{ app.settings.springStart ? `${app.settings.springStart.replaceAll('-', '.')} 起 · 我的放假安排` : '按公司的实际放假日期倒数' }}</footer>
            </article>
            <article class="event-card bonus-card">
              <span class="event-icon" aria-hidden="true">✧</span>
              <span class="event-kicker">年终奖</span>
              <h3>{{ bonusText }}</h3>
              <div v-if="app.bonus.state === 'upcoming'" class="event-number">
                <strong>{{ app.bonus.days }}</strong>
                <span>天</span>
              </div>
              <button v-else-if="app.bonus.state === 'unset'" class="text-action event-empty" @click="app.settingsOpen = true">
                设置预计发放日期
                <span>↗</span>
              </button>
              <div v-else class="bonus-actions event-empty">
                <button v-if="app.bonus.state !== 'received'" class="text-action" @click="app.patch({ bonusReceived: true })">标记已收到</button>
                <button class="text-action" @click="app.settingsOpen = true">调整日期 ↗</button>
              </div>
              <footer>{{ app.settings.bonusDate ? `${app.settings.bonusDate.replaceAll('-', '.')} · ${app.settings.bonusAmount === null ? '以实际发放为准' : `预计 ${app.money(app.settings.bonusAmount)}`}` : '不确定也没关系，等消息到了再填' }}</footer>
            </article>
          </div>
        </section>
        <footer class="page-footer">
          <span>收入按月薪与排班估算，午休照常计入工时，不代表实际到账。</span>
          <span v-if="!app.calendarKnown">本年调休资料缺失，暂按个人排班估算。</span>
          <span v-else-if="app.income.workdays === 0">本月没有计划工作日，估算为零。</span>
          <span v-else>本月 {{ app.income.workdays }} 个计划工作日</span>
        </footer>
      </main>
      <LiteSettings v-if="app.settingsOpen" :settings="app.settings" :recovery="app.recovery" :notice="app.notice" :desktop="app.desktop" @close="app.settingsOpen = false" @save="async value => { if (await app.save(value)) app.settingsOpen = false; }" @export="app.exportBackup" @reset="app.reset" @import="app.importBackup" />
    </div>
  </div>
</template>
