// ============================================================
//  UPADSFAST — Google Ads Bulk Upload Script (DEFINITIVO)
//  Formato: Templates oficiais do Google Ads
//  Método: newFileUpload com CSV blob
//
//  Abas (processadas nesta ordem):
//    1. Campaigns_upload
//    2. AdGroups_upload
//    3. Ads_upload
//    4. Keywords_upload
//
//  Baseado em:
//  - Templates oficiais: campaign_template.xlsx, ad_group_template.xlsx,
//    responsive_search_ad_template.xlsx, keyword_template.xlsx
//  - developers.google.com/google-ads/scripts/docs/features/bulk-upload
// ============================================================

var SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/16zPfzG_PaIDy7J5qeV8_1i_b5Sy8qRKKnEWdBmeh06I/edit';

// Abas — DEVEM corresponder EXATAMENTE aos nomes na planilha
var ABAS = [
  'Campaigns_upload',
  'AdGroups_upload',
  'Ads_upload',
  'Keywords_upload'
];

// ============================================================

function main() {
  var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);

  Logger.log('========================================');
  Logger.log('UPADSFAST — Bulk Upload (Templates Oficiais)');
  Logger.log('Planilha: ' + ss.getName());
  Logger.log('========================================');

  for (var i = 0; i < ABAS.length; i++) {
    var sheetName = ABAS[i];
    Logger.log('');
    Logger.log('>>> Processando: ' + sheetName + ' (' + (i + 1) + '/' + ABAS.length + ')');
    uploadSheet(ss, sheetName);
  }

  Logger.log('');
  Logger.log('========================================');
  Logger.log('UPADSFAST: Finalizado.');
  Logger.log('Verifique em: Ferramentas > Ações em massa > Uploads');
  Logger.log('========================================');
}

function uploadSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('  [ERRO] Aba "' + sheetName + '" não encontrada.');
    return;
  }

  var range = sheet.getDataRange();
  var values = range.getValues();

  if (values.length <= 1) {
    Logger.log('  [AVISO] Aba "' + sheetName + '" vazia — pulando.');
    return;
  }

  // Montar CSV em memória com o MESMO cabeçalho do template
  var csvRows = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var cells = [];
    for (var j = 0; j < row.length; j++) {
      cells.push(cleanCell(row[j]));
    }
    csvRows.push(cells.join(','));
  }
  var csv = csvRows.join('\n');

  var blob = Utilities.newBlob(csv, 'text/csv', sheetName + '.csv');

  var upload = AdsApp.bulkUploads().newFileUpload(blob);
  upload.forCampaignManagement();

  try {
    upload.apply();
    Logger.log('  [OK] "' + sheetName + '": ' + (values.length - 1) + ' linha(s) aplicada(s).');
  } catch (e) {
    Logger.log('  [ERRO] "' + sheetName + '": ' + e.message);
  }
}

// Limpa célula para formato CSV válido
function cleanCell(value) {
  if (value == null || value === undefined) return '';

  var text = String(value).trim();

  // Remover string "None" (Google Ads rejeita)
  if (text.toLowerCase() === 'none') return '';

  // Escapar vírgulas e aspas para CSV
  if (text.indexOf(',') > -1 || text.indexOf('"') > -1 || text.indexOf('\n') > -1) {
    text = '"' + text.replace(/"/g, '""') + '"';
  }

  return text;
}
