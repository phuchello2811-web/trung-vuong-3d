import { REAGENTS, REACTIONS } from './data.js';

// Tìm phản ứng ứng với tập chất trong ống: ưu tiên quy tắc cần nhiều chất hơn,
// và quy tắc chứa chất vừa thêm vào.
export function findReaction(contents, last) {
  const set = new Set(contents);
  const ok = REACTIONS.filter(r => r.need.every(x => set.has(x)) && (!last || r.need.includes(last)) && (!r.last || r.last === last));
  ok.sort((a, b) => b.need.length - a.need.length);
  return ok[0] || null;
}

// Ống nghiệm vẽ trên canvas: dung dịch, chất rắn, bọt khí, kết tủa lắng dần
export class Tube {
  constructor(canvas) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.reset();
    this.t = 0; this.raf = 0; this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  reset() {
    this.items = []; this.level = 0; this.color = [236, 240, 244, 0]; this.target = this.color.slice();
    this.bubbles = 0; this.ppt = null; this.pptAmt = 0; this.coat = null; this.coatAmt = 0; this.foam = 0; this.warm = 0; this.parts = [];
  }
  add(id) {
    const r = REAGENTS[id]; this.items.push(id);
    if (r.kind === 'liq' || r.kind === 'ind') {
      const add = r.kind === 'ind' ? .12 : .28; const k = this.level / (this.level + add);
      this.level = Math.min(.92, this.level + add);
      this.target = this.target.map((v, i) => i < 3 ? v * k + r.color[i] * (1 - k) : Math.max(v, r.color[3] * (1 - k) + v * k));
    }
  }
  apply(fx) {
    if (!fx) return;
    if (fx.liquid) this.target = fx.liquid.slice();
    if (fx.bubbles) this.bubbles = fx.bubbles;
    if (fx.ppt) { this.ppt = fx.ppt; this.pptAmt = 0; for (let i = 0; i < 90; i++) this.parts.push({ x: Math.random(), y: .2 + Math.random() * .6, v: .02 + Math.random() * .05 }); }
    if (fx.coat) { this.coat = fx.coat; this.coatAmt = 0; }
    if (fx.foam) this.foam = 1;
    if (fx.warm) this.warm = 1;
  }
  start() { const loop = () => { this.draw(); this.raf = requestAnimationFrame(loop); }; cancelAnimationFrame(this.raf); loop(); }
  stop() { cancelAnimationFrame(this.raf); }
  draw() {
    const { g, c } = this, W = c.width, H = c.height, dt = 1 / 60; this.t += dt;
    for (let i = 0; i < 4; i++) this.color[i] += (this.target[i] - this.color[i]) * .05;
    g.clearRect(0, 0, W, H);
    // giá đỡ và thân ống
    const x0 = W * .34, x1 = W * .66, top = H * .06, bot = H * .9, r = (x1 - x0) / 2;
    g.fillStyle = '#8b6a45'; g.fillRect(W * .12, H * .62, W * .76, H * .05);
    const tubePath = () => { g.beginPath(); g.moveTo(x0, top); g.lineTo(x0, bot - r); g.arc(W / 2, bot - r, r, Math.PI, 0, true); g.lineTo(x1, top); };
    // chất lỏng
    const ly = bot - (bot - top) * this.level;
    g.save(); tubePath(); g.clip();
    if (this.level > 0) {
      const [cr, cg, cb, ca] = this.color; g.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${Math.max(.08, ca)})`; g.fillRect(x0, ly, x1 - x0, bot - ly + 2);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x0, ly - 1, x1 - x0, 2);
    }
    // chất rắn: đinh sắt, kẽm viên, bột soda
    for (const id of this.items) {
      const rg = REAGENTS[id];
      if (rg.kind === 'solid') {
        const coat = this.coat ? Math.min(1, this.coatAmt) : 0, base = rg.color, col = base.map((v, i) => i < 3 ? v * (1 - coat) + this.coat?.[i] * coat || v : v);
        g.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;
        if (id === 'fe') { g.fillRect(W / 2 - 3, bot - (bot - top) * .62, 6, (bot - top) * .55); g.fillRect(W / 2 - 9, bot - (bot - top) * .62, 18, 5); }
        else for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(W / 2 - 14 + k * 7, bot - r * .7 - (k % 2) * 6, 6, 0, 6.3); g.fill(); }
      } else if (rg.kind === 'powder' && !this.foam) { g.fillStyle = '#f8f8f4'; g.beginPath(); g.ellipse(W / 2, bot - r * .6, r * .8, r * .4, 0, 0, 6.3); g.fill(); }
    }
    // kết tủa lơ lửng rồi lắng xuống đáy
    if (this.ppt) {
      this.pptAmt = Math.min(1, this.pptAmt + dt * .25);
      g.fillStyle = `rgba(${this.ppt[0]},${this.ppt[1]},${this.ppt[2]},.85)`;
      for (const p of this.parts) { if (!this.reduced) p.y = Math.min(.97, p.y + p.v * dt * 3); const px = x0 + 4 + p.x * (x1 - x0 - 8), py = ly + (bot - ly) * p.y; g.beginPath(); g.arc(px, py, 2.2, 0, 6.3); g.fill(); }
      g.globalAlpha = .9 * this.pptAmt; g.beginPath(); g.ellipse(W / 2, bot - r * .5, r * .92, r * .5 * this.pptAmt + 2, 0, 0, 6.3); g.fill(); g.globalAlpha = 1;
    }
    if (this.coat) this.coatAmt += dt * .2;
    // bọt khí nổi lên
    if (this.bubbles > 0 && this.level > 0) {
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.2;
      const n = Math.round(22 * this.bubbles);
      for (let i = 0; i < n; i++) { const s = (i * 97.13) % 1, sp = .25 + (i % 7) * .06, ph = ((this.reduced ? .5 : this.t * sp) + s) % 1; const bx = x0 + 6 + ((i * 53.7) % 1) * (x1 - x0 - 12) + Math.sin(this.t * 3 + i) * 2, by = bot - r * .4 - ph * (bot - r * .4 - ly); g.beginPath(); g.arc(bx, by, 1.5 + (i % 3), 0, 6.3); g.stroke(); }
    }
    if (this.foam > 0) { g.fillStyle = 'rgba(250,250,246,.95)'; const fh = (bot - top) * .2 * Math.min(1, this.foam); for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(x0 + (k + .5) * (x1 - x0) / 9, ly - fh * .5 + Math.sin(this.t * 2 + k) * 2, (x1 - x0) / 8, 0, 6.3); g.fill(); } this.foam = Math.min(1.4, this.foam + dt * .3); }
    g.restore();
    // thành ống thuỷ tinh
    g.lineWidth = 3; g.strokeStyle = 'rgba(214,232,244,.95)'; tubePath(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x0 + 5, top + 6, 5, bot - top - r - 10);
    g.lineWidth = 3; g.beginPath(); g.moveTo(x0 - 6, top); g.lineTo(x1 + 6, top); g.stroke();
    if (this.warm) { g.fillStyle = 'rgba(255,140,60,.18)'; g.fillRect(x0 - 14, ly, 8, bot - ly); g.fillRect(x1 + 6, ly, 8, bot - ly); }
  }
}
