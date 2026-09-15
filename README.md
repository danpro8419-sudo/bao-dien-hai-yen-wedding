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


## V6.3 — Final Envelope Composition
- DY reduced ~20–25% and moved upward.
- Couple name and date occupy separate lower zones.
- Desktop/mobile share identical vector logo geometry.
- Envelope size and all V5/V6 functionality remain unchanged.

## V6.4
Clean fixed DY monogram closer to the original reference; dedicated couple-name/date block; separate open-state positioning to prevent overlap.


## V7 — Seal Tear Opening
- Uses the supplied DY reference image inside a circular luxury seal.
- Fold text: “SỰ KIỆN ĐÁNG MONG CHỜ SẮP DIỄN RA”.
- Date below seal: 03.01.2027.
- Clicking the seal triggers a tear animation.
- Fold message/date disappear and BẢO ĐIỀN & HẢI YẾN are revealed.
- Holds on the names for 3 seconds, then enters the invitation.
- Adds subtle floating champagne particles in the side negative space.


## V8 — Cinematic Tear Seal
Opening rebuilt as an isolated full-screen component so legacy name/date/open controls cannot bleed through.
Sequence: seal click → bilateral tear → seal disappears → upper fold is removed → BẢO ĐIỀN & HẢI YẾN reveal → 3-second hold → cinematic fade into the existing wedding site.


## V8.1 — Cinematic Atmosphere + Direct Story Transition
- Added subtle botanical line-art in opposite side corners.
- Added layered champagne bokeh, floating dust, and slow warm light drift.
- Mobile automatically reduces decorative density.
- Removed the second legacy envelope interaction from the guest flow.
- After the 3-second name reveal, V8 fades directly into the wedding story.


# V9 — Modular Cinematic Opening
The opening is now isolated in `opening/opening.css` and `opening/opening.js`.
All Opening selectors use the `wedding-opening` namespace.
The old second envelope is retired from the visible flow.
Opening sequence: DY seal → tear → top fold opens → card rises 40px → names reveal → 3-second hold → blur/fade → main wedding story.
Main wedding CSS/JS, Admin, Supabase, RSVP, albums and guest uploads remain separate.
