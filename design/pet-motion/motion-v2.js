// Every displayed pose is authored artwork; only sheet registration translates it.
export const response = [
  [0, 160], [1, 75], [2, 90], [3, 170],
  [4, 110], [5, 130], [6, 320],
  [9, 45], [8, 90], [9, 65], [6, 220],
  [5, 130], [4, 120], [3, 130], [2, 95], [1, 80], [0, 180]
];
export const blink = [[0, 120], [1, 70], [2, 85], [3, 300], [2, 50], [1, 45], [0, 160]];
export const previous = [100,60,60,140,100,100,160,55,90,60,100,80,100,100,100,100].map((duration, frame) => [frame, duration]);
// Return along the same authored poses so each action lands on its exact rest pose.
const settle = (peak, hold, step = 95) => [
  [0, 180], ...Array.from({ length: peak }, (_, i) => [i + 1, i + 1 === peak ? hold : step]),
  ...Array.from({ length: peak }, (_, i) => [peak - i - 1, step + 15]), [0, 220]
];
export const actions = {
  response: { suffix: '-v2', clip: response, caption: '轻轻看看你，再慢慢放松下来。' },
  blink: { suffix: '-v2', clip: blink, caption: '眨眨眼，陪你放空一小会儿。' },
  yawn: { suffix: '-yawn', clip: settle(8, 420, 110), caption: '有点困了，你也歇一下吧。' },
  nuzzle: { suffix: '-nuzzle', clip: settle(7, 400, 100), caption: '嗯，被你摸摸就好多了。' },
  ears: { suffix: '-ears', clip: settle(8, 150, 75), caption: '耳朵动了动，是快下班了吗？' }
};
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const slider = document.querySelector('#frame');
const frameLabel = document.querySelector('#frame-label');
const status = document.querySelector('#status');
const stateLabel = document.querySelector('#old-status');

async function player(id, version) {
  const canvas = document.querySelector(id), ctx = canvas.getContext('2d');
  const cache = new Map();
  async function load(suffix) {
    if (!cache.has(suffix)) {
      const img = new Image(); img.src = `./capybara-poses${suffix}.webp`;
      const pending = Promise.all([fetch(`./frames${suffix}.json`).then(r => {
        if (!r.ok) throw new Error('Missing pose metadata'); return r.json();
      }), img.decode()]).then(([frames]) => ({ img, frames })).catch(error => { cache.delete(suffix); throw error; });
      cache.set(suffix, pending);
    }
    return cache.get(suffix);
  }
  let pack = version === 2 ? '-v2' : '';
  let { img, frames } = await load(pack);
  let timer, current = 0, running = false;
  function draw(n) {
    const f = frames[n], scale = .8;
    ctx.clearRect(0, 0, 288, 288);
    const left = version === 2 ? 114 - f.paw * scale : 144 - f.center * scale;
    ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh, left, 266 - f.ground * scale, f.sw * scale, f.sh * scale);
    current = n;
    if (version === 2) { slider.value = n; frameLabel.textContent = `${String(n + 1).padStart(2, '0')} / 16`; }
  }
  function stop(reset = true) { clearTimeout(timer); timer = undefined; running = false; if (reset) draw(0); }
  function play(clip) {
    stop();
    if (preference.matches) return;
    const speed = document.querySelector('#slow').checked ? 2 : 1;
    running = true;
    const start = performance.now();
    let nextAt = 0;
    function step(i) {
      if (i >= clip.length) { stop(); if (version === 2) status.textContent = '回应结束，安心待着。'; else stateLabel.textContent = '上一版样片'; return; }
      draw(clip[i][0]);
      nextAt += clip[i][1] * speed;
      timer = setTimeout(() => step(i + 1), Math.max(0, nextAt - (performance.now() - start)));
    }
    step(0);
  }
  draw(0);
  return { draw, play, stop, load,
    use(suffix, asset) { stop(false); pack = suffix; ({ img, frames } = asset); draw(0); },
    state: () => ({ playing: running, frame: current, pack, transform: getComputedStyle(canvas).transform }) };
}
try {
  const [old, refined] = await Promise.all([player('#old', 1), player('#pet', 2)]);
  let request = 0, selected = 'response';
  const stop = () => { request++; old.stop(); refined.stop(); status.textContent = '静止 · 点击它，再陪你玩一下'; stateLabel.textContent = '上一版样片'; };
  async function play(key = selected) {
    const token = ++request, action = actions[key];
    refined.stop();
    status.textContent = '准备这个小动作…';
    try {
      const asset = await refined.load(action.suffix);
      if (token !== request || document.hidden) return;
      selected = key;
      refined.use(action.suffix, asset);
      window.motionStudyClip = action.clip;
      document.querySelectorAll('[data-action]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.action === key)));
      refined.play(action.clip);
      status.textContent = preference.matches ? '已减少动态效果，可拖动滑杆查看。' : action.caption;
    } catch (error) {
      if (token === request) status.textContent = '这个动作暂未准备好，点击可以重试。';
      console.error(error);
    }
  }
  document.querySelectorAll('[data-action]').forEach(el => { el.onclick = () => play(el.dataset.action); });
  document.querySelector('#pet-button').onclick = () => play();
  document.querySelector('#stop').onclick = stop;
  document.querySelector('#old-play').onclick = () => { old.play(previous); stateLabel.textContent = '播放上一版…'; };
  document.querySelector('#compare').onclick = () => { old.play(previous); play('response'); };
  document.querySelector('#slow').onchange = stop;
  slider.oninput = () => { request++; const n = Number(slider.value); refined.stop(false); refined.draw(n); status.textContent = '细节查看 · 拖动看看表情'; };
  document.querySelector('#size').onclick = event => {
    const small = document.querySelector('.comparison').classList.toggle('small');
    event.target.textContent = small ? '放大看看细节' : '切换到桌宠实际大小';
  };
  document.querySelector('#background').onclick = event => {
    const dark = document.querySelector('.comparison').classList.toggle('night');
    event.target.setAttribute('aria-pressed', String(dark));
    event.target.textContent = dark ? '换回浅色背景' : '在深色背景下看看';
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  preference.addEventListener('change', () => { if (preference.matches) stop(); });
  addEventListener('pagehide', stop);
  document.querySelectorAll('button[disabled], input[disabled]').forEach(el => { el.disabled = false; });
  stop();
  window.motionStudyState = refined.state;
  window.motionStudyClip = response;
} catch (error) { status.textContent = '素材暂未加载，请刷新重试。'; console.error(error); }
