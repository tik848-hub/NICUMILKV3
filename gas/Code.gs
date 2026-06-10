/**
 * NICU Milk System v3 — Google Apps Script Backend
 * Deploy: Extensions → Apps Script → Deploy → Web App
 *   Execute as: Me | Who has access: Anyone
 * Copy the Web App URL → paste in shared/db.js as GAS_URL
 */

const SS_ID = '12iOYJtod2Ir4IL_LiZQxw5jx7o48mpa6_tRP6vcieYw';
const SS = SpreadsheetApp.openById(SS_ID);

/* ── Sheet names ── */
const SHEETS = {
  patients : 'patients',
  orders   : 'orders',
  milkcards: 'milkcards',
  deletelog: 'deletelog',
  stock    : 'stock',
};

/* ══════════════════════════════════════════
   HTTP entry points
══════════════════════════════════════════ */
function doGet(e) {
  const action = e.parameter.action || '';
  const sheet  = e.parameter.sheet  || '';
  try {
    if (action === 'getAll')    return ok(getAll(sheet));
    if (action === 'getDate')   return ok(getByDate(sheet, e.parameter.date));
    if (action === 'ping')      return ok({ status: 'ok', ts: new Date().toISOString() });
    return err('Unknown action: ' + action);
  } catch(ex) { return err(ex.toString()); }
}

function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action || '';
    if (action === 'upsert')    return ok(upsert(body.sheet, body.row));
    if (action === 'upsertMany')return ok(upsertMany(body.sheet, body.rows));
    if (action === 'delete')    return ok(deleteRow(body.sheet, body.id, body.log));
    return err('Unknown action: ' + action);
  } catch(ex) { return err(ex.toString()); }
}

function ok(data)  { return ContentService.createTextOutput(JSON.stringify({ ok:true,  data })).setMimeType(ContentService.MimeType.JSON); }
function err(msg)  { return ContentService.createTextOutput(JSON.stringify({ ok:false, error: msg })).setMimeType(ContentService.MimeType.JSON); }

/* ══════════════════════════════════════════
   Sheet helpers
══════════════════════════════════════════ */
function getSheet(name) {
  let sh = SS.getSheetByName(name);
  if (!sh) sh = SS.insertSheet(name);
  return sh;
}

function getAll(sheetName) {
  const sh = getSheet(sheetName);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function getByDate(sheetName, date) {
  return getAll(sheetName).filter(r => r.date === date);
}

function upsert(sheetName, row) {
  const sh = getSheet(sheetName);
  let headers = sh.getLastRow() > 0 ? sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0] : [];

  // Auto-create headers from row keys if sheet is empty
  if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
    headers = Object.keys(row);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  const values = headers.map(h => row[h] !== undefined ? row[h] : '');

  // Find existing row by id
  if (row.id) {
    const allData = sh.getDataRange().getValues();
    const idCol = headers.indexOf('id');
    for (let i = 1; i < allData.length; i++) {
      if (String(allData[i][idCol]) === String(row.id)) {
        sh.getRange(i+1, 1, 1, values.length).setValues([values]);
        return { action: 'updated', id: row.id };
      }
    }
  }
  sh.appendRow(values);
  return { action: 'inserted', id: row.id };
}

function upsertMany(sheetName, rows) {
  rows.forEach(r => upsert(sheetName, r));
  return { count: rows.length };
}

function deleteRow(sheetName, id, log) {
  const sh = getSheet(sheetName);
  if (sh.getLastRow() < 2) return { deleted: false };
  const allData = sh.getDataRange().getValues();
  const headers = allData[0];
  const idCol   = headers.indexOf('id');
  for (let i = allData.length - 1; i >= 1; i--) {
    if (String(allData[i][idCol]) === String(id)) {
      sh.deleteRow(i + 1);
      if (log) upsert('deletelog', log);
      return { deleted: true, id };
    }
  }
  return { deleted: false };
}

/* ══════════════════════════════════════════
   One-time setup: create all sheets with headers
══════════════════════════════════════════ */
function setupSheets() {
  const schema = {
    patients:  ['id','hn','room','firstName','lastName','dob','dobTime','religion','allergy','createdAt','updatedAt'],
    orders:    ['id','ptId','hn','date','milkType','formula','formulaFm','vol','freq','route','bottleExtra','bottleTotal','mouthCare','mouthCareFreq','breastFeed','limitBM','limitBMFeeds','feedSchedule','note','staffCode','status','approvedBy','approvedAt','rejectedReason','createdAt'],
    milkcards: ['id','orderId','ptId','hn','name','dob','room','formula','formulaFm','vol','route','freq','mouthCare','mouthCareFreq','date','feedsJson','qr','printedAt','nutritionReceived'],
    deletelog: ['id','sheet','recordId','reason','deletedBy','deletedAt'],
    stock:     ['id','type','owner','ptId','lot','vol','exp','received'],
  };
  Object.entries(schema).forEach(([name, headers]) => {
    const sh = getSheet(name);
    if (sh.getLastRow() === 0) sh.appendRow(headers);
    else sh.getRange(1,1,1,headers.length).setValues([headers]);
  });
  Logger.log('Setup complete');
}
