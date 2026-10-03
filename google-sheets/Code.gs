/**
 * Nhận RSVP từ website cưới và ghi vào Google Sheet.
 * Cùng họ tên (không phân biệt hoa/thường) => CẬP NHẬT dòng cũ, không tạo dòng trùng.
 * Hướng dẫn cài đặt: xem README.md mục "Lưu RSVP vào Google Sheets".
 */
var SHEET_NAME = "RSVP";
var HEADERS = ["ID", "Thời gian", "Họ tên", "Tham dự", "Số khách", "Món ăn", "Dị ứng", "Bài hát", "Lời nhắn"];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var list = JSON.parse(e.postData.contents);
    if (!Array.isArray(list)) list = [list];

    var sheet = getSheet_();
    var last = sheet.getLastRow();
    var rows = last > 1 ? sheet.getRange(2, 1, last - 1, HEADERS.length).getValues() : [];
    var index = {};
    rows.forEach(function (r, i) { index[norm_(r[2])] = i + 2; }); // họ tên -> số dòng

    var saved = 0, created = [], updated = [];
    list.forEach(function (rec) {
      if (!rec || !rec.fullName) return;
      var meal = rec.attending === "yes" ? (rec.meal === "Other" && rec.mealOther ? "Other: " + rec.mealOther : rec.meal) : "";
      var row = [
        rec.id, formatTime_(rec.submittedAt), rec.fullName,
        rec.attending === "yes" ? "Có" : "Không",
        rec.attending === "yes" ? Number(rec.guestCount) || 1 : "",
        meal, rec.allergy, rec.songRequest, rec.message
      ].map(safe_);
      var at = index[norm_(rec.fullName)];
      if (at) {
        sheet.getRange(at, 1, 1, HEADERS.length).setValues([row]);
        updated.push(rec);
      } else {
        sheet.appendRow(row);
        index[norm_(rec.fullName)] = sheet.getLastRow();
        created.push(rec);
      }
      saved++;
    });
    notify_(sheet, created, updated); // lỗi gửi mail không được làm mất RSVP
    return json_({ ok: true, saved: saved });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- Email thông báo ---------- */
// Để trống = gửi về chính email của bạn (chủ script). Nhiều người: "a@gmail.com, b@gmail.com"
var NOTIFY_EMAIL = "";

function notify_(sheet, created, updated) {
  try {
    if (!created.length && !updated.length) return;
    var to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
    if (!to) return;

    var data = sheet.getLastRow() > 1 ? sheet.getRange(2, 4, sheet.getLastRow() - 1, 2).getValues() : [];
    var yes = 0, no = 0, guests = 0;
    data.forEach(function (r) {
      if (r[0] === "Có") { yes++; guests += Number(r[1]) || 1; } else if (r[0] === "Không") no++;
    });
    var summary = "Tổng hiện tại: " + yes + " phản hồi tham dự (" + guests + " khách), " + no + " từ chối.";
    var link = "Mở danh sách: " + SpreadsheetApp.getActiveSpreadsheet().getUrl();

    var all = created.concat(updated), subject, lines = [];
    if (all.length === 1) {
      var r = all[0], isNew = created.length === 1;
      var yesAtt = r.attending === "yes";
      subject = (isNew ? "RSVP mới: " : "RSVP cập nhật: ") + r.fullName + " — " + (yesAtt ? "Có (" + (r.guestCount || 1) + " khách)" : "Không tham dự");
      lines = [
        "Họ tên: " + r.fullName,
        "Tham dự: " + (yesAtt ? "Có" : "Không"),
        yesAtt ? "Số khách: " + (r.guestCount || 1) : "",
        yesAtt ? "Món ăn: " + (r.meal === "Other" && r.mealOther ? "Other: " + r.mealOther : r.meal) : "",
        r.allergy ? "Dị ứng: " + r.allergy : "",
        r.songRequest ? "Bài hát: " + r.songRequest : "",
        r.message ? "Lời nhắn: " + r.message : ""
      ].filter(Boolean);
    } else {
      subject = "RSVP: " + created.length + " mới, " + updated.length + " cập nhật";
      lines = all.slice(0, 30).map(function (x) {
        return "• " + x.fullName + " — " + (x.attending === "yes" ? "Có (" + (x.guestCount || 1) + ")" : "Không");
      });
      if (all.length > 30) lines.push("… và " + (all.length - 30) + " phản hồi khác");
    }
    MailApp.sendEmail({ to: to, subject: subject, body: lines.join("\n") + "\n\n" + summary + "\n" + link, name: "Wedding RSVP" });
  } catch (err) { /* bỏ qua: dữ liệu RSVP đã được lưu */ }
}

// Mở link web app trực tiếp trên trình duyệt để kiểm tra đã triển khai đúng chưa.
function doGet() { return json_({ ok: true, message: "RSVP endpoint is running" }); }

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold").setBackground("#EDE4D3");
    sheet.setFrozenRows(1);
    sheet.getRange("A:A").setFontColor("#999999");
  }
  return sheet;
}
function norm_(s) { return String(s || "").trim().toLowerCase().replace(/\s+/g, " "); }
// Chặn công thức (=, +, -, @) do khách nhập vào ô Sheet
function safe_(v) {
  v = v == null ? "" : v;
  return typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v;
}
function formatTime_(iso) {
  var d = new Date(iso);
  return isNaN(d) ? "" : Utilities.formatDate(d, "Asia/Ho_Chi_Minh", "dd/MM/yyyy HH:mm");
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
