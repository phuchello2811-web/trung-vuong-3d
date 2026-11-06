import * as THREE from 'three';
import { X, Z, Y, ROOMS, pqFromXZ, levelFromY } from '../plan.js';
import { FOOD, MATERIALS, RECIPES, REAGENTS, REACTIONS, QUESTIONS, BOOK_FACTS, TITLES, QUESTS } from './data.js';
import { findReaction, Tube } from './lab.js';
import { typingGame, snakeGame } from './minigames.js';
import { createAuth, errText, LIMITS } from '../auth.js';

// ---------- tiện ích DOM ----------
const $ = id => document.getElementById(id);
function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'text') e.textContent = v; else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) e.append(k);
  return e;
}
const fmtClock = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
const pick = a => a[Math.floor(Math.random() * a.length)];
const SAVE_KEY = 'tv3d.save.v1';
const DAY_START = 6 * 60 + 30, DAY_END = 17 * 60 + 30;

function freshState(name = 'Khách') {
  return { v: 1, name, coins: 30, energy: 80, xp: 0, day: 1, clock: DAY_START, inv: {}, crafted: {}, reactions: {}, quests: {}, stats: { correct: 0, trash: 0, crafts: 0, exps: 0, shown: 0 }, best: { snake: 0, wpm: 0 } };
}
function sanitize(d, name) {
  const s = Object.assign(freshState(name), d || {});
  for (const k of ['inv', 'crafted', 'reactions', 'quests', 'stats', 'best']) if (typeof s[k] !== 'object' || !s[k]) s[k] = freshState()[k];
  s.coins = Math.max(0, Math.min(LIMITS.coins, Math.round(+s.coins || 0)));
  s.xp = Math.max(0, Math.min(LIMITS.xp, Math.round(+s.xp || 0)));
  s.energy = Math.max(0, Math.min(100, +s.energy || 0)); s.day = Math.max(1, Math.round(+s.day || 1));
  s.clock = Math.max(DAY_START, Math.min(DAY_END, +s.clock || DAY_START)); s.v = 1;
  s.name = String(s.name || name || 'Khách').slice(0, 40) || 'Khách';
  delete s.updatedAt;
  return s;
}
const readLocal = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; } };
const writeLocal = s => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { } };

// ---------- trò chơi ----------
export function createGame(app) {
  const { player, camera, scene } = app;
  const auth = createAuth();
  let st = sanitize(readLocal());
  let mode = 'menu', user = null, panel = null, panelClose = null, prompt = null, lastMin = -1, lastBake = -99, saveT = 0, cloudT = 0, cloudDirty = false, lowWarned = false;
  const cool = {};

  // ---- giao diện ----
  const ui = {
    menu: $('menu'), hud: $('gHud'), quest: $('gQuest'), prompt: $('gPrompt'), act: $('gAct'), panel: $('gPanel'), pTitle: $('gPanelT'), pBody: $('gPanelB'),
  };
  const toast = app.toast;
  const titleOf = xp => TITLES.filter(t => xp >= t[0]).pop()[1];
  const periodOf = m => m < 420 ? 'trước giờ học' : m < 555 ? 'tiết 1–3' : m < 575 ? 'ra chơi' : m < 675 ? 'tiết 4–5' : m < 810 ? 'nghỉ trưa' : m < 1020 ? 'buổi chiều' : 'sắp tan học';

  // ---- chỉ đường tới nhiệm vụ ----
  let guideId = null, guideAuto = true;
  const roomOf = test => ROOMS.find(test);
  const center = r => ({ P: (r.P0 + r.P1) / 2, Q: (r.Q0 + r.Q1) / 2, L: r.L });
  const SPOT = {
    an_sang: { P: 179, Q: 270, L: 1, n: 'Căn tin' },
    thi_nghiem: { ...center(roomOf(r => /KHTN/.test(r.name))), n: 'Phòng thí nghiệm KHTN' },
    stem: { ...center(roomOf(r => r.kind === 'stem')), n: 'Phòng STEM' },
    go_phim: { ...center(roomOf(r => r.kind === 'comp')), n: 'Phòng Tin học' },
  };
  // cầu thang dùng được cho mọi tầng: cầu thang chính khối Tây và cầu thang đầu khối Bắc
  const STAIRS = [{ P: 573, Q: 140, n: 'cầu thang chính' }, { P: 705, Q: 492, n: 'cầu thang khối Bắc' }];
  function guideQuest() {
    if (guideId && (st.quests[guideId] || 0) < QUESTS[guideId].goal) return guideId;
    if (!guideAuto) return null;
    return Object.keys(QUESTS).find(id => (st.quests[id] || 0) < QUESTS[id].goal) || null;
  }
  function guideSpot(id, P, Q, L) {
    if (SPOT[id]) return SPOT[id];
    if (id === 'nhat_rac') { let b = null; for (const t of trash) if (t.on) { const d = Math.hypot(t.x - X(Q), t.z - Z(P)); if (!b || d < b.d) b = { d, t }; } return b ? { P: 480 - b.t.z * 9.42, Q: 294 + b.t.x * 9.42, L: 1, n: 'Rác gần nhất' } : null; }
    if (id === 'hoc_bai') { let b = null; for (const r of ROOMS) if (r.kind === 'class') { const c = center(r), d = Math.hypot(c.P - P, c.Q - Q) + Math.abs(c.L - L) * 120; if (!b || d < b.d) b = { d, c }; } return b && { ...b.c, n: 'Lớp học gần nhất' }; }
    return null;
  }
  // cột sáng đánh dấu đích, nhìn xuyên được qua tường
  const beacon = new THREE.Group();
  { const beam = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 7, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xf4c63a, transparent: true, opacity: .28, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    beam.position.y = 3.5; beam.renderOrder = 5; beam.userData.noAO = true;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.28), new THREE.MeshBasicMaterial({ color: 0xffd75a, depthTest: false, transparent: true, opacity: .95 }));
    gem.position.y = 2.4; gem.renderOrder = 6; gem.userData.noAO = true; gem.name = 'gem';
    const ring = new THREE.Mesh(new THREE.RingGeometry(.45, .62, 40), new THREE.MeshBasicMaterial({ color: 0xf4c63a, transparent: true, opacity: .7, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = .04; ring.userData.noAO = true; ring.name = 'ring';
    beacon.add(beam, gem, ring); beacon.visible = false; beacon.traverse(o => { o.castShadow = false; o.userData.noAO = true; }); scene.add(beacon); }
  function updateGuide(P, Q, L, t) {
    const id = mode === 'game' && !panel ? guideQuest() : null; const g = $('gGuide');
    if (!id) { g.hidden = true; beacon.visible = false; return; }
    const sp = guideSpot(id, P, Q, L); if (!sp) { g.hidden = true; beacon.visible = false; return; }
    let tgt = sp, label = `${QUESTS[id].n}`, sub;
    if (sp.L !== L) { const s = STAIRS.reduce((a, b) => Math.hypot(b.P - P, b.Q - Q) < Math.hypot(a.P - P, a.Q - Q) ? b : a); tgt = { P: s.P, Q: s.Q, L }; sub = `${sp.L > L ? 'Lên' : 'Xuống'} tầng ${sp.L} bằng ${s.n} · ${Math.round(Math.hypot(s.P - P, s.Q - Q) / 9.42)} m`; }
    else sub = `${sp.n}${sp.L > 1 ? ' · tầng ' + sp.L : ''} · ${Math.max(0, Math.round(Math.hypot(sp.P - P, sp.Q - Q) / 9.42))} m`;
    $('gGuideT').textContent = label; $('gGuideD').textContent = sub; g.hidden = false;
    const tx = X(tgt.Q), tz = Z(tgt.P), c = camera.position, dx = tx - c.x, dz = tz - c.z;
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); const rel = Math.atan2(fwd.x * dz - fwd.z * dx, fwd.x * dx + fwd.z * dz);
    $('gArrow').style.transform = `rotate(${rel * 180 / Math.PI}deg)`;
    beacon.visible = Math.hypot(dx, dz) > 1.2; beacon.position.set(tx, (Y[tgt.L] || 0) + .01, tz);
    const gem = beacon.getObjectByName('gem'); gem.position.y = 2.4 + Math.sin(t * 2.2) * .12; gem.rotation.y = t * 1.4;
    beacon.getObjectByName('ring').scale.setScalar(1 + .12 * Math.sin(t * 3));
  }
  // chữ "+xu" bay lên cạnh số xu
  function coinFly(n) { const r = $('gCoins').getBoundingClientRect(); if (!r.width) return; const e = h('div', { class: 'coinfly', text: (n > 0 ? '+' : '') + n }); e.style.left = r.right + 6 + 'px'; e.style.top = r.top - 4 + 'px'; document.body.append(e); setTimeout(() => e.remove(), 1200); }

  function renderHud() {
    if (mode !== 'game') return;
    $('gName').textContent = st.name; $('gTitle').textContent = titleOf(st.xp);
    $('gCoins').textContent = st.coins; $('gXp').textContent = st.xp;
    $('gEnergyBar').style.width = st.energy + '%'; $('gEnergyBar').dataset.low = st.energy < 20 ? '1' : '';
    $('gEnergy').textContent = Math.round(st.energy);
    $('gClock').textContent = fmtClock(st.clock); $('gPeriod').textContent = periodOf(st.clock); $('gDay').textContent = 'Ngày ' + st.day;
    const ids = Object.keys(QUESTS), nDone = ids.filter(id => (st.quests[id] || 0) >= QUESTS[id].goal).length; $('gQCount').textContent = `${nDone}/${ids.length}`;
    const cur = guideQuest();
    ui.quest.replaceChildren(...Object.entries(QUESTS).map(([id, q]) => {
      const p = Math.min(q.goal, st.quests[id] || 0), done = p >= q.goal;
      return h('button', { class: 'q' + (done ? ' done' : '') + (id === cur ? ' sel' : ''), 'aria-pressed': id === cur ? 'true' : 'false', onclick: () => { guideId = done ? null : id; guideAuto = !guideId; renderHud(); } },
        h('span', { class: 'qn', text: q.n }), h('span', { class: 'qp mono', text: done ? `Xong · +${q.reward} xu` : `${p}/${q.goal}` }),
        h('span', { class: 'qbar' }, h('i', { style: `width:${p / q.goal * 100}%` })));
    }));
  }
  function changed(cloudNow) { renderHud(); saveT = 0; cloudDirty = true; if (cloudNow) cloudT = 9; }
  function addCoins(n, why) { st.coins = Math.max(0, Math.min(LIMITS.coins, Math.round(st.coins + n))); if (n) coinFly(n); if (n > 0 && why) toast(`+${n} xu · ${why}`); }
  function addXp(n) { const before = titleOf(st.xp); st.xp = Math.round(st.xp + n); const after = titleOf(st.xp); if (after !== before) toast(`Lên danh hiệu: ${after}`); }
  function useEnergy(n) { if (st.energy < n) { toast('Bạn mệt quá rồi. Xuống căn tin ăn gì đó để có thêm năng lượng.'); return false; } st.energy = Math.max(0, st.energy - n); return true; }
  function quest(id, n = 1) {
    const q = QUESTS[id]; const was = st.quests[id] || 0; if (was >= q.goal) return;
    st.quests[id] = Math.min(q.goal, was + n);
    if (st.quests[id] >= q.goal) { addCoins(q.reward, 'Hoàn thành: ' + q.n); addXp(10); }
  }

  // ---- bảng thông tin (panel) ----
  function openPanel(title, build, onClose) {
    closePanel(); window.__panelOpen = true; player.frozen = true; player.keys = {};
    if (document.pointerLockElement) document.exitPointerLock();
    ui.pTitle.textContent = title; ui.pBody.replaceChildren(); ui.panel.hidden = false; panel = title;
    panelClose = build(ui.pBody) || null; if (onClose) { const pc = panelClose; panelClose = () => { pc && pc(); onClose(); }; }
    setTimeout(() => (ui.panel.querySelector('[autofocus]') || $('gPanelX')).focus(), 30);
  }
  function closePanel() { if (!panel) return; prompt = undefined; panelClose && panelClose(); panelClose = null; panel = null; ui.panel.hidden = true; window.__panelOpen = false; player.frozen = false; renderHud(); if (mode === 'game') $('c').focus({ preventScroll: true }); }
  $('gPanelX').addEventListener('click', closePanel);
  ui.panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); closePanel(); } });

  // ---- vùng tương tác dựng từ mặt bằng ----
  const inRoom = (r, P, Q, L) => r.L === L && P >= r.P0 && P <= r.P1 && Q >= r.Q0 && Q <= r.Q1;
  const zones = [];
  for (const r of ROOMS) {
    if (r.kind === 'class') zones.push({ r, label: 'Vào học, trả lời câu hỏi', act: () => quiz(r) });
    else if (r.kind === 'comp') zones.push({ r, label: 'Dùng máy tính phòng Tin học', act: computer });
    else if (r.kind === 'stem') zones.push({ r, label: 'Vào bàn chế tạo STEM', act: stem });
    else if (r.kind === 'lab' && /KHTN/.test(r.name)) zones.push({ r, label: 'Làm thí nghiệm hoá học', act: lab });
    else if (r.kind === 'lab') zones.push({ r, label: 'Học thực hành ' + r.name.replace('Phòng ', '').toLowerCase(), act: () => quiz(r, 'Khoa học tự nhiên') });
    else if (r.kind === 'lib') zones.push({ r, label: 'Đọc sách ở thư viện', act: library });
  }
  zones.push({ r: { L: 1, P0: 130, P1: 228, Q0: 255, Q1: 300 }, label: 'Mua đồ ở căn tin', act: canteen });

  // ---- rác trong sân: nhặt bỏ vào thùng ----
  const trashGeo = [new THREE.IcosahedronGeometry(.075, 0), new THREE.CylinderGeometry(.033, .033, .12, 10), new THREE.CylinderGeometry(.035, .035, .2, 10)];
  const trashMat = [new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: .9 }), new THREE.MeshStandardMaterial({ color: 0xc22f2a, metalness: .6, roughness: .35 }), new THREE.MeshStandardMaterial({ color: 0x8fc4dc, roughness: .15, transparent: true, opacity: .75 })];
  const trashMesh = trashGeo.map((g, i) => { const m = new THREE.InstancedMesh(g, trashMat[i], 12); m.count = 0; m.castShadow = true; m.userData.noAO = true; m.frustumCulled = false; scene.add(m); return m; });
  let trash = [];
  function spawnTrash() {
    trash = []; let tries = 0;
    while (trash.length < 12 && tries++ < 400) {
      const big = Math.random() < .6, P = big ? 400 + Math.random() * 290 : 150 + Math.random() * 240, Q = big ? 160 + Math.random() * 262 : 160 + Math.random() * 330;
      const x = X(Q), z = Z(P), y = player.floorAt(x, z, 2.2); if (y === null || y > .45 || y < -.1) continue;
      if (trash.some(t => Math.hypot(t.x - x, t.z - z) < 3)) continue;
      trash.push({ x, y, z, k: trash.length % 3, ry: Math.random() * 6.28, on: true });
    }
    drawTrash();
  }
  function drawTrash() {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), cnt = [0, 0, 0];
    for (const t of trash) { if (!t.on) continue; q.setFromEuler(new THREE.Euler(t.k ? Math.PI / 2 : 0, t.ry, 0)); m4.compose(new THREE.Vector3(t.x, t.y + (t.k ? .035 : .06), t.z), q, s); trashMesh[t.k].setMatrixAt(cnt[t.k]++, m4); }
    trashMesh.forEach((m, i) => { m.count = cnt[i]; m.instanceMatrix.needsUpdate = true; });
  }
  // thùng rác xanh trong sân
  { const bin = new THREE.Group(), body = new THREE.Mesh(new THREE.CylinderGeometry(.27, .23, .82, 18), new THREE.MeshStandardMaterial({ color: 0x23864a, roughness: .5 })), lid = new THREE.Mesh(new THREE.CylinderGeometry(.29, .29, .06, 18), new THREE.MeshStandardMaterial({ color: 0x1b6a3a, roughness: .5 }));
    body.position.y = .41; lid.position.y = .85; body.castShadow = lid.castShadow = true; bin.add(body, lid);
    for (const [P, Q] of [[400, 300], [690, 300], [560, 410], [250, 270], [380, 470]]) { const b = bin.clone(); b.position.set(X(Q), 0, Z(P)); scene.add(b); } }

  // ---- vòng lặp ----
  let t2 = 0;
  function update(dt) {
    if (mode !== 'game') { beacon.visible = false; return; }
    t2 += dt;
    const c = camera.position;
    if (!panel) {
      st.clock += dt; // 1 giây thật = 1 phút trong game
      const running = player.keys.ShiftLeft || player.keys.ShiftRight, moving = player.keys.KeyW || player.keys.KeyA || player.keys.KeyS || player.keys.KeyD || player.touch.x || player.touch.y;
      st.energy = Math.max(0, st.energy - dt * (.05 + (moving ? .04 : 0) + (running && moving ? .12 : 0)));
      player.speedMul = st.energy < 5 ? .55 : 1;
      if (st.energy < 20 && !lowWarned) { lowWarned = true; toast('Năng lượng còn ít. Ghé căn tin ở sân có mái che để ăn nhé.'); }
      if (st.energy >= 25) lowWarned = false;
      const m = Math.floor(st.clock);
      if (m !== lastMin) { lastMin = m; const bake = m - lastBake >= 20; if (bake) lastBake = m; app.setClock(st.clock / 60, bake); renderHud(); }
      if (st.clock >= DAY_END) endDay();
    }
    // gợi ý tương tác gần nhất
    const [P, Q] = pqFromXZ(c.x, c.z), L = levelFromY(c.y);
    let best = null;
    if (L === 1) for (const t of trash) if (t.on) { const d = Math.hypot(t.x - c.x, t.z - c.z); if (d < 1.6 && (!best || d < best.d)) best = { d, label: 'Nhặt rác bỏ vào thùng', act: () => pickTrash(t) }; }
    if (!best) for (const zn of zones) if (inRoom(zn.r, P, Q, L)) { best = zn; break; }
    if (Math.floor(t2 * 4) !== Math.floor((t2 - dt) * 4)) { const w = $('whereT').textContent; if ($('gWhere').textContent !== w) $('gWhere').textContent = w; }
    updateGuide(P, Q, L, t2);
    if (best !== prompt) { prompt = best; ui.prompt.hidden = !best || !!panel; ui.act.hidden = !best || !!panel; if (best) $('gPromptT').textContent = best.label; }
    if (panel) { ui.prompt.hidden = true; ui.act.hidden = true; $('gGuide').hidden = true; beacon.visible = false; }
    saveT += dt; if (saveT > 10) { saveT = 0; writeLocal(st); }
    cloudT += dt; if (cloudDirty && user && cloudT > 12) { cloudT = 0; cloudDirty = false; pushCloud(); }
  }
  function interact() { if (mode === 'game' && prompt && !panel) prompt.act(); }
  addEventListener('keydown', e => {
    if (mode !== 'game' || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'KeyE' && !panel) { e.preventDefault(); interact(); }
    else if (e.code === 'KeyB' && !panel) bag();
    else if (e.code === 'Escape' && panel) closePanel();
  });
  ui.act.addEventListener('click', interact);
  $('gBagBtn').addEventListener('click', bag);
  $('gMenuBtn').addEventListener('click', () => { writeLocal(st); if (user) pushCloud(); showMenu(); });

  function pickTrash(t) { t.on = false; drawTrash(); st.stats.trash++; addCoins(2, 'Giữ sân trường sạch'); addXp(2); quest('nhat_rac'); changed(); prompt = null; }

  // ---- căn tin ----
  function canteen() {
    openPanel('Căn tin Trường THCS Trưng Vương', body => {
      const morning = st.clock < 10 * 60;
      body.append(h('p', { class: 'muted', text: morning ? 'Mua bữa sáng trước 10:00 để hoàn thành nhiệm vụ "Ăn sáng ở căn tin".' : 'Ăn để hồi năng lượng. Đồ mua thêm sẽ cất vào cặp sách.' }));
      const list = h('div', { class: 'shop' });
      const draw = () => list.replaceChildren(...Object.entries(FOOD).map(([id, f]) => h('div', { class: 'item' },
        h('div', {}, h('b', { text: f.n }), h('span', { class: 'muted mono', text: ` ${f.price} xu · +${f.energy} năng lượng` })),
        h('div', { class: 'btns' },
          h('button', { class: 'gb', disabled: st.coins < f.price || undefined, onclick: () => { coinFly(-f.price); st.coins -= f.price; st.energy = Math.min(100, st.energy + f.energy); if (st.clock < 600) quest('an_sang'); toast(`Đã ăn ${f.n.toLowerCase()}`); changed(true); draw(); } }, 'Mua và ăn'),
          h('button', { class: 'gb ghost', disabled: st.coins < f.price || undefined, onclick: () => { coinFly(-f.price); st.coins -= f.price; st.inv[id] = (st.inv[id] || 0) + 1; if (st.clock < 600) quest('an_sang'); toast(`Đã cất ${f.n.toLowerCase()} vào cặp`); changed(true); draw(); } }, 'Cho vào cặp')))));
      draw(); body.append(list, h('p', { class: 'muted mono', text: 'Thực đơn theo bảng ở căn tin của trường. Giá là xu trong game.' }));
    });
  }

  // ---- lớp học: 3 câu hỏi ----
  function quiz(r, forceSubj) {
    const key = r.L + r.name + r.P0 + r.Q0;
    if (cool[key] && st.clock < cool[key]) { toast(`Lớp này vừa học xong. Quay lại sau ${fmtClock(cool[key])} hoặc sang lớp khác.`); return; }
    if (!useEnergy(5)) return;
    const subj = forceSubj || pick(Object.keys(QUESTIONS)), pool = [...QUESTIONS[subj]].sort(() => Math.random() - .5).slice(0, 3);
    let i = 0, right = 0;
    openPanel(`Giờ học: ${subj}`, body => {
      const step = () => {
        if (i >= pool.length) { cool[key] = st.clock + 40; body.replaceChildren(h('p', { class: 'big', text: `Bạn trả lời đúng ${right}/${pool.length} câu.` }), h('p', { class: 'muted', text: right ? `Nhận ${right * 6} xu và ${right * 10} điểm kinh nghiệm.` : 'Không sao, sang lớp khác thử tiếp nhé.' }), h('button', { class: 'gb', autofocus: true, onclick: closePanel }, 'Ra khỏi lớp')); changed(true); return; }
        const q = pool[i]; let answered = false;
        const fb = h('p', { class: 'fb', 'aria-live': 'polite' });
        const next = h('button', { class: 'gb', hidden: true, onclick: () => { i++; step(); } }, i < pool.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả');
        body.replaceChildren(h('p', { class: 'muted mono', text: `Câu ${i + 1}/${pool.length}` }), h('p', { class: 'big', text: q.q }),
          h('div', { class: 'choices' }, ...q.c.map((c, k) => h('button', { class: 'gb ghost choice', autofocus: k === 0, onclick: ev => {
            if (answered) return; answered = true; const ok = k === q.a;
            ev.currentTarget.classList.add(ok ? 'ok' : 'bad'); body.querySelectorAll('.choice')[q.a].classList.add('ok');
            fb.textContent = (ok ? 'Đúng rồi. ' : 'Chưa đúng. ') + q.e;
            if (ok) { right++; st.stats.correct++; addCoins(6); addXp(10); quest('hoc_bai'); }
            next.hidden = false; next.focus(); renderHud();
          } }, `${'ABCD'[k]}. ${c}`))), fb, next);
      };
      step();
    });
  }

  // ---- phòng Tin học ----
  function computer() {
    openPanel('Máy tính phòng Tin học', body => {
      let stop = null;
      const desk = () => { stop && stop(); stop = null; body.replaceChildren(h('p', { class: 'muted', text: 'Chọn ứng dụng trên màn hình.' }),
        h('div', { class: 'apps' },
          h('button', { class: 'app', autofocus: true, onclick: () => { if (!useEnergy(3)) return; body.replaceChildren(h('button', { class: 'gb ghost sm', onclick: desk }, 'Về màn hình chính')); stop = typingGame(body, r => { const n = Math.min(20, Math.floor(r.ok / 2)); if (r.ok >= 5) quest('go_phim'); st.best.wpm = Math.max(st.best.wpm, r.wpm); addCoins(n, 'Luyện gõ phím'); addXp(Math.min(20, r.ok)); changed(true); }); } }, h('b', { text: 'Gõ phím 10 ngón' }), h('span', { text: 'Gõ đúng nhiều từ để nhận xu' })),
          h('button', { class: 'app', onclick: () => { body.replaceChildren(h('button', { class: 'gb ghost sm', onclick: desk }, 'Về màn hình chính')); stop = snakeGame(body, st.best.snake, sc => { if (sc > st.best.snake) { st.best.snake = sc; toast(`Kỉ lục rắn săn mồi mới: ${sc}`); changed(); } }); } }, h('b', { text: 'Rắn săn mồi' }), h('span', { text: 'Chơi giải trí giờ ra chơi' }))),
        h('p', { class: 'muted mono', text: `Kỉ lục: gõ ${st.best.wpm} từ/phút · rắn ${st.best.snake} điểm` })); };
      desk(); return () => stop && stop();
    });
  }

  // ---- phòng STEM ----
  function stem() {
    openPanel('Phòng Công nghệ – STEM', body => {
      let tab = 'craft';
      const tabs = h('div', { class: 'tabs', role: 'tablist' }), view = h('div', { class: 'tabview' });
      const count = (o, id) => o[id] || 0;
      const draw = () => {
        tabs.replaceChildren(...[['shop', 'Mua vật liệu'], ['craft', 'Chế tạo'], ['show', 'Trưng bày']].map(([k, n]) => h('button', { class: 'tab' + (tab === k ? ' on' : ''), role: 'tab', 'aria-selected': tab === k ? 'true' : 'false', onclick: () => { tab = k; draw(); } }, n)));
        if (tab === 'shop') view.replaceChildren(h('div', { class: 'shop' }, ...Object.entries(MATERIALS).map(([id, m]) => h('div', { class: 'item' },
          h('div', {}, h('b', { text: m.n }), h('span', { class: 'muted mono', text: ` ${m.price} xu · đang có ${count(st.inv, id)}` })),
          h('div', { class: 'btns' }, ...[1, 5].map(n => h('button', { class: 'gb ghost', disabled: st.coins < m.price * n || undefined, onclick: () => { coinFly(-m.price * n); st.coins -= m.price * n; st.inv[id] = count(st.inv, id) + n; changed(); draw(); } }, `Mua ${n}`)))))));
        else if (tab === 'craft') view.replaceChildren(h('div', { class: 'shop' }, ...Object.entries(RECIPES).map(([id, r]) => {
          const can = Object.entries(r.need).every(([m, n]) => count(st.inv, m) >= n);
          return h('div', { class: 'item col' }, h('div', {}, h('b', { text: r.n }), h('span', { class: 'muted mono', text: ` trưng bày được ${r.value} xu` })),
            h('div', { class: 'need' }, ...Object.entries(r.need).map(([m, n]) => h('span', { class: 'chip' + (count(st.inv, m) >= n ? ' have' : ''), text: `${MATERIALS[m].n} ${count(st.inv, m)}/${n}` }))),
            h('p', { class: 'muted small', text: r.note }),
            h('button', { class: 'gb', disabled: !can || undefined, onclick: ev => { if (!useEnergy(4)) return; const b = ev.currentTarget; b.disabled = true; b.textContent = 'Đang lắp ráp…';
              setTimeout(() => { for (const [m, n] of Object.entries(r.need)) st.inv[m] -= n; st.crafted[id] = count(st.crafted, id) + 1; st.stats.crafts++; addXp(r.xp); quest('stem'); toast(`Đã chế tạo ${r.n.toLowerCase()}`); changed(true); draw(); }, 900); } }, can ? 'Chế tạo' : 'Thiếu vật liệu'));
        })));
        else view.replaceChildren(h('p', { class: 'muted', text: 'Đem sản phẩm ra trưng bày ở Ngày hội STEM để nhận xu. Lần đầu trưng bày mỗi loại được thêm điểm kinh nghiệm.' }), h('div', { class: 'shop' }, ...Object.entries(RECIPES).filter(([id]) => count(st.crafted, id) > 0).map(([id, r]) => h('div', { class: 'item' },
          h('div', {}, h('b', { text: r.n }), h('span', { class: 'muted mono', text: ` có ${count(st.crafted, id)}` })),
          h('button', { class: 'gb', onclick: () => { st.crafted[id]--; addCoins(r.value, 'Trưng bày ' + r.n.toLowerCase()); const k = 'show_' + id; if (!st.reactions[k]) { st.reactions[k] = true; addXp(20); } st.stats.shown++; changed(true); draw(); } }, `Trưng bày, nhận ${r.value} xu`))), Object.values(st.crafted).some(n => n > 0) ? null : h('p', { class: 'muted', text: 'Chưa có sản phẩm nào. Sang thẻ Chế tạo nhé.' })));
      };
      body.append(tabs, view); draw();
    });
  }

  // ---- phòng thí nghiệm KHTN ----
  let safetyOk = false;
  function lab() {
    openPanel('Phòng thí nghiệm KHTN', body => {
      if (!safetyOk) {
        const items = ['Mặc áo blouse, buộc gọn tóc', 'Đeo kính bảo hộ và găng tay', 'Chỉ dùng lượng nhỏ hoá chất, không nếm, không ngửi trực tiếp', 'Hoá chất chỉ dùng trên bàn thí nghiệm, không mang ra ngoài'];
        const boxes = items.map((t, i) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', id: 'safe' + i }), ' ' + t));
        const go = h('button', { class: 'gb', disabled: true, onclick: () => { safetyOk = true; closePanel(); lab(); } }, 'Vào bàn thí nghiệm');
        body.append(h('p', { class: 'big', text: 'An toàn trước đã' }), ...boxes, go);
        body.addEventListener('change', () => { go.disabled = !boxes.every(b => b.querySelector('input').checked); });
        return;
      }
      const cv = h('canvas', { width: 220, height: 340, class: 'tube', 'aria-label': 'Ống nghiệm' }), tube = new Tube(cv); tube.start();
      let contents = [];
      const res = h('div', { class: 'res', 'aria-live': 'polite' }, h('p', { class: 'muted', text: 'Chọn tối đa 3 chất cho vào ống nghiệm. Thử ghép các chất để quan sát hiện tượng.' }));
      const inTube = h('p', { class: 'mono small' });
      const book = h('p', { class: 'muted mono small' });
      const drawBook = () => { const n = REACTIONS.filter(r => st.reactions[r.id]).length; book.textContent = `Sổ thí nghiệm: đã khám phá ${n}/${REACTIONS.length} phản ứng`; inTube.textContent = contents.length ? 'Trong ống: ' + contents.map(c => REAGENTS[c].f).join(' + ') : 'Ống nghiệm sạch'; };
      const add = id => {
        if (contents.length >= 3) { toast('Ống nghiệm đầy. Bấm Rửa ống để làm thí nghiệm mới.'); return; }
        if (contents.length === 0 && !useEnergy(2)) return;
        contents.push(id); tube.add(id); drawBook();
        const r = contents.length >= 2 ? findReaction(contents, id) : null;
        if (r) {
          tube.apply(r.fx); const isNew = !st.reactions[r.id];
          res.replaceChildren(h('p', { class: 'big', text: r.n }), h('p', { class: 'eq mono', text: r.eq }), h('p', {}, h('b', { text: 'Hiện tượng: ' }), r.see), h('p', {}, h('b', { text: 'Giải thích: ' }), r.why),
            isNew ? h('p', { class: 'new', text: 'Phản ứng mới. +8 xu, +15 điểm kinh nghiệm.' }) : null);
          if (isNew) { st.reactions[r.id] = true; st.stats.exps++; addCoins(8); addXp(15); }
          quest('thi_nghiem'); changed(true); drawBook();
        } else if (contents.length >= 2) res.replaceChildren(h('p', { class: 'big', text: 'Chưa thấy hiện tượng gì' }), h('p', { class: 'muted', text: 'Các chất này không phản ứng với nhau, hoặc phản ứng không quan sát được. Rửa ống và thử cặp khác.' }));
        else res.replaceChildren(h('p', { class: 'muted', text: `Đã cho ${REAGENTS[id].n.toLowerCase()} vào ống. Chọn thêm một chất nữa.` }));
      };
      const shelf = h('div', { class: 'shelf' }, ...Object.entries(REAGENTS).map(([id, r]) => h('button', { class: 'reag', onclick: () => add(id), title: r.hazard },
        h('span', { class: 'sw', style: `background:rgba(${r.color[0]},${r.color[1]},${r.color[2]},${Math.max(.35, r.color[3])})` }), h('span', {}, h('b', { text: r.f }), h('small', { text: r.n })), h('small', { class: 'hz', text: r.hazard }))));
      const wash = h('button', { class: 'gb ghost', onclick: () => { contents = []; tube.reset(); drawBook(); res.replaceChildren(h('p', { class: 'muted', text: 'Đã rửa sạch ống nghiệm.' })); } }, 'Rửa ống');
      body.append(h('div', { class: 'labgrid' }, shelf, h('div', { class: 'bench' }, cv, inTube, wash), res), book);
      drawBook();
      return () => tube.stop();
    });
  }

  // ---- thư viện ----
  function library() {
    const k = 'lib'; if (cool[k] && st.clock < cool[k]) { toast(`Bạn vừa đọc xong. Quay lại sau ${fmtClock(cool[k])}.`); return; }
    if (!useEnergy(2)) return; cool[k] = st.clock + 30; addXp(6); changed();
    openPanel('Thư viện', body => body.append(h('p', { class: 'muted', text: 'Bạn mượn một cuốn sách và đọc được điều thú vị:' }), h('p', { class: 'big', text: pick(BOOK_FACTS) }), h('p', { class: 'muted mono', text: '+6 điểm kinh nghiệm' }), h('button', { class: 'gb', autofocus: true, onclick: closePanel }, 'Trả sách')));
  }

  // ---- cặp sách ----
  function bag() {
    if (mode !== 'game') return;
    openPanel('Cặp sách', body => {
      const draw = () => {
        const foods = Object.entries(FOOD).filter(([id]) => st.inv[id] > 0), mats = Object.entries(MATERIALS).filter(([id]) => st.inv[id] > 0), made = Object.entries(RECIPES).filter(([id]) => st.crafted[id] > 0);
        body.replaceChildren(
          h('h3', { text: 'Đồ ăn' }), foods.length ? h('div', { class: 'shop' }, ...foods.map(([id, f]) => h('div', { class: 'item' }, h('div', {}, h('b', { text: f.n }), h('span', { class: 'muted mono', text: ` × ${st.inv[id]} · +${f.energy} năng lượng` })), h('button', { class: 'gb', onclick: () => { st.inv[id]--; st.energy = Math.min(100, st.energy + f.energy); toast(`Đã ăn ${f.n.toLowerCase()}`); changed(); draw(); } }, 'Ăn')))) : h('p', { class: 'muted', text: 'Chưa có đồ ăn.' }),
          h('h3', { text: 'Vật liệu STEM' }), mats.length ? h('p', { class: 'mono small', text: mats.map(([id, m]) => `${m.n} ${st.inv[id]}`).join(' · ') }) : h('p', { class: 'muted', text: 'Chưa có vật liệu.' }),
          h('h3', { text: 'Sản phẩm đã chế tạo' }), made.length ? h('p', { class: 'mono small', text: made.map(([id, r]) => `${r.n} ${st.crafted[id]}`).join(' · ') }) : h('p', { class: 'muted', text: 'Chưa có sản phẩm.' }),
          h('h3', { text: 'Thành tích' }), h('p', { class: 'mono small', text: `${st.stats.correct} câu đúng · ${REACTIONS.filter(r => st.reactions[r.id]).length}/${REACTIONS.length} phản ứng · ${st.stats.crafts} sản phẩm · ${st.stats.trash} rác đã nhặt` }));
      };
      draw();
    });
  }

  // ---- hết ngày học ----
  function endDay() {
    const done = Object.entries(QUESTS).filter(([id, q]) => (st.quests[id] || 0) >= q.goal).length;
    openPanel(`Tan học · Ngày ${st.day}`, body => body.append(h('p', { class: 'big', text: `Bạn hoàn thành ${done}/${Object.keys(QUESTS).length} nhiệm vụ.` }), h('p', { class: 'muted', text: `Hiện có ${st.coins} xu, ${st.xp} điểm kinh nghiệm, danh hiệu ${titleOf(st.xp)}.` }),
      h('button', { class: 'gb', autofocus: true, onclick: () => { st.day++; st.clock = DAY_START; st.energy = Math.max(st.energy, 75); st.quests = {}; spawnTrash(); changed(true); closePanel(); toast(`Ngày học thứ ${st.day} bắt đầu`); } }, 'Sang ngày mới')));
  }

  // ---- lưu đám mây ----
  async function pushCloud() { if (!user || !auth.enabled) return; try { await auth.save(user.uid, sanitize(st, st.name)); $('acctState').textContent = 'Đã lưu lên tài khoản'; } catch (e) { console.warn(e); cloudDirty = true; } }
  async function pullCloud(u) {
    try {
      const d = await auth.load(u.uid);
      if (d) { st = sanitize(d, u.displayName); toast(`Chào ${st.name}, đã tải tiến trình từ tài khoản`); }
      else { st.name = (u.displayName || st.name || 'Học sinh').slice(0, 40); st.coins = Math.min(st.coins, LIMITS.firstCoins); st.xp = Math.min(st.xp, LIMITS.firstXp); await auth.save(u.uid, sanitize(st, st.name)); toast('Đã tạo hồ sơ trên tài khoản của bạn'); }
      writeLocal(st); renderHud(); renderAcct();
    } catch (e) { toast(errText(e)); }
  }

  // ---- menu khởi đầu + tài khoản ----
  function renderAcct() {
    const box = $('acct'); box.replaceChildren();
    if (!auth.enabled) {
      box.append(h('p', { class: 'muted small', text: 'Tiến trình được lưu trên trình duyệt này. Đăng nhập bằng Google hoặc email có trên bản web đăng ở GitHub Pages sau khi cấu hình Firebase.' }),
        h('label', { class: 'fld' }, h('span', { text: 'Tên của bạn trong game' }), h('input', { id: 'guestName', value: st.name === 'Khách' ? '' : st.name, maxlength: '40', placeholder: 'Ví dụ: Minh Anh lớp 8/3', oninput: e => { st.name = e.target.value.trim().slice(0, 40) || 'Khách'; writeLocal(st); } })));
      return;
    }
    if (user) {
      box.append(h('p', {}, 'Đã đăng nhập: ', h('b', { text: user.displayName || user.email })), h('p', { id: 'acctState', class: 'muted small mono', text: 'Tiến trình tự lưu lên tài khoản' }),
        h('button', { class: 'gb ghost sm', onclick: async () => { await pushCloud(); await auth.signOut(); toast('Đã đăng xuất'); } }, 'Đăng xuất'));
      return;
    }
    const err = h('p', { class: 'err small', 'aria-live': 'polite' });
    const run = async f => { err.textContent = ''; try { await f(); } catch (e) { err.textContent = errText(e); } };
    const name = h('input', { id: 'auName', maxlength: '40', autocomplete: 'nickname', placeholder: 'Tên hiển thị' }), email = h('input', { id: 'auEmail', type: 'email', autocomplete: 'email', placeholder: 'Email' }), pw = h('input', { id: 'auPw', type: 'password', autocomplete: 'current-password', placeholder: 'Mật khẩu, ít nhất 6 kí tự' });
    box.append(h('button', { class: 'gb google', onclick: () => run(() => auth.google()) }, 'Đăng nhập bằng Google'),
      h('form', { class: 'auf', onsubmit: e => { e.preventDefault(); run(() => auth.signIn(email.value.trim(), pw.value)); } },
        h('label', { class: 'fld' }, h('span', { text: 'Tên hiển thị (khi tạo tài khoản)' }), name), h('label', { class: 'fld' }, h('span', { text: 'Email' }), email), h('label', { class: 'fld' }, h('span', { text: 'Mật khẩu' }), pw),
        h('div', { class: 'btns' }, h('button', { class: 'gb', type: 'submit' }, 'Đăng nhập'), h('button', { class: 'gb ghost', type: 'button', onclick: () => run(() => auth.signUp(name.value.trim(), email.value.trim(), pw.value)) }, 'Tạo tài khoản'),
          h('button', { class: 'linkb', type: 'button', onclick: () => run(async () => { if (!email.value.trim()) throw { message: 'Nhập email trước' }; await auth.reset(email.value.trim()); err.textContent = 'Đã gửi email đặt lại mật khẩu.'; }) }, 'Quên mật khẩu')), err),
      h('p', { class: 'muted small', text: 'Không muốn đăng nhập thì cứ bấm chơi, tiến trình lưu trên trình duyệt này.' }));
  }
  if (auth.enabled) auth.onUser(u => { user = u; renderAcct(); if (u) pullCloud(u); });
  renderAcct();

  function setBody(m) { mode = m; document.body.classList.remove('mode-menu', 'mode-tour', 'mode-game'); document.body.classList.add('mode-' + m); }
  function showMenu() { closePanel(); setBody('menu'); ui.menu.hidden = false; ui.prompt.hidden = ui.act.hidden = true; app.toMenu(); setTimeout(() => $('btnGame').focus(), 50); }
  function startTour() { ui.menu.hidden = true; setBody('tour'); app.toTour(); }
  function startGame() {
    ui.menu.hidden = true; setBody('game'); if (!trash.length) spawnTrash(); lastMin = -1; lastBake = -99;
    app.toGame(); renderHud();
    if (st.day === 1 && st.clock === DAY_START && !st.stats.correct) openPanel('Một ngày ở Trưng Vương', body => body.append(
      h('p', { class: 'big', text: `Chào ${st.name}, chào mừng đến Trường THCS Trưng Vương.` }),
      h('ul', {}, h('li', { text: 'Đi lại bằng W A S D, giữ Shift để chạy, bấm vào cảnh để xoay góc nhìn bằng chuột. Trên điện thoại dùng cần điều khiển.' }),
        h('li', { text: 'Đến gần chỗ có thể làm gì đó sẽ hiện gợi ý. Nhấn E hoặc nút Tương tác.' }),
        h('li', { text: 'Kiếm xu: trả lời câu hỏi trong lớp, gõ phím ở phòng Tin (tầng 5), nhặt rác ở sân, làm thí nghiệm ở phòng KHTN (tầng 5), trưng bày sản phẩm STEM (tầng 5).' }),
        h('li', { text: 'Tiêu xu: mua đồ ăn ở căn tin dưới sân có mái che để hồi năng lượng, mua vật liệu chế tạo ở phòng STEM.' }),
        h('li', { text: 'Một giây ngoài đời là một phút trong game. Tan học lúc 17:30. Bản đồ góc phải giúp đi nhanh giữa các tầng.' })),
      h('button', { class: 'gb', autofocus: true, onclick: closePanel }, 'Vào trường')));
  }
  $('btnTour').addEventListener('click', startTour);
  $('btnGame').addEventListener('click', startGame);
  if (matchMedia('(max-width: 820px)').matches) $('gQuestBox').removeAttribute('open');
  $('gToMenu')?.addEventListener('click', showMenu);
  addEventListener('beforeunload', () => writeLocal(st));
  document.addEventListener('visibilitychange', () => { if (document.hidden) { writeLocal(st); if (user) pushCloud(); } });

  return { QUESTIONS, update, showMenu, startTour, startGame, get mode() { return mode; }, get state() { return st; }, interact, openLab: lab, openCanteen: canteen, openStem: stem, openQuiz: quiz, openComputer: computer, closePanel, auth };
}
