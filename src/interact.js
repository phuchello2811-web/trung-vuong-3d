import * as THREE from 'three';
import { DYN } from './dyn.js';
import { pqFromXZ, levelFromY } from './plan.js';

// Tương tác trong chế độ đi bộ: nhìn vào vật và nhấn E (hoặc nút Tương tác trên điện thoại).
// Bảng trượt kéo vào ra, tivi bật tắt, ném bóng rổ, đánh pickleball, chơi đàn piano, đánh trống, cửa cuốn đã khoá.
export function createInteract({ scene, camera, player, MATS, toast }) {
  const $ = id => document.getElementById(id);
  const targets = [], anims = [];
  const inRoom = (r, c) => { const [P, Q] = pqFromXZ(c.x, c.z); return levelFromY(c.y) === r.L && P >= r.P0 - 1 && P <= r.P1 + 1 && Q >= r.Q0 - 1 && Q <= r.Q1 + 1; };
  const flipUV = g => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i)); };
  const tvOff = new THREE.MeshStandardMaterial({ color: 0x040507, roughness: .1, metalness: .3 });

  // ---------- bảng trượt và tivi trong lớp học ----------
  for (const d of DYN) {
    if (d.kind !== 'board') continue;
    const g = new THREE.Group(); g.matrixAutoUpdate = false; g.matrix.copy(d.m); scene.add(g);
    const yc = (d.by0 + d.by1) / 2, bh = d.by1 - d.by0;
    const tvG = new THREE.PlaneGeometry(d.tvW, d.tvH); if (d.flip) flipUV(tvG);
    const tv = new THREE.Mesh(tvG, MATS.tvScreen); tv.position.set(d.cx, yc, .172); g.add(tv);
    const panel = mat => {
      const p = new THREE.Group();
      const fr = new THREE.Mesh(new THREE.BoxGeometry(d.pw, bh + .03, .025), MATS.alu); fr.position.set(0, -.015, .1925); fr.receiveShadow = true;
      const fg = new THREE.PlaneGeometry(d.pw - .05, bh - .06); if (d.flip) flipUV(fg);
      const face = new THREE.Mesh(fg, MATS[mat]); face.position.z = .2055; face.receiveShadow = true;
      const hd = new THREE.Mesh(new THREE.BoxGeometry(.24, .02, .025), MATS.plasticDark); hd.position.set(0, -bh / 2 - .02, .217);
      p.add(fr, face, hd); p.position.y = yc; g.add(p); return p;
    };
    const L = panel(d.flip ? 'chalkR' : 'chalkL'), R = panel(d.flip ? 'chalkL' : 'chalkR');
    const open = [d.bx0 + d.pw / 2, d.bx1 - d.pw / 2], shut = [d.cx - d.pw / 2, d.cx + d.pw / 2];
    const st = { open: true, t: 1, tv: true };
    const place = () => { const e = st.t * st.t * (3 - 2 * st.t); L.position.x = shut[0] + (open[0] - shut[0]) * e; R.position.x = shut[1] + (open[1] - shut[1]) * e; };
    place();
    anims.push(dt => { const goal = st.open ? 1 : 0; if (st.t !== goal) { st.t += Math.sign(goal - st.t) * Math.min(Math.abs(goal - st.t), dt / 1.2); place(); } });
    const wp = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(d.m);
    targets.push({ pos: wp(d.cx, yc, .2), room: d.room, maxD: 6, label: () => st.open ? 'Kéo bảng vào' : 'Kéo bảng ra', act: () => { st.open = !st.open; } });
    targets.push({ pos: wp(...d.remote), room: d.room, maxD: 6, cone: .97, label: () => st.tv ? 'Tắt tivi' : 'Bật tivi', act: () => { st.tv = !st.tv; tv.material = st.tv ? MATS.tvScreen : tvOff; } });
    targets.at(-2).state = st; targets.at(-1).state = st;
  }

  // ---------- bóng ----------
  const ballTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#e06a1f'; x.fillRect(0, 0, 256, 128); x.strokeStyle = '#2a1408'; x.lineWidth = 4;
    for (const y of [64]) { x.beginPath(); x.moveTo(0, y); x.lineTo(256, y); x.stroke(); } for (const xx of [64, 192]) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, 128); x.stroke(); }
    x.beginPath(); x.ellipse(128, 64, 40, 64, 0, 0, 6.3); x.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.12, 24, 16), new THREE.MeshStandardMaterial({ map: ballTex, roughness: .7 }));
  ball.castShadow = true; ball.visible = false; scene.add(ball);
  const pball = new THREE.Mesh(new THREE.SphereGeometry(.045, 16, 12), new THREE.MeshStandardMaterial({ color: 0xd8f04a, roughness: .6 }));
  pball.castShadow = true; pball.visible = false; scene.add(pball);
  let shot = null, rally = null;
  anims.push(dt => {
    if (shot) {
      shot.t += dt;
      if (shot.phase === 'fly') {
        const u = Math.min(1, shot.t / shot.dur);
        ball.position.lerpVectors(shot.p0, shot.p1, u); ball.position.y += shot.h * 4 * u * (1 - u);
        ball.rotation.x += dt * 9;
        if (u >= 1) { shot.phase = 'fall'; shot.v = shot.hit ? new THREE.Vector3(0, -1.5, 0) : new THREE.Vector3((Math.random() - .5) * 2.4, 1.6, (Math.random() - .5) * 2.4); toast(shot.hit ? 'Vào rổ!' : 'Bóng bật vành ra ngoài, ném lại nhé'); }
      } else {
        shot.v.y -= 9.81 * dt; ball.position.addScaledVector(shot.v, dt); ball.rotation.z += dt * 5;
        if (ball.position.y < .12) { ball.position.y = .12; shot.v.y = -shot.v.y * .62; shot.v.x *= .85; shot.v.z *= .85; }
        if (shot.t > shot.dur + 3.2) { ball.visible = false; shot = null; }
      }
    }
    if (rally) {
      rally.t += dt; const k = Math.floor(rally.t / .95), u = (rally.t % .95) / .95;
      if (k >= rally.n) { pball.visible = false; rally = null; }
      else { const [a, b] = k % 2 ? [rally.b, rally.a] : [rally.a, rally.b];
        // đường bóng: đánh từ độ cao 0,9 m, nảy một lần ở 70% quãng đường, lên lại 0,9 m
        const x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u;
        let y; if (u < .7) { const s = u / .7; y = .9 + (.04 - .9) * s + 2.2 * s * (1 - s); } else { const s = (u - .7) / .3; y = .04 + (.9 - .04) * s + 1.2 * s * (1 - s); }
        pball.position.set(x, Math.max(.045, y), z); }
    }
  });
  for (const d of DYN) {
    if (d.kind === 'hoop') {
      const ring = new THREE.Vector3(...d.ring);
      targets.push({ pos: ring, maxD: 9, cone: .9, label: () => 'Ném bóng vào rổ', act: () => {
        if (shot) return;
        const f = new THREE.Vector3(); camera.getWorldDirection(f);
        const p0 = camera.position.clone().addScaledVector(f, .5); p0.y -= .35;
        const dist = Math.hypot(ring.x - p0.x, ring.z - p0.z), hit = Math.random() < Math.max(.35, .92 - dist * .07);
        const p1 = ring.clone(); if (!hit) { p1.x += (Math.random() - .5) * .5; p1.z += (Math.random() - .5) * .5; p1.y += .05; }
        shot = { p0, p1, t: 0, dur: .65 + dist * .07, h: 1 + dist * .18, phase: 'fly', hit }; ball.position.copy(p0); ball.visible = true;
      } });
    }
    if (d.kind === 'pickle') {
      targets.push({ pos: new THREE.Vector3(...d.net), maxD: 8, cone: .85, label: () => rally ? 'Đang đánh pickleball…' : 'Xem đánh pickleball', act: () => { if (rally) return; rally = { a: d.a, b: d.b, t: 0, n: 8 }; pball.visible = true; toast('Một pha đánh qua lại 8 lần'); } });
    }
    if (d.kind === 'shutter') {
      targets.push({ pos: new THREE.Vector3(...d.pos), room: d.room, maxD: 4, label: () => 'Cửa cuốn lên sân thượng', act: () => toast('Cửa cuốn đang khoá. Học sinh không được lên sân thượng.') });
    }
  }

  // ---------- âm thanh: đàn piano, bộ trống (tổng hợp bằng Web Audio, không cần tải tệp) ----------
  let ac = null, busyUntil = 0;
  const audio = () => { if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C(); } if (ac.state === 'suspended') ac.resume(); return ac; };
  const hz = n => 261.63 * Math.pow(2, n / 12);   // n = số nửa cung tính từ Đô 4
  function piano(a, f, t0, dur) {
    const g = a.createGain(), o1 = a.createOscillator(), o2 = a.createOscillator(), o3 = a.createOscillator(), g2 = a.createGain(), g3 = a.createGain();
    o1.type = 'triangle'; o2.type = 'sine'; o3.type = 'sine'; o1.frequency.value = f; o2.frequency.value = f * 2; o3.frequency.value = f * 3.01;
    g2.gain.value = .3; g3.gain.value = .08; o2.connect(g2).connect(g); o3.connect(g3).connect(g); o1.connect(g); g.connect(a.destination);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.28, t0 + .008); g.gain.exponentialRampToValueAtTime(.06, t0 + dur * .8); g.gain.exponentialRampToValueAtTime(.0008, t0 + dur + .9);
    for (const o of [o1, o2, o3]) { o.start(t0); o.stop(t0 + dur + 1); }
  }
  function noise(a, t0, dur, type, freq, vol) {
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = buf; fl.type = type; fl.frequency.value = freq;
    s.connect(fl).connect(g).connect(a.destination); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur); s.start(t0);
  }
  function kick(a, t0) { const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(140, t0); o.frequency.exponentialRampToValueAtTime(45, t0 + .18); o.connect(g).connect(a.destination); g.gain.setValueAtTime(.9, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + .35); o.start(t0); o.stop(t0 + .4); }
  for (const d of DYN) {
    if (d.kind === 'piano') targets.push({ pos: new THREE.Vector3(...d.pos), room: d.room, maxD: 3, label: () => 'Chơi đàn piano', act: () => openPiano() });
    if (d.kind === 'drum') targets.push({ pos: new THREE.Vector3(...d.pos), room: d.room, maxD: 3, label: () => 'Đánh trống', act: () => {
      const a = audio(); if (!a || a.currentTime < busyUntil) return;
      let t = a.currentTime + .05; const q = .3;
      for (let bar = 0; bar < 2; bar++) for (let i = 0; i < 8; i++) { const tt = t + (bar * 8 + i) * q / 2; noise(a, tt, .05, 'highpass', 7000, .18); if (i % 4 === 0) kick(a, tt); if (i % 4 === 2) noise(a, tt, .16, 'bandpass', 1800, .55); }
      t += 16 * q / 2; noise(a, t, 1.2, 'highpass', 5000, .35); kick(a, t); busyUntil = t + .6; toast('Tùng tùng chát!');
    } });
  }

  // ---------- đàn piano chơi được: phím trên màn hình, bàn phím máy tính, bài mẫu, tập chơi ----------
  const SOL = ['Đô', 'Đô#', 'Rê', 'Rê#', 'Mi', 'Fa', 'Fa#', 'Son', 'Son#', 'La', 'La#', 'Si'];
  const KEYMAP = { KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5, KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12, KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16 };
  const KEYLBL = Object.fromEntries(Object.entries(KEYMAP).map(([k, v]) => [v, k === 'Semicolon' ? ';' : k.slice(3)]));
  // bài mẫu: [nửa cung tính từ Đô 4, số phách]
  const SONGS = {
    buom: { n: 'Kìa con bướm vàng', beat: .36, notes: [[7, 1], [9, 1], [11, 1], [7, 1], [7, 1], [9, 1], [11, 1], [7, 1], [11, 1], [12, 1], [14, 2], [11, 1], [12, 1], [14, 2],
      [14, .5], [16, .5], [14, .5], [12, .5], [11, 1], [7, 1], [14, .5], [16, .5], [14, .5], [12, .5], [11, 1], [7, 1], [7, 1], [2, 1], [7, 2], [7, 1], [2, 1], [7, 2]] },
    sao: { n: 'Twinkle Twinkle Little Star', beat: .42, notes: [[0, 1], [0, 1], [7, 1], [7, 1], [9, 1], [9, 1], [7, 2], [5, 1], [5, 1], [4, 1], [4, 1], [2, 1], [2, 1], [0, 2],
      [7, 1], [7, 1], [5, 1], [5, 1], [4, 1], [4, 1], [2, 2], [7, 1], [7, 1], [5, 1], [5, 1], [4, 1], [4, 1], [2, 2],
      [0, 1], [0, 1], [7, 1], [7, 1], [9, 1], [9, 1], [7, 2], [5, 1], [5, 1], [4, 1], [4, 1], [2, 1], [2, 1], [0, 2]] },
  };
  let pianoEl = null, base = 0, learn = null, demoTimers = [], pianoOpen = false;
  const isBlack = n => [1, 3, 6, 8, 10].includes(((n % 12) + 12) % 12);
  function keyEl(n) { return pianoEl?.querySelector(`[data-n="${n}"]`); }
  function flash(n, ms = 220) { const k = keyEl(n); if (!k) return; k.classList.add('down'); clearTimeout(k._t); k._t = setTimeout(() => k.classList.remove('down'), ms); }
  function play(n, held) {
    const a = audio(); if (!a) return;
    piano(a, hz(n), a.currentTime + .005, .9); if (!held) flash(n);
    if (learn) { const want = learn.song.notes[learn.i][0];
      if (n === want) { learn.i++; if (learn.i >= learn.song.notes.length) { toast(`Hoàn thành bài "${learn.song.n}"!`); learn = null; } }
      else learn.miss++;
      renderLearn(); }
  }
  function renderLearn() {
    if (!pianoEl) return; pianoEl.querySelectorAll('.pk.next').forEach(k => k.classList.remove('next'));
    const info = pianoEl.querySelector('#pnInfo');
    if (!learn) { info.textContent = 'Bấm phím bằng chuột, chạm, hoặc gõ phím trên bàn phím máy tính.'; return; }
    const n = learn.song.notes[learn.i][0]; const k = keyEl(n); if (k) k.classList.add('next');
    info.textContent = `Tập chơi "${learn.song.n}": nốt ${learn.i + 1}/${learn.song.notes.length} là ${SOL[((n % 12) + 12) % 12]} · bấm sai ${learn.miss} lần`;
  }
  function stopDemo() { demoTimers.forEach(clearTimeout); demoTimers = []; }
  function demo(id) {
    stopDemo(); learn = null; renderLearn(); const a = audio(); if (!a) return; const sg = SONGS[id]; let t = 0;
    for (const [n, l] of sg.notes) { const tt = t; demoTimers.push(setTimeout(() => { piano(a, hz(n), a.currentTime + .005, l * sg.beat * 1.1); flash(n, l * sg.beat * 900); }, tt * 1000)); t += l * sg.beat; }
    toast(`Đang chơi bài mẫu "${sg.n}"`);
  }
  function buildKeys() {
    const kb = pianoEl.querySelector('.pkeys'); kb.replaceChildren();
    const whites = []; for (let n = 0; n < 24; n++) if (!isBlack(n)) whites.push(n);
    whites.forEach((n, i) => { const k = document.createElement('button'); k.className = 'pk w'; k.dataset.n = n; k.style.left = `calc(${i} * var(--kw))`; k.setAttribute('aria-label', SOL[n % 12] + ' ' + (4 + Math.floor(n / 12)));
      const kl = KEYLBL[n - base]; k.innerHTML = `<span class="sol">${SOL[n % 12]}</span>${kl ? `<kbd>${kl}</kbd>` : ''}`; kb.append(k); });
    for (let n = 0; n < 24; n++) if (isBlack(n)) { const wi = whites.indexOf(n - 1); const k = document.createElement('button'); k.className = 'pk b'; k.dataset.n = n; k.style.left = `calc(${wi + 1} * var(--kw) - var(--kw) * .3)`; k.setAttribute('aria-label', SOL[n % 12]);
      const kl = KEYLBL[n - base]; k.innerHTML = kl ? `<kbd>${kl}</kbd>` : ''; kb.append(k); }
    pianoEl.querySelector('#pnOct').textContent = `Phím máy tính: quãng ${base ? 'cao' : 'thấp'} (Z, X để đổi)`;
    renderLearn();
  }
  function ensurePiano() {
    if (pianoEl) return;
    pianoEl = document.createElement('div'); pianoEl.id = 'piano'; pianoEl.className = 'pn'; pianoEl.setAttribute('role', 'dialog'); pianoEl.setAttribute('aria-label', 'Đàn piano'); pianoEl.hidden = true;
    pianoEl.innerHTML = `<header><h2>Đàn piano · Phòng Âm nhạc 501</h2><div class="pbtns">
      <button class="ib" data-demo="buom">Nghe "Kìa con bướm vàng"</button><button class="ib" data-demo="sao">Nghe "Twinkle Twinkle"</button>
      <button class="ib" data-learn="buom">Tập chơi "Kìa con bướm vàng"</button><button class="ib" data-learn="sao">Tập chơi "Twinkle"</button>
      <button class="ib" id="pnClose">Đóng <kbd>Esc</kbd></button></div></header>
      <p id="pnInfo" class="pinfo"></p><div class="pscroll"><div class="pkeys"></div></div><p id="pnOct" class="pinfo mono"></p>`;
    document.body.append(pianoEl);
    pianoEl.addEventListener('click', e => { const d = e.target.closest('[data-demo]'), l = e.target.closest('[data-learn]');
      if (d) demo(d.dataset.demo); if (l) { stopDemo(); learn = { song: SONGS[l.dataset.learn], i: 0, miss: 0 }; renderLearn(); } });
    pianoEl.querySelector('#pnClose').addEventListener('click', closePiano);
    // chuột và cảm ứng: bấm được nhiều phím, kéo tay lướt qua các phím
    const down = new Map();
    const kb = pianoEl.querySelector('.pkeys');
    const hitKey = (x, y) => document.elementsFromPoint(x, y).find(el => el.classList?.contains('pk'));
    kb.addEventListener('pointerdown', e => { const k = hitKey(e.clientX, e.clientY); if (!k) return; e.preventDefault(); kb.setPointerCapture(e.pointerId); down.set(e.pointerId, k); k.classList.add('down'); play(+k.dataset.n, true); });
    kb.addEventListener('pointermove', e => { if (!down.has(e.pointerId)) return; const k = hitKey(e.clientX, e.clientY); const prev = down.get(e.pointerId); if (k && k !== prev) { prev?.classList.remove('down'); k.classList.add('down'); down.set(e.pointerId, k); play(+k.dataset.n, true); } });
    const up = e => { const k = down.get(e.pointerId); k?.classList.remove('down'); down.delete(e.pointerId); };
    kb.addEventListener('pointerup', up); kb.addEventListener('pointercancel', up);
    buildKeys();
  }
  const held = new Set();
  addEventListener('keydown', e => {
    if (!pianoOpen) return;
    if (e.code === 'Escape') { e.preventDefault(); closePiano(); return; }
    if (e.code === 'KeyZ' || e.code === 'KeyX') { base = e.code === 'KeyZ' ? 0 : 12; buildKeys(); e.preventDefault(); return; }
    const off = KEYMAP[e.code]; if (off === undefined || e.metaKey || e.ctrlKey) return;
    e.preventDefault(); if (e.repeat || held.has(e.code)) return; held.add(e.code);
    const n = base + off; if (n > 23) return; keyEl(n)?.classList.add('down'); play(n, true);
  }, true);
  addEventListener('keyup', e => { if (!pianoOpen) return; const off = KEYMAP[e.code]; if (off === undefined) return; held.delete(e.code); keyEl(base + off)?.classList.remove('down'); }, true);
  function openPiano() {
    ensurePiano(); audio(); pianoOpen = true; pianoEl.hidden = false; window.__panelOpen = true; player.frozen = true; player.keys = {};
    if (document.pointerLockElement) document.exitPointerLock();
    $('tPrompt').hidden = true; $('tAct').hidden = true; setTimeout(() => pianoEl.querySelector('.pk.w')?.focus({ preventScroll: true }), 30);
  }
  function closePiano() { if (!pianoOpen) return; pianoOpen = false; pianoEl.hidden = true; stopDemo(); learn = null; held.clear(); window.__panelOpen = false; player.frozen = false; $('c').focus({ preventScroll: true }); }

  // ---------- chọn vật đang nhìn, hiện gợi ý ----------
  let cur = null;
  const fwd = new THREE.Vector3(), v = new THREE.Vector3();
  function pick() {
    if (player.mode !== 'walk' || player.tween || document.body.classList.contains('mode-game')) return null;
    const c = camera.position; camera.getWorldDirection(fwd); let best = null, bs = -1e9;
    for (const t of targets) {
      v.copy(t.pos).sub(c); const d = v.length(); if (d > (t.maxD || 3)) continue;
      if (t.room ? !inRoom(t.room, c) : Math.abs(v.y) > 3.2) continue;
      const dot = v.normalize().dot(fwd); if (dot < (t.cone || .8)) continue;
      const sc = dot * 2 - d * .05; if (sc > bs) { bs = sc; best = t; }
    }
    return best;
  }
  function act() { if (cur) cur.act(); }
  addEventListener('keydown', e => {
    if (pianoOpen || e.code !== 'KeyE' || e.repeat || player.mode !== 'walk') return;
    if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
    if (cur) { e.preventDefault(); act(); }
  });
  $('tAct')?.addEventListener('click', act);
  let acc = 0;
  return {
    targets,
    act,
    get pianoOpen() { return pianoOpen; }, openPiano, closePiano,
    get current() { return cur; },
    update(dt) {
      for (const a of anims) a(dt);
      acc += dt; if (acc < .08) return; acc = 0;
      if (pianoOpen) return;
      cur = pick();
      const el = $('tPrompt'), btn = $('tAct');
      if (!el) return;
      el.hidden = !cur; if (btn) btn.hidden = !cur; if (cur && $('hint')) $('hint').hidden = true;
      if (cur) { const t = cur.label(); if ($('tPromptT').textContent !== t) $('tPromptT').textContent = t; }
    },
  };
}
