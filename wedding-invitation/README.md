# Bảo Điền & Hải Yến — Wedding Invitation

Starter frontend cho concept **Luxury Cinematic × Vietnamese Modern**.

## Chạy thử
Mở `index.html` bằng trình duyệt hoặc dùng VS Code Live Server.

## Cấu hình
Sửa `js/config.js`.

- `weddingDate`: ngày/giờ countdown.
- `theNightBefore`: `false` = ẩn, `true` = hiện.
- `locations`: điền địa chỉ và Google Maps URL sau.

## Lưu ý
Đây là bản UI/frontend đầu tiên. Upload ảnh/video, RSVP, Admin Auth, Supabase Storage/Database và RLS sẽ được kết nối ở bước tiếp theo.

Đặt file nhạc thật tại:
`assets/music/music.mp3`

Ảnh thật có thể đặt trong:
`assets/images/`


## V4 — Admin

Sau khi chạy `supabase/schema.sql`, chạy thêm `supabase/admin-migration.sql`.

Admin user hiện tại đã được cấp quyền bằng UUID trong migration.

Mở `/admin/` để đăng nhập bằng tài khoản Supabase Auth.


## V5 — Sticky Countdown
Countdown is now section #2 after the opening. Once scrolled past, it becomes a compact sticky pill on desktop and a full-width top bar on mobile. On/after 03.01.2027 it changes to `WE ARE MARRIED ❤️`. Supabase, RSVP, Guest Upload and Admin are unchanged.
