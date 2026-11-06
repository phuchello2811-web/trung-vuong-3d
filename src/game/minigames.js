import { TYPING_WORDS } from './data.js';

const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); } for (const k of kids) e.append(k); return e; };

// Luyện gõ phím 30 giây, gõ không dấu. Trả về số từ đúng qua onDone.
export function typingGame(root, onDone) {
  const words = Array.from({ length: 60 }, () => TYPING_WORDS[Math.floor(Math.random() * TYPING_WORDS.length)]);
  let i = 0, ok = 0, bad = 0, left = 30, started = false, timer = 0;
  const line = el('div', { class: 'tw' }), inp = el('input', { id: 'typeIn', class: 'tin', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Gõ từ đang tô sáng rồi nhấn cách' });
  const stat = el('div', { class: 'tstat mono' });
  const render = () => { line.replaceChildren(...words.slice(i, i + 12).map((w, k) => el('span', { class: k ? '' : 'cur' }, w + ' '))); stat.textContent = `Còn ${left} giây · đúng ${ok} · sai ${bad}`; };
  const finish = () => { clearInterval(timer); inp.disabled = true; const wpm = ok * 2; stat.textContent = `Hết giờ: ${ok} từ đúng, ${bad} từ sai, khoảng ${wpm} từ/phút.`; onDone({ ok, bad, wpm }); };
  inp.addEventListener('keydown', e => {
    if (!started) { started = true; timer = setInterval(() => { left--; if (left <= 0) finish(); else render(); }, 1000); }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); const v = inp.value.trim(); if (!v) return; if (v === words[i]) ok++; else bad++; i++; inp.value = ''; render(); }
    if (e.key !== 'Escape') e.stopPropagation();
  });
  root.append(el('p', { class: 'muted' }, 'Gõ từ đang tô sáng rồi nhấn phím cách. Gõ không dấu. Đồng hồ bắt đầu khi bạn gõ phím đầu tiên.'), line, inp, stat);
  render(); setTimeout(() => inp.focus(), 50);
  return () => clearInterval(timer);
}

// Rắn săn mồi trên máy tính phòng Tin
export function snakeGame(root, best, onScore) {
  const N = 18, S = 18, c = el('canvas', { width: N * S, height: N * S, class: 'snake', tabindex: '0', 'aria-label': 'Trò rắn săn mồi, dùng phím mũi tên' });
  const info = el('div', { class: 'tstat mono' });
  let snake = [[8, 9], [7, 9], [6, 9]], dir = [1, 0], next = [1, 0], food = [12, 9], score = 0, alive = true, t = 0;
  const g = c.getContext('2d');
  const place = () => { do { food = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; } while (snake.some(p => p[0] === food[0] && p[1] === food[1])); };
  const draw = () => {
    g.fillStyle = '#0d1a14'; g.fillRect(0, 0, N * S, N * S);
    g.fillStyle = '#e04848'; g.fillRect(food[0] * S + 3, food[1] * S + 3, S - 6, S - 6);
    snake.forEach((p, k) => { g.fillStyle = k ? '#55c26a' : '#a6f08a'; g.fillRect(p[0] * S + 1, p[1] * S + 1, S - 2, S - 2); });
    info.textContent = alive ? `Điểm ${score} · kỉ lục ${Math.max(best, score)}` : `Thua rồi: ${score} điểm. Nhấn Enter để chơi lại.`;
  };
  const step = () => {
    if (!alive) return; dir = next; const h = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
    if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || snake.some(p => p[0] === h[0] && p[1] === h[1])) { alive = false; onScore(score); draw(); return; }
    snake.unshift(h); if (h[0] === food[0] && h[1] === food[1]) { score++; place(); } else snake.pop(); draw();
  };
  const turn = d => { if (d[0] !== -dir[0] || d[1] !== -dir[1]) next = d; };
  c.addEventListener('keydown', e => {
    const m = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] }[e.code];
    if (m) { e.preventDefault(); turn(m); }
    if (e.key === 'Enter' && !alive) { snake = [[8, 9], [7, 9], [6, 9]]; dir = next = [1, 0]; score = 0; alive = true; place(); }
    if (e.key !== 'Escape') e.stopPropagation();
  });
  let sx = 0, sy = 0;
  c.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; c.focus(); if (!alive) { snake = [[8, 9], [7, 9], [6, 9]]; dir = next = [1, 0]; score = 0; alive = true; place(); } });
  c.addEventListener('pointerup', e => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.hypot(dx, dy) < 18) return; turn(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]); });
  root.append(el('p', { class: 'muted' }, 'Dùng phím mũi tên hoặc W A S D. Trên điện thoại thì vuốt trên màn hình.'), c, info);
  draw(); setTimeout(() => c.focus(), 50);
  t = setInterval(step, 120);
  return () => clearInterval(t);
}
