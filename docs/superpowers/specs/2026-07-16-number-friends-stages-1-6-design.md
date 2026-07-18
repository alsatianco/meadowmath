# Thiết kế — "Bạn Số" hoàn thiện Chặng 1–6 + 4 cơ chế từ sách bài tập Numberblocks

Ngày: 2026-07-16 · Trạng thái: Đã duyệt · Nhánh: `feature/number-friends-tach-gop`
Kế thừa: [2026-06-26-number-friends-tach-gop-design.md](2026-06-26-number-friends-tach-gop-design.md) (spec gốc, vẫn hiệu lực) — tài liệu này đặc tả phần *còn thiếu* (Chặng 1–6) và các cơ chế mới bổ sung.

## 1. Mục tiêu

Hoàn thiện toàn bộ chuỗi game tách gộp của thế giới "Bạn Số": trẻ **chụp hình ảnh lượng gắn với số** (subitizing) rồi thấy tận mắt logic **tách–gộp** (phần–toàn thể) qua thao tác kéo vỡ / dính lại, theo tinh thần Numberblocks.
Bổ sung 4 cơ chế học được từ bộ sách bài tập Numberblocks song ngữ (file tham khảo của người dùng): máy tách quả *Fruit Salad*, lấp hình bóng *Make-9*, bậc thang *Number Magic*, so sánh *Blockzilla*.

## 2. Quyết định đã chốt (decision log, 2026-07-16)

- **Phạm vi:** toàn bộ Chặng 1–6 trong một đợt (sau bổ sung 2026-07-16: **22 mini-game + 6 intro**).
- **Cơ chế mới:** đưa đủ cả 4 — Fruit Salad thành game riêng ở Chặng 3; Make-9 thành game `fill-shape` ở Chặng 3; Number Magic thành hoạt cảnh intro Chặng 2; Blockzilla thành game `who-is-bigger` bổ sung vào Chặng 0 (so sánh là kỹ năng liền sau đếm/nhận mặt số).
- **Code đang dở:** commit phần storybook UI redesign hiện có thành một commit riêng trước, rồi xây game trên nền đó.
- **Kiến trúc:** phương án A — mỗi mini-game một trang HTML tự chứa theo đúng pattern repo; phần dùng chung mở rộng vào `js/block-engine.js` + file mới `number-friends/activities/nf-widgets.js`. Không build step.
- **Nghệ thuật:** thuần CSS/emoji, art gốc, không dùng tên/hình nhân vật Numberblocks (an toàn bản quyền, nhất quán spec gốc).
- **Bổ sung 2026-07-16 (yêu cầu nhận diện nhân vật):** người dùng muốn trẻ nhận ra nhân vật như trong phim. Quyết định: KHÔNG clone thiết kế nhân vật (site công khai, bản quyền Alphablocks/BBC) — thay bằng **gói tín hiệu nhận diện an toàn**: bảng màu đúng từng số như phim (1 đỏ · 2 cam · 3 vàng · 4 xanh lá · 5 xanh dương · 6 chàm · 7 tím cầu vồng · 8 hồng · 9 xám · 10 đỏ-trắng), số Một 1 mắt (mắt = giá trị), phụ kiện gợi nhớ vẽ theo phong cách riêng (kính Hai, vương miện Ba, lông mày vuông Bốn, sao trên tay Năm, chấm xúc xắc Sáu, 7 ô 7 sắc Bảy, nơ Tám, mặt hắt xì Chín, sọc Mười). Task riêng trong plan (2b).
- **Bổ sung 2026-07-16 (đợt tài liệu thứ hai — 47 worksheet theo tập phim + flashcard 0–20 + pack 136 trang):** thêm lớp kể chuyện "Nhiệm vụ nhà thám hiểm số" (§4a), thêm 2 game `stamp-shapes` và `inside-me`, làm giàu `fruit-salad` (hai chiều), `doubles` (gương nhân đôi + bẻ đôi), `hide-seek` (trốn sau bạn lớn hơn). Người dùng yêu cầu trực tiếp ("tham khảo cả cách xây dựng câu chuyện").

## 3. Sư phạm — trục xuyên suốt

- **CPA (Concrete → Pictorial → Abstract):** khối (cụ thể) → quả/hình bóng (chuyển giao sang vật thể bất kỳ) → sơ đồ bond + đẳng thức `5 = 2 + 3` hiện *thụ động* (trừu tượng — trẻ nhìn quen mắt, không bắt đọc/viết).
- **Subitizing mọi nơi:** mọi số hiển thị theo bố cục chuẩn của engine (`patternCoords`) — bố cục tự để lộ cấu trúc tách gộp (4=2+2, 7=6+1, 10=5+5).
- **No-fail dịu nhẹ:** sai → rung nhẹ → tự diễn lại cách đúng → đi tiếp; game khám phá (`split-free`, `merge-free`) không có khái niệm sai.
- **Không phụ thuộc chữ:** chơi được hoàn toàn bằng hình + loa 🔊 (Web Speech vi/en); chữ chỉ là phụ đề.

## 4. Chuỗi game (delta so với spec gốc in đậm)

| Chặng | Intro | Mini-games |
|---|---|---|
| 0 Làm quen *(đã có)* | *(đã có)* | **+ `who-is-bigger` — Blockzilla:** hai tháp khối xuất hiện, trẻ chạm/xoay miệng quái vật (ký hiệu `>` `<` `=` cách điệu thành miệng) về phía tháp lớn hơn; ba trạng thái lớn hơn/bé hơn/bằng nhau. *(Nguồn: Trang 51.)* · **+ `stamp-shapes` — Dấu in nhún nhảy:** cùng một số "in dấu" thành nhiều hình dạng khác nhau (3 = hàng ngang / chữ L / đường chéo…); trẻ chọn dấu in đúng của bạn số, hoặc tìm dấu in *không phải* của bạn ấy — dạy bảo toàn số lượng + chụp lượng ngoài bố cục chuẩn. *(Nguồn: worksheet Stampolines — "recognise amounts without counting".)* |
| 1 Tách | `split-intro`: tháp 4 tự vỡ thành 2+2 rồi 3+1, đọc "bốn tách thành hai và hai" | `split-free` (bẻ khối tự do, không có sai) · `split-name` (tách ra mấy-và-mấy) · `missing-part` (biết tổng + một phần → phần kia) |
| 2 Gộp | **`merge-intro` — bậc thang Number Magic:** hai bạn khối leo hai bậc thang cạnh nhau, dính lại thành tháp cao bằng bậc tổng — chiều cao *là* phép cộng *(Nguồn: Trang 69.)* | `merge-free` (kéo hai bạn vào nhau) · `merge-name` (gộp thành mấy) · `pick-pair` (cặp nào làm nên tớ) |
| 3 Toàn thể của tớ | `bonds-intro`: số 5 khoe lần lượt mọi cách tách của mình | **`fruit-salad` — Máy Tách Quả:** sơ đồ bond 3 vòng — **hai chiều như worksheet gốc**: mũi tên xuống = tách (quả rơi vào 2 bát, `5 = 2 + 3`), mũi tên lên = gộp (hai bát dồn lên, `2 + 3 = ?`); các lượt xen kẽ hai chiều *(Nguồn: Trang 58 + worksheet Fruit Salad — "nhà máy quả" của bạn Ba.)* · `all-bonds` (tìm đủ cách tách một số) · **`inside-me` — Ai ở trong tớ?:** bạn số N hỏi "bạn nào là một phần của tớ?" — chọn *tất cả* bạn nhỏ hơn nằm vừa trong N, và nhận ra bạn Một quá nhỏ để chứa ai *(Nguồn: worksheet The Whole of Me — "numbers inside other numbers".)* · **`fill-shape` — Lấp hình bóng:** hình bóng bố cục chuẩn của số N đã lấp sẵn một phần bởi một bạn khối, chọn bạn khối lấp vừa khít phần còn lại *(Nguồn: Trang 85.)* · `doubles` — **Gương nhân đôi:** bạn số soi gương (mô-típ Double Trouble) → hỏi tổng đôi 1+1…5+5; xen kẽ lượt *bẻ đôi bằng nhau* (số chẵn tách thành hai nửa) *(Nguồn: worksheet Double Trouble — doubling & halving.)* |
| 4 Trốn tìm (mầm trừ) | `hide-intro`: vài ô của tháp nấp sau bụi cây rồi ló ra | `hide-seek` — **trốn sau bạn lớn hơn:** các bạn nhỏ nấp sau một bạn số lớn hơn hoặc bụi cây (chỉ trốn sau ai *cao hơn* được — nối so sánh với phần–toàn thể); còn thấy mấy, đoán mấy bạn đang trốn *(Nguồn: worksheet Hide and Seek.)* · `bond-missing` (sơ đồ bond khuyết một phần, bằng khối) · `take-away` (lấy đi còn mấy) |
| 5 Bạn của 5 & 10 ⭐ | `frame-intro`: bàn tay 5 ngón và khung 10 | `five-frame` (đầy khung 5) · `ten-frame` (đầy khung 10) · `number-rainbow` (cầu vồng cặp make-10) · `how-many-more` (thiếu mấy nữa đầy 10) |
| 6 Mười-và-lẻ (11–20) | `teen-intro`: "Ten Again" — teen = tháp 10 + vài ô lẻ | `teen-build` (dựng 10 + lẻ) · `teen-split` (tách teen thành 10 và lẻ) |

Ghi chú so với spec gốc: `number-rainbow` chuyển từ Chặng 3 sang Chặng 5 (bản chất là make-10) và thay thế `make-ten-pairs` (trùng cơ chế); Chặng 3 nhận `fruit-salad` + `inside-me` + `fill-shape` mới; Chặng 0 nhận `who-is-bigger` + `stamp-shapes`. Tổng mới: **22 mini-game + 6 intro**.

## 4a. Lớp kể chuyện — "Nhiệm vụ nhà thám hiểm số" (từ cấu trúc Mission của worksheet gốc)

Học từ công thức worksheet Numberblocks (mỗi tập = một *nhiệm vụ*: Fact File nhân vật → hoạt động → nhiệm vụ đời thực → sao tự thưởng → móc nối tập sau):

- **Mỗi chặng có một bạn số dẫn chuyện (host):** C0 = Một · C1 Tách = Tư (khối vuông thích bẻ đôi 2+2) · C2 Gộp = Hai (thích kết bạn) · C3 Toàn thể = Sáu (nhiều cách tách đẹp) · C4 Trốn tìm = Ba (tinh nghịch) · C5 = Năm & Mười (bàn tay, khung 10) · C6 = Mười ("Ten Again"). Host xuất hiện trong intro (lời chào + "hồ sơ" ngắn kiểu Fact File: tớ là mấy, tớ xếp hình gì, điều đặc biệt của tớ) và làm nhân vật cổ vũ trong các mini-game của chặng (avatar khối nhỏ ở góc, lời thoại i18n ngắn).
- **Nhiệm vụ đời thực (Explorer Missions):** mỗi chặng có 2–3 nhiệm vụ chơi-cùng-bố-mẹ ngoài đời (vd C1: "chia 4 quả nho vào 2 bát"; C5: "giơ 3 ngón tay — thiếu mấy ngón nữa đủ 5?"). Hiển thị ở **hub**: khi mọi game của chặng có sao, nút "🏅 Nhiệm vụ thật" mở modal liệt kê nhiệm vụ (đọc được bằng loa, có ô tự đánh dấu ⭐ lưu `storage.js`). Không trang mới — thêm vào hub JS + `data/number-friends.json` (`missions[]` mỗi chặng) + i18n.
- **Móc nối chặng sau:** màn hoàn thành intro/chặng có câu "Chặng sau: …" (i18n) — giữ nhịp "tập tiếp theo" của worksheet gốc.
- **Sao tự thưởng:** giữ nguyên hệ sao `storage.js` hiện có — trùng khớp mô-típ "colour the star" của worksheet.

## 5. Mở rộng phần dùng chung

### 5.1 `js/block-engine.js` (giữ API cũ nguyên vẹn, chỉ thêm)
- `renderSilhouette(container, { value, filledCells })` — vẽ bố cục chuẩn của số dưới dạng ô viền đứt (ghost); `filledCells` là số ô đầu đã lấp màu. Dùng cho `fill-shape`, `five-frame`/`ten-frame` (khung = silhouette 5/10), `teen-build`.
- Kéo-tách / kéo-gộp bằng Pointer Events: `makeSplittable(el, onSplit)` (kéo/chạm khe giữa hai hàng-cột để tách theo đường nối tự nhiên của bố cục) và `makeDraggable(el, targets, onDrop)` (kéo tháp vào mục tiêu, có snap). Mọi thao tác kéo có lối chạm tương đương (chạm khe / chạm lần lượt hai đối tượng).
- Tôn trọng `prefers-reduced-motion` như hiện tại.

### 5.2 `number-friends/activities/nf-widgets.js` (mới) + CSS đi kèm trong `activity.css`
- `bondDiagram(container, opts)` — sơ đồ 3 vòng tròn nối mũi tên (toàn thể trên, hai phần dưới), chứa được khối hoặc quả; dùng cho `fruit-salad`, `bond-missing`, và đẳng thức thụ động.
- `fruitRow(container, { kind: '🍊'|'🍎'|…, count })` — hàng quả đếm được, xếp theo bố cục chuẩn subitizing.
- `blockzilla(container)` — quái vật CSS: thân tròn xanh lá, mắt lồi, miệng là ký hiệu `>` xoay được về 3 trạng thái (`>`, `<`, `=`); có hàm `point(direction)`.
- `staircase(container, steps)` — bậc thang cho intro Chặng 2.
- `hostBadge(container, { value, textKey })` — avatar bạn số dẫn chuyện thu nhỏ ở góc màn chơi + bong bóng thoại i18n (lớp kể chuyện §4a).
- `rainbow(container, { max: 10 })` — cầu vồng cặp make-10 cho `number-rainbow`; `arc(a)` vẽ cung nối `a` với `10 − a`.
- Modal "🏅 Nhiệm vụ thật" ở hub (không thuộc nf-widgets — nằm trong `number-friends.js`): đọc `missions[]` từ data, hiện khi chặng đủ sao, tự đánh dấu ⭐ lưu `storage.js`.

### 5.3 Dữ liệu & i18n
- `data/number-friends.json`: điền `intro` + `activities[]` cho stage-1…stage-6; thêm `who-is-bigger` vào stage-0. Schema giữ nguyên.
- `lang/vi/number-friends.json` + `lang/en/number-friends.json`: khóa `section.activities.<id>.title|instruction` cho ~26 mục mới; lời loa đọc đặt trong từng trang qua khóa i18n riêng (`…speak.*`) khi cần.
- Hub `number-friends.js`: đã render từ JSON — chỉ cần dữ liệu mới là các chặng hết "Sắp ra mắt"; kiểm tra chip intro + sao hoạt động cho stage 1–6.

## 5a. Lớp âm thanh hướng dẫn (bổ sung 2026-07-17 — yêu cầu người dùng)

Trẻ chưa đọc được chữ (bố mẹ có thể cũng không đọc được tiếng Anh), nên **âm thanh là kênh hướng dẫn chính**:
- **Mở game:** đọc to lời hướng dẫn (khóa `instruction`) ngay khi vào vòng đầu; nếu trình duyệt chặn autoplay (iOS) thì phát ở lượt chạm đầu tiên.
- **Nút 🔊 to, cố định** trên header mọi trang game: chạm để nghe lại hướng dẫn bất cứ lúc nào.
- **Trả lời sai:** luôn đọc to lời sửa (`incorrect`/`tooBig`/`wrongPair`…) — không chỉ hiển thị chữ.
- **Intro:** đọc to caption của từng bước khi bước hiện ra.
- Vẫn tôn trọng nút tắt tiếng (`setMuted`) và no-op êm khi máy thiếu giọng vi/en.

## 6. Vòng chơi chuẩn của một mini-game

10 câu/lượt (theo `ActivityBase` hiện có): sinh đề tránh trùng liên tiếp, distractor không trùng đáp án (kế thừa cách `makeChoices` của engine); đúng → `celebrate` + `sfx('correct')` + loa đọc đẳng thức; sai → rung + tự diễn cách đúng + cho đi tiếp; xong lượt → modal sao + lưu `storage.js`.
Game khám phá (`split-free`, `merge-free`, `fruit-salad` chiều tự do) đếm "số lần khám phá" thay vì đúng/sai — đủ N thao tác là hoàn thành, không chấm điểm.

## 7. Lỗi & biên

- Kế thừa toàn bộ mục 7 spec gốc (Web Speech thiếu giọng vi → nút loa trơ; số 0; `prefers-reduced-motion`; kéo-thả luôn có lối chạm).
- `fill-shape`: các lựa chọn phải cùng *hình dáng phần khuyết* hợp lệ — phần khuyết tính từ bố cục chuẩn, distractor lệch ±1..2 và không âm, không trùng.
- `who-is-bigger`: trộn đều 3 trạng thái, có cả cặp bằng nhau; hai tháp hiện đồng thời, thẳng hàng đáy để chiều cao so được bằng mắt.
- `fruit-salad`: tổng ≤ 10; quả xếp bố cục chuẩn để trẻ subitize thay vì đếm từng quả.
- Số teen: chỉ 11–20, luôn phân rã `10 + n` qua `decomposeTeen` sẵn có.

## 8. Kiểm thử

- Cập nhật `number-friends/block-engine.test.html`: thêm khối thử `renderSilhouette`, `makeSplittable`/`makeDraggable`, và các widget mới (bond, blockzilla, staircase).
- Checklist QA thủ công mỗi game (kéo + chạm, đúng/sai, loa, tắt tiếng, mobile, reduced-motion) như spec gốc mục 8.
- Chạy `js/block-engine.test.js` hiện có sau khi mở rộng engine (không phá API cũ).

## 9. Thứ tự xây & commit

1. Commit riêng phần storybook UI redesign đang dở (chốt nền).
2. Commit mở rộng engine (`renderSilhouette`, drag/split/merge tương tác) + `nf-widgets.js` + trang test.
3. Mỗi chặng một commit: data + i18n + intro + mini-games (thứ tự 1 → 2 → 3 → 4 → 5 → 6, thêm `who-is-bigger` vào commit Chặng 0-bổ-sung cùng đợt Chặng 1).
4. Commit chót: sitemap/SEO, QA sửa vặt.

## 10. Tiêu chí thành công

- Trẻ 4–5 tuổi tự chơi trọn hành trình 7 chặng trên cảm ứng, không cần đọc chữ.
- Nhìn lượng nhận ra số (subitizing) và *thấy* logic tách gộp qua thao tác — đúng mục tiêu "chụp hình ảnh lượng gắn với số"; `stamp-shapes` chứng minh trẻ nhận lượng cả ngoài bố cục chuẩn (bảo toàn số lượng).
- 4 cơ chế mới chạy đúng nguồn cảm hứng: máy tách quả (hai chiều), lấp hình bóng, bậc thang, miệng Blockzilla; cộng `inside-me` và gương nhân đôi từ đợt tài liệu thứ hai.
- Lớp kể chuyện sống động: mỗi chặng có host chào hỏi, nhiệm vụ đời thực mở khoá khi đủ sao, móc nối chặng sau.
- Hub sáng đủ 7 chặng, hết "Sắp ra mắt"; song ngữ vi/en; mobile mượt; không build step; API engine cũ không đổi.
