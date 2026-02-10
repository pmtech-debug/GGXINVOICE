// ============================================================================
// GOOGLE APPS SCRIPT CODE (V21 - FIXED SCOPE ISSUES)
// ============================================================================
// 1. Open your Google Sheet -> Extensions -> Apps Script
// 2. Paste this code entirely, replacing existing code.
// 3. Run 'setup' function once to create columns.
// 4. Deploy > Manage Deployments > Edit > New Version > Deploy
// ============================================================================

function getSheetName() {
  return "Shipments";
}

function setup() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = getSheetName();
  var sheet = doc.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
  }
  
  // Define Headers (31 Columns including Discount)
  var headers = [
    'Date', 'Invoice No', 'Branch Name', 'Destination', 'Service', 
    'Sender Name', 'Sender Ph', 'Cons Name', 'Cons Ph', 'Cons Email', 'Cons Address', 'Cons City', 'Cons Zip',
    'Items Summary', 'Items JSON', 'Total Boxes',
    'Act Wt', 'Vol Wt', 'Chg Wt', 'Rate Per Kg', 'Base Freight',
    'Vac Qty', 'Vac Price', 'Box Qty', 'Box Price', 'Insurance',
    'Grand Total', 'Paid', 'Balance', 'Pay Method', 'Discount'
  ];
  
  // Set Headers if missing
  var currentHeaders = [];
  if (sheet.getLastColumn() > 0) {
    currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  if (currentHeaders.length < headers.length) {
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    sheet.setFrozenRows(1);
    headerRange.setFontWeight("bold").setBackground("#cffafe"); 
  }
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); 

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = getSheetName();
    var sheet = doc.getSheetByName(sheetName);
    
    if (!sheet) {
      setup();
      sheet = doc.getSheetByName(sheetName);
    }

    // --- GET Request (Fetch History) ---
    // e might be undefined if run from editor, but effectively e.postData is undefined on GET
    if (!e || !e.postData) {
      var lastRow = sheet.getLastRow();
      
      if (lastRow < 2) {
        return ContentService.createTextOutput(JSON.stringify([]))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var data = sheet.getDataRange().getValues();
      data.shift(); // Remove header
      
      var result = data.map(function(row) {
        return {
           date: row[0],
           invoiceNo: row[1],
           branchName: row[2],
           country: row[3],
           service: row[4],
           
           senderName: row[5],
           senderPh: row[6],
           consName: row[7],
           consPh: row[8],
           consEmail: row[9] || '', 
           consAddr: row[10] || '',
           consCity: row[11] || '',
           consZip: row[12] || '',
           
           items: row[13],
           itemsJson: row[14] || '[]',
           totalBoxes: row[15] || 1,
           
           actWt: row[16] || 0,
           volWt: row[17] || 0,
           chgWt: row[18] || 0,
           ratePerKg: row[19] || 0,
           freight: row[20] || 0,
           
           vacQty: row[21] || 0,
           vacPrice: row[22] || 0,
           boxQty: row[23] || 0,
           boxPrice: row[24] || 0,
           insurance: row[25] || 0,
           
           grandTotal: row[26] || 0,
           amountPaid: row[27] || 0,
           balanceDue: row[28] || 0,
           payMethod: row[29] || 'Cash',
           discount: row[30] || 0
        };
      });
      
      return ContentService.createTextOutput(JSON.stringify(result.reverse()))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- POST Request (Save Invoice) ---
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);

    var itemsList = "";
    if (data.items && Array.isArray(data.items)) {
      itemsList = data.items.map(function(item) {
        return item.description + ' (' + item.qty + ')';
      }).join(', ');
    }

    var itemsJson = JSON.stringify(data.items || []);

    sheet.appendRow([
      "'" + (data.date || new Date().toLocaleDateString()),
      data.invoiceNo,
      data.branch ? data.branch.name : 'N/A',
      data.country,
      data.service,
      
      data.senderName,
      data.senderPh,
      data.consName,
      data.consPh,
      data.consEmail || '', 
      data.consAddr || '',
      data.consCity || '',
      data.consZip || '',
      
      itemsList,
      itemsJson,
      data.totalBoxes || 1,
      
      data.actWt || 0,
      data.volWt || 0,
      data.chgWt || 0,
      data.ratePerKg || 0,
      data.total || 0, // Base freight
      
      data.vacQty || 0,
      data.vacPrice || 0,
      data.boxQty || 0,
      data.boxPrice || 0,
      data.insurance || 0,
      
      data.grandTotal || 0,
      data.amountPaid || 0,
      data.balanceDue || 0,
      data.payMethod || 'Cash',
      data.discount || 0
    ]);

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'message': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}