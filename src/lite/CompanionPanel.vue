<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { INTERACTIONS_PER_STAGE, PET_STYLES, PET_STYLE_LABELS, dateKey, type LiteSettings } from './model';
import { petStage, recordPetInteraction } from './calendar';
import { manualReport, requestedReport, comfortReport, type ReportTopic } from './broadcast';
import { reportAction } from './petReactions';
import { petThumbs } from './petAssets';
import PetArtwork from './PetArtwork.vue';
const props = defineProps<{ settings: LiteSettings; now: Date; saving: boolean }>();
const emit = defineEmits<{ pet: [value: LiteSettings['pet']]; quiet: [] }>();
const portrait = ref<InstanceType<typeof PetArtwork>>();
const wardrobe = ref(false);
const message = ref('事情可以一件件来，我陪着你。');
const topic = ref('');
let touches = 0;
const authored = computed(() => props.settings.pet.motion === 'authored');
const stage = computed(() => props.settings.pet.form ?? petStage(props.now, props.settings));
function bump() {
  const next = recordPetInteraction(props.now, props.settings);
  if (next === props.settings) return;
  emit('pet', next.pet);
  void window.wageclawLite?.setPetBond?.(next.pet.bondDate, next.pet.bondCount)?.catch(() => undefined);
}
function interact(action: 'pat' | 'stretch') {
  bump();
  portrait.value?.play(action === 'pat' ? 'play' : 'stretch');
  message.value = comfortReport(props.settings.pet.style, action, touches++).text;
  if (window.wageclawLite) void window.wageclawLite.interact(action);
}
function report(requested?: ReportTopic) {
  bump();
  const next = requested ? requestedReport(props.now, props.settings, requested) : manualReport(props.now, props.settings, topic.value);
  topic.value = next.topic; message.value = next.text; const action = reportAction(next); if (action) portrait.value?.play(action);
}
function form(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  emit('pet', { ...props.settings.pet, form: value === 'auto' ? null : Number(value) });
}
watch([() => props.settings.privacy, () => props.settings.pet.style], () => { message.value = '事情可以一件件来，我陪着你。'; topic.value = ''; });
watch(() => props.settings.bonusReceivedAt, (value, before) => { if (value && value !== before) { message.value = '这一份辛苦终于到账了，为你开心。'; portrait.value?.play('celebrate'); } });
const quiet = computed(() => !props.settings.broadcast.enabled || props.settings.broadcast.quietDate === dateKey(props.now) || props.settings.broadcast.pauseUntil > props.now.getTime());
</script>
<template>
  <aside class="companion-panel" aria-label="我的桌面搭子">
    <header class="companion-heading"><h2>我的桌面搭子</h2><span><i class="status-dot"></i> {{ quiet ? '安静陪伴中' : '偶尔说一句' }}</span></header>
    <p class="companion-speech" role="status">{{ message }}</p>
    <button class="companion-pet" :aria-label="`摸摸${PET_STYLE_LABELS[settings.pet.style]}`" @click="interact('pat')"><PetArtwork ref="portrait" :style="settings.pet.style" :stage="stage" :animated="authored" transitions /></button>
    <h3>{{ PET_STYLE_LABELS[settings.pet.style] }}</h3>
    <p class="companion-caption">{{ settings.pet.form ? `喜欢的第 ${stage} 种模样` : stage >= 10 ? `今天的第 ${stage} 种模样` : `今天的第 ${stage} 种模样 · 再陪 ${INTERACTIONS_PER_STAGE} 次会换，满一小时也会换` }}</p>
    <div class="companion-actions"><button @click="interact('pat')">♡ 摸摸它</button><button @click="interact('stretch')">一起松口气</button><button @click="report()">听一句</button></div>
    <nav class="companion-topics" aria-label="让搭子报个信"><button @click="report('income')">攒了多少</button><button @click="report('offwork')">多久下班</button><button @click="report('holiday')">多久放假</button><button @click="report('spring')">春节回家</button><button @click="report('bonus')">年终奖</button></nav>
    <div class="pet-picker" aria-label="选择桌宠">
      <button v-for="item in PET_STYLES" :key="item" :aria-label="`选择${PET_STYLE_LABELS[item]}`" :aria-pressed="settings.pet.style === item" :disabled="saving" @click="emit('pet', { ...settings.pet, style: item })"><img :src="petThumbs[item]" alt="" width="48" height="48" /><span>{{ PET_STYLE_LABELS[item] }}</span></button>
    </div>
    <button class="wardrobe-toggle" :aria-expanded="wardrobe" @click="wardrobe = !wardrobe">换个形态 <span>{{ wardrobe ? '收起 −' : '10 种自由选 ＋' }}</span></button>
    <div v-if="wardrobe" class="wardrobe">
      <label>形态模式<select aria-label="形态模式" :value="settings.pet.form ?? 'auto'" :disabled="saving" @change="form"><option value="auto">随互动变化</option><option v-for="n in 10" :key="n" :value="n">固定第 {{ n }} 种形态</option></select></label>
      <label class="switch-row"><span>互动时做动作</span><input type="checkbox" aria-label="互动时做动作" :checked="authored" :disabled="saving" @change="emit('pet', { ...settings.pet, motion: ($event.target as HTMLInputElement).checked ? 'authored' : 'classic' })" /></label>
      <div class="form-gallery"><button v-for="n in 10" :key="n" :disabled="saving" :aria-label="`选择第 ${n} 种形态`" :aria-pressed="settings.pet.form === n" @click="emit('pet', { ...settings.pet, form: n })"><PetArtwork :style="settings.pet.style" :stage="n" /><span>{{ n }}</span></button></div>
      <p>每天一上班是第一种模样。每种模样互动 {{ INTERACTIONS_PER_STAGE }} 次会换下一种；就算次数不够，上班后每满一小时也会自动换。也可以固定一种，10 种模样都能做动作。</p>
    </div>
    <p v-if="authored" class="companion-caption">攒钱时开心一下 · 听到假期就抬头 · 休息时松口气</p>
    <footer>不用喂养，不用打卡，想起来就陪你玩。</footer>
    <button class="companion-quiet" @click="emit('quiet')">{{ quiet ? '恢复偶尔播报' : '今天想安静一点' }}</button>
  </aside>
</template>
