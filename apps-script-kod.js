// ============================================================
//  ERJEOKUM 2026 — Tüm Formlar İçin Birleşik Google Apps Script
// ============================================================
//
//  KURULUM:
//  1. script.google.com → Yeni Proje aç
//  2. Bu kodun TAMAMINI yapıştır
//  3. Dağıt → Yeni dağıtım → Web uygulaması
//     - Şu kullanıcı olarak çalıştır: "Ben"
//     - Kimler erişebilir: "Herkes"
//  4. İzinleri onayla (Drive, Sheets, Mail)
//  5. Verilen URL'yi kopyala → bana gönder
//
//  NOT: Bu tek script 4 formu da yönetir:
//    - Çalıştay Kayıt (type yok veya 'register')
//    - Bildiri Gönderme (type: 'paper')
//    - Teknik Gezi Kayıt (type: 'trip')
//    - Görüş/Öneri (type: 'feedback')
//
// ============================================================

// ---------- AYARLAR ----------
var DRIVE_FOLDER_ID = '1W1Cak4vzr0K8WB7wmOuS3X-XNoJlOuQK';       // Bildiri dosyalarının kaydedileceği Drive klasörü
var SHEETS_ID       = '1wOmKO4dN1ejhOEQg-Bb6YhoNbw4cPlPJ5e9Zz7Wt5ho'; // Verilerin yazılacağı Google Sheets
var ADMIN_EMAIL     = 'erjekum2026@gmail.com';                      // Bildirim gidecek organizator e-postasi

// ---------- TEST FONKSİYONU ----------
// Tarayıcıdan script URL'sine girince çalışır (doğru çalışıp çalışmadığını test eder)
function doGet(e) {
  try {
    var ss = SpreadsheetApp.openById(SHEETS_ID);
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    return ContentService.createTextOutput(
      'ERJEOKUM 2026 Script AKTIF\n' +
      'Sheets: ' + ss.getName() + '\n' +
      'Drive: ' + folder.getName() + '\n' +
      'Tarih: ' + new Date()
    );
  } catch (err) {
    return ContentService.createTextOutput('HATA: ' + err.toString());
  }
}

// ---------- ANA FONKSİYON ----------
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var type = data.type || 'register';

    if (type === 'paper') {
      return handlePaper(data);
    } else if (type === 'trip') {
      return handleTrip(data);
    } else if (type === 'feedback') {
      return handleFeedback(data);
    } else {
      return handleRegister(data);
    }

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}


// ========================================================
//  1. ÇALIŞTAY KAYIT FORMU
// ========================================================
function handleRegister(data) {
  var ss    = SpreadsheetApp.openById(SHEETS_ID);
  var sheet = ss.getSheetByName('Kayitlar');

  if (!sheet) {
    sheet = ss.insertSheet('Kayitlar');
    sheet.appendRow(['Tarih', 'Ad Soyad', 'E-posta', 'Kurum', 'Uzmanlık Alanı']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }

  sheet.appendRow([
    new Date(),
    data.name,
    data.email,
    data.institution || '',
    data.field || ''
  ]);

  // Katılımcıya onay e-postası
  try {
    MailApp.sendEmail({
      to: data.email,
      subject: 'Kayıt Onayı — ERJEOKUM 2026',
      body: 'Sayın ' + data.name + ',\n\n' +
            'Çalıştay ön kaydınız başarıyla alınmıştır.\n\n' +
            'Detaylı bilgi ve program için web sitemizi takip ediniz.\n\n' +
            'Saygılarımızla,\n' +
            'ERJEOKUM 2026 Organizasyon Komitesi\n' +
            'erjekum2026@gmail.com'
    });
  } catch (mailErr) {}

  // Organizatöre bildirim e-postası
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: '[YENİ KAYIT] ' + data.name + ' — ERJEOKUM 2026',
      body: 'Yeni bir çalıştay kaydı alındı!\n\n' +
            '--- KAYIT DETAYLARI ---\n' +
            'Ad Soyad: ' + data.name + '\n' +
            'E-posta: ' + data.email + '\n' +
            'Kurum: ' + (data.institution || '-') + '\n' +
            'Uzmanlık Alanı: ' + (data.field || '-') + '\n' +
            'Tarih: ' + new Date() + '\n\n' +
            '--- Google Sheets ---\n' +
            'https://docs.google.com/spreadsheets/d/' + SHEETS_ID
    });
  } catch (mailErr) {}

  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok' })
  ).setMimeType(ContentService.MimeType.JSON);
}


// ========================================================
//  2. BİLDİRİ GÖNDERİMİ (dosya yükleme dahil)
// ========================================================
function handlePaper(data) {
  // Dosyayı Drive'a kaydet
  var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  var blob   = Utilities.newBlob(
    Utilities.base64Decode(data.fileData),
    data.fileType,
    data.fileName
  );
  var file = folder.createFile(blob);

  // Metadata'yı Sheets'e yaz
  var ss    = SpreadsheetApp.openById(SHEETS_ID);
  var sheet = ss.getSheetByName('Bildiriler');

  if (!sheet) {
    sheet = ss.insertSheet('Bildiriler');
    sheet.appendRow(['Tarih', 'Ad Soyad', 'E-posta', 'Kurum', 'Bildiri Başlığı', 'Dosya Adı', 'Dosya Linki']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }

  sheet.appendRow([
    new Date(),
    data.authorName,
    data.authorEmail,
    data.authorInstitution || '',
    data.paperTitle,
    data.fileName,
    file.getUrl()
  ]);

  // Yazara onay e-postası
  try {
    MailApp.sendEmail({
      to: data.authorEmail,
      subject: 'Bildiriniz Alınmıştır — ERJEOKUM 2026',
      body: 'Sayın ' + data.authorName + ',\n\n' +
            'Bildiriniz başarıyla alınmıştır.\n\n' +
            'Bildiri Başlığı: ' + data.paperTitle + '\n' +
            'Dosya: ' + data.fileName + '\n\n' +
            'Değerlendirme sonuçları e-posta ile bildirilecektir.\n\n' +
            'Saygılarımızla,\n' +
            'ERJEOKUM 2026 Organizasyon Komitesi\n' +
            'erjekum2026@gmail.com'
    });
  } catch (mailErr) {}

  // Organizatöre bildirim e-postası
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: '[YENİ BİLDİRİ] ' + data.paperTitle + ' — ERJEOKUM 2026',
      body: 'Yeni bir bildiri gönderildi!\n\n' +
            '--- BİLDİRİ DETAYLARI ---\n' +
            'Yazar: ' + data.authorName + '\n' +
            'E-posta: ' + data.authorEmail + '\n' +
            'Kurum: ' + (data.authorInstitution || '-') + '\n' +
            'Bildiri Başlığı: ' + data.paperTitle + '\n' +
            'Dosya Adı: ' + data.fileName + '\n' +
            'Drive Linki: ' + file.getUrl() + '\n' +
            'Tarih: ' + new Date() + '\n\n' +
            '--- Google Sheets ---\n' +
            'https://docs.google.com/spreadsheets/d/' + SHEETS_ID
    });
  } catch (mailErr) {}

  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok' })
  ).setMimeType(ContentService.MimeType.JSON);
}


// ========================================================
//  3. TEKNİK GEZİ KAYDI
// ========================================================
function handleTrip(data) {
  var ss    = SpreadsheetApp.openById(SHEETS_ID);
  var sheet = ss.getSheetByName('Teknik Gezi');

  if (!sheet) {
    sheet = ss.insertSheet('Teknik Gezi');
    sheet.appendRow(['Tarih', 'Ad Soyad', 'E-posta', 'Kurum', 'Katılım Süresi']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }

  sheet.appendRow([
    new Date(),
    data.name,
    data.email,
    data.institution || '',
    data.tripDays
  ]);

  // Katılımcıya onay e-postası
  try {
    MailApp.sendEmail({
      to: data.email,
      subject: 'Teknik Gezi Kaydınız Alınmıştır — ERJEOKUM 2026',
      body: 'Sayın ' + data.name + ',\n\n' +
            'Teknik gezi kaydınız alınmıştır.\n\n' +
            'Katılım: ' + data.tripDays + '\n\n' +
            'Teknik gezi ücretlidir. Ücret ve detaylar için sizinle iletişime geçilecektir.\n\n' +
            'Saygılarımızla,\n' +
            'ERJEOKUM 2026 Organizasyon Komitesi\n' +
            'erjekum2026@gmail.com'
    });
  } catch (mailErr) {}

  // Organizatöre bildirim e-postası
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: '[TEKNİK GEZİ] ' + data.name + ' — ERJEOKUM 2026',
      body: 'Yeni bir teknik gezi kaydı alındı!\n\n' +
            '--- KAYIT DETAYLARI ---\n' +
            'Ad Soyad: ' + data.name + '\n' +
            'E-posta: ' + data.email + '\n' +
            'Kurum: ' + (data.institution || '-') + '\n' +
            'Katılım Süresi: ' + data.tripDays + '\n' +
            'Tarih: ' + new Date() + '\n\n' +
            '--- Google Sheets ---\n' +
            'https://docs.google.com/spreadsheets/d/' + SHEETS_ID
    });
  } catch (mailErr) {}

  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok' })
  ).setMimeType(ContentService.MimeType.JSON);
}


// ========================================================
//  4. GÖRÜŞ / ÖNERİ FORMU
// ========================================================
function handleFeedback(data) {
  var ss    = SpreadsheetApp.openById(SHEETS_ID);
  var sheet = ss.getSheetByName('Gorus Oneri');

  if (!sheet) {
    sheet = ss.insertSheet('Gorus Oneri');
    sheet.appendRow(['Tarih', 'Ad Soyad', 'E-posta', 'Mesaj']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }

  sheet.appendRow([
    new Date(),
    data.name,
    data.email,
    data.message
  ]);

  // Gönderene onay e-postası
  try {
    MailApp.sendEmail({
      to: data.email,
      subject: 'Görüşünüz Alınmıştır — ERJEOKUM 2026',
      body: 'Sayın ' + data.name + ',\n\n' +
            'Görüş ve öneriniz için teşekkür ederiz. Mesajınız tarafımıza ulaşmıştır.\n\n' +
            'Gerekli durumlarda sizinle iletişime geçilecektir.\n\n' +
            'Saygılarımızla,\n' +
            'ERJEOKUM 2026 Organizasyon Komitesi\n' +
            'erjekum2026@gmail.com'
    });
  } catch (mailErr) {}

  // Organizatöre bildirim e-postası
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: '[GÖRÜŞ/ÖNERİ] ' + data.name + ' — ERJEOKUM 2026',
      body: 'Yeni bir görüş/öneri mesajı alındı!\n\n' +
            '--- MESAJ DETAYLARI ---\n' +
            'Ad Soyad: ' + data.name + '\n' +
            'E-posta: ' + data.email + '\n' +
            'Mesaj: ' + data.message + '\n' +
            'Tarih: ' + new Date() + '\n\n' +
            '--- Google Sheets ---\n' +
            'https://docs.google.com/spreadsheets/d/' + SHEETS_ID
    });
  } catch (mailErr) {}

  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok' })
  ).setMimeType(ContentService.MimeType.JSON);
}
