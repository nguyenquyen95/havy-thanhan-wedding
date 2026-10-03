(function () {
  "use strict";
  var W = window.WEDDING;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg; t.classList.add("on");
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("on"); }, 2200);
  }

  /* ---------- nav ---------- */
  var navToggle = $("#navToggle"), navLinks = $("#navLinks");
  function closeNav() { navLinks.classList.remove("open"); navToggle.setAttribute("aria-expanded", "false"); navToggle.setAttribute("aria-label", "Mở menu"); }
  navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open);
    navToggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
  });
  navLinks.addEventListener("click", function (e) { if (e.target.closest("a")) closeNav(); });

  /* ---------- venue / map ---------- */
  var mapUrl = W.venue.mapsUrl ||
    "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(W.venue.name + " " + W.venue.area.replace("·", ","));
  $("#mapBtn1").href = mapUrl; $("#mapBtn2").href = mapUrl;
  $("#placeName").textContent = W.venue.name; $("#placeArea").textContent = W.venue.area;
  $("#venueName").textContent = W.venue.name; $("#venueArea").textContent = W.venue.area;
  $("#vArrival").textContent = W.arrival; $("#vBefore").textContent = W.arriveBefore;
  if (W.venue.address) { var a = $("#venueAddr"); a.textContent = W.venue.address; a.hidden = false; }

  /* ---------- key times + schedule ---------- */
  var kt = $("#keytimes");
  W.keyTimes.forEach(function (k) {
    var d = el("div"); d.appendChild(el("b", null, k.time)); d.appendChild(el("span", null, k.label)); kt.appendChild(d);
  });
  var sch = $("#schedule");
  W.schedule.forEach(function (s, i) {
    var li = el("li", "sc reveal");
    li.style.setProperty("--d", (i % 3) * 0.05 + "s");
    li.appendChild(el("time", null, s.time));
    var d = el("div"); d.appendChild(el("h3", null, s.en)); d.appendChild(el("p", null, s.vi));
    li.appendChild(d); sch.appendChild(li);
  });
  function scheduleProgress() {
    var r = sch.getBoundingClientRect(), vh = window.innerHeight;
    var p = (vh * 0.7 - r.top) / r.height;
    sch.style.setProperty("--p", Math.max(0, Math.min(1, p)));
  }
  window.addEventListener("scroll", scheduleProgress, { passive: true }); scheduleProgress();

  /* ---------- Q&A ---------- */
  var acc = $("#acc");
  W.qa.forEach(function (it) {
    var d = el("details"), s = el("summary", null, it.q);
    var a = el("p", "ans" + (it.a ? "" : " pending"), it.a || "Thông tin này sẽ được cập nhật sớm. Bạn có thể nhắn trực tiếp cho Hà Vy & Thanh An.");
    d.appendChild(s); d.appendChild(a); acc.appendChild(d);
  });

  /* ---------- gifts (chỉ hiện khi có dữ liệu thật) ---------- */
  var g = W.gifts;
  if (g.enabled && g.accountNumber) {
    var card = $("#giftCard"), dl = el("dl");
    [["Ngân hàng", g.bankName], ["Chủ tài khoản", g.accountName], ["Số tài khoản", g.accountNumber]].forEach(function (p) {
      if (!p[1]) return;
      var w = el("div"); w.appendChild(el("dt", null, p[0])); w.appendChild(el("dd", null, p[1])); dl.appendChild(w);
    });
    card.appendChild(dl);
    if (g.qrImage) { var im = el("img"); im.src = g.qrImage; im.alt = "Mã QR chuyển khoản"; card.appendChild(im); }
    var cb = el("button", "btn btn--ghost", "Copy số tài khoản"); cb.type = "button";
    cb.addEventListener("click", function () {
      function done() { toast("Đã sao chép số tài khoản"); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(g.accountNumber).then(done, fallback);
      else fallback();
      function fallback() {
        var t = el("textarea"); t.value = g.accountNumber; document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); done(); } catch (e) { toast("Không sao chép được — hãy chép thủ công"); }
        document.body.removeChild(t);
      }
    });
    card.appendChild(cb);
    $("#gifts").hidden = false;
  }

  /* ---------- countdown ---------- */
  var target = new Date(W.startISO).getTime();
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function tick() {
    var diff = Math.max(0, target - Date.now()), s = Math.floor(diff / 1000);
    $("#cdD").textContent = Math.floor(s / 86400);
    $("#cdH").textContent = pad(Math.floor(s % 86400 / 3600));
    $("#cdM").textContent = pad(Math.floor(s % 3600 / 60));
    $("#cdS").textContent = pad(s % 60);
  }
  tick(); setInterval(tick, 1000);

  /* ---------- add to calendar ---------- */
  function utc(iso) { return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  var calTitle = W.couple + " — Wedding";
  var calLoc = W.venue.name + ", " + W.venue.area.replace("·", ",") + (W.venue.address ? ", " + W.venue.address : "");
  var calDesc = "Guest arrival " + W.arrival + ", please arrive before " + W.arriveBefore + ". Dress code: Modern Garden Formal.";
  $("#calGoogle").href = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(calTitle) +
    "&dates=" + utc(W.startISO) + "/" + utc(W.endISO) + "&details=" + encodeURIComponent(calDesc) + "&location=" + encodeURIComponent(calLoc);
  function esc(s) { return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type }), url = URL.createObjectURL(blob), a = el("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  var calBtn = $("#calBtn"), calMenu = $("#calMenu");
  calBtn.addEventListener("click", function () { calMenu.hidden = !calMenu.hidden; calBtn.setAttribute("aria-expanded", !calMenu.hidden); });
  document.addEventListener("click", function (e) { if (!e.target.closest("#cal")) { calMenu.hidden = true; calBtn.setAttribute("aria-expanded", "false"); } });
  $("#calGoogle").addEventListener("click", function () { calMenu.hidden = true; });
  $("#calIcs").addEventListener("click", function () {
    var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//HaVy-ThanhAn//Wedding//VI", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      "UID:hvta-wedding-20261010@wedding", "DTSTAMP:" + utc(new Date().toISOString()),
      "DTSTART:" + utc(W.startISO), "DTEND:" + utc(W.endISO),
      "SUMMARY:" + esc(calTitle), "LOCATION:" + esc(calLoc), "DESCRIPTION:" + esc(calDesc),
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    download("Ha-Vy-Thanh-An-Wedding.ics", ics, "text/calendar;charset=utf-8");
    calMenu.hidden = true; toast("Đã tải file lịch");
  });

  /* ---------- reveal ---------- */
  var revs = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revs.forEach(function (n) { io.observe(n); });
  } else revs.forEach(function (n) { n.classList.add("in"); });

  /* ---------- gallery + lightbox ---------- */
  var items = $$(".g"), tabs = $$(".tab"), shown = [], cur = 0;
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (x) { x.classList.toggle("is-on", x === t); x.setAttribute("aria-selected", x === t); });
      var f = t.dataset.filter;
      items.forEach(function (i) { i.hidden = !(f === "all" || i.dataset.group === f); });
    });
  });
  var lb = $("#lb"), lbImg = $("#lbImg"), lastFocus = null;
  function openLb(i) {
    shown = items.filter(function (x) { return !x.hidden; });
    cur = shown.indexOf(items[i]); if (cur < 0) cur = 0;
    lastFocus = document.activeElement; show(); lb.hidden = false; document.body.style.overflow = "hidden"; $("#lbClose").focus();
  }
  function show() { var im = shown[cur].querySelector("img"); lbImg.src = im.src; lbImg.alt = im.alt; }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  function step(d) { cur = (cur + d + shown.length) % shown.length; show(); }
  items.forEach(function (b, i) { b.addEventListener("click", function () { openLb(i); }); });
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", function () { step(-1); });
  $("#lbNext").addEventListener("click", function () { step(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb(); else if (e.key === "ArrowLeft") step(-1); else if (e.key === "ArrowRight") step(1);
  });
  var sx = null;
  lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });

  /* ---------- RSVP ---------- */
  var form = $("#rsvpForm"), thanks = $("#thanks");
  var guestSel = $("#guestCount");
  for (var n = 1; n <= 10; n++) { var o = el("option", null, n === 1 ? "1 guest" : n + " guests"); o.value = n; guestSel.appendChild(o); }
  var yesOnly = $("#yesOnly"), mealSel = $("#meal"), mealOther = $("#mealOther");
  function syncAttending() {
    var v = (form.querySelector("input[name=attending]:checked") || {}).value;
    yesOnly.hidden = v !== "yes";
  }
  $$("input[name=attending]").forEach(function (r) { r.addEventListener("change", syncAttending); });
  mealSel.addEventListener("change", function () { mealOther.hidden = mealSel.value !== "Other"; if (!mealOther.hidden) mealOther.focus(); });
  if (!RSVPStore.isAvailable()) $("#storeNote").hidden = false;

  var dl = new Date(W.rsvp.deadlineISO), now = new Date();
  var d2 = function (n) { return (n < 10 ? "0" : "") + n; };
  var dlLabel = d2(dl.getDate()) + "." + d2(dl.getMonth() + 1) + "." + dl.getFullYear();
  var closed = W.rsvp.closeAfterDeadline && now > dl;
  var dlEl = $("#rsvpDeadline");
  if (closed) {
    dlEl.textContent = "Đã hết hạn nhận RSVP (" + dlLabel + "). Vui lòng liên hệ trực tiếp Hà Vy & Thanh An.";
    dlEl.hidden = false; form.hidden = true;
  } else if (now <= dl) {
    dlEl.textContent = "Please reply by " + dlLabel + " · Vui lòng phản hồi trước " + dlLabel; dlEl.hidden = false;
  }

  function setErr(name, msg) {
    var p = $('[data-err="' + name + '"]'); if (p) { p.textContent = msg || ""; p.closest(".field").classList.toggle("bad", !!msg); }
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.fullName.value.trim().replace(/\s+/g, " ");
    var att = (form.querySelector("input[name=attending]:checked") || {}).value;
    var ok = true;
    setErr("fullName", name ? "" : "Vui lòng nhập họ tên."); if (!name) ok = false;
    setErr("attending", att ? "" : "Vui lòng chọn một lựa chọn."); if (!att) ok = false;
    if (!ok) { var bad = form.querySelector(".bad input, .bad .choice input"); (bad || form.fullName).focus(); return; }
    var rec = {
      fullName: name, attending: att,
      guestCount: att === "yes" ? parseInt(guestSel.value, 10) || 1 : 0,
      meal: att === "yes" ? mealSel.value : "",
      mealOther: att === "yes" && mealSel.value === "Other" ? mealOther.value.trim() : "",
      allergy: att === "yes" ? form.allergy.value.trim() : "",
      songRequest: att === "yes" ? form.song.value.trim() : "",
      message: form.message.value.trim()
    };
    RSVPStore.save(rec).then(function (res) {
      $("#thanksMsg").textContent = att === "yes" ? "Thank you. We’ll see you on 10.10." : "Thank you for letting us know. We’ll miss you.";
      var sub = res.updated ? "Phản hồi trước đó của bạn đã được cập nhật." : "";
      if (res.synced === false) sub += " Hiện chưa gửi được tới cặp đôi do kết nối mạng — trang sẽ tự thử lại khi bạn mở lại.";
      $("#thanksSub").textContent = sub.trim();
      form.hidden = true; thanks.hidden = false; thanks.focus();
      thanks.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
  $("#again").addEventListener("click", function () {
    form.reset(); syncAttending(); mealOther.hidden = true;
    thanks.hidden = true; form.hidden = false; form.fullName.focus();
  });
})();
