/* ============================================================
   shared/db.js  —  NICU Milk v3
   Google Sheets via GAS Web App  +  localStorage cache/offline
   ============================================================ */
'use strict';

/* ── CONFIG: Google Apps Script Web App URL ── */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwJ7tDgfZCJOGqYHJScAROG8vk36sp_HqCZEFURAwNNUTglNUPNOmpgHr09XN_xGTM0/exec';

const CACHE_PREFIX = 'nicuv3_';
const OFFLINE_QUEUE_KEY = 'nicuv3_offlineQ';

/* ══════════════════════════════════════════
   Utility
══════════════════════════════════════════ */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function todayStr() { return new Date().toISOString().split('T')[0]; }
function nowTs() { return new Date().toISOString(); }

function calcAge(dobStr, dobTime) {
  if (!dobStr) return { h:0, d:0, m:0, y:0, label:'—' };
  const parts = dobStr.split('/');
  if (parts.length < 3) return { h:0, d:0, m:0, y:0, label:'—' };
  let [dd, mm, yy] = parts.map(Number);
  // Buddhist Era → CE
  if (yy > 2400) yy -= 543;
  else if (yy >= 2500) yy -= 543;
  else if (yy <= 99) yy += (yy < 70 ? 2000 : 1900);
  let dob = new Date(yy, mm - 1, dd);
  if (dobTime) {
    const [hh2, mi] = dobTime.split(':').map(Number);
    dob.setHours(hh2 || 0, mi || 0, 0, 0);
  }
  const now = new Date();
  const ms  = now - dob;
  if (ms < 0) return { h:0, d:0, m:0, y:0, label:'—' };
  const totalH = Math.floor(ms / 3600000);
  const totalD = Math.floor(ms / 86400000);
  const y = Math.floor(totalD / 365);
  const mo = Math.floor((totalD % 365) / 30);
  const d = totalD % 30;
  let label = '';
  if (y  > 0) label += y  + ' ปี ';
  if (mo > 0) label += mo + ' เดือน ';
  label += d + ' วัน';
  if (totalD === 0) label = totalH + ' ชั่วโมง';
  return { h: totalH, d: totalD, m: mo, y, label: label.trim() };
}

/* Round up to nearest 5 */
function roundTo5(n) {
  const r = Math.ceil(n / 5) * 5;
  return r;
}

/* Bottle / Cup feeding total = vol * 1.20, rounded to nearest 5 */
function calcBottleTotal(vol) { return roundTo5(Math.ceil(vol * 1.20)); }
function needsBottleCalc(route) { return route === 'Bottle' || route === 'Cup feeding'; }

/* Generate QR content matching wristband format: A00C{HN}
   Hospital wristband example: A00C2646475
   We store HN as-is (e.g. C2645501) → QR = A00C2645501            */
function genWristbandQR(hn) {
  if (!hn) return '';
  const clean = hn.replace(/^[A-Za-z0]+/, ''); // strip leading letters/zeros
  return 'A00C' + clean;
}

/* ══════════════════════════════════════════
   Local Cache (localStorage)
══════════════════════════════════════════ */
const Cache = {
  get(k, def=[]) { try { const v = localStorage.getItem(CACHE_PREFIX+k); return v!==null?JSON.parse(v):def; } catch { return def; } },
  set(k, v)      { try { localStorage.setItem(CACHE_PREFIX+k, JSON.stringify(v)); } catch {} },
};

/* ══════════════════════════════════════════
   Offline Queue
══════════════════════════════════════════ */
const OfflineQ = {
  all()     { return Cache.get('offlineQ', []); },
  push(op)  { const q = this.all(); q.push(op); Cache.set('offlineQ', q); },
  clear()   { Cache.set('offlineQ', []); },
  async flush() {
    const q = this.all();
    if (!q.length) return;
    for (const op of q) {
      try { await _gasPost(op); } catch { return; } // stop on first failure
    }
    this.clear();
    console.log('[OfflineQ] flushed', q.length, 'ops');
  }
};
window.addEventListener('online', () => OfflineQ.flush());

/* ══════════════════════════════════════════
   GAS Transport
══════════════════════════════════════════ */
async function _gasGet(params) {
  const url = GAS_URL + '?' + new URLSearchParams(params);
  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

async function _gasPost(body) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

/* ══════════════════════════════════════════
   Generic Sheet API
══════════════════════════════════════════ */
const Sheet = {
  async getAll(sheet) {
    try {
      const rows = await _gasGet({ action:'getAll', sheet });
      Cache.set(sheet, rows);
      return rows;
    } catch {
      return Cache.get(sheet, []);
    }
  },
  async getDate(sheet, date) {
    try {
      const rows = await _gasGet({ action:'getDate', sheet, date });
      // merge into cache
      const all = Cache.get(sheet, []);
      rows.forEach(r => { const i=all.findIndex(x=>x.id===r.id); if(i>=0)all[i]=r; else all.push(r); });
      Cache.set(sheet, all);
      return rows;
    } catch {
      return Cache.get(sheet,[]).filter(r=>r.date===date);
    }
  },
  async upsert(sheet, row) {
    // optimistic local update
    const all = Cache.get(sheet,[]);
    const i = all.findIndex(x=>x.id===row.id);
    if (i>=0) all[i]=row; else all.push(row);
    Cache.set(sheet, all);
    const op = { action:'upsert', sheet, row };
    try { return await _gasPost(op); }
    catch { OfflineQ.push(op); return { action:'queued' }; }
  },
  async delete(sheet, id, log) {
    // optimistic local
    Cache.set(sheet, Cache.get(sheet,[]).filter(r=>r.id!==id));
    const op = { action:'delete', sheet, id, log };
    try { return await _gasPost(op); }
    catch { OfflineQ.push(op); return { action:'queued' }; }
  },
  localAll(sheet) { return Cache.get(sheet,[]); },
};

/* ══════════════════════════════════════════
   Domain helpers (local-first read, async write)
══════════════════════════════════════════ */
const Patients = {
  all()          { return Sheet.localAll('patients'); },
  find(id)       { return this.all().find(p=>p.id===id); },
  findByHN(hn)   { return this.all().find(p=>p.hn===hn); },
  match(text) {
    const t=(text||'').trim().toLowerCase();
    return this.all().find(p=>
      p.hn===text||p.hn?.toLowerCase()===t||
      p.firstName===text||p.firstName?.toLowerCase()===t||
      p.room===text||p.room?.toLowerCase()===t||
      p.room?.toLowerCase().replace('-','')===t.replace('-','')
    );
  },
  async save(pt)  { pt.updatedAt=nowTs(); return Sheet.upsert('patients',pt); },
  async del(id,log) { return Sheet.delete('patients',id,log); },
  async refresh() { return Sheet.getAll('patients'); },
};

const Orders = {
  allLocal()     { return Sheet.localAll('orders'); },
  forDate(date)  { return this.allLocal().filter(o=>o.date===date); },
  find(id)       { return this.allLocal().find(o=>o.id===id); },
  pending()      { return this.allLocal().filter(o=>o.status==='pending'); },
  async save(o)  { return Sheet.upsert('orders',o); },
  async refresh(date) { return Sheet.getDate('orders', date); },
};

const MilkCards = {
  allLocal()           { return Sheet.localAll('milkcards'); },
  forDate(date)        { return this.allLocal().filter(m=>m.date===date); },
  find(id)             { return this.allLocal().find(m=>m.id===id); },
  forOrder(orderId)    { return this.allLocal().filter(m=>m.orderId===orderId); },
  // feedsJson is stored as JSON string in Sheet
  getFeeds(mc)         { try { return typeof mc.feedsJson==='string'?JSON.parse(mc.feedsJson):mc.feedsJson||[]; } catch { return []; } },
  async save(mc) {
    const row = {...mc, feedsJson: JSON.stringify(mc.feeds||[]) };
    delete row.feeds;
    return Sheet.upsert('milkcards', row);
  },
  async refresh(date)  { return Sheet.getDate('milkcards', date); },
};

/* ══════════════════════════════════════════
   Seed demo data into local cache (first run)
══════════════════════════════════════════ */
function seedLocalDemo() {
  const today = todayStr();
  // Reset orders/milkcards cache ถ้าวันไม่ตรง (ข้ามวัน)
  const existingOrders = Sheet.localAll('orders');
  if (existingOrders.length && existingOrders.every(o => o.date !== today)) {
    Cache.set('orders', []);
    Cache.set('milkcards', []);
  }
  if (Sheet.localAll('patients').length) return;
  Cache.set('patients', [
    { id:'p01', hn:'C2645501', room:'NICU01-01', firstName:'อินทรา',   lastName:'มีสุข',  dob:'22/04/69', dobTime:'14:30', religion:'พุทธ',    allergy:'NKA',       createdAt:'2026-06-01T08:00:00Z', updatedAt:'' },
    { id:'p02', hn:'C2645502', room:'NICU01-02', firstName:'เพ็งสุข',  lastName:'ใจดี',   dob:'19/03/69', dobTime:'',     religion:'พุทธ',    allergy:'NKA',       createdAt:'2026-06-01T08:05:00Z', updatedAt:'' },
    { id:'p03', hn:'C2645503', room:'NICU02-01', firstName:'กันทรา',   lastName:'สว่าง',  dob:'22/05/69', dobTime:'',     religion:'พุทธ',    allergy:'แพ้นมวัว', createdAt:'2026-06-01T08:10:00Z', updatedAt:'' },
    { id:'p04', hn:'C2645504', room:'NICU02-03', firstName:'ใจบุญ',    lastName:'สุขใจ',  dob:'05/06/69', dobTime:'',     religion:'อิสลาม',  allergy:'NKA',       createdAt:'2026-06-01T08:15:00Z', updatedAt:'' },
    { id:'p05', hn:'C2645505', room:'NICU03-01', firstName:'สุภาสิริ', lastName:'ดวงดี',  dob:'07/06/69', dobTime:'',     religion:'พุทธ',    allergy:'NKA',       createdAt:'2026-06-01T08:20:00Z', updatedAt:'' },
  ]);
  Cache.set('orders', [
    { id:'o01', ptId:'p01', hn:'C2645501', date:today, milkType:'นมแม่/DBM', formula:'นมแม่/DBM (20 kcal/oz) 27 ml + Con. PF1 (2 kcal/mL) 3 mL (24 kcal/oz)', formulaFm:'', vol:30, freq:8, route:'Bottle', bottleExtra:true, bottleTotal:36, mouthCare:true, mouthCareFreq:'q 3 h', breastFeed:false, limitBM:false, limitBMFeeds:0, feedSchedule:'[]', note:'', staffCode:'029122', status:'approved', approvedBy:'013443', approvedAt:nowTs(), rejectedReason:'', createdAt:nowTs() },
    { id:'o02', ptId:'p02', hn:'C2645502', date:today, milkType:'นมแม่', formula:'นมแม่/DBM (20 kcal/oz) 28.5 ml + Conc. PF1 (2kcal/ml) 1.5 ml (22 kcal/oz)', formulaFm:'', vol:30, freq:8, route:'Bottle', bottleExtra:true, bottleTotal:36, mouthCare:true, mouthCareFreq:'q 3 h', breastFeed:false, limitBM:false, limitBMFeeds:0, feedSchedule:'[]', note:'', staffCode:'027169', status:'pending', approvedBy:'', approvedAt:'', rejectedReason:'', createdAt:nowTs() },
  ]);
  const h6 = new Date(); h6.setHours(6,0,0,0);
  const h9 = new Date(); h9.setHours(9,0,0,0);
  const feeds = [
    {no:1,time:'06:00',milkType:'นมแม่',status:'fed',     deliveredAt:h6.toISOString(),fedAt:h6.toISOString(),fedBy:'029122'},
    {no:2,time:'09:00',milkType:'นมแม่',status:'delivered',deliveredAt:h9.toISOString(),fedAt:'',fedBy:''},
    {no:3,time:'12:00',milkType:'DBM',  status:'pending',  deliveredAt:'',fedAt:'',fedBy:''},
    {no:4,time:'15:00',milkType:'นมแม่',status:'pending',  deliveredAt:'',fedAt:'',fedBy:''},
    {no:5,time:'18:00',milkType:'DBM',  status:'pending',  deliveredAt:'',fedAt:'',fedBy:''},
    {no:6,time:'21:00',milkType:'นมแม่',status:'pending',  deliveredAt:'',fedAt:'',fedBy:''},
    {no:7,time:'00:00',milkType:'DBM',  status:'pending',  deliveredAt:'',fedAt:'',fedBy:''},
    {no:8,time:'03:00',milkType:'นมแม่',status:'pending',  deliveredAt:'',fedAt:'',fedBy:''},
  ];
  Cache.set('milkcards', [
    { id:'mc01', orderId:'o01', ptId:'p01', hn:'C2645501', name:'อินทรา มีสุข', dob:'22/04/69', room:'NICU01-01',
      formula:'นมแม่/DBM (20 kcal/oz) 27 ml + Con. PF1 3 mL', formulaFm:'', vol:30, route:'Bottle',
      freq:8, mouthCare:true, mouthCareFreq:'q 3 h', date:today,
      feedsJson:JSON.stringify(feeds),
      qr:'C2645501', printedAt:nowTs(), nutritionReceived:true },
  ]);
}

/* ══════════════════════════════════════════
   Feed schedule allocator
   ══════════════════════════════════════════
   Rules:
   - limitBM N/day  → first N meals = BM, rest = FM
   - bmFeeds + fmFeeds (alternating: BM first)
   - single type → all same
   feedTimes: array of 'HH:MM' strings (length = freq)
══════════════════════════════════════════ */
function allocateFeeds({ freq, milkType, limitBM, limitBMFeeds, feedTimes }) {
  const times = feedTimes && feedTimes.length === freq ? feedTimes : defaultFeedTimes(freq);
  const feeds = times.map((t, i) => ({ no: i+1, time: t, milkType: '', status:'pending', deliveredAt:'', fedAt:'', fedBy:'' }));

  if (milkType === 'NPO') {
    feeds.forEach(f => f.milkType = 'NPO');
    return feeds;
  }
  const isMixed = milkType.includes('/') || milkType.includes('สลับ') ||
                  milkType.includes('DBM') && milkType.includes('นมแม่');
  if (!isMixed) {
    // pure BM or pure FM
    if (limitBM && limitBMFeeds > 0 && milkType.includes('นมแม่')) {
      feeds.forEach((f,i) => f.milkType = i < limitBMFeeds ? 'นมแม่' : 'นมผสม');
    } else {
      feeds.forEach(f => f.milkType = milkType);
    }
    return feeds;
  }
  // mixed: alternate BM/FM starting BM
  // If limitBM: first limitBMFeeds = BM, rest = FM
  if (limitBM && limitBMFeeds > 0) {
    feeds.forEach((f,i) => f.milkType = i < limitBMFeeds ? 'นมแม่' : 'นมผสม');
  } else {
    // half & half alternating
    feeds.forEach((f,i) => f.milkType = i % 2 === 0 ? 'นมแม่' : 'นมผสม');
  }
  return feeds;
}

function defaultFeedTimes(freq) {
  const start = 6; // 06:00
  const interval = 24 / freq;
  return Array.from({length:freq}, (_,i) => {
    const h = (start + i * interval) % 24;
    return String(Math.floor(h)).padStart(2,'0') + ':00';
  });
}

/* Formula dropdowns */
const FORMULA_BM = [
  'NPO/งดน้ำงดอาหาร',
  'นมแม่ (20 kcal/oz)',
  'นมแม่/DBM (20 kcal/oz)',
  'นมแม่/DBM (20 kcal/oz) 27 ml + Con. PF1 (2 kcal/mL) 3 mL (24 kcal/oz)',
  'นมแม่/DBM (20 kcal/oz) 27 ml + Con. PF1 (2 kcal/mL) 3 mL (24 kcal/oz) + MCT oil 0.5 mL/oz (28 kcal/oz)',
  'นมแม่/DBM (20 kcal/oz) 28.5 ml + Conc. PF1 (2kcal/ml) 1.5 ml (22 kcal/oz)',
  'นมแม่/DBM (20kcal/oz) 24.5 ml + Conc. PF1 5.5 ml (27.3kcal/oz)',
  'นมแม่ (20 kcal/oz) 27 ml + Con. PF1 (2kcal/ml) 3 ml (24 kcal/oz)',
  'นมแม่ (20 kcal/oz) 28.5 ml + Conc. PF1 (2kcal/ml) 1.5 ml (22 kcal/oz)',
  'นมแม่ (20kcal/oz) 24.5 ml + Conc. PF1 5.5 ml (27.3kcal/oz)',
  'นมแม่ (20 kcal/oz) 27 ml + Con. PF1 (2 kcal/mL) 3 mL (24 kcal/oz) + MCT oil 0.5 ml/oz (28 kcal/Oz)',
  'DBM (20kcal/oz)',
  'DBM (20kcal/oz) 27 ml + Con. PF1 (2 kcal/mL) 3 mL (24 kcal/oz)',
  'นมแม่/DBM (20 kcal/oz) 24.5 ml + Con. PF1 (2 kcal/mL) 5.5 mL (27.3 kcal/oz)',
  'เติม นมแม่/DBM (20 kcal/Oz) 3 ml ใน SF x 8 feeds',
  'นมแม่ (20 kcal/oz.) รับมื้อ 9 น.',
];
const FORMULA_FM = [
  '', // ไม่มีนมเสริม
  '/ Infant formula (IF) (20 kcal/oz)',
  '/ Premature formula (PF1) (24 kcal/oz)',
  '/ PF1 (24 kcal/oz) + MCT oil 0.5 mL/oz at ward (28 kcal/oz)',
  '/ PF2 (22 kcal/oz)',
  '/ NAN LF(20 kcal/oz)',
  '/ Nutramigen (20 kcal/oz)',
  '/ Infatrini (30 kcal/oz)',
  '/S26 gold pro HA',
  '/Infant formula (20 kcal/oz)(S26 gold pro HA)',
];
const ROUTES     = ['Bottle','Tube feed gavage','Tube feed drip','Cup feeding','Bag for SF'];
const RELIGIONS  = ['พุทธ','คริสต์','อิสลาม','พราหมณ์-ฮินดู','ไม่ระบุ'];
const DEL_REASONS= ['ย้ายแผนก','จำหน่าย','เสียชีวิต','อื่นๆ'];
const ROOMS = [
  ...Array.from({length:5},(_,i)=>`NICU01-0${i+1}`),
  ...Array.from({length:10},(_,i)=>`NICU02-${String(i+1).padStart(2,'0')}`),
  ...Array.from({length:2},(_,i)=>`NICU03-0${i+1}`),
  ...Array.from({length:6},(_,i)=>`NICU04-0${i+1}`),
  ...Array.from({length:5},(_,i)=>`NICU05-0${i+1}`),
];

/* Available feed time slots */
const FEED_SLOT_OPTIONS = ['03:00','06:00','09:00','12:00','15:00','18:00','21:00','00:00'];
