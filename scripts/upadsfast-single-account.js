// ============================================================
//  UPADSFAST — Google Ads Script (DEFINITIVO)
//  Arquitetura: Híbrida (mutate síncrono + Bulk Upload)
//
//  Fase 1: AdsApp.mutate() cria Budget + Campaign + AdGroup
//          de forma ATÔMICA (operação única, síncrona).
//          Garante que pais existam antes dos filhos.
//
//  Fase 2: AdsApp.bulkUploads() cria Ads e Extensões
//          via CSV Upload (Campaign e AdGroup já existem).
//
//  Baseado em:
//  - developers.google.com/google-ads/scripts/docs/campaigns/search/required-components
//  - developers.google.com/google-ads/scripts/docs/features/bulk-upload
//  - developers.google.com/google-ads/scripts/docs/reference/adsapp/adsapp
// ============================================================

var SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/16zPfzG_PaIDy7J5qeV8_1i_b5Sy8qRKKnEWdBmeh06I/edit';

var SHEET = {
  CAMPAIGNS:  'Campaigns',
  AD_GROUPS:  'Ad groups',
  ADS:        'Ads',
  CALLOUTS:   'Callouts',
  SITELINKS:  'Sitelinks',
  SNIPPETS:   'Structured snippets',
  PROMOTIONS: 'Promotions'
};

// Contador de IDs temporários para mutateAll (devem ser negativos)
var _nextTempId = -1;
function getNextTempId() { return _nextTempId--; }

// Colunas auxiliares do excel.ts (NÃO são colunas do Google Ads).
// Devem ser excluídas do Bulk Upload para evitar rejeição.
var AUX_COLUMNS = [
  'Product_Name', 'Country', 'Language', 'Discount_Value',
  'Guarantee_Days', 'Has_Free_Shipping', 'Free_Ship_Min',
  'Currency', 'Price'
];

// ============================================================
// MAIN
// ============================================================

function main() {
  var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  var customerId = AdsApp.currentAccount().getCustomerId().replace(/-/g, '');

  Logger.log('========================================');
  Logger.log('UPADSFAST — Script Definitivo');
  Logger.log('Conta: ' + customerId);
  Logger.log('Planilha: ' + ss.getName());
  Logger.log('========================================');

  // ── FASE 1: Criar estrutura via mutate() ────────────────────
  // Budget + Campaign + AdGroup numa operação atômica.
  // Se já existem, pula e vai direto para Fase 2.
  Logger.log('');
  Logger.log('>>> FASE 1: Criando estrutura (mutate síncrono)...');
  criarEstruturaViaMutate(ss, customerId);

  // ── FASE 2: Bulk Upload de Ads e Extensões ──────────────────
  // Campaign e AdGroup já existem garantidamente.
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
  Logger.log('Verifique Ads e Extensões em:');
  Logger.log('  Ferramentas > Ações em massa > Uploads');
  Logger.log('========================================');
}

// ============================================================
// FASE 1: MUTATE — Budget + Campaign + Ad Group
// ============================================================

function criarEstruturaViaMutate(ss, customerId) {
  // Ler dados das abas Campaigns e Ad groups
  var campanhas = lerAba(ss, SHEET.CAMPAIGNS);
  var adGroups  = lerAba(ss, SHEET.AD_GROUPS);

  if (!campanhas.length) {
    Logger.log('[AVISO] Nenhuma campanha encontrada na planilha.');
    return;
  }

  // Deduplicar campanhas
  var campanhasUnicas = {};
  for (var i = 0; i < campanhas.length; i++) {
    var nome = sanitizar(campanhas[i]['Campaign'] || campanhas[i]['campaign']);
    if (!nome || campanhasUnicas[nome]) continue;
    campanhasUnicas[nome] = campanhas[i];
  }

  // Para cada campanha, verificar se já existe. Se não, criar via mutate.
  for (var nomeCamp in campanhasUnicas) {
    var dadosCamp = campanhasUnicas[nomeCamp];

    // Verificar se campanha já existe na conta
    var campExistente = buscarCampanha(nomeCamp);
    if (campExistente) {
      Logger.log('  [JÁ EXISTE] Campanha: ' + nomeCamp);
      // Criar ad groups que ainda não existem para esta campanha
      criarAdGroupsFaltantes(adGroups, nomeCamp, campExistente, customerId);
      continue;
    }

    // Montar operações atômicas: Budget + Campaign + Ad Groups
    var operations = [];

    // 1. Budget
    var budgetTempId = getNextTempId();
    var budgetValue = parseFloat(sanitizar(dadosCamp['Budget'] || dadosCamp['budget'])) || 10;
    // amountMicros = valor * 1.000.000
    var amountMicros = String(Math.round(budgetValue * 1000000));

    operations.push({
      campaignBudgetOperation: {
        create: {
          resourceName: 'customers/' + customerId + '/campaignBudgets/' + budgetTempId,
          name: nomeCamp + ' Budget',
          amountMicros: amountMicros,
          deliveryMethod: 'STANDARD',
          explicitlyShared: false
        }
      }
    });

    // 2. Campaign
    var campaignTempId = getNextTempId();

    operations.push({
      campaignOperation: {
        create: {
          resourceName: 'customers/' + customerId + '/campaigns/' + campaignTempId,
          name: nomeCamp,
          status: 'ENABLED',
          advertisingChannelType: 'SEARCH',
          campaignBudget: 'customers/' + customerId + '/campaignBudgets/' + budgetTempId,
          biddingStrategyType: 'MANUAL_CPC',
          manualCpc: {
            enhancedCpcEnabled: false
          },
          networkSettings: {
            targetGoogleSearch: true,
            targetSearchNetwork: false
          },
          containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING'
        }
      }
    });

    // 3. Ad Groups desta campanha
    var adGroupsDestaCamp = filtrarAdGroups(adGroups, nomeCamp);
    var seenAG = {};

    for (var j = 0; j < adGroupsDestaCamp.length; j++) {
      var nomeAG = sanitizar(adGroupsDestaCamp[j]['Ad group'] || adGroupsDestaCamp[j]['ad group']);
      if (!nomeAG || seenAG[nomeAG]) continue;
      seenAG[nomeAG] = true;

      var adGroupTempId = getNextTempId();
      operations.push({
        adGroupOperation: {
          create: {
            resourceName: 'customers/' + customerId + '/adGroups/' + adGroupTempId,
            name: nomeAG,
            status: 'ENABLED',
            campaign: 'customers/' + customerId + '/campaigns/' + campaignTempId,
            type: 'SEARCH_STANDARD'
          }
        }
      });
    }

    // Executar todas as operações de uma vez (atômico)
    try {
      var results = AdsApp.mutateAll(operations, { partialFailure: false });
      Logger.log('  [OK] Campanha criada: ' + nomeCamp + ' (' + operations.length + ' operações)');

      // Verificar resultado de cada operação
      for (var r = 0; r < results.length; r++) {
        var result = results[r];
        if (!result.isSuccessful()) {
          Logger.log('    [ERRO] Operação ' + (r + 1) + ': ' + result.getErrorMessages().join(', '));
        }
      }
    } catch (e) {
      Logger.log('  [ERRO] Falha ao criar ' + nomeCamp + ': ' + e.message);
    }
  }
}

function criarAdGroupsFaltantes(adGroupRows, nomeCampanha, campanha, customerId) {
  var adGroupsDestaCamp = filtrarAdGroups(adGroupRows, nomeCampanha);
  var campaignResourceName = campanha.getResourceName();

  for (var j = 0; j < adGroupsDestaCamp.length; j++) {
    var nomeAG = sanitizar(adGroupsDestaCamp[j]['Ad group'] || adGroupsDestaCamp[j]['ad group']);
    if (!nomeAG) continue;

    // Verificar se já existe
    var iter = campanha.adGroups().withCondition('Name = "' + nomeAG + '"').get();
    if (iter.hasNext()) {
      Logger.log('    [JÁ EXISTE] Ad Group: ' + nomeAG);
      continue;
    }

    try {
      var result = AdsApp.mutate({
        adGroupOperation: {
          create: {
            resourceName: 'customers/' + customerId + '/adGroups/' + getNextTempId(),
            name: nomeAG,
            status: 'ENABLED',
            campaign: campaignResourceName,
            type: 'SEARCH_STANDARD'
          }
        }
      });

      if (result.isSuccessful()) {
        Logger.log('    [OK] Ad Group criado: ' + nomeAG);
      } else {
        Logger.log('    [ERRO] ' + nomeAG + ': ' + result.getErrorMessages().join(', '));
      }
    } catch (e) {
      Logger.log('    [ERRO] ' + nomeAG + ': ' + e.message);
    }
  }
}

// ============================================================
// FASE 2: BULK UPLOAD — Ads e Extensões
// ============================================================

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

  // Sanitizar cabeçalhos
  var headers = [];
  var indexes = [];
  var hasStatus = false;

  for (var h = 0; h < data[0].length; h++) {
    var header = String(data[0][h]).trim();
    if (header === '') continue;

    // Pular colunas auxiliares (não são do Google Ads)
    if (AUX_COLUMNS.indexOf(header) >= 0) {
      Logger.log('  [SKIP] Coluna auxiliar ignorada: "' + header + '"');
      continue;
    }

    // Deduplicar "Status"
    var lower = header.toLowerCase();
    if (lower === 'status' || lower === 'campaign status') {
      if (hasStatus) continue;
      hasStatus = true;
      header = 'Status';
    }

    headers.push(header);
    indexes.push(h);
  }

  var upload = AdsApp.bulkUploads().newCsvUpload(headers);
  upload.forCampaignManagement();

  var count = 0;
  for (var i = 1; i < data.length; i++) {
    var row = {};
    var temDado = false;

    for (var j = 0; j < indexes.length; j++) {
      var val = sanitizar(data[i][indexes[j]]);
      if (val === '') continue;
      row[headers[j]] = val;
      temDado = true;
    }

    if (temDado) {
      upload.append(row);
      count++;
    }
  }

  if (count === 0) {
    Logger.log('[AVISO] "' + sheetName + '": sem dados válidos.');
    return;
  }

  try {
    upload.apply();
    Logger.log('[OK] "' + sheetName + '": ' + count + ' linha(s) aplicada(s).');
  } catch (e) {
    Logger.log('[ERRO] "' + sheetName + '": ' + e.message);
  }
}

// ============================================================
// UTILITÁRIOS
// ============================================================

// Lê uma aba da planilha e retorna array de objetos { header: valor }
function lerAba(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = [];
  for (var h = 0; h < data[0].length; h++) {
    headers.push(String(data[0][h]).trim());
  }

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      if (headers[j]) obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

// Sanitiza: trim + elimina "None"/null/undefined → retorna string limpa
function sanitizar(val) {
  if (val === null || val === undefined) return '';
  var str = String(val).trim();
  if (str.toLowerCase() === 'none') return '';
  return str;
}

// Filtra ad groups que pertencem a uma campanha específica
function filtrarAdGroups(adGroupRows, nomeCampanha) {
  var result = [];
  for (var i = 0; i < adGroupRows.length; i++) {
    var camp = sanitizar(adGroupRows[i]['Campaign'] || adGroupRows[i]['campaign']);
    if (camp === nomeCampanha) result.push(adGroupRows[i]);
  }
  return result;
}

// Busca campanha pelo nome exato na conta
function buscarCampanha(nome) {
  var iter = AdsApp.campaigns()
    .withCondition('Name = "' + nome + '"')
    .get();
  return iter.hasNext() ? iter.next() : null;
}
