/* ============================================================
   NICU Milk v3 — nutrition/app.js
   Pages: dashboard · produce  (โภชนาการ)
   ============================================================ */
'use strict';

let _page = 'dashboard';
let _ageTimers = [];

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
let _syncState = 'ok';
function _setSyncDot(state) {
  _syncState = state;
  document.querySelectorAll('.sync-dot').forEach(d => {
    d.className = 'sync-dot' + (state==='syncing'?' syncing':state==='error'?' error':'');
  });
}
async function _initSync() {
  _setSyncDot('syncing');
  try {
    await Promise.all([Patients.refresh(), Orders.refresh(todayStr()), MilkCards.refresh(todayStr())]);
    _setSyncDot('ok'); _renderPage(_page);
  } catch { _setSyncDot('error'); }
}

function showPage(id) {
  _stopAgeTimers();
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
  document.getElementById('pg-'+id)?.classList.add('active');
  document.getElementById('nv-'+id)?.classList.add('active');
  _page=id; _renderPage(id);
}
function _renderPage(id) {
  if (id==='dashboard') _renderDashboard();
  else if (id==='produce') _renderProducePage();
}
function _stopAgeTimers() { _ageTimers.forEach(clearInterval); _ageTimers=[]; }
function _startAgeEl(el, dob, dobTime) {
  const upd = () => { const a=calcAge(dob,dobTime); if(el)el.textContent=a.label; };
  upd(); _ageTimers.push(setInterval(upd,60000));
}
function toast(msg,dur=2800) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),dur);
}

/* ══════════════════════════════════════════
   DASHBOARD (nutrition view)
══════════════════════════════════════════ */
function _renderDashboard() {
  const today  = todayStr();
  const orders = Orders.forDate(today);
  const appr   = orders.filter(o=>o.status==='approved').length;
  const cards  = MilkCards.forDate(today);
  const pts    = Patients.all();

  document.getElementById('d-pts').textContent    = pts.length;
  document.getElementById('d-appr').textContent   = appr;
  document.getElementById('d-printed').textContent = cards.filter(m=>m.printedAt).length;
  document.getElementById('d-total').textContent  = orders.length;

  // Flow (simplified for nutrition)
  const flowItems = [
    { label:'คำสั่งทั้งหมด', val:orders.length,  icon:'ti-clipboard-list', done:orders.length>0 },
    { label:'Approved',      val:appr,            icon:'ti-shield-check',   done:appr>0 },
    { label:'ผลิตแล้ว',      val:cards.length,    icon:'ti-printer',        done:cards.length>0 },
  ];
  document.getElementById('d-flow').innerHTML = flowItems.map((s,i)=>`
    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1">
      <div style="width:40px;height:40px;border-radius:50%;background:${s.done?'var(--orange-500)':'var(--gray-100)'};display:flex;align-items:center;justify-content:center;color:${s.done?'#fff':'var(--text-3)'};font-size:18px">
        <i class="ti ${s.icon}" aria-hidden="true"></i></div>
      <div style="font-size:17px;font-weight:700;color:${s.done?'var(--orange-500)':'var(--text-3)'}">${s.val}</div>
      <div style="font-size:10px;color:var(--text-3);text-align:center">${s.label}</div>
    </div>
    ${i<flowItems.length-1?'<div style="width:20px;height:2px;background:var(--border);margin-bottom:20px;flex-shrink:0"></div>':''}`).join('');

  const alerts=[];
  if (appr>0 && cards.length<appr) alerts.push(`<div class="alert al-amber"><i class="ti ti-clock" aria-hidden="true"></i><div><div class="al-title">รอผลิต ${appr-cards.length} รายการ</div><div class="al-body">กดหน้าผลิตเพื่อรับคำสั่งและ print บัตรนม</div></div></div>`);
  if (!alerts.length) alerts.push(`<div class="alert al-green"><i class="ti ti-circle-check" aria-hidden="true"></i><div><div class="al-title">ทุกรายการผลิตแล้ว</div></div></div>`);
  document.getElementById('d-alerts').innerHTML = alerts.join('');

  // Summary table of approved orders
  const listEl = document.getElementById('d-order-list');
  const approvedOrders = orders.filter(o=>o.status==='approved');
  if (!approvedOrders.length) { listEl.innerHTML='<div style="text-align:center;padding:1.5rem;color:var(--text-3)">ยังไม่มีคำสั่งนม Approved วันนี้</div>'; return; }
  listEl.innerHTML = approvedOrders.map(o=>{
    const p = Patients.find(o.ptId);
    const hasMC = MilkCards.forOrder(o.id).length>0;
    const ageEl = p ? `<span id="age-d-${p.id}"></span>` : '—';
    return `<div class="list-row">
      <div class="avatar" style="background:var(--orange-50);color:var(--orange-800);border-color:var(--orange-500)">${p?.firstName?.charAt(0)||'?'}</div>
      <div class="row-body">
        <div class="row-title">${p?p.firstName+' '+p.lastName:'—'} <span style="font-size:11px;color:var(--text-3)">· HN: ${o.hn}</span></div>
        <div class="row-sub">${p?.room||''} · ${ageEl}</div>
        <div class="row-hint">${o.formula}${o.formulaFm?' '+o.formulaFm:''}<br>${o.vol} mL × ${o.freq} มื้อ · ${o.route}${o.route==='Bottle'?` · ขวดละ ${o.bottleTotal||o.vol} mL`:''}</div>
      </div>
      <span class="chip ${hasMC?'chip-delivered':'chip-approved'}">${hasMC?'✓ ผลิตแล้ว':'รอผลิต'}</span>
    </div>`;
  }).join('');

  approvedOrders.forEach(o=>{ const p=Patients.find(o.ptId); if(p){ const el=document.getElementById('age-d-'+p.id); if(el)_startAgeEl(el,p.dob,p.dobTime); }});
}

/* ══════════════════════════════════════════
   PRODUCE (nutrition)
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
    let feedPreview='';
    try {
      const fs=JSON.parse(o.feedSchedule||'[]');
      feedPreview=`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px">${fs.map(f=>`
        <div style="display:flex;align-items:center;gap:3px;background:${f.milkType?.includes('นมแม่')?'var(--teal-50)':'var(--blue-50)'};border:1px solid ${f.milkType?.includes('นมแม่')?'var(--teal-100)':'var(--blue-100)'};border-radius:4px;padding:2px 6px;font-size:10.5px;">
          <span style="font-weight:600;color:${f.milkType?.includes('นมแม่')?'var(--teal-800)':'var(--blue-800)'}">${f.time}</span>
          <span style="color:${f.milkType?.includes('นมแม่')?'var(--teal-700)':'var(--blue-700)'}">${f.milkType?.includes('นมแม่')?'🍼BM':'🥛FM'}</span>
        </div>`).join('')}</div>`;
    } catch {}
    return `<div class="card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px">
        <div>
          <div style="font-size:14px;font-weight:600">${p?p.firstName+' '+p.lastName:'—'}</div>
          <div style="font-size:12px;color:var(--text-2)">HN: ${o.hn} · ${p?.room||''}</div>
        </div>
        <span class="chip ${printed?'chip-delivered':'chip-approved'}">${printed?'✓ พิมพ์แล้ว':'รอผลิต'}</span>
      </div>
      <div style="background:var(--gray-50);border-radius:var(--r-sm);padding:8px 10px;margin-bottom:6px;font-size:12.5px;line-height:1.7">
        <div><b>สูตร:</b> ${o.formula}${o.formulaFm?' '+o.formulaFm:''}</div>
        <div><b>ปริมาณ:</b> ${o.vol} mL × ${o.freq} มื้อ/วัน · <b>Route:</b> ${o.route}${o.route==='Bottle'?` · ขวดละ <b>${o.bottleTotal||o.vol} mL</b>`:''}</div>
        ${o.mouthCare?`<div><b>Mouth care:</b> BM 0.2 mL ${o.mouthCareFreq}</div>`:''}
        ${feedPreview}
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" style="flex:1;background:var(--orange-500);border-color:var(--orange-800)" onclick="receiveAndPrint('${o.id}')">
          <i class="ti ti-printer" aria-hidden="true"></i> รับเข้า + Print บัตรนม
        </button>
        ${printed?`<button class="btn" style="flex:1" onclick="viewCards('${o.id}')"><i class="ti ti-eye" aria-hidden="true"></i> ดูบัตรนม</button>`:''}
      </div>
    </div>`;
  }).join('');
}

function receiveAndPrint(orderId) {
  const o=Orders.find(orderId); if(!o) return;
  const p=Patients.find(o.ptId); if(!p) return;
  const existing=MilkCards.forOrder(orderId);
  let feedSchedule; try { feedSchedule=JSON.parse(o.feedSchedule||'[]'); } catch { feedSchedule=[]; }
  if (!feedSchedule.length) feedSchedule=allocateFeeds({freq:o.freq,milkType:o.formula,limitBM:o.limitBM,limitBMFeeds:parseInt(o.limitBMFeeds)||0,feedTimes:defaultFeedTimes(parseInt(o.freq)||8)});
  let mc;
  if (existing.length){ mc=existing[0]; mc.printedAt=nowTs(); }
  else { mc={id:uid(),orderId,ptId:o.ptId,hn:o.hn,name:p.firstName+' '+p.lastName,dob:p.dob,room:p.room,formula:o.formula,formulaFm:o.formulaFm||'',vol:o.vol,route:o.route,freq:parseInt(o.freq)||8,mouthCare:o.mouthCare,mouthCareFreq:o.mouthCareFreq,date:todayStr(),feeds:feedSchedule,qr:p.hn,printedAt:nowTs(),nutritionReceived:true}; }
  MilkCards.save(mc);
  toast('✓ บัตรนม '+p.firstName+' · '+mc.freq+' ใบ');
  _renderProducePage(); viewCards(orderId);
}

function viewCards(orderId) {
  const cards=MilkCards.forOrder(orderId); if(!cards.length) return;
  const mc=cards[0]; const feeds=MilkCards.getFeeds(mc);
  const p=Patients.find(mc.ptId); const age=calcAge(mc.dob);
  const section=document.getElementById('prod-cards-section');
  const grid=document.getElementById('prod-card-grid');
  grid.innerHTML=feeds.map(f=>{
    const isBM=f.milkType?.includes('นมแม่');
    const typeCls=f.milkType?.includes('นมแม่')?'mc-type-bm':f.milkType==='NPO'?'mc-type-npo':'mc-type-fm';
    const qrPat=[1,1,1,0,1,1,0,1,0,0,0,1,1,1,0,1,0,1,1,0,0,0,1,0,1];
    const qrHtml=`<div class="qr-block">${qrPat.map(v=>`<div class="qr-px" style="background:${v?'#000':'#fff'}"></div>`).join('')}</div>`;
    return `<div class="milk-card">
      <div class="mc-header"><span>วันที่ ${mc.date}</span><span>มื้อที่ ${f.no}</span></div>
      <div class="mc-hn">HN: ${mc.hn}</div>
      <div style="font-size:10.5px;color:var(--text-2)">${mc.name} · ${age.label}</div>
      <div style="font-size:9.5px;color:var(--text-3)">${mc.room} · ${mc.route}</div>
      <div class="mc-formula">${mc.formula}${mc.formulaFm?' '+mc.formulaFm:''}</div>
      <div style="font-size:10px;color:var(--text-2)">${mc.vol} mL${mc.route==='Bottle'?' (ขวดละ '+(calcBottleTotal(mc.vol))+' mL)':''}${mc.mouthCare?' + MC '+mc.mouthCareFreq:''}</div>
      <div class="mc-meal-row">
        <span class="mc-time">${f.time} น.</span>
        <span class="mc-type ${typeCls}">${f.milkType?.includes('นมแม่')?'🍼 BM':f.milkType==='NPO'?'NPO':'🥛 FM'}</span>
        <div style="display:flex;align-items:center;gap:3px">${qrHtml}<div class="mc-checkbox"></div></div>
      </div>
    </div>`;
  }).join('');
  section.style.display='block'; section.scrollIntoView({behavior:'smooth'});
}
function printCards() { window.print(); }

function _openModal(id) { document.getElementById(id)?.classList.add('show'); }
function _closeModal() { document.querySelectorAll('.modal-overlay').forEach(m=>m.classList.remove('show')); }
