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


## V6 — Responsive Cinematic Opening
- Desktop envelope enlarged for stronger visual focus.
- Mobile opening optimized for Messenger/Facebook/Safari dynamic browser bars.
- Uses dynamic viewport units (`dvh` / `svh`) with a JS fallback.
- New D/Y monogram inspired by the supplied reference: serif D + calligraphic Y.
- CTA interaction and envelope presence refined.
- V5 Sticky Countdown, Supabase, RSVP, Guest Upload and Admin remain intact.


## V6.1 — Monogram refinement
- DY monogram moved upward and given a raised shadow/champagne halo.
- Couple name and wedding date receive a separate lower visual zone.
- Mobile spacing refined so the monogram no longer covers the name/date.


## V6.2 — Fixed DY Vector Logo
- DY monogram converted from device-dependent fonts to inline SVG vector paths.
- Same logo geometry on Windows, iPhone, Android, Safari, Chrome and Messenger.
- Stronger raised/shadow treatment.
- Name and wedding date remain separated below the logo.
