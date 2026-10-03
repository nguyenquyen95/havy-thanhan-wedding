(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  function toast(m) { var t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("on"); }, 2200); }
  function fmt(iso) {
    var d = new Date(iso); if (isNaN(d)) return "";
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function mealOf(r) { return r.attending !== "yes" ? "" : (r.meal === "Other" && r.mealOther ? "Other: " + r.mealOther : r.meal); }

  function stats(list) {
    var yes = list.filter(function (r) { return r.attending === "yes"; });
    var guests = yes.reduce(function (s, r) { return s + (r.guestCount || 1); }, 0);
    var veg = yes.filter(function (r) { return r.meal === "Vegetarian"; }).reduce(function (s, r) { return s + (r.guestCount || 1); }, 0);
    var al = yes.filter(function (r) { return r.allergy; }).length;
    var data = [["Phản hồi", list.length], ["Tham dự", yes.length], ["Từ chối", list.length - yes.length], ["Tổng số khách", guests], ["Khách ăn chay", veg], ["Có dị ứng", al]];
    var box = $("#stats"); box.textContent = "";
    data.forEach(function (d) { var s = el("div", "stat"); s.appendChild(el("b", null, d[1])); s.appendChild(el("span", null, d[0])); box.appendChild(s); });
  }

  function render() {
    var all = RSVPStore.all().slice().sort(function (a, b) { return (b.submittedAt || "").localeCompare(a.submittedAt || ""); });
    stats(all);
    var q = $("#q").value.trim().toLowerCase();
    var list = !q ? all : all.filter(function (r) { return JSON.stringify(r).toLowerCase().indexOf(q) > -1; });
    var body = $("#rows"); body.textContent = "";
    list.forEach(function (r) {
      var tr = el("tr");
      tr.appendChild(el("td", null, fmt(r.submittedAt)));
      tr.appendChild(el("td", null, r.fullName));
      tr.appendChild(el("td", r.attending === "yes" ? "yes" : "no", r.attending === "yes" ? "Có" : "Không"));
      tr.appendChild(el("td", null, r.attending === "yes" ? r.guestCount : ""));
      tr.appendChild(el("td", null, mealOf(r)));
      tr.appendChild(el("td", null, r.allergy || ""));
      tr.appendChild(el("td", null, r.songRequest || ""));
      tr.appendChild(el("td", "msg", r.message || ""));
      var td = el("td"), x = el("button", "x", "×"); x.type = "button"; x.title = "Xóa"; x.setAttribute("aria-label", "Xóa " + r.fullName);
      x.addEventListener("click", function () { if (confirm("Xóa phản hồi của " + r.fullName + "?")) { RSVPStore.remove(r.id); render(); } });
      td.appendChild(x); tr.appendChild(td); body.appendChild(tr);
    });
    $("#empty").hidden = list.length > 0;
    $("#empty").textContent = all.length ? "Không có kết quả phù hợp." : "Chưa có phản hồi nào.";
  }

  function download(name, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type })), a = el("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  function cell(v) {
    v = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; // chống CSV injection khi mở bằng Excel
    return '"' + v.replace(/"/g, '""') + '"';
  }
  $("#csv").addEventListener("click", function () {
    var list = RSVPStore.all();
    if (!list.length) return toast("Chưa có dữ liệu để xuất");
    var head = ["Thời gian", "Họ tên", "Tham dự", "Số khách", "Món ăn", "Dị ứng", "Bài hát", "Lời nhắn"];
    var rows = list.map(function (r) {
      return [fmt(r.submittedAt), r.fullName, r.attending === "yes" ? "Có" : "Không", r.attending === "yes" ? r.guestCount : "", mealOf(r), r.allergy, r.songRequest, r.message].map(cell).join(",");
    });
    download("RSVP-HaVy-ThanhAn.csv", "﻿" + [head.map(cell).join(",")].concat(rows).join("\r\n"), "text/csv;charset=utf-8");
  });
  $("#json").addEventListener("click", function () {
    download("RSVP-backup.json", JSON.stringify(RSVPStore.all(), null, 2), "application/json");
  });
  $("#importBtn").addEventListener("click", function () { $("#file").click(); });
  $("#file").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var arr = JSON.parse(rd.result);
        if (!Array.isArray(arr)) throw 0;
        var cur = RSVPStore.all(), ids = {};
        cur.forEach(function (r) { ids[r.id] = 1; });
        var added = arr.filter(function (r) { return r && r.fullName && r.id && !ids[r.id]; });
        RSVPStore.replaceAll(cur.concat(added)); render();
        toast("Đã nhập " + added.length + " phản hồi");
      } catch (err) { toast("File không hợp lệ"); }
      e.target.value = "";
    };
    rd.readAsText(f);
  });
  $("#clear").addEventListener("click", function () {
    if (!RSVPStore.all().length) return;
    if (confirm("Xóa TẤT CẢ phản hồi trên trình duyệt này? Hãy xuất JSON để sao lưu trước. Không thể hoàn tác.")) { RSVPStore.clear(); render(); }
  });
  $("#q").addEventListener("input", render);
  render();
})();

(function () {
  var b = document.getElementById("sync");
  if (!RSVPStore.hasSheet()) return;
  b.hidden = false;
  b.addEventListener("click", function () {
    b.disabled = true; b.textContent = "Đang gửi…";
    RSVPStore.syncAll().then(function (ok) {
      b.disabled = false; b.textContent = "Gửi lên Google Sheet";
      var t = document.getElementById("toast");
      t.textContent = ok ? "Đã gửi " + RSVPStore.all().length + " phản hồi lên Google Sheet — hãy kiểm tra trong Sheet" : "Không gửi được — kiểm tra mạng và URL trong data.js";
      t.classList.add("on"); setTimeout(function () { t.classList.remove("on"); }, 3500);
    });
  });
})();
