// ============================================================
//  UPADSFAST — Google Ads Bulk Upload Script
//  Versao: Conta Unica
//  Fix: Execucao sequencial com throttling para hierarquia
// ============================================================

// >>> CONFIGURACAO <<<
var SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1s3NQNSE5-JaqUAUMv5IBMLuY4jX0TbJspuWgziG8QbM/edit';

// >>> MODO DE EXECUCAO <<<
// true  = PREVIEW (apenas visualiza, nao aplica mudancas)
// false = APPLY (aplica mudancas diretamente na conta)
var PREVIEW_MODE = true;

// Nomes das abas (correspondem aos nomes gerados pelo excel.ts)
var SHEET = {
  CAMPAIGNS:  'Campaigns',
  AD_GROUPS:  'Ad groups',
  ADS:        'Ads',
  CALLOUTS:   'Callouts',
  SITELINKS:  'Sitelinks',
  SNIPPETS:   'Structured snippets',
  PROMOTIONS: 'Promotions'
};

// Tempo de espera (ms) apos upload da Campanha para garantir
// que o Job no servidor do Google finalize antes dos filhos.
var CAMPAIGN_THROTTLE_MS = 60000; // 60 segundos

// Tempo de espera (ms) apos upload de Ad Groups
var AD_GROUP_THROTTLE_MS = 30000; // 30 segundos

// ============================================================

function main() {
  var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);

  Logger.log('========================================');
  Logger.log('UPADSFAST - Bulk Upload (Single Account)');
  Logger.log('Planilha: ' + ss.getName());
  Logger.log('Modo: ' + (PREVIEW_MODE ? 'PREVIEW' : 'APPLY'));
  Logger.log('========================================');

  var results = [];

  // ── FASE 1: CAMPANHA (pai de tudo) ──
  Logger.log('');
  Logger.log('>>> FASE 1: Criando Campanhas...');
  var campResult = processSheet(ss, SHEET.CAMPAIGNS);
  results.push(campResult);

  if (campResult.rows > 0 && !PREVIEW_MODE) {
    Logger.log('  Aguardando ' + (CAMPAIGN_THROTTLE_MS / 1000) + 's para o Job da Campanha finalizar...');
    Utilities.sleep(CAMPAIGN_THROTTLE_MS);
    Logger.log('  Throttle concluido.');
  }

  // ── FASE 2: GRUPOS DE ANUNCIOS (filho da campanha) ──
  Logger.log('');
  Logger.log('>>> FASE 2: Criando Ad Groups...');
  var agResult = processSheet(ss, SHEET.AD_GROUPS);
  results.push(agResult);

  if (agResult.rows > 0 && !PREVIEW_MODE) {
    Logger.log('  Aguardando ' + (AD_GROUP_THROTTLE_MS / 1000) + 's para o Job dos Ad Groups finalizar...');
    Utilities.sleep(AD_GROUP_THROTTLE_MS);
    Logger.log('  Throttle concluido.');
  }

  // ── FASE 3: ANUNCIOS E EXTENSOES (filhos do grupo) ──
  Logger.log('');
  Logger.log('>>> FASE 3: Criando Ads e Extensoes...');
  results.push(processSheet(ss, SHEET.ADS));
  results.push(processSheet(ss, SHEET.CALLOUTS));
  results.push(processSheet(ss, SHEET.SITELINKS));
  results.push(processSheet(ss, SHEET.SNIPPETS));
  results.push(processSheet(ss, SHEET.PROMOTIONS));

  // ── RESUMO ──
  Logger.log('');
  Logger.log('========== RESUMO ==========');
  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    Logger.log(r.sheet + ': ' + r.rows + ' linha(s) | ' + r.status);
  }
  Logger.log('============================');
  Logger.log('Detalhes em: Ferramentas > Acoes em massa > Uploads');
}

function processSheet(ss, sheetName) {
  var result = { sheet: sheetName, rows: 0, status: '' };

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    result.status = 'ERRO: aba nao encontrada';
    Logger.log('[ERRO] ' + sheetName + ': aba nao encontrada.');
    return result;
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    result.status = 'VAZIA';
    Logger.log('[AVISO] ' + sheetName + ': sem dados.');
    return result;
  }

  // ── Sanitizar cabecalhos ──
  // 1. Trim universal em todos os headers
  // 2. Bloquear colunas "Status" duplicadas (manter apenas a primeira)
  var rawHeaders = [];
  for (var h = 0; h < data[0].length; h++) {
    rawHeaders.push(String(data[0][h]).trim());
  }

  var validHeaders = [];
  var validIndexes = [];
  var hasStatusCol = false;

  for (var h = 0; h < rawHeaders.length; h++) {
    var header = rawHeaders[h];

    // Pular headers vazios
    if (header === '') continue;

    // Deduplicar coluna "Status" — manter apenas a primeira ocorrencia
    var isStatus = header.toLowerCase() === 'status' ||
                   header.toLowerCase() === 'campaign status';
    if (isStatus) {
      if (hasStatusCol) {
        Logger.log('  [SANITIZE] Coluna duplicada ignorada: "' + header + '" (col ' + (h + 1) + ')');
        continue;
      }
      hasStatusCol = true;
      header = 'Status'; // Normalizar nome
    }

    validHeaders.push(header);
    validIndexes.push(h);
  }

  var upload = AdsApp.bulkUploads().newCsvUpload(validHeaders);
  upload.forCampaignManagement();

  var count = 0;
  for (var i = 1; i < data.length; i++) {
    var row = {};
    var hasData = false;

    for (var j = 0; j < validIndexes.length; j++) {
      var val = data[i][validIndexes[j]];
      // Trim universal em todos os valores
      if (val !== '' && val !== null && val !== undefined) {
        row[validHeaders[j]] = String(val).trim();
        hasData = true;
      }
    }

    if (hasData) {
      upload.append(row);
      count++;
    }
  }

  if (count === 0) {
    result.status = 'VAZIA (sem dados validos)';
    Logger.log('[AVISO] ' + sheetName + ': nenhuma linha valida.');
    return result;
  }

  result.rows = count;

  try {
    if (PREVIEW_MODE) {
      upload.preview();
      result.status = 'PREVIEW enviado';
    } else {
      upload.apply();
      result.status = 'APLICADO';
    }
    Logger.log('[OK] ' + sheetName + ': ' + count + ' linha(s) — ' + result.status);
  } catch (e) {
    result.status = 'ERRO: ' + e.message;
    Logger.log('[ERRO] ' + sheetName + ': ' + e.message);
  }

  return result;
}
