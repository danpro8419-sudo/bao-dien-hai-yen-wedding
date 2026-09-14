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
