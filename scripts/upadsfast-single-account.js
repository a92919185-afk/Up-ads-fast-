// ============================================================
//  UPADSFAST — Google Ads Script
//  Arquitetura: Híbrida (Builder síncrono + Bulk Upload)
//  Fase 1: CampaignBuilder + AdGroupBuilder (síncronos)
//  Fase 2: Bulk Upload para Ads e Extensões
// ============================================================

var SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1s3NQNSE5-JaqUAUMv5IBMLuY4jX0TbJspuWgziG8QbM/edit';

// Nomes das abas — devem ser IDÊNTICOS aos da planilha
var SHEET = {
  CAMPAIGNS:  'Campaigns',
  AD_GROUPS:  'Ad groups',
  ADS:        'Ads',
  CALLOUTS:   'Callouts',
  SITELINKS:  'Sitelinks',
  SNIPPETS:   'Structured snippets',
  PROMOTIONS: 'Promotions'
};

// ============================================================

function main() {
  var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  Logger.log('========================================');
  Logger.log('UPADSFAST — Arquitetura Híbrida');
  Logger.log('Planilha: ' + ss.getName());
  Logger.log('========================================');

  // ── FASE 1A: Criar Campanhas de forma SÍNCRONA ──────────────
  Logger.log('');
  Logger.log('>>> FASE 1A: Criando Campanhas (Builder síncrono)...');
  var campaignMap = criarCampanhas(ss);

  // ── FASE 1B: Criar Ad Groups de forma SÍNCRONA ──────────────
  Logger.log('');
  Logger.log('>>> FASE 1B: Criando Ad Groups (Builder síncrono)...');
  criarAdGroups(ss, campaignMap);

  // ── FASE 2: Bulk Upload de Anúncios e Extensões ─────────────
  Logger.log('');
  Logger.log('>>> FASE 2: Bulk Upload de Ads e Extensões...');
  bulkUploadAba(ss, SHEET.ADS);
  bulkUploadAba(ss, SHEET.CALLOUTS);
  bulkUploadAba(ss, SHEET.SITELINKS);
  bulkUploadAba(ss, SHEET.SNIPPETS);
  bulkUploadAba(ss, SHEET.PROMOTIONS);

  Logger.log('');
  Logger.log('========================================');
  Logger.log('UPADSFAST: Finalizado.');
  Logger.log('Verifique: Ferramentas > Ações em massa > Uploads');
  Logger.log('========================================');
}

// ─── FASE 1A: CampaignBuilder ────────────────────────────────

function criarCampanhas(ss) {
  var campaignMap = {}; // { nomeCampanha: objetoCampanha }

  var sheet = ss.getSheetByName(SHEET.CAMPAIGNS);
  if (!sheet) {
    Logger.log('[ERRO] Aba "' + SHEET.CAMPAIGNS + '" não encontrada.');
    return campaignMap;
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    Logger.log('[AVISO] Aba Campaigns vazia.');
    return campaignMap;
  }

  // Mapear índices dos cabeçalhos
  var headers = normalizarHeaders(data[0]);
  var iCampaign = headers.indexOf('campaign');
  var iBudget   = headers.indexOf('budget');

  if (iCampaign < 0 || iBudget < 0) {
    Logger.log('[ERRO] Aba Campaigns: colunas "Campaign" e/ou "Budget" não encontradas.');
    Logger.log('  Cabeçalhos encontrados: ' + data[0].join(', '));
    return campaignMap;
  }

  var seenCampaigns = {};

  for (var i = 1; i < data.length; i++) {
    var nomeCampanha = sanitizarValor(data[i][iCampaign]);
    var budget       = parseFloat(sanitizarValor(data[i][iBudget])) || 10;

    if (!nomeCampanha || seenCampaigns[nomeCampanha]) continue;
    seenCampaigns[nomeCampanha] = true;

    // Verificar se campanha já existe
    var campExistente = buscarCampanha(nomeCampanha);
    if (campExistente) {
      Logger.log('  [JÁ EXISTE] Campanha: ' + nomeCampanha);
      campaignMap[nomeCampanha] = campExistente;
      continue;
    }

    // Criar campanha via Builder (síncrono)
    try {
      var operacao = AdsApp.newCampaignBuilder()
        .withName(nomeCampanha)
        .withBudget(budget)
        .withBiddingStrategy('MANUAL_CPC')
        .forSearchNetwork()
        .withStatus('ENABLED')
        .build();

      if (operacao.isSuccessful()) {
        var campanha = operacao.getResult();
        campaignMap[nomeCampanha] = campanha;
        Logger.log('  [OK] Campanha criada: ' + nomeCampanha + ' (Budget: ' + budget + ')');
      } else {
        var erros = operacao.getErrors();
        Logger.log('  [ERRO] ' + nomeCampanha + ': ' + erros.join(', '));
      }
    } catch (e) {
      Logger.log('  [ERRO] ' + nomeCampanha + ': ' + e.message);
    }
  }

  return campaignMap;
}

// ─── FASE 1B: AdGroupBuilder ─────────────────────────────────

function criarAdGroups(ss, campaignMap) {
  var sheet = ss.getSheetByName(SHEET.AD_GROUPS);
  if (!sheet) {
    Logger.log('[ERRO] Aba "' + SHEET.AD_GROUPS + '" não encontrada.');
    return;
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    Logger.log('[AVISO] Aba Ad groups vazia.');
    return;
  }

  var headers  = normalizarHeaders(data[0]);
  var iCampaign = headers.indexOf('campaign');
  var iAdGroup  = headers.indexOf('ad group');

  if (iCampaign < 0 || iAdGroup < 0) {
    Logger.log('[ERRO] Aba Ad groups: colunas "Campaign" e/ou "Ad group" não encontradas.');
    Logger.log('  Cabeçalhos encontrados: ' + data[0].join(', '));
    return;
  }

  var seenGroups = {};

  for (var i = 1; i < data.length; i++) {
    var nomeCampanha = sanitizarValor(data[i][iCampaign]);
    var nomeGrupo    = sanitizarValor(data[i][iAdGroup]);
    var chave        = nomeCampanha + '|' + nomeGrupo;

    if (!nomeCampanha || !nomeGrupo || seenGroups[chave]) continue;
    seenGroups[chave] = true;

    // Buscar campanha (no mapa ou na conta)
    var campanha = campaignMap[nomeCampanha] || buscarCampanha(nomeCampanha);
    if (!campanha) {
      Logger.log('  [ERRO] Ad Group "' + nomeGrupo + '": campanha "' + nomeCampanha + '" não encontrada na conta.');
      continue;
    }

    // Verificar se ad group já existe
    var agExistente = buscarAdGroup(campanha, nomeGrupo);
    if (agExistente) {
      Logger.log('  [JÁ EXISTE] Ad Group: ' + nomeGrupo);
      continue;
    }

    // Criar ad group via Builder (síncrono)
    try {
      var operacao = campanha.newAdGroupBuilder()
        .withName(nomeGrupo)
        .withStatus('ENABLED')
        .withCpc(0.01)
        .build();

      if (operacao.isSuccessful()) {
        Logger.log('  [OK] Ad Group criado: ' + nomeGrupo + ' (Campanha: ' + nomeCampanha + ')');
      } else {
        var erros = operacao.getErrors();
        Logger.log('  [ERRO] ' + nomeGrupo + ': ' + erros.join(', '));
      }
    } catch (e) {
      Logger.log('  [ERRO] ' + nomeGrupo + ': ' + e.message);
    }
  }
}

// ─── FASE 2: Bulk Upload ──────────────────────────────────────

function bulkUploadAba(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('[AVISO] Aba "' + sheetName + '" não encontrada — pulando.');
    return;
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    Logger.log('[AVISO] Aba "' + sheetName + '" vazia — pulando.');
    return;
  }

  // Sanitizar cabeçalhos: trim + deduplicar "Status"
  var rawHeaders  = [];
  var validIndexes = [];
  var hasStatus   = false;

  for (var h = 0; h < data[0].length; h++) {
    var header = String(data[0][h]).trim();
    if (header === '') continue;

    var ehStatus = header.toLowerCase() === 'status' ||
                   header.toLowerCase() === 'campaign status';
    if (ehStatus) {
      if (hasStatus) {
        Logger.log('  [SANITIZE] Coluna duplicada ignorada: "' + header + '"');
        continue;
      }
      hasStatus = true;
      header = 'Status';
    }

    rawHeaders.push(header);
    validIndexes.push(h);
  }

  var upload = AdsApp.bulkUploads().newCsvUpload(rawHeaders);
  upload.forCampaignManagement();

  var count = 0;
  for (var i = 1; i < data.length; i++) {
    var row     = {};
    var temDado = false;

    for (var j = 0; j < validIndexes.length; j++) {
      var raw = data[i][validIndexes[j]];
      var val = sanitizarValor(raw);

      // Ignorar células vazias, null ou "None" — o Google rejeita "None"
      if (val === '') continue;

      row[rawHeaders[j]] = val;
      temDado = true;
    }

    if (temDado) {
      upload.append(row);
      count++;
    }
  }

  if (count === 0) {
    Logger.log('[AVISO] "' + sheetName + '": nenhuma linha válida.');
    return;
  }

  try {
    upload.apply();
    Logger.log('[OK] "' + sheetName + '": ' + count + ' linha(s) aplicada(s).');
  } catch (e) {
    Logger.log('[ERRO] "' + sheetName + '": ' + e.message);
  }
}

// ─── UTILITÁRIOS ─────────────────────────────────────────────

// Retorna array de headers em minúsculas para comparação
function normalizarHeaders(linha) {
  var result = [];
  for (var i = 0; i < linha.length; i++) {
    result.push(String(linha[i]).trim().toLowerCase());
  }
  return result;
}

// Remove espaços, converte para string; retorna '' para None/null/undefined
function sanitizarValor(val) {
  if (val === null || val === undefined) return '';
  var str = String(val).trim();
  if (str === 'None' || str === 'none' || str === 'NONE') return '';
  return str;
}

// Busca campanha pelo nome exato na conta
function buscarCampanha(nome) {
  var iter = AdsApp.campaigns()
    .withCondition('Name = "' + nome + '"')
    .get();
  return iter.hasNext() ? iter.next() : null;
}

// Busca ad group pelo nome dentro de uma campanha
function buscarAdGroup(campanha, nome) {
  var iter = campanha.adGroups()
    .withCondition('Name = "' + nome + '"')
    .get();
  return iter.hasNext() ? iter.next() : null;
}
