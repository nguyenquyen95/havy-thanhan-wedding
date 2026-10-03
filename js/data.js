/* =====================================================================
   DỮ LIỆU SỰ KIỆN — chỗ DUY NHẤT cần sửa khi thay thông tin thật.
   Các mục đánh dấu TODO là thông tin chưa được cung cấp, KHÔNG tự bịa.
   ===================================================================== */
window.WEDDING = {
  couple: "Hà Vy & Thanh An",
  dateLabel: "10.10.2026",

  // Thời gian sự kiện (múi giờ Việt Nam, GMT+7). Giờ kết thúc 23:00 là mặc định cho file lịch.
  startISO: "2026-10-10T16:30:00+07:00",
  endISO: "2026-10-10T23:00:00+07:00",

  venue: {
    name: "The Glasshouse Garden",
    area: "Thảo Điền · Hồ Chí Minh",
    // TODO: địa điểm hiện là GIẢ LẬP. Khi có địa điểm thật, dán link Google Maps vào mapsUrl.
    // Để trống thì nút sẽ tìm kiếm theo tên + khu vực.
    mapsUrl: "",
    address: "" // TODO: địa chỉ thật (để trống thì không hiển thị)
  },
  arrival: "16:30",
  arriveBefore: "17:10",

  rsvp: {
    deadlineISO: "2026-09-20T23:59:59+07:00",
    // false: form luôn mở (phù hợp bản demo). true: tự đóng form sau hạn deadline.
    closeAfterDeadline: false,
    // Dán URL "Web app" của Google Apps Script để RSVP gửi về Google Sheets (xem README, mục Google Sheets).
    // Để trống = chỉ lưu trên trình duyệt này.
    endpoint: "https://script.google.com/macros/s/AKfycbxYphxnfROEXkqsk1Lxrse9VudMAnEppfd2Y1klqWq2bGJYnCTONH1LrCxVfg_5ENc2/exec"
  },

  keyTimes: [
    { time: "16:30", label: "Guest Arrival" },
    { time: "17:30", label: "Ceremony" },
    { time: "18:30", label: "Dinner" },
    { time: "20:30", label: "Celebration" }
  ],

  schedule: [
    { time: "16:30", en: "Welcome Drinks", vi: "Đón khách" },
    { time: "17:30", en: "Ceremony", vi: "Lễ cưới" },
    { time: "18:00", en: "Cocktails & Golden Hour", vi: "Cocktail & chụp ảnh" },
    { time: "18:30", en: "Dinner", vi: "Tiệc tối" },
    { time: "20:00", en: "First Dance", vi: "Điệu nhảy đầu tiên" },
    { time: "20:30", en: "The Party", vi: "Tiệc mừng" },
    { time: "22:00", en: "Late Night", vi: "Cuộc vui tiếp tục" }
  ],

  // answer: null  → hiển thị "sẽ cập nhật sớm". Điền câu trả lời khi đã xác nhận.
  qa: [
    { q: "Tôi nên đến lúc mấy giờ?", a: "Đón khách từ 16:30. Bạn nên có mặt trước 17:10 để kịp lễ cưới lúc 17:30." },
    { q: "Dress code là gì?", a: "Modern Garden Formal — thanh lịch, hiện đại, tự nhiên. Màu gợi ý: Ivory, Champagne, Olive, Dusty Rose, Terracotta/Burgundy, Chocolate, Black." },
    { q: "Có món chay không?", a: "Bạn có thể chọn Vegetarian khi điền RSVP." },
    { q: "Có chỗ đỗ xe không?", a: null }, // TODO: cần cặp đôi/venue xác nhận
    { q: "Tôi có thể đưa người đi cùng không?", a: null }, // TODO
    { q: "Tôi có thể mang theo trẻ em không?", a: null } // TODO
  ],

  // Quà mừng: chỉ hiển thị khi enabled = true VÀ đã điền số tài khoản.
  gifts: {
    enabled: false,
    bankName: "", // TODO
    accountName: "", // TODO
    accountNumber: "", // TODO
    qrImage: "" // TODO: đường dẫn ảnh QR tạo từ dữ liệu thật, vd "images/qr.png"
  }
};
