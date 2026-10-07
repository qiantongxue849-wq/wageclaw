// WageClaw Gomoku. MIT License; see LICENSE. Local AI, no network or account.
'use strict';
const canvas = document.getElementById('board'), ctx = canvas.getContext('2d');
const status = document.getElementById('status'), mode = document.getElementById('mode');
const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
const N = 15, margin = 18, gap = 23, size = margin * 2 + gap * (N - 1);
let board, moves, turn, ended, thinking, timer, winning = [], cursor = [7, 7];
function inside(x, y) { return x >= 0 && y >= 0 && x < N && y < N; }
function reset() { clearTimeout(timer); board = Array.from({ length: N }, () => Array(N).fill(0)); moves = []; turn = 1; ended = false; thinking = false; winning = []; cursor = [7, 7]; draw(); announce(); }
function announce(text) { status.textContent = text || (thinking ? '电脑思考中…' : turn === 1 ? '● 黑棋落子' : '○ 白棋落子'); }
function fit() {
  const pixels = Math.max(80, Math.min(innerHeight - 8, innerWidth - 128));
  canvas.style.width = canvas.style.height = pixels + 'px';
  canvas.width = canvas.height = Math.round(pixels * devicePixelRatio);
  draw();
}
function draw() {
  if (!board) return;
  ctx.setTransform(canvas.width / size, 0, 0, canvas.height / size, 0, 0);
  ctx.fillStyle = '#e8ca92'; ctx.fillRect(0, 0, size, size); ctx.strokeStyle = '#a58453'; ctx.lineWidth = 1;
  for (let n = 0; n < N; n++) {
    const p = margin + n * gap; ctx.beginPath(); ctx.moveTo(margin, p); ctx.lineTo(size - margin, p); ctx.moveTo(p, margin); ctx.lineTo(p, size - margin); ctx.stroke();
  }
  for (const x of [3, 7, 11]) for (const y of [3, 7, 11]) { ctx.beginPath(); ctx.arc(margin + x * gap, margin + y * gap, 3, 0, Math.PI * 2); ctx.fillStyle = '#8e6c43'; ctx.fill(); }
  board.forEach((row, y) => row.forEach((stone, x) => {
    if (!stone) return;
    const px = margin + x * gap, py = margin + y * gap;
    const shade = ctx.createRadialGradient(px - 4, py - 4, 1, px, py, 10);
    shade.addColorStop(0, stone === 1 ? '#535353' : '#fff'); shade.addColorStop(1, stone === 1 ? '#141414' : '#ded9cb');
    ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fillStyle = shade; ctx.fill();
  }));
  const last = moves.at(-1);
  if (last) { ctx.fillStyle = '#bd613b'; ctx.fillRect(margin + last.x * gap - 2, margin + last.y * gap - 2, 4, 4); }
  if (winning.length) {
    ctx.strokeStyle = '#bc573b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(margin + winning[0][0] * gap, margin + winning[0][1] * gap); const lastWin = winning.at(-1); ctx.lineTo(margin + lastWin[0] * gap, margin + lastWin[1] * gap); ctx.stroke();
  }
  if (document.activeElement === canvas && !ended) { ctx.strokeStyle = '#bd613b'; ctx.lineWidth = 2; ctx.strokeRect(margin + cursor[0] * gap - 11, margin + cursor[1] * gap - 11, 22, 22); }
}
function line(x, y, stone, dx, dy) {
  const cells = [[x, y]];
  for (const sign of [-1, 1]) { let a = x + dx * sign, b = y + dy * sign; while (inside(a, b) && board[b][a] === stone) { sign < 0 ? cells.unshift([a, b]) : cells.push([a, b]); a += dx * sign; b += dy * sign; } }
  return cells;
}
function place(x, y) {
  if (ended || !inside(x, y) || board[y][x]) return false;
  board[y][x] = turn; moves.push({ x, y, stone: turn });
  for (const [dx, dy] of directions) { const cells = line(x, y, turn, dx, dy); if (cells.length >= 5) { ended = true; winning = cells; announce(turn === 1 ? '黑棋赢了！' : '白棋赢了！'); break; } }
  if (!ended && moves.length === N * N) { ended = true; announce('平局，再来一盘。'); }
  if (!ended) { turn = 3 - turn; announce(); }
  draw(); return true;
}
// Score contiguous threats and five-cell windows. Immediate wins/blocks always
// outrank positional choices; nearby empty cells keep each turn inexpensive.
function score(x, y, stone) {
  let total = 0;
  board[y][x] = stone;
  for (const [dx, dy] of directions) {
    const cells = line(x, y, stone, dx, dy), count = cells.length;
    if (count >= 5) { board[y][x] = 0; return 10000000; }
    const [a, b] = cells[0], [c, d] = cells.at(-1);
    const open = Number(inside(a - dx, b - dy) && !board[b - dy][a - dx]) + Number(inside(c + dx, d + dy) && !board[d + dy][c + dx]);
    if (open) total += [0, 2, 20, 700, 50000][count] * open * open;
    for (let start = -4; start <= 0; start++) {
      let same = 0, valid = true;
      for (let k = 0; k < 5; k++) { const a = x + (start + k) * dx, b = y + (start + k) * dy; if (!inside(a, b) || board[b][a] === 3 - stone) { valid = false; break; } if (board[b][a] === stone) same++; }
      if (valid) total += [0, 1, 6, 80, 4000, 10000000][same];
    }
  }
  board[y][x] = 0; return total;
}
function choose() {
  let best = -1, move = [7, 7];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (board[y][x]) continue;
    const nearby = moves.some(m => Math.abs(m.x - x) <= 2 && Math.abs(m.y - y) <= 2);
    if (moves.length && !nearby) continue;
    const attack = score(x, y, 2), defend = score(x, y, 1);
    const value = attack >= 10000000 ? 1e10 : defend >= 10000000 ? 1e9 : attack * 1.1 + defend;
    const ranked = value - (Math.abs(x - 7) + Math.abs(y - 7)) * .01;
    if (ranked > best) { best = ranked; move = [x, y]; }
  }
  return move;
}
function human(x, y) {
  if (thinking || !place(x, y) || ended || mode.value !== 'ai') return;
  thinking = true; announce();
  timer = setTimeout(() => { thinking = false; place(...choose()); }, 160);
}
canvas.addEventListener('click', event => { const r = canvas.getBoundingClientRect(); const x = Math.round(((event.clientX - r.left) * size / r.width - margin) / gap), y = Math.round(((event.clientY - r.top) * size / r.height - margin) / gap); if (inside(x, y)) { cursor = [x, y]; human(x, y); } });
canvas.addEventListener('keydown', event => {
  const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
  if (delta) { event.preventDefault(); cursor = cursor.map((value, n) => Math.max(0, Math.min(N - 1, value + delta[n]))); draw(); }
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); human(...cursor); }
});
canvas.addEventListener('focus', draw); canvas.addEventListener('blur', draw);
document.getElementById('undo').addEventListener('click', () => {
  clearTimeout(timer); const count = mode.value === 'ai' && !thinking && moves.length > 1 ? 2 : 1;
  for (let i = 0; i < count; i++) { const move = moves.pop(); if (move) { board[move.y][move.x] = 0; turn = move.stone; } }
  ended = false; thinking = false; winning = []; announce(); draw();
});
document.getElementById('reset').addEventListener('click', reset); mode.addEventListener('change', reset); window.addEventListener('resize', fit);
reset(); fit();
