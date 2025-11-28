const SPREADSHEET_ID = '-';
const SHEET_NAME = '-';

function doPost(e) {
  try {
    Logger.log('RAW EVENT: ' + JSON.stringify(e));
    var p = (e && e.parameter) ? e.parameter : {};
    if (!Object.keys(p).length) {
      throw new Error('Request has no parameter data');
    }
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found');
    }
    var firstName = p.first_name || '';
    var lastName = p.last_name || '';
    var fullName = (firstName + ' ' + lastName).trim();
    var spreadsheetFile = DriveApp.getFileById(SPREADSHEET_ID);
    var parents = spreadsheetFile.getParents();
    var parentFolder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();

    var passportFileUrl = '';
    var bankStatementFileUrl = '';
    if (p.passport_file) {
      var passportBase64 = p.passport_file; // чистый base64
      var passportBytes = Utilities.base64Decode(passportBase64);

      var passportOriginalName = p.passport_file_name || '';
      var passportContentType = p.passport_file_type || 'application/octet-stream';
      var passportExt = getExtensionFromName(passportOriginalName) || guessExtensionFromMime(passportContentType);

      var passportFileName = fullName
        ? (fullName + ' паспорт' + (passportExt ? '.' + passportExt : ''))
        : ('паспорт' + (passportExt ? '.' + passportExt : ''));

      var passportBlob = Utilities.newBlob(passportBytes, passportContentType, passportFileName);
      var createdPassportFile = parentFolder.createFile(passportBlob);
      passportFileUrl = createdPassportFile.getUrl();
    }
    if (p.bank_statement_file) {
      var bankBase64 = p.bank_statement_file;
      var bankBytes = Utilities.base64Decode(bankBase64);

      var bankOriginalName = p.bank_statement_file_name || '';
      var bankContentType = p.bank_statement_file_type || 'application/octet-stream';
      var bankExt = getExtensionFromName(bankOriginalName) || guessExtensionFromMime(bankContentType);

      var bankFileName = fullName
        ? (fullName + ' банк отчет' + (bankExt ? '.' + bankExt : ''))
        : ('банк отчет' + (bankExt ? '.' + bankExt : ''));

      var bankBlob = Utilities.newBlob(bankBytes, bankContentType, bankFileName);
      var createdBankFile = parentFolder.createFile(bankBlob);
      bankStatementFileUrl = createdBankFile.getUrl();
    }
    sheet.appendRow([
      new Date(),                         // 1  Timestamp
      p.first_name || '',                 // 2  First name
      p.last_name || '',                  // 3  Last name
      p.date_of_birth || '',              // 4  Date of birth
      p.country_of_birth || '',           // 5  Country of birth
      p.income || '',                     // 6  Income
      p.income_currency || '',            // 7  Income currency
      p.additional_income || '',          // 8  Additional income
      p.additional_income_currency || '', // 9  Additional income currency
      p.email || '',                      // 10 Email
      p.phone ? "'" + p.phone : "",       // 11 Phone (как текст, с плюсом)
      p.residential_address || '',        // 12 Residential address
      p.workplace || '',                  // 13 Workplace
      p.position || '',                   // 14 Position
      p.work_start_year || '',            // 15 Work start year
      p.country_of_residence || '',       // 16 Country of residence
      passportFileUrl,                    // 17 Passport (URL)
      bankStatementFileUrl                // 18 Bank statement (URL)
    ]);
    var lastRow = sheet.getLastRow();
    var result = {
      success: true,
      lastRow: lastRow,
      received: p,
      passportFileUrl: passportFileUrl,
      bankStatementFileUrl: bankStatementFileUrl
    };
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('ERROR: ' + err);

    var result = {
      success: false,
      error: String(err)
    };

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
function getExtensionFromName(name) {
  if (!name) return '';
  var parts = name.split('.');
  return parts.length > 1 ? parts.pop() : '';
}
function guessExtensionFromMime(mime) {
  if (!mime) return '';
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  return '';
}
