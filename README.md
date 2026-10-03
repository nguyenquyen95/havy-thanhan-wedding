# Wedding Website — Hà Vy & Thanh An (10.10.2026)

## Cách mở
Double-click **`index.html`** — không cần cài đặt hay chạy server.
Trang quản lý RSVP cho cặp đôi: mở **`admin.html`** (không có link từ trang chính).
Cần Internet cho: font chữ (Google Fonts, có font dự phòng nếu offline), Google Maps/Calendar.

## Cấu trúc
```
index.html      trang thiệp
admin.html      danh sách RSVP, thống kê, xuất CSV/JSON
js/data.js      ★ MỌI thông tin sự kiện (giờ, lịch trình, Q&A, quà mừng…) — sửa ở đây
js/store.js     lưu RSVP (localStorage)
js/main.js      hành vi trang thiệp · js/admin.js: trang quản lý
css/style.css   giao diện
images/         ảnh (JPG đã tối ưu, ~5.6MB tổng)
```

## RSVP được lưu thế nào (quan trọng)
RSVP lưu trong **localStorage của trình duyệt đang dùng**: đóng/mở lại vẫn còn, nhưng **chỉ nằm trên máy đó**.
- Dùng để demo/portfolio: ổn.
- Gửi link cho khách thật: cần nối Google Sheets — xem mục "Lưu RSVP vào Google Sheets" bên dưới.
- Luôn bấm **Xuất JSON** trong `admin.html` để sao lưu. Xóa dữ liệu trình duyệt sẽ mất RSVP.
- Trình duyệt Firefox mở file trực tiếp có thể tách dữ liệu theo từng file; dùng Chrome/Safari hoặc đưa lên hosting để `index.html` và `admin.html` dùng chung dữ liệu.


## Lưu RSVP vào Google Sheets (làm 1 lần, ~5 phút)
1. Vào https://sheets.google.com → tạo Sheet trống, đặt tên "RSVP Hà Vy & Thanh An".
2. Menu **Extensions (Tiện ích mở rộng) → Apps Script**. Xóa code mẫu, dán toàn bộ nội dung file `google-sheets/Code.gs` → bấm **Save**.
3. Bấm **Deploy (Triển khai) → New deployment → chọn loại "Web app"**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone** (bắt buộc, để khách chưa đăng nhập Google vẫn gửi được)
   - Bấm **Deploy** → cấp quyền khi Google hỏi (Advanced → Go to project) → **copy "Web app URL"** (dạng `https://script.google.com/macros/s/…/exec`).
4. Dán URL vào `js/data.js`: `endpoint: "https://script.google.com/macros/s/…/exec"`.
5. Kiểm tra: mở URL ở bước 3 trên trình duyệt → thấy `{"ok":true,…}`. Rồi gửi thử 1 RSVP trên web → Sheet xuất hiện tab **RSVP** với dòng mới.
6. RSVP đã có sẵn trên máy này? Mở `admin.html` → bấm **Gửi lên Google Sheet** (tự bỏ trùng theo họ tên).

Lưu ý:
- Mỗi lần sửa `Code.gs` phải **Deploy → Manage deployments → Edit → New version**, URL giữ nguyên.
- Cùng họ tên gửi lại → cập nhật dòng cũ. Hai khách trùng họ tên sẽ bị ghi đè — hãy nhắc khách ghi tên đầy đủ.
- Gửi lỗi (mất mạng) → web giữ lại và tự gửi lại khi khách mở trang lần sau. Trình duyệt không đọc được phản hồi của Google nên **luôn kiểm tra Sheet sau khi gửi thử**.
- Ai có URL web app đều gửi được dữ liệu vào Sheet của bạn; đừng đăng URL công khai. Sheet tự nó chỉ mình bạn xem được.

## Email báo khi có RSVP mới
`Code.gs` tự gửi email mỗi khi có RSVP mới/cập nhật (tên, tham dự, số khách, món ăn, lời nhắn + tổng hiện tại + link Sheet).
- Mặc định gửi về email của chủ script. Muốn gửi cho nhiều người: điền `NOTIFY_EMAIL = "a@gmail.com, b@gmail.com"` ở đầu mục "Email thông báo".
- Sau khi dán code mới: **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**, và bấm cấp quyền gửi email khi Google hỏi. URL không đổi.
- Gửi hàng loạt (nút "Gửi lên Google Sheet") chỉ tạo 1 email tóm tắt. Giới hạn ~100 email/ngày; lần đầu có thể rơi vào Spam.
- Lỗi gửi mail không làm mất RSVP — dữ liệu vẫn vào Sheet.

## Còn thiếu — cần cặp đôi cung cấp (xem TODO trong `js/data.js`)
1. Địa điểm thật: tên, địa chỉ, link Google Maps (hiện **The Glasshouse Garden là giả lập**, nút Maps chỉ tìm theo tên).
2. Quà mừng: ngân hàng/số tài khoản/QR thật → đặt `gifts.enabled = true`. Đến lúc đó mục Gifts mới hiện.
3. Q&A chưa có đáp án: đỗ xe, người đi cùng, trẻ em (đang hiện "sẽ cập nhật sớm").
4. Hạn RSVP 20.09.2026 đã qua so với ngày hiện tại; form đang để **luôn mở** (`closeAfterDeadline: false`). Đổi ngày hoặc bật `true` nếu muốn tự đóng form.
5. Ảnh chưa có: nhẫn, bouquet, flatlay riêng, các ảnh pre-wedding bổ sung.

## Đưa lên mạng
Kéo cả folder vào Netlify Drop / Vercel / GitHub Pages để có link ngắn. Sau đó đổi `og:image` trong `index.html` thành URL tuyệt đối (để Zalo/Messenger hiện ảnh bìa). Trang đang đặt `noindex` để không xuất hiện trên Google.
`admin.html` chỉ được ẩn chứ không có mật khẩu.
