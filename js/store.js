/* Lớp lưu RSVP.
   1) Luôn lưu vào localStorage của trình duyệt (không cần server).
   2) Nếu WEDDING.rsvp.endpoint có URL (Google Apps Script) -> gửi thêm lên Google Sheet.
      Gửi lỗi (mất mạng...) thì giữ trong hàng đợi và tự gửi lại ở lần mở trang sau. */
(function () {
  var KEY = "hvta_rsvps_v1", QKEY = "hvta_rsvps_pending_v1";
  var memory = [], memQ = [];
  var available = true;

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      var v = raw ? JSON.parse(raw) : [];
      return Array.isArray(v) ? v : [];
    } catch (e) { available = false; return fallback; }
  }
  function save(key, list) {
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { available = false; }
  }
  function read() { return load(KEY, memory); }
  function write(list) { memory = list; save(KEY, list); }
  function norm(s) { return String(s || "").trim().toLowerCase().replace(/\s+/g, " "); }
  function uid() { return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function endpoint() { return (window.WEDDING && window.WEDDING.rsvp && window.WEDDING.rsvp.endpoint) || ""; }

  // Gửi một mảng bản ghi lên Google Sheet. Resolve nếu request đi được tới Google.
  function post(records) {
    return fetch(endpoint(), { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(records) });
  }
  function queueAdd(rec) {
    var q = load(QKEY, memQ).filter(function (r) { return r.id !== rec.id; });
    q.push(rec); memQ = q; save(QKEY, q);
  }
  function flush() {
    if (!endpoint()) return Promise.resolve(false);
    var q = load(QKEY, memQ);
    if (!q.length) return Promise.resolve(true);
    return post(q).then(function () { memQ = []; save(QKEY, []); return true; }, function () { return false; });
  }

  window.RSVPStore = {
    isAvailable: function () { read(); return available; },
    hasSheet: function () { return !!endpoint(); },
    pendingCount: function () { return load(QKEY, memQ).length; },
    all: read,
    // Lưu 1 phản hồi. Cùng họ tên -> cập nhật phản hồi cũ. Trả về Promise {updated, synced}.
    save: function (entry) {
      var list = read(), idx = -1, i;
      for (i = 0; i < list.length; i++) if (norm(list[i].fullName) === norm(entry.fullName)) { idx = i; break; }
      var rec = Object.assign({ id: uid(), submittedAt: new Date().toISOString() }, entry);
      var updated = idx >= 0;
      if (updated) { rec.id = list[idx].id; list[idx] = rec; } else { list.push(rec); }
      write(list);

      if (!endpoint()) return Promise.resolve({ updated: updated, synced: null, record: rec });
      queueAdd(rec);
      return flush().then(function (ok) { return { updated: updated, synced: ok, record: rec }; });
    },
    // Gửi lại TOÀN BỘ RSVP đang có trên trình duyệt này lên Sheet (Sheet tự bỏ trùng theo họ tên).
    syncAll: function () {
      if (!endpoint()) return Promise.resolve(false);
      return post(read()).then(function () { return true; }, function () { return false; });
    },
    flushPending: flush,
    remove: function (id) { write(read().filter(function (r) { return r.id !== id; })); },
    replaceAll: function (arr) { write(Array.isArray(arr) ? arr : []); },
    clear: function () { write([]); }
  };

  // Tự gửi lại các RSVP chưa lên được Sheet.
  if (endpoint()) window.addEventListener("load", function () { flush(); });
})();
