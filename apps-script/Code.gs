/**
 * Code.gs — Backend de (gas)TITOS. Proyecto de Apps Script standalone
 * (no container-bound) que accede al Google Sheet vía
 * SpreadsheetApp.openById(SPREADSHEET_ID) y actúa como Web App. Mismo
 * patrón de auth que Comer.ar (verifyGoogleIdToken_ en F:\web\foodie\Code.gs),
 * pero acá TODO —lectura y escritura— exige un ID token válido y en la
 * whitelist de 2 emails, porque a diferencia de Comer.ar los datos son
 * privados.
 *
 * Pestañas: "Categories" (12 categorías + split default), "Expenses".
 *
 * Script Properties requeridas (Project Settings > Script Properties):
 *   GOOGLE_CLIENT_ID, WILSON_EMAIL, YANINA_EMAIL
 *
 * Setup post-deploy:
 *   1) Ejecutar forceAuth() UNA vez desde el editor (autoriza
 *      script.external_request para poder llamar a tokeninfo, y el acceso
 *      al Spreadsheet por SPREADSHEET_ID).
 *   2) Deploy > New deployment > Web app.
 *        Execute as: Me
 *        Who has access: Anyone
 *      (el control de acceso lo hace este script verificando el ID token
 *      de Google en cada request, no la capa de Apps Script — si se pone
 *      "Anyone with Google account" Apps Script intercepta el request
 *      antes de llegar acá y rompe el flujo de doPost).
 *
 * OJO al redeployar con `clasp deploy -i <id>` sobre un deployment ya
 * existente: clasp no siempre respeta el "access": "ANYONE" del
 * appsscript.json y puede resetear el deployment a "Anyone with Google
 * account". Después de cada `clasp deploy -i`, verificar manualmente en
 * Deploy > Manage deployments > Edit > "Who has access" que siga en
 * "Anyone" (si no, cambiarlo ahí y volver a apretar Deploy).
 */

var SPREADSHEET_ID = '1Kyr9F-KpQyLw226mVYUBVr2uPIBf0jb5GuRnBdOleWU';
var CATEGORIES_SHEET_NAME = 'Categories';
var EXPENSES_SHEET_NAME = 'Expenses';

var CATEGORIES_HEADERS = ['id', 'name', 'essential', 'splitWilson', 'splitYanina'];
var EXPENSES_HEADERS = [
  'id', 'date', 'categoryId', 'amount', 'paidBy',
  'splitWilson', 'splitYanina', 'essential', 'detail', 'note',
  'overridden', 'settled', 'settledAt', 'createdAt', 'createdBy'
];

var SEED_CATEGORIES = [
  ['hipotecario',   'Hipotecario',   true,  50, 50],
  ['expensas',      'Expensas',      true,  50, 50],
  ['luz',           'Luz',           true,  50, 50],
  ['gas',           'Gas',           true,  50, 50],
  ['internet',      'Internet',      true,  50, 50],
  ['super',         'Súper',         true,  50, 50],
  ['auto',          'Auto',          true,  50, 50],
  ['salud',         'Salud',         true,  50, 50],
  ['delivery',      'Delivery',      false, 50, 50],
  ['suscripciones', 'Suscripciones', false, 50, 50],
  ['salidas',       'Salidas',       false, 50, 50],
  ['otros',         'Otros',         false, 50, 50]
];

// =============================================
// Autorización — ejecutar UNA vez a mano desde el editor
// =============================================
function forceAuth() {
  var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=test', { muteHttpExceptions: true });
  Logger.log('forceAuth (external request) OK — HTTP ' + r.getResponseCode());
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log('forceAuth (spreadsheet access) OK — ' + ss.getName());
}

// =============================================
// Router
// =============================================
function doGet(e) {
  return sendJson_({ ok: true, service: 'TITOS API', hint: 'Usar POST con { action, credential, ... }' });
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var profile = verifyIdentity_(postData.credential);
    Logger.log('POST action=' + action + ' by=' + profile.email);

    switch (action) {
      case 'getData':
        return sendJson_(getFullDataset_());
      case 'addExpense':
        return sendJson_(addExpense_(postData.expense, profile));
      case 'updateCategoryDefaultSplit':
        return sendJson_(updateCategoryDefaultSplit_(postData.categoryId, postData.split));
      case 'settleUp':
        return sendJson_(settleUp_());
      case 'settleExpense':
        return sendJson_(settleExpense_(postData.expenseId, profile));
      default:
        throw new Error('Acción desconocida: ' + action);
    }
  } catch (error) {
    return sendJson_({ success: false, error: error.message || String(error) });
  }
}

// =============================================
// Auth — mismo mecanismo que verifyGoogleIdToken_ de Comer.ar
// =============================================
function getPeopleEmailMap_() {
  var props = PropertiesService.getScriptProperties();
  var map = {};
  map[String(props.getProperty('WILSON_EMAIL') || '').toLowerCase().trim()] = 'wilson';
  map[String(props.getProperty('YANINA_EMAIL') || '').toLowerCase().trim()] = 'yanina';
  return map;
}

function verifyGoogleIdToken_(credential) {
  if (!credential) throw new Error('Falta la sesión de Google. Iniciá sesión.');
  var clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  if (!clientId) throw new Error('Servidor mal configurado: GOOGLE_CLIENT_ID no seteado.');

  var url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential);
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) throw new Error('Sesión inválida o expirada. Volvé a iniciar sesión.');

  var info;
  try { info = JSON.parse(resp.getContentText()); } catch (e) { throw new Error('No se pudo validar la sesión.'); }

  if (String(info.aud) !== String(clientId)) throw new Error('Token no emitido para esta aplicación.');
  if (info.iss !== 'accounts.google.com' && info.iss !== 'https://accounts.google.com') throw new Error('Emisor de token inválido.');
  var now = Math.floor(Date.now() / 1000);
  if (info.exp && parseInt(info.exp, 10) < now) throw new Error('Sesión expirada. Volvé a iniciar sesión.');
  if (!info.email || (info.email_verified !== 'true' && info.email_verified !== true)) throw new Error('No se pudo verificar tu email de Google.');

  return { email: String(info.email).toLowerCase().trim(), name: info.name || info.email, picture: info.picture || '' };
}

function verifyIdentity_(credential) {
  var profile = verifyGoogleIdToken_(credential);
  var personId = getPeopleEmailMap_()[profile.email];
  if (!personId) throw new Error('Email no autorizado.');
  profile.personId = personId;
  return profile;
}

// =============================================
// Sheets — bootstrap y lectura
// =============================================
function getOrCreateSheet_(name, headers) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function buildColumnMap_(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    if (h) map[h] = i;
  }
  return map;
}

function getCategoriesSheet_() {
  var sheet = getOrCreateSheet_(CATEGORIES_SHEET_NAME, CATEGORIES_HEADERS);
  if (sheet.getLastRow() < 2) {
    sheet.getRange(2, 1, SEED_CATEGORIES.length, CATEGORIES_HEADERS.length).setValues(SEED_CATEGORIES);
  }
  return sheet;
}

function getExpensesSheet_() {
  return getOrCreateSheet_(EXPENSES_SHEET_NAME, EXPENSES_HEADERS);
}

function formatDateCell_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd');
  }
  return String(value);
}

function readCategories_() {
  var sheet = getCategoriesSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, CATEGORIES_HEADERS.length).getValues();
  var map = buildColumnMap_(CATEGORIES_HEADERS);
  return values.filter(function (row) { return row[map.id]; }).map(function (row) {
    return {
      id: String(row[map.id]).trim(),
      name: String(row[map.name]).trim(),
      essential: row[map.essential] === true || String(row[map.essential]).toUpperCase() === 'TRUE',
      defaultSplit: {
        wilson: Number(row[map.splitWilson]) || 0,
        yanina: Number(row[map.splitYanina]) || 0
      }
    };
  });
}

function readExpenses_() {
  var sheet = getExpensesSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, EXPENSES_HEADERS.length).getValues();
  var map = buildColumnMap_(EXPENSES_HEADERS);
  return values.filter(function (row) { return row[map.id]; }).map(function (row) {
    return {
      id: String(row[map.id]),
      date: formatDateCell_(row[map.date]),
      categoryId: String(row[map.categoryId]).trim(),
      amount: Number(row[map.amount]) || 0,
      paidBy: String(row[map.paidBy]).trim(),
      split: { wilson: Number(row[map.splitWilson]) || 0, yanina: Number(row[map.splitYanina]) || 0 },
      essential: row[map.essential] === true || String(row[map.essential]).toUpperCase() === 'TRUE',
      detail: row[map.detail] ? String(row[map.detail]) : '',
      note: row[map.note] ? String(row[map.note]) : '',
      overridden: row[map.overridden] === true || String(row[map.overridden]).toUpperCase() === 'TRUE',
      settled: row[map.settled] === true || String(row[map.settled]).toUpperCase() === 'TRUE',
      settledAt: row[map.settledAt] ? formatDateCell_(row[map.settledAt]) : null
    };
  }).sort(function (a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); });
}

function getFullDataset_() {
  return { success: true, categories: readCategories_(), expenses: readExpenses_() };
}

// =============================================
// Escritura
// =============================================
function addExpense_(input, profile) {
  if (!input) throw new Error('Falta el gasto a registrar.');
  var category = readCategories_().filter(function (c) { return c.id === input.categoryId; })[0];
  if (!category) throw new Error('Categoría inválida: ' + input.categoryId);

  var amount = Number(input.amount);
  if (!amount || amount <= 0) throw new Error('El monto debe ser mayor a 0.');

  var paidBy = input.paidBy;
  if (paidBy !== 'wilson' && paidBy !== 'yanina') throw new Error('Quién pagó es inválido.');

  var split = input.split || category.defaultSplit;
  var splitWilson = Number(split.wilson);
  var splitYanina = Number(split.yanina);
  if (isNaN(splitWilson) || isNaN(splitYanina) || Math.round(splitWilson + splitYanina) !== 100) {
    throw new Error('La división debe sumar 100%.');
  }

  var essential = (typeof input.essential === 'boolean') ? input.essential : category.essential;
  var overridden = (splitWilson !== category.defaultSplit.wilson) || (splitYanina !== category.defaultSplit.yanina);
  var date = input.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd');
  var id = Utilities.getUuid();

  getExpensesSheet_().appendRow([
    id, date, category.id, amount, paidBy,
    splitWilson, splitYanina, essential, sanitizeCellValue_(input.detail || ''), '',
    overridden, false, '', new Date(), profile.email
  ]);

  // "Usar esta división de ahora en adelante" -> también actualiza el default de la categoría.
  if (input.useAsDefault) {
    return updateCategoryDefaultSplit_(category.id, { wilson: splitWilson, yanina: splitYanina });
  }
  return getFullDataset_();
}

function updateCategoryDefaultSplit_(categoryId, split) {
  if (!categoryId || !split) throw new Error('Faltan datos para actualizar la división.');
  var wilson = Number(split.wilson);
  var yanina = Number(split.yanina);
  if (isNaN(wilson) || isNaN(yanina) || Math.round(wilson + yanina) !== 100) {
    throw new Error('La división debe sumar 100%.');
  }

  var sheet = getCategoriesSheet_();
  var lastRow = sheet.getLastRow();
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === categoryId) {
      sheet.getRange(i + 2, 4, 1, 2).setValues([[wilson, yanina]]); // splitWilson, splitYanina
      return getFullDataset_();
    }
  }
  throw new Error('Categoría no encontrada: ' + categoryId);
}

function settleUp_() {
  var sheet = getExpensesSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return getFullDataset_();

  var map = buildColumnMap_(EXPENSES_HEADERS);
  var range = sheet.getRange(2, 1, lastRow - 1, EXPENSES_HEADERS.length);
  var values = range.getValues();
  var now = new Date();
  var changed = false;

  for (var i = 0; i < values.length; i++) {
    var isSettled = values[i][map.settled] === true || String(values[i][map.settled]).toUpperCase() === 'TRUE';
    if (!isSettled) {
      values[i][map.settled] = true;
      values[i][map.settledAt] = now;
      changed = true;
    }
  }
  if (changed) range.setValues(values);
  return getFullDataset_();
}

// Liquida un solo gasto compartido. Solo puede hacerlo quien NO pagó
// (es decir, quien le debe su parte a quien pagó).
function settleExpense_(expenseId, profile) {
  if (!expenseId) throw new Error('Falta el id del gasto.');
  var sheet = getExpensesSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error('Gasto no encontrado.');

  var map = buildColumnMap_(EXPENSES_HEADERS);
  var range = sheet.getRange(2, 1, lastRow - 1, EXPENSES_HEADERS.length);
  var values = range.getValues();

  for (var i = 0; i < values.length; i++) {
    if (String(values[i][map.id]) !== String(expenseId)) continue;
    var paidBy = String(values[i][map.paidBy]).trim();
    if (paidBy === profile.personId) throw new Error('Solo quien no pagó puede liquidar este gasto.');
    values[i][map.settled] = true;
    values[i][map.settledAt] = new Date();
    range.setValues(values);
    return getFullDataset_();
  }
  throw new Error('Gasto no encontrado.');
}

// =============================================
// Utilidades
// =============================================
// Anti CSV/formula injection — igual que sanitizeCellValue en Comer.ar.
function sanitizeCellValue_(v) {
  var s = String(v == null ? '' : v);
  if (/^[=+\-@\t\r]/.test(s)) return "'" + s;
  return s;
}

function sendJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
