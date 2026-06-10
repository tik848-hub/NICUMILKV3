# ระบบนม NICU v3 — GitHub Pages + Google Sheets

## URL 2 หน้า (แยกบุคลากร)

| URL | ใช้สำหรับ | หน้าที่มี |
|-----|---------|---------|
| `https://USERNAME.github.io/REPO/nicu/` | บุคลากร NICU | ภาพรวม · ลงทะเบียน · สั่งนม · Approve · ผลิต · Feed |
| `https://USERNAME.github.io/REPO/nutrition/` | โภชนาการ | ภาพรวม · ผลิต |

---

## ขั้นตอนที่ 1 — ตั้งค่า Google Sheets + Apps Script

### 1.1 สร้าง Google Sheet ใหม่
1. ไปที่ [sheets.google.com](https://sheets.google.com) → สร้างชีทใหม่
2. คัดลอก **Spreadsheet ID** จาก URL:
   `https://docs.google.com/spreadsheets/d/**[COPY THIS ID]**/edit`

### 1.2 Deploy Apps Script
1. ใน Google Sheet → **Extensions → Apps Script**
2. ลบโค้ดเดิม → วางโค้ดจากไฟล์ `gas/Code.gs`
3. แทนที่ `YOUR_SPREADSHEET_ID` ด้วย ID จากขั้นตอน 1.1
4. รัน function `setupSheets()` ครั้งเดียว (สร้าง Sheet headers)
5. **Deploy → New deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. คัดลอก **Web App URL**

### 1.3 วาง URL ใน shared/db.js
```javascript
const GAS_URL = 'https://script.google.com/macros/s/YOUR_ID/exec';
```

---

## ขั้นตอนที่ 2 — Deploy บน GitHub Pages

```bash
# 1. สร้าง repo ใหม่บน GitHub (Public)
# 2. Upload ไฟล์ทั้งหมด (รวม icons/, shared/, nicu/, nutrition/, gas/)
git init && git add . && git commit -m "NICU Milk v3"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main

# 3. Settings → Pages → Source: main / root → Save
```

---

## โครงสร้างไฟล์

```
nicu-milk-v3/
├── nicu/
│   ├── index.html        ← NICU staff app
│   └── app.js
├── nutrition/
│   ├── index.html        ← Nutrition app
│   └── app.js
├── shared/
│   ├── db.js             ← Google Sheets layer (แก้ GAS_URL ที่นี่)
│   └── style.css
├── gas/
│   └── Code.gs           ← วางใน Google Apps Script
├── icons/                ← App icons
├── manifest-nicu.json
├── manifest-nutrition.json
└── sw.js                 ← Service Worker
```

---

## ฟีเจอร์ v3

### QR Code ป้ายข้อมือ
- รูปแบบ HN ที่รองรับ: `C2645562`, `A00C2645562`, หรือ text ที่มี HN อยู่ด้วย
- สแกน → ระบบ match กับ HN ในฐานข้อมูลอัตโนมัติ

### คำสั่งนมแบบผสม (ข้อ 4.1)
- **นมแม่ จำกัด N มื้อ**: มื้อที่ 1-N = นมแม่, ที่เหลือ = นมผสม
- **นมแม่ 4 มื้อ + นมผสม 4 มื้อ**: สลับ BM/FM อัตโนมัติ
- แสดงชนิดนมแต่ละมื้อชัดเจนบนบัตรนม (🍼 BM / 🥛 FM)

### Bottle +20% (ข้อ 4.2)
- คำนวณอัตโนมัติ: ปริมาณ × 1.20 → ปัดขึ้นให้ลงท้าย 0 หรือ 5
- แสดงในบัตรนมและบนหน้าคำสั่ง

### ลบผู้ป่วย (ข้อ 3.2)
- บังคับเลือกเหตุผล (ย้ายแผนก / จำหน่าย / เสียชีวิต / อื่นๆ)
- บังคับระบุรหัสผู้ลบ 6 หลัก
- บันทึก log ใน Sheet `deletelog`

### Offline Support
- ใช้งานได้แม้ไม่มีอินเทอร์เน็ต (localStorage cache)
- sync กลับ Google Sheets เมื่อออนไลน์อัตโนมัติ

---

*FM-CNQIR-001 Rev.05 · NICU Milk v3.0 · โรงพยาบาลรามาธิบดีจักรีนฤบดินทร์*
