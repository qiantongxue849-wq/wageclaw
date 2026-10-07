<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useLite } from './lite/useLite';
import { usePocket } from './lite/usePocket';
import LiteSettings from './lite/LiteSettings.vue';
import CompanionPanel from './lite/CompanionPanel.vue';
import BreakCorner from './lite/BreakCorner.vue';
import PetArtwork from './lite/PetArtwork.vue';
import WindowControls from './lite/WindowControls.vue';
import { petStage } from './lite/calendar';
import { dateKey, nextMonthDay, parseDate, type LiteSettings as Settings } from './lite/model';
import { workdayGap } from './lite/calendar';
import { cardArt } from './lite/cardArt';
const app = reactive(useLite());
const savingPet = ref(false);
let queuedPet: Settings['pet'] | null = null;
async function savePet(pet: Settings['pet']) {
  queuedPet = pet;
  if (savingPet.value) return;
  savingPet.value = true;
  try {
    while (queuedPet) {
      const next = queuedPet;
      queuedPet = null;
      await app.patch({ pet: next });
    }
  } finally { savingPet.value = false; }
}
async function toggleQuiet() {
  const b = app.settings.broadcast;
  const quiet = !b.enabled || b.quietDate === dateKey(app.now) || b.pauseUntil > app.now.getTime();
  await app.patch({ broadcast: { ...b, enabled: true, pauseUntil: 0, quietDate: quiet ? '' : dateKey(app.now) } });
}
const pocket = usePocket();
const slide = ref(0);
const gamesOpen = ref(false);
const slides = ['今日', '盼头', '桌宠', '游戏'];
const dateLabel = computed(() => app.now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }));
const springText = computed(() => ({ unset: '留一个回家的盼头', started: '春节假期开始了', active: '春节假期中', upcoming: '距离我的春节放假' })[app.spring.state]);
const bonusText = computed(() => ({ unset: '留一个收获的盼头', received: '年终奖已收到', today: '预计今天发放', past: '预计日期已到', upcoming: '距离预计发放' })[app.bonus.state]);
const BASIS_KEY = 'wageclaw-day-basis';
const workdayBasis = ref(false);
try { workdayBasis.value = localStorage.getItem(BASIS_KEY) === 'workday'; } catch { /* 读不到时保持自然日。 */ }
function setBasis(workday: boolean) {
  workdayBasis.value = workday;
  try { localStorage.setItem(BASIS_KEY, workday ? 'workday' : 'calendar'); } catch { /* 记不住时，这一次切换仍然生效。 */ }
}
function until(calendarDays: number, target: Date | null) {
  if (!workdayBasis.value || !target) return calendarDays;
  return workdayGap(app.now, target, app.settings);
}
const paydayNote = computed(() => {
  const value = app.payday;
  if (!value) return '每一步，都算数';
  if (value.days === 0) return '今天发薪';
  if (!workdayBasis.value) return `距发薪还有 ${value.days} 天`;
  const days = until(value.days, parseDate(value.date));
  return days === 0 ? '发薪前没有工作日' : `距发薪还有 ${days} 个工作日`;
});
const holidayView = computed(() => {
  const holiday = app.holidays;
  if (!holiday) return null;
  if (holiday.days <= 0) return { count: holiday.remaining, unit: '天假期剩余' };
  return workdayBasis.value
    ? { count: until(holiday.days, parseDate(holiday.start)), unit: '个工作日后放假' }
    : { count: holiday.days, unit: '天后放假' };
});
const clockParts = computed(() => {
  const label = app.offLabel ?? '';
  return /^\d+:\d{2}:\d{2}$/.test(label) ? { main: label.slice(0, -3), seconds: label.slice(-3) } : null;
});
const todayHope = computed(() => {
  const holiday = app.holidays;
  if (holiday && holidayView.value) {
    const { count } = holidayView.value;
    const value = holiday.days <= 0 ? `还剩 ${count} 天`
      : workdayBasis.value ? count === 0 ? '下班后放假' : `${count} 工作日后`
      : count === 1 ? '明天放假' : `${count} 天后放假`;
    return { label: holiday.name === '国庆节' ? '国庆' : holiday.name, value, title: `${holiday.name} · ${count} ${holidayView.value.unit}` };
  }
  const payday = app.payday;
  if (payday) {
    const count = until(payday.days, parseDate(payday.date));
    const value = payday.days === 0 ? '今天发薪' : workdayBasis.value ? `${count} 工作日后`
      : count === 1 ? '明天发薪' : `${count} 天后`;
    return { label: '下次发薪', value, title: paydayNote.value };
  }
  return { label: '下次假期', value: '待公布', title: '下一年的法定假期安排尚未收录' };
});
const springView = computed(() => {
  if (app.spring.state === 'active') return { count: app.spring.days, unit: '天假期剩余' };
  if (!workdayBasis.value || app.spring.state !== 'upcoming') return { count: app.spring.days, unit: '天后放假' };
  return { count: until(app.spring.days, nextMonthDay(app.now, app.settings.springStart)), unit: '个工作日后放假' };
});
const bonusView = computed(() => {
  if (!workdayBasis.value || app.bonus.state !== 'upcoming') return { count: app.bonus.days, unit: '天' };
  return { count: until(app.bonus.days, nextMonthDay(app.now, app.settings.bonusDate)), unit: '个工作日' };
});
</script>

<template>
  <div class="lite-root" :inert="gamesOpen" :class="{ 'is-pocket': pocket, 'is-desktop': !!app.desktop, 'has-window-controls': !!app.desktop?.windowControls }" :data-theme="app.settings.theme">
    <div class="page-shell">
      <header class="app-header">
        <a class="brand" href="#" aria-label="忍了吧首页" @click.prevent="app.settingsOpen = false">
          <span class="brand-mark">忍</span>
          <strong>
            忍了吧
            <span>给忙碌的日子，留一点松弛</span>
          </strong>
        </a>
        <nav class="header-actions" aria-label="页面操作">
          <div v-if="!pocket" class="day-basis" role="group" aria-label="天数统计">
            <button type="button" :aria-pressed="!workdayBasis" @click="setBasis(false)">自然日</button>
            <button type="button" :aria-pressed="workdayBasis" title="去掉周末、法定节假日和你设置的休息日，调休上班日照算" @click="setBasis(true)">工作日</button>
          </div>
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
        <section v-if="!pocket" class="greeting">
          <div>
            <p class="eyebrow">{{ dateLabel }}</p>
            <h1>{{ app.income.status === 'after' && app.settings.configured ? '今天辛苦了，时间归你了。' : app.income.status === 'rest' && app.settings.configured ? '今天，安心休息。' : app.income.status === 'working' && app.income.progress > .7 ? '再坚持一小会，今天就归你了。' : '慢慢来，好日子正在靠近。' }}</h1>
          </div>
          <span class="quiet-tag">
            <i class="status-dot"></i>
            {{ app.settings.configured ? '按自己的节奏来' : '从你的作息开始' }}
          </span>
        </section>
        <div class="dashboard-layout"><div class="dashboard-main" v-show="!pocket || slide !== 2">
        <section v-if="pocket && slide === 0" class="notebook-today" aria-label="今日小记">
          <div class="notebook-hero">
            <div class="notebook-summary">
              <div class="notebook-label">{{ !app.settings.configured ? '今日小记' : app.income.status === 'working' ? `${app.shift.endTime} 下班` : app.income.status === 'before' ? `${app.shift.startTime} 上班` : '今日安排' }}</div>
              <strong class="notebook-clock" :class="{ words: !clockParts }" data-testid="offwork" :aria-label="clockParts ? `距离下班 ${app.offLabel}` : app.offLabel"><template v-if="clockParts">{{ clockParts.main }}<span class="notebook-seconds">{{ clockParts.seconds }}</span></template><template v-else>{{ app.offLabel }}</template></strong>
            </div>
            <button class="notebook-pet" aria-label="打开我的桌宠" @click="slide = 2">
              <PetArtwork :style="app.settings.pet.style" :stage="app.settings.pet.form ?? petStage(app.now, app.settings)" />
            </button>
          </div>
          <div class="notebook-stats">
            <div class="notebook-stat notebook-income" :class="{ 'is-wide': !app.settings.privacy && app.money(app.income.today).length > 11 }"><span>今日估算</span><strong data-testid="today-income">{{ app.settings.configured ? app.money(app.income.today) : '¥ —' }}</strong></div>
            <div class="notebook-stat notebook-next" :title="todayHope.title"><span>{{ todayHope.label }}</span><strong>{{ todayHope.value }}</strong></div>
          </div>
        </section>
        <section v-if="pocket && slide === 1" class="notebook-hopes" aria-label="接下来的盼头">
          <div class="notebook-hopes-head"><div class="hopes-month"><span>本月已赚 · 估算</span><strong data-testid="month-income">{{ app.settings.configured ? app.money(app.income.monthly) : '¥ —' }}</strong></div><div class="day-basis" role="group" aria-label="天数统计"><button :aria-pressed="!workdayBasis" @click="setBasis(false)">自然日</button><button :aria-pressed="workdayBasis" @click="setBasis(true)">工作日</button></div></div>
          <div class="hopes-grid">
            <div><span>下次发薪</span><strong>{{ app.payday ? app.payday.days === 0 ? '今天发薪' : `${until(app.payday.days, parseDate(app.payday.date))} ${workdayBasis ? '工作日后' : '天后'}` : '待设置' }}</strong></div>
            <div><span>{{ app.holidays?.name || '下一个假期' }}</span><strong>{{ holidayView ? `${holidayView.count} ${holidayView.unit.replace('个工作日后放假', '工作日后').replace('天后放假', '天后')}` : '待公布' }}</strong></div>
            <button @click="app.settingsOpen = true"><span>我的春节 <small>↗</small></span><strong>{{ ['upcoming', 'active'].includes(app.spring.state) ? `${springView.count} ${springView.unit.replace('个工作日后放假', '工作日后').replace('天后放假', '天后')}` : '设置假期' }}</strong></button>
            <button @click="app.settingsOpen = true"><span>年终奖 · 预计 <small>↗</small></span><strong>{{ app.bonus.state === 'upcoming' ? `${bonusView.count} ${bonusView.unit.replace('个工作日', '工作日')}后` : app.bonus.state === 'unset' ? '待设置' : bonusText }}</strong></button>
          </div>
        </section>
        <section v-if="!pocket" class="hero-grid" aria-label="今日收入与下班时间">
          <article class="earnings-card">
            <div class="card-top">
              <span class="card-title"><img class="card-glyph" :src="cardArt.income" alt="" />今日已赚</span>
              <span class="subtle-label">{{ app.settings.configured ? '实时估算' : '等待设置' }}</span>
            </div>
            <div class="income-number" data-testid="today-income">{{ app.settings.configured ? app.money(app.income.today) : '¥ —' }}</div>
            <p class="income-caption">{{ app.income.status === 'rest' ? '休息也很重要，今天不用赶进度。' : app.income.status === 'after' ? '今天的付出，已经看得见。' : '你的付出，正在一点点变成回报。' }}</p>
            <footer class="income-footer">
              <div>
                <span>本月已赚</span>
                <strong data-testid="month-income">{{ app.settings.configured ? app.money(app.income.monthly) : '¥ —' }}</strong>
              </div>
              <span class="payday-note">{{ paydayNote }}</span>
            </footer>
          </article>
          <article class="offwork-card">
            <div class="card-top">
              <span class="card-title"><img class="card-glyph" :src="cardArt.offwork" alt="" />{{ app.income.status === 'working' && app.settings.configured ? '距离下班' : '今日状态' }}</span>
            </div>
            <div class="clock-number" :class="{ 'clock-words': app.income.status !== 'working' || !app.settings.configured }" data-testid="offwork">{{ app.offLabel }}</div>
            <p class="clock-caption">{{ !app.settings.configured ? '填好工资和作息，让盼头开始。' : app.income.status === 'after' ? '剩下的时间，留给自己的生活。' : app.income.status === 'rest' ? '慢一点也没关系。' : `${app.shift.startTime} — ${app.shift.endTime}${app.shift.summer ? ' · 夏季作息' : ''} · 今天也有终点` }}</p>
            <footer class="shift-footer">
              <div>
                <span>今天已经走过</span>
                <strong>{{ app.settings.configured ? Math.round(app.income.progress * 100) : 0 }}%</strong>
              </div>
              <div class="progress-track" role="progressbar" aria-label="今日班次进度" :aria-valuenow="Math.round(app.income.progress * 100)" aria-valuemin="0" aria-valuemax="100">
                <i :style="{ width: `${app.income.progress * 100}%` }"></i>
              </div>
            </footer>
          </article>
        </section>
        <section v-if="!pocket" class="anticipation-section" aria-labelledby="anticipation-title">
          <header class="section-heading">
            <h2 id="anticipation-title">接下来的盼头</h2>
            <span>日子向前，好事渐近</span>
          </header>
          <div class="anticipation-grid">
            <article class="event-card holiday-card">
              <img class="event-art" :src="cardArt.holiday" alt="" />
              <span class="event-kicker">{{ app.holidays && app.holidays.days <= 0 ? '正在放假' : '下一个节假日' }}</span>
              <h3>{{ app.holidays?.name || '假期安排待公布' }}</h3>
              <div v-if="holidayView" class="event-number">
                <strong>{{ holidayView.count }}</strong>
                <span>{{ holidayView.unit }}</span>
              </div>
              <p v-else class="event-empty">有了确定的日期，再开始期待。</p>
              <footer>{{ app.holidays ? `${app.holidays.start.slice(5).replace('-', '.')} — ${app.holidays.end.slice(5).replace('-', '.')} · 共 ${app.holidays.length} 天假` : '已收录 2026 年官方安排' }}</footer>
            </article>
            <article class="event-card spring-card">
              <img class="event-art" :src="cardArt.spring" alt="" />
              <span class="event-kicker">我的春节假期</span>
              <h3>{{ app.spring.state === 'upcoming' ? '离回家，又近了一天' : springText }}</h3>
              <div v-if="['upcoming', 'active'].includes(app.spring.state)" class="event-number">
                <strong>{{ springView.count }}</strong>
                <span>{{ springView.unit }}</span>
              </div>
              <button v-else class="text-action event-empty" @click="app.settingsOpen = true">
                {{ app.spring.state === 'unset' ? '设置你的春节假期' : '调整假期日期' }}
                <span>↗</span>
              </button>
              <footer>{{ app.settings.springStart ? `每年 ${app.settings.springStart.replace('-', '.')} 起 · 我的放假安排` : '按公司的实际放假日期倒数' }}</footer>
            </article>
            <article class="event-card bonus-card">
              <img class="event-art" :src="cardArt.bonus" alt="" />
              <span class="event-kicker">年终奖</span>
              <h3>{{ bonusText }}</h3>
              <div v-if="app.bonus.state === 'upcoming'" class="event-number">
                <strong>{{ bonusView.count }}</strong>
                <span>{{ bonusView.unit }}</span>
              </div>
              <button v-else-if="app.bonus.state === 'unset'" class="text-action event-empty" @click="app.settingsOpen = true">
                设置预计发放日期
                <span>↗</span>
              </button>
              <div v-else class="bonus-actions event-empty">
                <button v-if="app.bonus.state !== 'received'" class="text-action" @click="app.markBonus(true)">标记已收到</button>
                <button class="text-action" @click="app.settingsOpen = true">调整日期 ↗</button>
              </div>
              <footer>{{ app.settings.bonusDate ? `每年 ${app.settings.bonusDate.replace('-', '.')} · ${app.settings.bonusAmount === null ? '以实际发放为准' : `预计 ${app.money(app.settings.bonusAmount)}`}` : '不确定也没关系，等消息到了再填' }}</footer>
            </article>
          </div>
        </section>
        <BreakCorner v-if="!pocket || slide === 3 || gamesOpen" :theme="app.settings.theme" @active="gamesOpen = $event" />
        </div><CompanionPanel v-show="!pocket || slide === 2" :settings="app.settings" :now="app.now" :saving="savingPet" @pet="savePet" @quiet="toggleQuiet" /></div>
        <nav v-if="pocket" class="pocket-nav" aria-label="切换卡片">
          <button v-for="(name, index) in slides" :key="name" type="button" :aria-label="name" :aria-current="slide === index ? 'page' : undefined" @click="slide = index">{{ name }}</button>
        </nav>
        <footer class="page-footer">
          <span>收入按月薪与排班估算，午休照常计入工时，不代表实际到账。</span>
          <span v-if="!app.calendarKnown">本年调休资料缺失，暂按个人排班估算。</span>
          <span v-else-if="app.income.workdays === 0">本月没有计划工作日，估算为零。</span>
          <span v-else>本月 {{ app.income.workdays }} 个计划工作日</span>
        </footer>
      </main>
      <LiteSettings v-if="app.settingsOpen" :settings="app.settings" :recovery="app.recovery" :notice="app.notice" :desktop="app.desktop" @close="app.settingsOpen = false" @save="async value => { if (await app.save(value)) app.settingsOpen = false; }" @export="app.exportBackup" @reset="app.reset" @import="app.importBackup" @dismiss-notice="app.notice = ''" />
    </div>
    <WindowControls :theme="app.settings.theme" :compact="pocket && !gamesOpen && !app.settingsOpen" />
  </div>
</template>
