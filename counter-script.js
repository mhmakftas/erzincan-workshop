// ============================================
// ZİYARETÇİ SAYACI — Google Apps Script
// ============================================
// Bu kodu Google Apps Script'e yapıştır ve deploy et.
//
// ADIMLAR:
// 1. https://script.google.com adresine git
// 2. "Yeni proje" oluştur
// 3. Bu kodun tamamını yapıştır
// 4. Üstten: Dağıt > Yeni dağıtım
// 5. Tür: "Web uygulaması"
// 6. Erişim: "Herkes" (Anyone)
// 7. "Dağıt" butonuna bas
// 8. Verilen URL'yi kopyala
// 9. index.html'deki APPS_SCRIPT_URL_BURAYA yerine yapıştır
// ============================================

function doGet(e) {
  var props = PropertiesService.getScriptProperties();
  var count = parseInt(props.getProperty('visitorCount') || '0');
  count++;
  props.setProperty('visitorCount', count.toString());

  return ContentService
    .createTextOutput(JSON.stringify({ count: count }))
    .setMimeType(ContentService.MimeType.JSON);
}
