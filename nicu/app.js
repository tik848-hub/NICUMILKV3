/* ============================================================
   NICU Milk v3 — nicu/app.js
   Pages: dashboard · register · order · approve · produce · feed
   ============================================================ */
'use strict';

let _page = 'dashboard';
let _scanStream = null, _scanRaf = null, _scanTarget = null;
let _editPt = null, _editOrder = null;
let _ageTimers = [];

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  seedLocalDemo();
  _initOffline();
  _initHeader();
  _initSync();
  showPage('dashboard');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(()=>{});
});

function _initOffline() {
  const b = document.getElementById('offline-bar');
  const upd = () => b && b.classList.toggle('show', !navigator.onLine);
  window.addEventListener('offline', upd); window.addEventListener('online', upd); upd();
}
function _initHeader() {
  const el = document.getElementById('hdr-date');
  if (el) el.textContent = new Date().toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'});
}

/* ── Sync status ── */
let _syncState = 'ok'; // ok | syncing | error
function _setSyncDot(state) {
  _syncState = state;
  document.querySelectorAll('.sync-dot').forEach(d => {
    d.className = 'sync-dot' + (state === 'syncing' ? ' syncing' : state === 'error' ? ' error' : '');
  });
}
async function _initSync() {
  _setSyncDot('syncing');
  try {
    await Promise.all([
      Patients.refresh(),
      Orders.refresh(todayStr()),
      MilkCards.refresh(todayStr()),
    ]);
    _setSyncDot('ok');
    _renderPage(_page);
    _updateBadges();
  } catch { _setSyncDot('error'); }
}

/* ── Navigation ── */
function showPage(id) {
  _stopAgeTimers();
  _closeCamera();
  _closeModal();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('pg-' + id)?.classList.add('active');
  document.getElementById('nv-' + id)?.classList.add('active');
  _page = id;
  _renderPage(id);
}
function _renderPage(id) {
  if      (id === 'dashboard') _renderDashboard();
  else if (id === 'register')  _renderRegister();
  else if (id === 'order')     _renderOrderPage();
  else if (id === 'approve')   _renderApprovePage();
  else if (id === 'produce')   _renderProducePage();
  else if (id === 'feed')      _renderFeedPage();
}

/* ── Toast ── */
function toast(msg, dur=2800) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), dur);
}

/* ── Real-time age ── */
function _stopAgeTimers() { _ageTimers.forEach(clearInterval); _ageTimers=[]; }
function _startAgeEl(el, dob, dobTime) {
  const upd = () => { const a = calcAge(dob, dobTime); if (el) el.textContent = a.label; };
  upd();
  _ageTimers.push(setInterval(upd, 60000));
}

/* ══════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════ */
function _renderDashboard() {
  const today  = todayStr();
  const pts    = Patients.all();
  const orders = Orders.forDate(today);
  const pend   = orders.filter(o => o.status==='pending').length;
  const appr   = orders.filter(o => o.status==='approved').length;
  const cards  = MilkCards.forDate(today);
  const pendFeeds = cards.reduce((n,m) => { const f = MilkCards.getFeeds(m); return n + f.filter(x=>x.status==='delivered').length; }, 0);
  const fedCount  = cards.reduce((n,m) => { const f = MilkCards.getFeeds(m); return n + f.filter(x=>x.status==='fed').length; }, 0);

  document.getElementById('d-pts').textContent   = pts.length;
  document.getElementById('d-pend').textContent  = pend;
  document.getElementById('d-appr').textContent  = appr;
  document.getElementById('d-feeds').textContent = pendFeeds;

  // Flow bar
  const flowItems = [
    { label:'ลงทะเบียน', val:pts.length,     icon:'ti-user-plus',      done:pts.length>0 },
    { label:'สั่งนม',    val:orders.length,   icon:'ti-clipboard-plus', done:orders.length>0 },
    { label:'Approve',   val:appr,            icon:'ti-shield-check',   done:appr>0 },
    { label:'ผลิต',      val:cards.length,    icon:'ti-printer',        done:cards.length>0 },
    { label:'Feed',      val:fedCount,        icon:'ti-milk',           done:fedCount>0 },
  ];
  document.getElementById('d-flow').innerHTML = flowItems.map((s,i)=>`
    <div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">
      <div style="width:36px;height:36px;border-radius:50%;background:${s.done?'var(--teal-600)':'var(--gray-100)'};display:flex;align-items:center;justify-content:center;color:${s.done?'#fff':'var(--text-3)'};font-size:16px">
        <i class="ti ${s.icon}" aria-hidden="true"></i></div>
      <div style="font-size:15px;font-weight:700;color:${s.done?'var(--teal-700)':'var(--text-3)'}">${s.val}</div>
      <div style="font-size:9px;color:var(--text-3);text-align:center">${s.label}</div>
    </div>
    ${i<flowItems.length-1?'<div style="width:12px;height:2px;background:var(--border);margin-bottom:18px;flex-shrink:0"></div>':''}`).join('');

  // Alerts (no expiry milk)
  const alerts = [];
  if (pend>0) alerts.push(`<div class="alert al-amber"><i class="ti ti-clock" aria-hidden="true"></i><div><div class="al-title">รอ Approve ${pend} คำสั่ง</div><div class="al-body">Incharge / หัวหน้าหน่วยกรุณาตรวจสอบ</div></div></div>`);
  if (pendFeeds>0) alerts.push(`<div class="alert al-blue"><i class="ti ti-milk" aria-hidden="true"></i><div><div class="al-title">รอ Feed ${pendFeeds} มื้อ</div><div class="al-body">นมส่งถึงหน่วยแล้ว สแกน QR ก่อน feed</div></div></div>`);
  if (!alerts.length) alerts.push(`<div class="alert al-green"><i class="ti ti-circle-check" aria-hidden="true"></i><div><div class="al-title">ทุกอย่างปกติ</div><div class="al-body">ไม่มีการแจ้งเตือน</div></div></div>`);
  document.getElementById('d-alerts').innerHTML = alerts.join('');

  // Patient list
  const listEl = document.getElementById('d-pt-list');
  listEl.innerHTML = pts.length ? pts.map(p=>{
    const o = orders.find(x=>x.ptId===p.id);
    const ageEl = `<span class="age-live" id="age-d-${p.id}"></span>`;
    return `<div class="list-row">
      <div class="avatar">${p.firstName?.charAt(0)||'?'}</div>
      <div class="row-body">
        <div class="row-title">${p.firstName} ${p.lastName}</div>
        <div class="row-sub">${p.room} · HN: ${p.hn} · ${ageEl}</div>
        ${o?`<div class="row-hint">${o.formula}${o.formulaFm?' '+o.formulaFm:''}</div>`:'<div class="row-hint" style="color:var(--amber-600)">ยังไม่มีคำสั่งนมวันนี้</div>'}
      </div>
      <span class="badge ${o?.status==='approved'?'b-green':o?'b-amber':'b-gray'}">${o?.status==='approved'?'✓ Approve':o?'รอ':'—'}</span>
    </div>`;
  }).join('') : '<div style="text-align:center;padding:1.5rem;color:var(--text-3);font-size:13px">ยังไม่มีผู้ป่วย</div>';

  // Start age timers
  pts.forEach(p => {
    const el = document.getElementById('age-d-'+p.id);
    if (el) _startAgeEl(el, p.dob, p.dobTime);
  });
}

/* ══════════════════════════════════════════
   STEP 1 — REGISTER
══════════════════════════════════════════ */
function _renderRegister() {
  _editPt = null;
  _populateRooms('reg-room');
  document.getElementById('reg-form')?.reset();
  document.getElementById('reg-age-display').textContent = '';
  document.getElementById('reg-result').className = 'result-box';
  _renderPatientList();
}

function _renderPatientList() {
  const pts = Patients.all();
  const el  = document.getElementById('reg-pt-list');
  if (!pts.length) { el.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--text-3)">ยังไม่มีผู้ป่วยลงทะเบียน</div>'; return; }
  el.innerHTML = pts.map(p => {
    const ageEl = `<span id="age-r-${p.id}"></span>`;
    return `<div class="list-row">
      <div class="avatar">${p.firstName?.charAt(0)||'?'}</div>
      <div class="row-body">
        <div class="row-title">${p.firstName} ${p.lastName} ${p.allergy!=='NKA'?`<span style="color:var(--red-600);font-size:11px;font-weight:600">⚠ ${p.allergy}</span>`:''}</div>
        <div class="row-sub">HN: ${p.hn} · ${p.room} · ${p.religion}</div>
        <div class="row-hint">${ageEl}</div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="btn btn-xs" onclick="editPt('${p.id}')" aria-label="แก้ไข"><i class="ti ti-edit" aria-hidden="true"></i></button>
        <button class="btn btn-xs btn-danger" onclick="openDelPtModal('${p.id}')" aria-label="ลบ"><i class="ti ti-trash" aria-hidden="true"></i></button>
      </div>
    </div>`;
  }).join('');
  pts.forEach(p => {
    const el = document.getElementById('age-r-'+p.id);
    if (el) _startAgeEl(el, p.dob, p.dobTime);
  });
}

function _populateRooms(selId) {
  const s = document.getElementById(selId); if (!s) return;
  s.innerHTML = '<option value="">-- เลือกห้อง --</option>' + ROOMS.map(r=>`<option>${r}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', ()=>{
  const dob = document.getElementById('reg-dob');
  if (dob) dob.addEventListener('input', ()=>{
    const a = calcAge(dob.value, document.getElementById('reg-dobtime')?.value);
    document.getElementById('reg-age-display').textContent = a.label ? 'อายุ: '+a.label : '';
  });
});

function savePt() {
  const hn    = document.getElementById('reg-hn').value.trim();
  const room  = document.getElementById('reg-room').value;
  const first = document.getElementById('reg-first').value.trim();
  const last  = document.getElementById('reg-last').value.trim();
  const dob   = document.getElementById('reg-dob').value.trim();
  const dobT  = document.getElementById('reg-dobtime').value.trim();
  const rel   = document.getElementById('reg-religion').value;
  const alg   = document.getElementById('reg-allergy').value.trim() || 'NKA';
  if (!hn||!room||!first||!dob) { toast('กรุณากรอก HN / ห้อง / ชื่อ / วันเกิด'); return; }
  const dup = Patients.findByHN(hn);
  if (dup && (!_editPt || dup.id!==_editPt.id)) { toast('HN นี้มีในระบบแล้ว'); return; }
  const pt = { id:_editPt?_editPt.id:uid(), hn, room, firstName:first, lastName:last, dob, dobTime:dobT, religion:rel, allergy:alg, createdAt:_editPt?_editPt.createdAt:nowTs(), updatedAt:nowTs() };
  Patients.save(pt);
  document.getElementById('reg-result').className='result-box show success';
  document.getElementById('reg-result').innerHTML=`<i class="ti ti-circle-check" aria-hidden="true"></i><div class="result-title">${_editPt?'แก้ไข':'ลงทะเบียน'}สำเร็จ</div><div class="result-detail">${first} ${last} · ${hn} · ${room}</div>`;
  _editPt=null; document.getElementById('reg-form')?.reset(); document.getElementById('reg-age-display').textContent='';
  setTimeout(()=>document.getElementById('reg-result').className='result-box',4000);
  _renderPatientList(); _updateBadges();
  toast('✓ บันทึก '+first);
}
function editPt(id) {
  const p = Patients.find(id); if(!p) return;
  _editPt = p;
  _populateRooms('reg-room');
  document.getElementById('reg-hn').value       = p.hn;
  document.getElementById('reg-room').value     = p.room;
  document.getElementById('reg-first').value    = p.firstName;
  document.getElementById('reg-last').value     = p.lastName;
  document.getElementById('reg-dob').value      = p.dob;
  document.getElementById('reg-dobtime').value  = p.dobTime||'';
  document.getElementById('reg-religion').value = p.religion;
  document.getElementById('reg-allergy').value  = p.allergy==='NKA'?'':p.allergy;
  document.getElementById('reg-age-display').textContent = 'อายุ: '+calcAge(p.dob,p.dobTime).label;
  document.getElementById('reg-form')?.scrollIntoView({behavior:'smooth'});
}
function openDelPtModal(id) {
  const p = Patients.find(id); if(!p) return;
  document.getElementById('del-pt-id').value   = id;
  document.getElementById('del-pt-name').textContent = p.firstName+' '+p.lastName+' ('+p.hn+')';
  document.getElementById('del-pt-reason').value='';
  document.getElementById('del-pt-by').value='';
  _openModal('modal-del-pt');
}
async function confirmDelPt() {
  const id     = document.getElementById('del-pt-id').value;
  const reason = document.getElementById('del-pt-reason').value;
  const byCode = document.getElementById('del-pt-by').value.trim();
  if (!reason) { toast('กรุณาเลือกเหตุผล'); return; }
  if (!byCode) { toast('กรุณาระบุรหัสผู้ลบ'); return; }
  const log = { id:uid(), sheet:'patients', recordId:id, reason, deletedBy:byCode, deletedAt:nowTs() };
  await Patients.del(id, log);
  _closeModal(); _renderPatientList(); _updateBadges();
  toast('ลบข้อมูลผู้ป่วยแล้ว');
}

/* ══════════════════════════════════════════
   STEP 2 — ORDER
══════════════════════════════════════════ */
function _renderOrderPage() {
  _editOrder = null;
  const sel = document.getElementById('ord-patient');
  if (sel) sel.innerHTML = '<option value="">-- เลือกผู้ป่วย --</option>' + Patients.all().map(p=>`<option value="${p.id}">${p.firstName} ${p.lastName} · ${p.room}</option>`).join('');
  document.getElementById('ord-pt-info').style.display = 'none';
  document.getElementById('ord-result').className = 'result-box';
  _populateFormulas();
  _renderOrderList();
  _initFeedTimeChips();
}

function _populateFormulas() {
  const bm = document.getElementById('ord-bm');
  const fm = document.getElementById('ord-fm');
  if (bm) bm.innerHTML = FORMULA_BM.map(f=>`<option>${f}</option>`).join('');
  if (fm) fm.innerHTML = FORMULA_FM.map((f,i)=>`<option value="${f}">${f||'— ไม่มีนมเสริม —'}</option>`).join('');
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('ord-patient')?.addEventListener('change', _onPtChange);
  document.getElementById('ord-vol')?.addEventListener('input', _calcTotal);
  document.getElementById('ord-freq')?.addEventListener('input', ()=>{ _calcTotal(); _renderFeedChips(); });
  document.getElementById('ord-route')?.addEventListener('change', ()=>{
    const isBottle = document.getElementById('ord-route').value==='Bottle';
    document.getElementById('ord-bottle-info').style.display = isBottle?'block':'none';
    _calcTotal();
  });
  document.getElementById('ord-limit-bm')?.addEventListener('change', ()=>{
    const v = document.getElementById('ord-limit-bm').checked;
    document.getElementById('ord-limit-bm-row').style.display = v?'block':'none';
  });
  const popRoute = document.getElementById('ord-route');
  if (popRoute) popRoute.innerHTML = ROUTES.map(r=>`<option>${r}</option>`).join('');
});

function _onPtChange() {
  const id = document.getElementById('ord-patient').value;
  const info = document.getElementById('ord-pt-info');
  if (!id) { info.style.display='none'; return; }
  const p = Patients.find(id); if (!p) return;
  const age = calcAge(p.dob, p.dobTime);
  document.getElementById('ord-pt-hn').textContent   = p.hn;
  document.getElementById('ord-pt-name').textContent = p.firstName+' '+p.lastName;
  document.getElementById('ord-pt-room').textContent = p.room;
  document.getElementById('ord-pt-age').textContent  = age.label;
  document.getElementById('ord-pt-alg').textContent  = p.allergy;
  document.getElementById('ord-pt-alg').style.color  = p.allergy!=='NKA'?'var(--red-600)':'';
  // Auto mouth care
  const mcFreq = document.getElementById('ord-mc-freq');
  if (mcFreq && age.d<=7) mcFreq.value='q 3 h';
  info.style.display='block';
  _calcTotal();
}

function _calcTotal() {
  const vol   = parseInt(document.getElementById('ord-vol')?.value)||0;
  const freq  = parseInt(document.getElementById('ord-freq')?.value)||0;
  const route = document.getElementById('ord-route')?.value||'';
  const el    = document.getElementById('ord-total');
  if (!el) return;
  if (vol&&freq) {
    const base  = vol*freq;
    const total = calcBottleTotal(vol);
    el.innerHTML = route==='Bottle'
      ? `ปริมาณรวม: ${base} mL/วัน · Bottle: <strong>${total} mL/ขวด</strong> (${vol}+${total-vol} mL)`
      : `ปริมาณรวม: ${base} mL/วัน`;
  } else el.innerHTML='';
}

/* Feed time chips */
let _selectedTimes = [];
function _initFeedTimeChips() { _selectedTimes=[]; _renderFeedChips(); }
function _renderFeedChips() {
  const freq  = parseInt(document.getElementById('ord-freq')?.value)||8;
  const wrap  = document.getElementById('ord-time-chips');
  if (!wrap) return;
  wrap.innerHTML = FEED_SLOT_OPTIONS.map(t=>`
    <div class="time-chip ${_selectedTimes.includes(t)?'selected':''}" onclick="toggleTimeChip('${t}')" role="button" tabindex="0">${t}</div>`).join('');
  document.getElementById('ord-time-hint').textContent =
    _selectedTimes.length===0?`ไม่เลือก = ระบบจัดสรรอัตโนมัติ ${freq} มื้อ`:
    _selectedTimes.length===freq?'✓ ครบ '+freq+' มื้อ':
    `เลือก ${_selectedTimes.length}/${freq} มื้อ`;
}
function toggleTimeChip(t) {
  const freq = parseInt(document.getElementById('ord-freq')?.value)||8;
  if (_selectedTimes.includes(t)) _selectedTimes = _selectedTimes.filter(x=>x!==t);
  else if (_selectedTimes.length < freq) _selectedTimes.push(t.toString());
  _selectedTimes.sort();
  _renderFeedChips();
}

function submitOrder() {
  const ptId    = document.getElementById('ord-patient').value;
  const staff   = document.getElementById('ord-staff').value.trim();
  if (!ptId) { toast('กรุณาเลือกผู้ป่วย'); return; }
  if (!staff||staff.length!==6) { toast('กรุณากรอกรหัสบุคลากร 6 หลัก'); return; }
  const p       = Patients.find(ptId);
  const bm      = document.getElementById('ord-bm').value;
  const fm      = document.getElementById('ord-fm').value;
  const vol     = parseInt(document.getElementById('ord-vol').value)||0;
  const freq    = parseInt(document.getElementById('ord-freq').value)||8;
  const route   = document.getElementById('ord-route').value;
  const mc      = document.getElementById('ord-mc').checked;
  const mcFreq  = document.getElementById('ord-mc-freq').value;
  const bf      = document.getElementById('ord-bf').checked;
  const limitBM = document.getElementById('ord-limit-bm').checked;
  const limitBMFeeds = limitBM ? parseInt(document.getElementById('ord-limit-bm-n').value)||0 : 0;
  const note    = document.getElementById('ord-note').value.trim();
  if (!vol) { toast('กรุณาระบุปริมาณนม'); return; }

  const feedTimes = _selectedTimes.length===freq ? [..._selectedTimes] : defaultFeedTimes(freq);
  const feedSchedule = allocateFeeds({ freq, milkType:bm, limitBM, limitBMFeeds, feedTimes });

  const order = {
    id: _editOrder?_editOrder.id:uid(), ptId, hn:p.hn,
    date: todayStr(), milkType:bm, formula:bm, formulaFm:fm,
    vol, freq, route,
    bottleExtra: route==='Bottle',
    bottleTotal: route==='Bottle' ? calcBottleTotal(vol) : vol,
    mouthCare:mc, mouthCareFreq:mcFreq,
    breastFeed:bf, limitBM, limitBMFeeds,
    feedSchedule: JSON.stringify(feedSchedule),
    note, staffCode:staff,
    status:'pending', approvedBy:'', approvedAt:'', rejectedReason:'',
    createdAt: _editOrder?_editOrder.createdAt:nowTs(),
  };
  Orders.save(order);
  _editOrder=null;
  const box = document.getElementById('ord-result');
  box.className='result-box show success';
  box.innerHTML=`<i class="ti ti-circle-check" aria-hidden="true"></i><div class="result-title">ส่งคำสั่งนมสำเร็จ</div><div class="result-detail">${p.firstName} · ${bm}${fm?' '+fm:''}<br>${vol} mL × ${freq} มื้อ · ${route}${route==='Bottle'?` · ขวดละ ${calcBottleTotal(vol)} mL`:''}</div>`;
  setTimeout(()=>box.className='result-box',5000);
  document.getElementById('ord-patient').value='';
  document.getElementById('ord-pt-info').style.display='none';
  document.getElementById('ord-staff').value='';
  _initFeedTimeChips();
  _renderOrderList(); _updateBadges();
  toast('✓ ส่งคำสั่งนมเรียบร้อย');
}

function _renderOrderList() {
  const today  = todayStr();
  const orders = Orders.forDate(today);
  const el     = document.getElementById('ord-list');
  if (!orders.length) { el.innerHTML='<div style="text-align:center;padding:1.5rem;color:var(--text-3)">ยังไม่มีคำสั่งนมวันนี้</div>'; return; }
  el.innerHTML = orders.map(o=>{
    const p = Patients.find(o.ptId);
    const cls = o.status==='approved'?'chip-approved':o.status==='rejected'?'chip-rejected':'chip-pending';
    const txt = o.status==='approved'?'✓ Approved':o.status==='rejected'?'✗ Rejected':'⏳ รอตรวจ';
    return `<div class="list-row">
      <div class="row-body">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
          <span class="row-title">${p?.firstName||'—'} · ${o.hn}</span>
          <span class="chip ${cls}">${txt}</span>
        </div>
        <div class="row-sub" style="white-space:normal">${o.formula}${o.formulaFm?' '+o.formulaFm:''}</div>
        <div class="row-hint">${o.vol} mL × ${o.freq} มื้อ · ${o.route}${o.route==='Bottle'?' · ขวดละ '+(o.bottleTotal||o.vol)+' mL':''}${o.status==='rejected'?' · <span style="color:var(--red-600)">'+o.rejectedReason+'</span>':''}</div>
      </div>
      ${o.status!=='approved'?`<button class="btn btn-xs" onclick="reenterOrder('${o.id}')"><i class="ti ti-edit" aria-hidden="true"></i></button>`:''}
    </div>`;
  }).join('');
}

function reenterOrder(id) {
  const o = Orders.find(id); if (!o) return;
  _editOrder=o;
  document.getElementById('ord-patient').value=o.ptId; _onPtChange();
  document.getElementById('ord-bm').value=o.formula;
  document.getElementById('ord-fm').value=o.formulaFm||'';
  document.getElementById('ord-vol').value=o.vol;
  document.getElementById('ord-freq').value=o.freq;
  document.getElementById('ord-route').value=o.route;
  document.getElementById('ord-mc').checked=o.mouthCare=='true'||o.mouthCare===true;
  document.getElementById('ord-mc-freq').value=o.mouthCareFreq;
  document.getElementById('ord-staff').value=o.staffCode;
  try { _selectedTimes = JSON.parse(o.feedSchedule||'[]').map(f=>f.time).slice(0,parseInt(o.freq)||8); } catch { _selectedTimes=[]; }
  _calcTotal(); _renderFeedChips();
  document.getElementById('ord-form')?.scrollIntoView({behavior:'smooth'});
}

/* ══════════════════════════════════════════
   STEP 3 — APPROVE
══════════════════════════════════════════ */
function _renderApprovePage() {
  const today  = todayStr();
  let orders = Orders.forDate(today);
  if (!orders.length) orders = Orders.allLocal();
  document.getElementById('apv-pend').textContent = orders.filter(o=>o.status==='pending').length;
  document.getElementById('apv-appr').textContent = orders.filter(o=>o.status==='approved').length;
  document.getElementById('apv-rej').textContent  = orders.filter(o=>o.status==='rejected').length;
  const el = document.getElementById('apv-list');
  if (!orders.length) { el.innerHTML='<div style="text-align:center;padding:2rem;color:var(--text-3)">ไม่มีคำสั่งนมวันนี้</div>'; return; }
  el.innerHTML = orders.map(o=>{
    const p   = Patients.find(o.ptId);
    const age = p?calcAge(p.dob,p.dobTime):null;
    const cls = o.status==='approved'?'chip-approved':o.status==='rejected'?'chip-rejected':'chip-pending';
    const txt = o.status==='approved'?'✓ Approved':o.status==='rejected'?'✗ Rejected':'⏳ รอตรวจ';
    let feedPreview='';
    try {
      const fs=JSON.parse(o.feedSchedule||'[]');
      feedPreview=`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${fs.map(f=>`<span class="badge ${f.milkType==='นมแม่'||f.milkType?.includes('BM')?'b-teal':'b-blue'}" style="font-size:9.5px">${f.time} ${f.milkType?.includes('นมแม่')||f.milkType==='นมแม่'?'🍼BM':'🥛FM'}</span>`).join('')}</div>`;
    } catch {}
    return `<div class="card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
        <div>
          <div style="font-size:14px;font-weight:600">${p?p.firstName+' '+p.lastName:'—'}</div>
          <div style="font-size:12px;color:var(--text-2)">HN: ${o.hn} · ${p?.room||''} · ${age?.label||'—'}</div>
          ${p?.allergy!=='NKA'?`<div style="font-size:11px;color:var(--red-600);font-weight:600">⚠ แพ้: ${p.allergy}</div>`:''}
        </div><span class="chip ${cls}">${txt}</span>
      </div>
      <div style="background:var(--gray-50);border-radius:var(--r-sm);padding:8px 10px;margin-bottom:8px;font-size:12.5px;line-height:1.7">
        <div><b>สูตร:</b> ${o.formula}${o.formulaFm?' '+o.formulaFm:''}</div>
        <div><b>ปริมาณ:</b> ${o.vol} mL × ${o.freq} มื้อ · <b>Route:</b> ${o.route}${o.route==='Bottle'?` · ขวดละ ${o.bottleTotal||o.vol} mL`:''}</div>
        ${o.mouthCare?`<div><b>Mouth care:</b> BM 0.2 mL ${o.mouthCareFreq}</div>`:''}
        ${o.breastFeed?'<div>Breast feeding</div>':''}
        ${o.limitBM?`<div>จำกัดนมแม่: ${o.limitBMFeeds} มื้อ/วัน</div>`:''}
        ${o.note?`<div><b>หมายเหตุ:</b> ${o.note}</div>`:''}
        <div style="color:var(--text-3)">คีย์โดย: ${o.staffCode}</div>
        ${feedPreview}
      </div>
      ${o.status==='pending'?`<div style="display:flex;gap:8px"><button class="btn btn-primary" style="flex:1" onclick="approveOrder('${o.id}')"><i class="ti ti-check" aria-hidden="true"></i> Approve</button><button class="btn btn-danger" style="flex:1" onclick="openRejectModal('${o.id}')"><i class="ti ti-x" aria-hidden="true"></i> Reject</button></div>`
        :o.status==='rejected'?`<div style="font-size:12px;color:var(--red-600)">เหตุผล: ${o.rejectedReason}</div>`
        :`<div style="font-size:12px;color:var(--green-600)">Approved โดย: ${o.approvedBy}</div>`}
    </div>`;
  }).join('');
}

function approveOrder(id) {
  const o = Orders.find(id); if (!o) return;
  document.getElementById('apv-order-id').value=id;
  document.getElementById('apv-staff').value='';
  _openModal('modal-approve');
}
function submitApprove() {
  const id   = document.getElementById('apv-order-id').value;
  const code = document.getElementById('apv-staff').value.trim();
  if (!code||code.length!==6) { toast('รหัส 6 หลักเท่านั้น'); return; }
  const o = Orders.find(id); if (!o) return;
  o.status='approved'; o.approvedBy=code; o.approvedAt=nowTs();
  Orders.save(o); _closeModal();
  toast('✓ Approved HN '+o.hn); _renderApprovePage(); _updateBadges();
}
function openRejectModal(id) {
  document.getElementById('rej-order-id').value=id;
  document.getElementById('rej-reason').value='';
  _openModal('modal-reject');
}
function submitReject() {
  const id     = document.getElementById('rej-order-id').value;
  const reason = document.getElementById('rej-reason').value.trim();
  if (!reason) { toast('กรุณาระบุเหตุผล'); return; }
  const o = Orders.find(id); if (!o) return;
  o.status='rejected'; o.rejectedReason=reason;
  Orders.save(o); _closeModal();
  toast('Rejected HN '+o.hn); _renderApprovePage(); _updateBadges();
}

/* ══════════════════════════════════════════
   STEP 4 — PRODUCE
══════════════════════════════════════════ */
function _renderProducePage() {
  const approved = Orders.forDate(todayStr()).filter(o=>o.status==='approved');
  document.getElementById('prod-count').textContent = approved.length;
  const el = document.getElementById('prod-list');
  if (!approved.length) { el.innerHTML='<div style="text-align:center;padding:2rem;color:var(--text-3)">ไม่มีคำสั่ง Approved วันนี้</div>'; return; }
  el.innerHTML = approved.map(o=>{
    const p = Patients.find(o.ptId);
    const cards = MilkCards.forOrder(o.id);
    const printed = cards.length&&cards[0].printedAt;
    return `<div class="card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
        <div>
          <div style="font-size:14px;font-weight:600">${p?p.firstName+' '+p.lastName:'—'}</div>
          <div style="font-size:12px;color:var(--text-2)">HN: ${o.hn} · ${p?.room||''}</div>
        </div>
        <span class="chip ${printed?'chip-delivered':'chip-approved'}">${printed?'✓ พิมพ์แล้ว':'รอผลิต'}</span>
      </div>
      <div style="background:var(--gray-50);border-radius:var(--r-sm);padding:7px 10px;margin-bottom:8px;font-size:12.5px;line-height:1.6">
        ${o.formula}${o.formulaFm?' '+o.formulaFm:''}<br>
        ${o.vol} mL × ${o.freq} มื้อ · ${o.route}${o.route==='Bottle'?` · ขวดละ ${o.bottleTotal||o.vol} mL`:''}
        ${o.mouthCare?`<br>Mouth care BM 0.2 mL ${o.mouthCareFreq}`:''}
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" style="flex:1" onclick="receiveAndPrint('${o.id}')"><i class="ti ti-printer" aria-hidden="true"></i> รับเข้า + Print</button>
        ${printed?`<button class="btn" style="flex:1" onclick="viewCards('${o.id}')"><i class="ti ti-eye" aria-hidden="true"></i> ดูบัตรนม</button>`:''}
      </div>
    </div>`;
  }).join('');
}

function receiveAndPrint(orderId) {
  const o = Orders.find(orderId); if(!o) return;
  const p = Patients.find(o.ptId); if(!p) return;
  const existing = MilkCards.forOrder(orderId);
  let feedSchedule;
  try { feedSchedule = JSON.parse(o.feedSchedule||'[]'); } catch { feedSchedule=[]; }
  if (!feedSchedule.length) feedSchedule = allocateFeeds({ freq:o.freq, milkType:o.formula, limitBM:o.limitBM, limitBMFeeds:parseInt(o.limitBMFeeds)||0, feedTimes:defaultFeedTimes(parseInt(o.freq)||8) });
  let mc;
  if (existing.length) { mc=existing[0]; mc.printedAt=nowTs(); }
  else {
    mc = { id:uid(), orderId, ptId:o.ptId, hn:o.hn, name:p.firstName+' '+p.lastName,
      dob:p.dob, room:p.room, formula:o.formula, formulaFm:o.formulaFm||'',
      vol:o.vol, route:o.route, freq:parseInt(o.freq)||8,
      mouthCare:o.mouthCare, mouthCareFreq:o.mouthCareFreq,
      date:todayStr(), feeds:feedSchedule,
      qr: p.hn,   // QR = HN (matches wristband format A00C...)
      printedAt:nowTs(), nutritionReceived:true };
  }
  MilkCards.save(mc);
  toast('✓ บัตรนม '+p.firstName+' · '+mc.freq+' ใบ');
  _renderProducePage(); _updateBadges();
  viewCards(orderId);
}

function viewCards(orderId) {
  const cards = MilkCards.forOrder(orderId); if(!cards.length) return;
  const mc = cards[0];
  const feeds = MilkCards.getFeeds(mc);
  const section = document.getElementById('prod-cards-section');
  const grid = document.getElementById('prod-card-grid');
  const p = Patients.find(mc.ptId);
  const age = calcAge(mc.dob);
  grid.innerHTML = feeds.map(f => {
    const isBM = f.milkType?.includes('นมแม่')||f.milkType==='DBM'||!f.milkType;
    const typeLabel = f.milkType||mc.formula;
    const typeCls = f.milkType?.includes('นมแม่')?'mc-type-bm': f.milkType==='NPO'?'mc-type-npo':'mc-type-fm';
    // QR pattern (decorative mini)
    const qrPat = [1,1,1,0,1,1,0,1,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,0,1];
    const qrHtml = `<div class="qr-block">${qrPat.map(v=>`<div class="qr-px" style="background:${v?'#000':'#fff'}"></div>`).join('')}</div>`;
    return `<div class="milk-card">
      <div class="mc-header"><span>วันที่ ${mc.date}</span><span>มื้อที่ ${f.no}</span></div>
      <div class="mc-hn">HN: ${mc.hn}</div>
      <div style="font-size:10.5px;color:var(--text-2)">${mc.name} · ${age.label}</div>
      <div style="font-size:9.5px;color:var(--text-3)">${mc.room} · ${mc.route}</div>
      <div class="mc-formula">${mc.formula}${mc.formulaFm?' '+mc.formulaFm:''}</div>
      <div style="font-size:10px;color:var(--text-2)">${mc.vol} mL${mc.route==='Bottle'?' (ขวดละ '+(calcBottleTotal(mc.vol))+' mL)':''}${mc.mouthCare?' + MC '+mc.mouthCareFreq:''}</div>
      <div class="mc-meal-row">
        <span class="mc-time">${f.time} น.</span>
        <span class="mc-type ${typeCls}">${typeLabel.includes('นมแม่')?'🍼 BM':typeLabel==='NPO'?'NPO':'🥛 FM'}</span>
        <div style="display:flex;align-items:center;gap:3px">${qrHtml}<div class="mc-checkbox ${f.status==='fed'?'fed':''}"></div></div>
      </div>
    </div>`;
  }).join('');
  section.style.display='block';
  section.scrollIntoView({behavior:'smooth'});
}
function printCards() { window.print(); }

/* ══════════════════════════════════════════
   STEP 5 — FEED + QR SCAN
══════════════════════════════════════════ */
function _renderFeedPage() {
  _scanTarget=null;
  document.getElementById('feed-scanner').style.display='none';
  const today = todayStr();
  const cards = MilkCards.forDate(today);
  const pendCount = cards.filter(m=>{ const f=MilkCards.getFeeds(m); return f.some(x=>x.status==='delivered'); }).length;
  document.getElementById('feed-count').textContent = pendCount+' ผู้ป่วย';
  document.getElementById('feed-count').className = 'badge '+(pendCount>0?'b-amber':'b-green');
  const el = document.getElementById('feed-queue');
  if (!cards.length) { el.innerHTML='<div style="text-align:center;padding:2rem;color:var(--text-3)"><i class="ti ti-circle-check" style="font-size:32px;display:block;margin-bottom:.5rem;color:var(--teal-500)"></i>ยังไม่มีบัตรนมวันนี้</div>'; return; }
  el.innerHTML = cards.map(mc=>{
    const feeds = MilkCards.getFeeds(mc);
    const fed   = feeds.filter(f=>f.status==='fed').length;
    const next  = feeds.find(f=>f.status==='delivered');
    return `<div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <div class="avatar">${mc.name?.charAt(0)||'?'}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600">${mc.name}</div>
          <div style="font-size:12px;color:var(--text-2)">HN: ${mc.hn} · ${mc.room}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div class="badge b-teal">${fed}/${mc.freq} มื้อ</div>
          ${next?`<div style="font-size:11px;color:var(--amber-600);margin-top:2px">🍼 ${next.time} · ${next.milkType||'—'}</div>`:''}
        </div>
      </div>
      <div style="font-size:12px;color:var(--text-2);margin-bottom:8px">${mc.formula} · ${mc.vol} mL · ${mc.route}</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm" style="flex:1" onclick="markDelivered('${mc.id}')"><i class="ti ti-truck-delivery" aria-hidden="true"></i> รับนมเข้าหน่วย</button>
        <button class="btn btn-primary btn-sm" style="flex:1" onclick="startFeedScan('${mc.id}')"><i class="ti ti-qrcode" aria-hidden="true"></i> สแกน QR Feed</button>
      </div>
    </div>`;
  }).join('');
}

function markDelivered(mcId) {
  const mc = MilkCards.find(mcId); if(!mc) return;
  const feeds = MilkCards.getFeeds(mc);
  let changed=false;
  feeds.forEach(f=>{ if(f.status==='pending'){ f.status='delivered'; f.deliveredAt=nowTs(); changed=true; }});
  if (!changed) { toast('นมมาครบทุกมื้อแล้ว'); return; }
  mc.feeds=feeds; MilkCards.save(mc);
  toast('✓ รับนม '+mc.name+' เข้าหน่วยแล้ว'); _renderFeedPage(); _updateBadges();
}

function startFeedScan(mcId) {
  _scanTarget = MilkCards.find(mcId); if(!_scanTarget) return;
  const feeds  = MilkCards.getFeeds(_scanTarget);
  const next   = feeds.find(f=>f.status==='delivered');
  document.getElementById('feed-scan-name').textContent   = 'ยืนยัน Feed: '+_scanTarget.name;
  document.getElementById('feed-scan-detail').textContent = _scanTarget.formula+' · '+_scanTarget.vol+' mL';
  document.getElementById('feed-scan-feed').textContent   = next?'มื้อที่ '+next.no+' · '+next.time+' น. · '+(next.milkType||'—'):'';
  document.getElementById('feed-scan-result').className='result-box';
  document.getElementById('feed-scan-start').style.display='block';
  document.getElementById('feed-cam-view').style.display='none';
  _setSteps('feed-', [1,1,0,0]);
  document.getElementById('feed-scanner').style.display='block';
  document.getElementById('feed-scanner').scrollIntoView({behavior:'smooth'});
}

function _setSteps(pre, state) {
  ['s1','s2','s3','s4'].forEach((s,i)=>{
    const el=document.getElementById(pre+s); if(!el) return;
    el.className='step-node '+(state[i]===1?'step-done':state[i]===2?'step-active':'step-pending');
  });
}

function openFeedCamera() {
  if (!navigator.mediaDevices?.getUserMedia) { toast('ต้องใช้ HTTPS เพื่อเปิดกล้อง'); return; }
  document.getElementById('feed-scan-start').style.display='none';
  document.getElementById('feed-cam-view').style.display='block';
  _setSteps('feed-',[1,1,2,0]);
  navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}})
    .then(s=>{ _scanStream=s; const v=document.getElementById('feed-video'); v.srcObject=s; v.onloadedmetadata=()=>{ v.play(); _scanLoop(); }; })
    .catch(err=>{ document.getElementById('feed-scan-start').style.display='block'; document.getElementById('feed-cam-view').style.display='none'; toast(err.name==='NotAllowedError'?'ไม่ได้รับอนุญาตกล้อง':'เปิดกล้องไม่ได้'); _setSteps('feed-',[1,1,0,0]); });
}
function _scanLoop() {
  const v=document.getElementById('feed-video'), c=document.getElementById('feed-canvas');
  if (!v||v.readyState<2) { _scanRaf=requestAnimationFrame(_scanLoop); return; }
  c.width=v.videoWidth; c.height=v.videoHeight;
  const ctx=c.getContext('2d'); ctx.drawImage(v,0,0);
  const img=ctx.getImageData(0,0,c.width,c.height);
  const code=typeof jsQR!=='undefined'?jsQR(img.data,c.width,c.height,{inversionAttempts:'dontInvert'}):null;
  if (code?.data) { _closeCamera(); _handleFeedQR(code.data.trim()); }
  else _scanRaf=requestAnimationFrame(_scanLoop);
}
function _handleFeedQR(raw) {
  _setSteps('feed-',[1,1,1,2]);
  // QR from wristband: "A00C2646475" → match by HN or starts-with
  const pt = Patients.match(raw) ||
    Patients.all().find(p => raw.includes(p.hn) || p.hn.includes(raw));
  const res = document.getElementById('feed-scan-result');
  document.getElementById('feed-cam-view').style.display='none';
  if (!pt) {
    res.className='result-box show error';
    res.innerHTML=`<i class="ti ti-alert-circle" aria-hidden="true"></i><div class="result-title">ไม่พบผู้ป่วย</div><div class="result-detail">QR: "${raw}"</div><div class="result-actions"><button class="btn btn-sm" onclick="retryFeedScan()"><i class="ti ti-refresh" aria-hidden="true"></i> สแกนใหม่</button><button class="btn btn-sm" onclick="cancelFeedScan()">ยกเลิก</button></div>`;
    _setSteps('feed-',[1,1,0,0]); return;
  }
  if (_scanTarget && _scanTarget.ptId!==pt.id) {
    res.className='result-box show warning';
    res.innerHTML=`<i class="ti ti-alert-triangle" aria-hidden="true"></i><div class="result-title">ผู้ป่วยไม่ตรง!</div><div class="result-detail">สแกนได้: <b>${pt.firstName} · ${pt.room}</b><br>รายการนี้สำหรับ: <b>${_scanTarget?.name}</b></div><div class="result-actions"><button class="btn btn-sm" onclick="retryFeedScan()">สแกนใหม่</button><button class="btn btn-sm" onclick="cancelFeedScan()">ยกเลิก</button></div>`;
    _setSteps('feed-',[1,1,0,0]); return;
  }
  _setSteps('feed-',[1,1,1,1]);
  res.className='result-box show success';
  const feeds=MilkCards.getFeeds(_scanTarget);
  const next=feeds.find(f=>f.status==='delivered'||f.status==='pending');
  res.innerHTML=`<i class="ti ti-circle-check" aria-hidden="true"></i>
    <div class="result-title">QR ยืนยันตรงผู้ป่วย ✓</div>
    <div class="result-detail"><b>${pt.firstName} ${pt.lastName}</b> · ${pt.room}<br>${_scanTarget.formula} · ${_scanTarget.vol} mL<br>${next?'มื้อที่ '+next.no+' · '+next.time+' น. · <b>'+(next.milkType||'')+'</b>':''}<br><span style="color:var(--green-600)">✓ ตรง HN · ✓ ตรงห้อง</span></div>
    <div class="result-actions">
      <button class="btn btn-primary btn-sm" onclick="confirmFeed()"><i class="ti ti-check" aria-hidden="true"></i> บันทึก Feed</button>
      <button class="btn btn-sm" onclick="cancelFeedScan()">ยกเลิก</button>
    </div>`;
}
function confirmFeed() {
  if (!_scanTarget) return;
  const feeds=MilkCards.getFeeds(_scanTarget);
  const next=feeds.find(f=>f.status==='delivered'||f.status==='pending');
  if (next) { next.status='fed'; next.fedAt=nowTs(); next.fedBy='พยาบาล'; }
  _scanTarget.feeds=feeds; MilkCards.save(_scanTarget);
  toast('✓ Feed '+_scanTarget.name+' มื้อที่ '+(next?.no||'—')+' · '+(next?.milkType||''));
  _scanTarget=null;
  document.getElementById('feed-scanner').style.display='none';
  _renderFeedPage(); _updateBadges();
}
function retryFeedScan() { document.getElementById('feed-scan-result').className='result-box'; openFeedCamera(); }
function cancelFeedScan() { _closeCamera(); _scanTarget=null; document.getElementById('feed-scanner').style.display='none'; }

/* ── Helpers ── */
function _closeCamera() {
  if (_scanRaf) { cancelAnimationFrame(_scanRaf); _scanRaf=null; }
  if (_scanStream) { _scanStream.getTracks().forEach(t=>t.stop()); _scanStream=null; }
  const v=document.getElementById('feed-video'); if(v) v.srcObject=null;
}
function _openModal(id) { document.getElementById(id)?.classList.add('show'); }
function _closeModal() { document.querySelectorAll('.modal-overlay').forEach(m=>m.classList.remove('show')); }
function _updateBadges() {
  const today=todayStr();
  const p=Orders.forDate(today).filter(o=>o.status==='pending').length;
  const b=document.getElementById('nv-approve-badge');
  if(b){b.textContent=p;b.style.display=p>0?'flex':'none';}
  const cards=MilkCards.forDate(today);
  const f=cards.reduce((n,m)=>{const fs=MilkCards.getFeeds(m);return n+fs.filter(x=>x.status==='delivered').length;},0);
  const fb=document.getElementById('nv-feed-badge');
  if(fb){fb.textContent=f;fb.style.display=f>0?'flex':'none';}
}

function exportCSV() {
  const today=todayStr();
  const cards=MilkCards.forDate(today);
  const rows=[['HN','ชื่อ','ห้อง','สูตรนม','ปริมาณ(mL)','Route','มื้อที่','เวลา','ชนิดนม','สถานะ','เวลา Feed']];
  cards.forEach(mc=>{const f=MilkCards.getFeeds(mc);f.forEach(x=>rows.push([mc.hn,mc.name,mc.room,mc.formula,mc.vol,mc.route,x.no,x.time,x.milkType||'',x.status,x.fedAt?new Date(x.fedAt).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}):'' ]));});
  const csv='\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='nicu-milk-'+today+'.csv'; a.click();
  toast('✓ ดาวน์โหลด CSV');
}
