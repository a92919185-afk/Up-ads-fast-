// ============================================================
//  UPADSFAST — Google Ads Bulk Upload Script
//  Versao: MCC (Multiplas Contas)
//  Fix: Execucao sequencial com throttling para hierarquia
// ============================================================

// >>> CONFIGURACAO <<<
// Cole aqui a URL da sua planilha Google Sheets:
var SPREADSHEET_URL = 'COLE_A_URL_DA_SUA_PLANILHA_AQUI';

// >>> MODO DE EXECUCAO <<<
// true  = PREVIEW (apenas visualiza)
// false = APPLY (aplica mudancas)
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

// Nome da coluna que identifica a conta em cada aba.
var ACCOUNT_ID_COLUMN = 'Account_ID';

// Tempo de espera (ms) apos upload da Campanha para garantir
// que o Job no servidor do Google finalize antes dos filhos.
var CAMPAIGN_THROTTLE_MS = 60000; // 60 segundos

// Tempo de espera (ms) apos upload de Ad Groups
var AD_GROUP_THROTTLE_MS = 30000; // 30 segundos

// ============================================================

function main() {
  var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);

  Logger.log('========================================');
  Logger.log('UPADSFAST MCC - Bulk Upload');
  Logger.log('Planilha: ' + ss.getName());
  Logger.log('Modo: ' + (PREVIEW_MODE ? 'PREVIEW' : 'APPLY'));
  Logger.log('========================================');

  var accounts = AdsManagerApp.accounts().get();

  while (accounts.hasNext()) {
    var account = accounts.next();
    AdsManagerApp.select(account);
    var accountId = account.getCustomerId();

    Logger.log('');
    Logger.log('=== Conta: ' + accountId + ' (' + account.getName() + ') ===');

    // ── FASE 1: CAMPANHA (pai de tudo) ──
    Logger.log('  >>> FASE 1: Criando Campanhas...');
    var campResult = processSheet(ss, SHEET.CAMPAIGNS, accountId);

    if (campResult.rows > 0 && !PREVIEW_MODE) {
      Logger.log('  Aguardando ' + (CAMPAIGN_THROTTLE_MS / 1000) + 's para o Job da Campanha finalizar...');
      Utilities.sleep(CAMPAIGN_THROTTLE_MS);
      Logger.log('  Throttle concluido.');
    }

    // ── FASE 2: GRUPOS DE ANUNCIOS (filho da campanha) ──
    Logger.log('  >>> FASE 2: Criando Ad Groups...');
    var agResult = processSheet(ss, SHEET.AD_GROUPS, accountId);

    if (agResult.rows > 0 && !PREVIEW_MODE) {
      Logger.log('  Aguardando ' + (AD_GROUP_THROTTLE_MS / 1000) + 's para o Job dos Ad Groups finalizar...');
      Utilities.sleep(AD_GROUP_THROTTLE_MS);
      Logger.log('  Throttle concluido.');
    }

    // ── FASE 3: ANUNCIOS E EXTENSOES (filhos do grupo) ──
    Logger.log('  >>> FASE 3: Criando Ads e Extensoes...');
    processSheet(ss, SHEET.ADS, accountId);
    processSheet(ss, SHEET.CALLOUTS, accountId);
    processSheet(ss, SHEET.SITELINKS, accountId);
    processSheet(ss, SHEET.SNIPPETS, accountId);
    processSheet(ss, SHEET.PROMOTIONS, accountId);
  }

  Logger.log('');
  Logger.log('========================================');
  Logger.log('UPADSFAST MCC: Finalizado');
  Logger.log('Detalhes em cada conta: Ferramentas > Acoes em massa > Uploads');
  Logger.log('========================================');
}

function processSheet(ss, sheetName, accountId) {
  var result = { sheet: sheetName, rows: 0, status: '' };

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    result.status = 'ERRO: aba nao encontrada';
    Logger.log('  [ERRO] ' + sheetName + ': aba nao encontrada.');
    return result;
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    result.status = 'VAZIA';
    Logger.log('  [AVISO] ' + sheetName + ': sem dados.');
    return result;
  }

  // ── Sanitizar cabecalhos ──
  var rawHeaders = [];
  for (var h = 0; h < data[0].length; h++) {
    rawHeaders.push(String(data[0][h]).trim());
  }

  // Verificar coluna Account_ID
  var accountCol = rawHeaders.indexOf(ACCOUNT_ID_COLUMN);
  var hasAccountFilter = accountCol >= 0;

  // Filtrar headers: remover vazios, Account_ID, e Status duplicados
  var validHeaders = [];
  var validIndexes = [];
  var hasStatusCol = false;

  for (var h = 0; h < rawHeaders.length; h++) {
    var header = rawHeaders[h];

    // Pular headers vazios e Account_ID
    if (header === '' || header === ACCOUNT_ID_COLUMN) continue;

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
    // Filtrar por Account_ID se a coluna existir
    if (hasAccountFilter) {
      var rowAccountId = String(data[i][accountCol]).replace(/-/g, '').trim();
      var targetId = String(accountId).replace(/-/g, '').trim();
      if (rowAccountId !== targetId) {
        continue;
      }
    }

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
    result.status = 'VAZIA (0 linhas para esta conta)';
    Logger.log('  [AVISO] ' + sheetName + ': 0 linhas para conta ' + accountId);
    return result;
  }

  result.rows = count;

  try {
    if (PREVIEW_MODE) {
      upload.preview();
      result.status = 'PREVIEW enviado';
      Logger.log('  [OK] ' + sheetName + ': ' + count + ' linha(s) — PREVIEW');
    } else {
      upload.apply();
      result.status = 'APLICADO';
      Logger.log('  [OK] ' + sheetName + ': ' + count + ' linha(s) — APLICADO');
    }
  } catch (e) {
    result.status = 'ERRO: ' + e.message;
    Logger.log('  [ERRO] ' + sheetName + ': ' + e.message);
  }

  return result;
}
