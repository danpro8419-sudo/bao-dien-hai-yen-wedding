# BẢO ĐIỀN & HẢI YẾN — SUPABASE SETUP

## Đã kết nối frontend
Project URL:
`https://ijdtbdldkqorosukjqry.supabase.co`

Frontend dùng publishable key. Không đặt service_role/secret key vào website.

## 1. Database
Đã tạo:
- `albums`
- `media`
- `rsvps`

Nếu đã chạy schema cũ, chạy thêm phần STORAGE POLICIES ở cuối `schema.sql`.

## 2. Storage
Đã tạo:
- `wedding-photos` (PUBLIC)
- `wedding-videos` (PUBLIC)

## 3. Website
- RSVP gửi trực tiếp vào `rsvps`.
- Guest upload ảnh/video vào Storage.
- Sau upload, tạo record `media` với `status = pending`.
- Chỉ khi Admin approve thì media mới được query công khai.

## 4. Lưu ý bảo mật
Publishable key có thể xuất hiện ở frontend. `service_role`/secret key tuyệt đối không đưa vào GitHub/Vercel frontend.

## 5. Bước tiếp theo
Làm Admin Dashboard với Supabase Auth để:
- đăng nhập admin
- xem pending
- approve/reject
- quản lý album
- xem RSVP
- upload ảnh của cô dâu chú rể
