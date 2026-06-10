<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#115E59">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="NICU Milk">
  <link rel="manifest" href="../manifest-nicu.json">
  <link rel="icon" href="../icons/icon-192.png">
  <link rel="apple-touch-icon" href="../icons/icon-192.png">
  <title>ระบบนม NICU</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">
  <link rel="stylesheet" href="../shared/style.css">
  <style>:root{--header-bg:#115E59}</style>
</head>
<body>
<div id="app">

  <div id="offline-bar" class="offline-bar"><i class="ti ti-wifi-off"></i> ออฟไลน์ — บันทึกในเครื่อง รอ sync</div>

  <header class="header">
    <i class="ti ti-milk hdr-icon" aria-hidden="true"></i>
    <div class="hdr-titles">
      <div class="hdr-title">ระบบนม NICU</div>
      <div class="hdr-sub">รามาธิบดีจักรีนฤบดินทร์</div>
    </div>
    <div class="hdr-right">
      <span id="hdr-date" class="hdr-badge"></span>
      <span class="sync-dot" title="sync status"></span>
    </div>
  </header>

  <main class="main-content" role="main">

    <!-- ═══ DASHBOARD ═══ -->
    <section id="pg-dashboard" class="page">
      <div class="card">
        <div class="card-title"><i class="ti ti-chart-bar" aria-hidden="true"></i> Flow ประจำวัน</div>
        <div id="d-flow" style="display:flex;align-items:center;justify-content:space-between;padding:2px 0"></div>
      </div>
      <div class="metrics-2">
        <div class="metric t-amber"><div class="m-val amber" id="d-pend">—</div><div class="m-lbl">รอ Approve</div></div>
        <div class="metric t-blue"><div class="m-val blue" id="d-feeds">—</div><div class="m-lbl">รอ Feed</div></div>
      </div>
      <div class="metrics-2">
        <div class="metric t-teal"><div class="m-val teal" id="d-pts">—</div><div class="m-lbl">ผู้ป่วย</div></div>
        <div class="metric t-green"><div class="m-val green" id="d-appr">—</div><div class="m-lbl">Approved</div></div>
      </div>
      <div id="d-alerts"></div>
      <div class="sec-label">ผู้ป่วยทั้งหมด</div>
      <div class="card" style="padding:8px 12px"><div id="d-pt-list"></div></div>
    </section>

    <!-- ═══ REGISTER ═══ -->
    <section id="pg-register" class="page" aria-label="ลงทะเบียนผู้ป่วย">
      <div class="sec-label">ลงทะเบียน / แก้ไขผู้ป่วย</div>
      <div class="card">
        <form id="reg-form" onsubmit="event.preventDefault()">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="reg-hn">HN <span class="req">*</span></label>
              <input id="reg-hn" class="form-control" type="text" placeholder="เช่น C2645562" autocomplete="off">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-room">ห้อง <span class="req">*</span></label>
              <select id="reg-room" class="form-control"><option value="">-- เลือก --</option></select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="reg-first">ชื่อ <span class="req">*</span></label>
              <input id="reg-first" class="form-control" type="text">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-last">นามสกุล</label>
              <input id="reg-last" class="form-control" type="text">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="reg-dob">วัน/เดือน/ปีเกิด <span class="req">*</span></label>
              <input id="reg-dob" class="form-control" type="text" placeholder="22/04/69">
              <div id="reg-age-display" class="form-hint" style="color:var(--teal-700);font-weight:500;min-height:16px"></div>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-dobtime">เวลาเกิด</label>
              <input id="reg-dobtime" class="form-control" type="text" placeholder="14:30">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="reg-religion">ศาสนา</label>
              <select id="reg-religion" class="form-control">
                <option>พุทธ</option><option>คริสต์</option><option>อิสลาม</option>
                <option>พราหมณ์-ฮินดู</option><option>ไม่ระบุ</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-allergy">แพ้ยา/อาหาร</label>
              <input id="reg-allergy" class="form-control" type="text" placeholder="NKA">
            </div>
          </div>
          <button type="button" class="btn btn-primary btn-block" onclick="savePt()">
            <i class="ti ti-user-plus" aria-hidden="true"></i> บันทึกข้อมูลผู้ป่วย
          </button>
        </form>
        <div id="reg-result" class="result-box"></div>
      </div>
      <div class="sec-label">รายชื่อผู้ป่วยทั้งหมด</div>
      <div class="card" style="padding:8px 12px"><div id="reg-pt-list"></div></div>
    </section>

    <!-- ═══ ORDER ═══ -->
    <section id="pg-order" class="page" aria-label="คำสั่งนม">
      <div class="sec-label">คีย์คำสั่งนม</div>
      <div class="card">
        <form id="ord-form" onsubmit="event.preventDefault()">
          <div class="form-group">
            <label class="form-label" for="ord-patient">ผู้ป่วย <span class="req">*</span></label>
            <select id="ord-patient" class="form-control"><option value="">-- เลือกผู้ป่วย --</option></select>
          </div>
          <div id="ord-pt-info" style="display:none;background:var(--teal-50);border:1px solid var(--teal-100);border-radius:var(--r-sm);padding:8px 11px;margin-bottom:10px;font-size:12.5px">
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:3px">
              <span><b>HN:</b> <span id="ord-pt-hn"></span></span>
              <span><b>ชื่อ:</b> <span id="ord-pt-name"></span></span>
              <span><b>ห้อง:</b> <span id="ord-pt-room"></span></span>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <span><b>อายุ:</b> <span id="ord-pt-age"></span></span>
              <span><b>แพ้:</b> <span id="ord-pt-alg" style="font-weight:600"></span></span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="ord-bm">สูตรนมแม่ / หลัก <span class="req">*</span></label>
            <select id="ord-bm" class="form-control"></select>
          </div>
          <div class="form-group">
            <label class="form-label" for="ord-fm">นมผสม / เสริม</label>
            <select id="ord-fm" class="form-control"></select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="ord-vol">ปริมาณ/มื้อ (mL) <span class="req">*</span></label>
              <input id="ord-vol" class="form-control" type="number" min="1" max="300" placeholder="30">
            </div>
            <div class="form-group">
              <label class="form-label" for="ord-freq">จำนวนมื้อ/วัน</label>
              <input id="ord-freq" class="form-control" type="number" min="1" max="24" value="8">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="ord-route">Route <span class="req">*</span></label>
            <select id="ord-route" class="form-control"></select>
          </div>
          <div id="ord-bottle-info" class="form-info" style="display:none">
            <i class="ti ti-calculator" aria-hidden="true"></i> Bottle: คำนวณเบิก +20% ลงท้าย 5 หรือ 0
          </div>
          <div id="ord-total" style="font-size:13px;color:var(--teal-700);font-weight:600;margin-bottom:10px;min-height:18px"></div>

          <!-- Feed time selector -->
          <div class="form-group">
            <label class="form-label">เวลามื้อนม</label>
            <div class="time-chips" id="ord-time-chips"></div>
            <div class="form-hint" id="ord-time-hint">ไม่เลือก = ระบบจัดสรรอัตโนมัติ 8 มื้อ</div>
          </div>

          <!-- Special orders -->
          <div style="font-size:12px;font-weight:600;color:var(--text-2);margin-bottom:6px">คำสั่งพิเศษ</div>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="ord-mc" style="width:16px;height:16px;accent-color:var(--teal-600)">
            Mouth care นมแม่ 0.2 mL
            <select id="ord-mc-freq" class="form-control" style="width:auto;font-size:12px;padding:4px 8px">
              <option>q 3 h</option><option>q 6 h</option>
            </select>
          </label>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="ord-bf" style="width:16px;height:16px;accent-color:var(--teal-600)">
            Breast feeding
          </label>
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="ord-limit-bm" style="width:16px;height:16px;accent-color:var(--teal-600)">
            จำกัดนมแม่
          </label>
          <div id="ord-limit-bm-row" style="display:none;padding-left:24px;margin-bottom:8px">
            <div style="display:flex;align-items:center;gap:8px;font-size:13px">
              <input id="ord-limit-bm-n" class="form-control" type="number" style="width:70px;padding:5px 8px" min="1" max="24" value="2">
              <span style="font-size:12px;color:var(--text-3)">มื้อ/วัน (ที่เหลือเป็นนมผสม)</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="ord-note">หมายเหตุ</label>
            <textarea id="ord-note" class="form-control" rows="2" placeholder="คำสั่งเพิ่มเติม..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="ord-staff">รหัสบุคลากร 6 หลัก <span class="req">*</span></label>
            <input id="ord-staff" class="form-control" type="text" maxlength="6" inputmode="numeric" placeholder="xxxxxx">
            <div class="form-hint">ผู้คีย์คัดลอกคำสั่งนม</div>
          </div>
          <button type="button" class="btn btn-primary btn-block" onclick="submitOrder()">
            <i class="ti ti-send" aria-hidden="true"></i> ส่งคำสั่งนม
          </button>
        </form>
        <div id="ord-result" class="result-box"></div>
      </div>
      <div class="sec-label">คำสั่งนมวันนี้</div>
      <div class="card" style="padding:8px 12px"><div id="ord-list"></div></div>
    </section>

    <!-- ═══ APPROVE ═══ -->
    <section id="pg-approve" class="page" aria-label="Approve คำสั่งนม">
      <div class="metrics-3">
        <div class="metric t-amber"><div class="m-val amber" id="apv-pend">—</div><div class="m-lbl">รอตรวจ</div></div>
        <div class="metric t-green"><div class="m-val green" id="apv-appr">—</div><div class="m-lbl">Approved</div></div>
        <div class="metric t-red"><div class="m-val red" id="apv-rej">—</div><div class="m-lbl">Rejected</div></div>
      </div>
      <div class="alert al-teal"><i class="ti ti-shield-check" aria-hidden="true"></i>
        <div><div class="al-title">Incharge Nurse / หัวหน้าหน่วย</div><div class="al-body">ตรวจสอบ Approve คำสั่งนมก่อนส่งห้องโภชนาการ</div></div>
      </div>
      <div id="apv-list"></div>
    </section>

    <!-- ═══ PRODUCE ═══ -->
    <section id="pg-produce" class="page" aria-label="ผลิตนม">
      <div class="alert al-blue"><i class="ti ti-building-store" aria-hidden="true"></i>
        <div><div class="al-title">ข้อมูลนี้ส่งต่อห้องโภชนาการ</div><div class="al-body">คำสั่ง Approved จะแสดงในหน้าโภชนาการด้วย</div></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div class="sec-label" style="margin:0">Approved วันนี้ (<span id="prod-count">—</span>)</div>
      </div>
      <div id="prod-list"></div>
      <div id="prod-cards-section" style="display:none">
        <div style="display:flex;align-items:center;justify-content:space-between;margin:10px 0 8px">
          <div class="sec-label" style="margin:0">บัตรนม 8 ใบ/ผู้ป่วย</div>
          <button class="btn btn-primary btn-sm" onclick="printCards()"><i class="ti ti-printer" aria-hidden="true"></i> Print A4</button>
        </div>
        <div id="prod-card-grid" class="milk-card-grid"></div>
      </div>
    </section>

    <!-- ═══ FEED ═══ -->
    <section id="pg-feed" class="page" aria-label="Feed นม">
      <div class="card">
        <div class="card-title">
          <i class="ti ti-milk" aria-hidden="true"></i> รายการบัตรนมวันนี้
          <span id="feed-count" class="badge b-amber" style="margin-left:auto">—</span>
        </div>
        <div id="feed-queue"></div>
      </div>

      <!-- QR scan panel -->
      <div id="feed-scanner" style="display:none">
        <div class="card">
          <div style="text-align:center;margin-bottom:8px">
            <div style="font-size:14px;font-weight:600" id="feed-scan-name">—</div>
            <div style="font-size:12.5px;color:var(--text-2)" id="feed-scan-detail">—</div>
            <div style="font-size:12px;color:var(--teal-700);font-weight:600;margin-top:3px" id="feed-scan-feed">—</div>
          </div>
          <div class="step-row">
            <div class="step-node step-done" id="feed-s1"><div class="step-circle"><i class="ti ti-truck-delivery" aria-hidden="true"></i></div><div class="step-text">รับนม</div></div>
            <div class="step-line"></div>
            <div class="step-node step-done" id="feed-s2"><div class="step-circle"><i class="ti ti-id-badge" aria-hidden="true"></i></div><div class="step-text">ป้ายข้อมือ</div></div>
            <div class="step-line"></div>
            <div class="step-node step-active" id="feed-s3"><div class="step-circle"><i class="ti ti-qrcode" aria-hidden="true"></i></div><div class="step-text">สแกน QR</div></div>
            <div class="step-line"></div>
            <div class="step-node step-pending" id="feed-s4"><div class="step-circle"><i class="ti ti-check" aria-hidden="true"></i></div><div class="step-text">Feed</div></div>
          </div>
          <div id="feed-scan-start">
            <button class="btn btn-primary btn-block" onclick="openFeedCamera()" style="font-size:15px;padding:13px">
              <i class="ti ti-camera" aria-hidden="true"></i> เปิดกล้องสแกน QR ป้ายข้อมือ
            </button>
            <p style="font-size:11.5px;color:var(--text-3);text-align:center;margin-top:6px">
              สแกน QR code บนป้ายข้อมือผู้ป่วย (เช่น A00C2645501)
            </p>
          </div>
          <div id="feed-cam-view" style="display:none">
            <div class="qr-wrap">
              <video id="feed-video" class="qr-video" autoplay playsinline muted aria-label="กล้อง QR"></video>
              <div class="qr-shadow"></div>
              <div style="position:absolute;inset:0;pointer-events:none">
                <div class="qr-corner qr-tl"></div><div class="qr-corner qr-tr"></div>
                <div class="qr-corner qr-bl"></div><div class="qr-corner qr-br"></div>
                <div class="qr-line"></div>
              </div>
              <canvas id="feed-canvas" style="display:none"></canvas>
            </div>
            <div style="text-align:center;margin-top:8px;font-size:12.5px;color:var(--text-2)">จ่อ QR ป้ายข้อมือให้อยู่ในกรอบ — อ่านอัตโนมัติ</div>
            <div style="text-align:center;margin-top:8px">
              <button class="btn btn-sm" onclick="cancelFeedScan()"><i class="ti ti-x" aria-hidden="true"></i> ยกเลิก</button>
            </div>
          </div>
          <div id="feed-scan-result" class="result-box"></div>
        </div>
      </div>
    </section>

  </main>

  <nav class="bottom-nav" aria-label="เมนูหลัก">
    <button class="nav-item active" id="nv-dashboard" onclick="showPage('dashboard')" aria-label="ภาพรวม">
      <i class="ti ti-layout-dashboard" aria-hidden="true"></i><span>ภาพรวม</span>
    </button>
    <button class="nav-item" id="nv-register" onclick="showPage('register')" aria-label="ลงทะเบียน">
      <i class="ti ti-user-plus" aria-hidden="true"></i><span>ลงทะเบียน</span>
    </button>
    <button class="nav-item" id="nv-order" onclick="showPage('order')" aria-label="คำสั่งนม">
      <i class="ti ti-clipboard-plus" aria-hidden="true"></i><span>สั่งนม</span>
    </button>
    <button class="nav-item" id="nv-approve" onclick="showPage('approve')" aria-label="Approve">
      <i class="ti ti-shield-check" aria-hidden="true"></i><span>Approve</span>
      <span class="nav-badge" id="nv-approve-badge" style="display:none">0</span>
    </button>
    <button class="nav-item" id="nv-produce" onclick="showPage('produce')" aria-label="ผลิต">
      <i class="ti ti-printer" aria-hidden="true"></i><span>ผลิต</span>
    </button>
    <button class="nav-item" id="nv-feed" onclick="showPage('feed')" aria-label="Feed">
      <i class="ti ti-milk" aria-hidden="true"></i><span>Feed</span>
      <span class="nav-badge" id="nv-feed-badge" style="display:none">0</span>
    </button>
  </nav>
</div>

<!-- Modals -->
<div id="modal-del-pt" class="modal-overlay" onclick="if(event.target===this)_closeModal()">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-title">ลบผู้ป่วย</div>
    <input type="hidden" id="del-pt-id">
    <div style="font-size:14px;font-weight:600;margin-bottom:10px" id="del-pt-name"></div>
    <div class="form-group">
      <label class="form-label" for="del-pt-reason">เหตุผล <span class="req">*</span></label>
      <select id="del-pt-reason" class="form-control">
        <option value="">-- เลือกเหตุผล --</option>
        <option>ย้ายแผนก</option><option>จำหน่าย</option><option>เสียชีวิต</option><option>อื่นๆ</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label" for="del-pt-by">รหัสผู้ลบ 6 หลัก <span class="req">*</span></label>
      <input id="del-pt-by" class="form-control" type="text" maxlength="6" inputmode="numeric" placeholder="xxxxxx">
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1" onclick="_closeModal()">ยกเลิก</button>
      <button class="btn btn-danger" style="flex:1" onclick="confirmDelPt()"><i class="ti ti-trash" aria-hidden="true"></i> ยืนยันลบ</button>
    </div>
  </div>
</div>

<div id="modal-approve" class="modal-overlay" onclick="if(event.target===this)_closeModal()">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-title">Approve คำสั่งนม</div>
    <input type="hidden" id="apv-order-id">
    <div class="form-group">
      <label class="form-label" for="apv-staff">รหัสบุคลากร Incharge 6 หลัก <span class="req">*</span></label>
      <input id="apv-staff" class="form-control" type="text" maxlength="6" inputmode="numeric" placeholder="xxxxxx">
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1" onclick="_closeModal()">ยกเลิก</button>
      <button class="btn btn-primary" style="flex:1" onclick="submitApprove()"><i class="ti ti-check" aria-hidden="true"></i> Approve</button>
    </div>
  </div>
</div>

<div id="modal-reject" class="modal-overlay" onclick="if(event.target===this)_closeModal()">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-title">Reject คำสั่งนม</div>
    <input type="hidden" id="rej-order-id">
    <div class="form-group">
      <label class="form-label" for="rej-reason">เหตุผล <span class="req">*</span></label>
      <textarea id="rej-reason" class="form-control" rows="3" placeholder="ระบุเหตุผล..."></textarea>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn" style="flex:1" onclick="_closeModal()">ยกเลิก</button>
      <button class="btn btn-danger" style="flex:1" onclick="submitReject()"><i class="ti ti-x" aria-hidden="true"></i> Reject</button>
    </div>
  </div>
</div>

<div id="toast" class="toast" role="alert" aria-live="polite"></div>

<script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
<script src="../shared/db.js"></script>
<script src="app.js"></script>
</body>
</html>
