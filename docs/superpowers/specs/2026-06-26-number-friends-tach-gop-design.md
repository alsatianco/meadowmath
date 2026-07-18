# Thiết kế — "Bạn Số" (Number Friends): Nền tảng tính toán cho mẫu giáo — Giai đoạn 1: Tách Gộp

Ngày: 2026-06-26 · Trạng thái: Đã duyệt thiết kế (chờ rà soát spec) · Phạm vi: chỉ Giai đoạn 1.

## 1. Mục tiêu

Xây một khu vực riêng trong Meadow Math giúp trẻ mẫu giáo (~4–5 tuổi) rèn nền tảng tính toán, *bắt đầu từ tách gộp số* (phần–toàn thể), bằng ngôn ngữ hình ảnh lấy cảm hứng Numberblocks: số là những "bạn khối" — tháp lập phương có mặt cười — tách ra và gộp lại được mà trẻ thấy tận mắt.
Niềm tin sư phạm: trẻ hiểu toán qua *làm*, không qua nghe giảng. Mọi khái niệm trở thành hành động kéo–tách–ghép.
Đây là một dự án 3 giai đoạn (Tách gộp → Cộng/Trừ → Cửu chương). Spec này chỉ đặc tả **Giai đoạn 1**; hai giai đoạn sau có spec riêng và tái dùng bộ máy hình ảnh ở đây.

## 2. Các quyết định đã chốt (decision log)

- **Vị trí:** một khu vực ("thế giới") riêng mới, không nhồi vào Kinder. Tên tạm: **"Bạn Số" (vi) / "Number Friends" (en)** — dễ đổi.
- **Phong cách hình ảnh:** giống *tinh thần* Numberblocks (khối lập phương, màu đặc trưng từng số, mặt cười, animation tách/gộp) nhưng **art gốc** — không dùng tên/logo/thiết kế nhân vật y hệt. An toàn bản quyền cho site công khai.
- **Bố cục theo lượng (subitizing) — nguyên tắc xuyên suốt:** mỗi số xếp theo bố cục chuẩn dễ nhận ra tức thì như chấm xúc xắc (5 = mặt 5 xúc xắc, 6 = mặt 6, 7 = 6 + 1, 8 = hai hàng 4, 10 = khung hai hàng 5…), để trẻ *nhìn lượng là nhận ra số* và bố cục tự để lộ cách tách gộp.
- **Phạm vi số:** dạy sâu trong **0–10** (trọng tâm make-5, make-10), cộng **nhánh mở rộng 11–20** (số teen = "10 và vài đơn vị").
- **Âm thanh:** hình ảnh là chính; thêm hiệu ứng âm thanh + **nút loa đọc tên số bằng Web Speech API** có sẵn trong trình duyệt; tự tắt êm nếu máy không hỗ trợ. Không thu file âm thanh ở giai đoạn này.
- **Cấu trúc nội dung:** **hành trình theo chặng** — mỗi chặng có một màn "kể chuyện" trực quan ngắn rồi nhiều mini-game luyện (giống cách Numberblocks đi theo từng nhân vật/ý niệm).
- **Song ngữ:** theo chuẩn i18n sẵn có (`data-i18n` + `lang/vi` & `lang/en`).
- **Không thêm build step.** Giữ trang tĩnh thuần (HTML/CSS/JS), khớp khuôn mẫu hiện tại.

## 3. Bộ máy "khối số" dùng chung — `js/block-engine.js`

Module render duy nhất cho khối số, đặt ở `js/` gốc vì **cả 3 giai đoạn đều dùng lại**. Đây là đơn vị có ranh giới rõ: mọi việc vẽ/làm động khối nằm trong đây, lộ ra một giao diện sạch; mini-game không cần biết khối được vẽ thế nào.

### 3.1 Hình ảnh
- Mỗi số = N ô lập phương (1 ô = 1 đơn vị), **vẽ thuần CSS** (gradient + viền + bóng tạo khối 3D nhẹ), không dùng file ảnh → nhẹ, phóng to thoải mái, đổi màu theo số dễ dàng.
- **Nguyên tắc cốt lõi: bố cục theo lượng (subitizing).** Mặc định mỗi số được xếp theo một **bố cục chuẩn dễ nhận ra tức thì** — như chấm trên xúc xắc — để *trẻ chỉ cần nhìn lượng là nhận ra số*, không phải đếm từng ô. Quan trọng hơn: bố cục đó **để lộ cấu trúc tách gộp** (số đôi, "6 thêm 1", "hai hàng 4"…), nên hình ảnh và khái niệm tách gộp củng cố lẫn nhau.
- **Bản đồ bố cục chuẩn (1–10)** — cấu hình được, mặc định:

  ```
  1  ▢                         (đơn lẻ)
  2  ▢▢                        (cặp)
  3  ▢▢▢                       (hàng 3)
  4  ▢▢ / ▢▢                   (ô vuông 2×2  → đôi 2+2)
  5  ▢·▢ / ·▢· / ▢·▢           (mặt 5 xúc xắc)
  6  ▢▢▢ / ▢▢▢                 (2 hàng 3  → đôi 3+3 ; cũng là mặt 6 xúc xắc)
  7  ▢▢▢ / ▢▢▢ / ▢             (mặt 6 thêm 1  → 6+1)
  8  ▢▢▢▢ / ▢▢▢▢               (2 hàng 4  → đôi 4+4)
  9  ▢▢▢ / ▢▢▢ / ▢▢▢           (vuông 3×3  → 3 hàng 3)
  10 ▢▢▢▢▢ / ▢▢▢▢▢             (khung 10, 2 hàng 5  → 5+5)
  ```
  (Dấu `/` = xuống hàng.) Nhờ vậy *số đôi và cặp make-10 hiện ra ngay trong hình*: 4=2+2, 6=3+3, 8=4+4, 10=5+5; 5=mặt xúc xắc; 7=6+1; 9=ba hàng 3. `split` ưu tiên tách dọc theo đường nối tự nhiên của bố cục (vd tách 8 thành hai hàng 4, tách 10 thành hai hàng 5).
- **Mặt cười** đơn giản, thân thiện (đặt trên thân khối) — nhưng **tín hiệu nhận số là chính bố cục lượng**, không phải số mắt. (Có thể giữ "số mắt = giá trị" cho 1–3 như điểm nhấn dễ thương, không bắt buộc.)
- **Bảng màu khởi điểm** (mỗi số một màu, dễ tinh chỉnh sau):
  - 0 `#cbd5e1` (xám "khối rỗng/ma") · 1 `#e23b3b` · 2 `#f5872b` · 3 `#f5c518` · 4 `#3fb64a` · 5 `#27b6d6` · 6 `#3b6fe2` · 7 `#7c4dd6` · 8 `#e23b9b` · 9 `#1faf8f` · 10 `#f0a818` (vàng kim, mốc đặc biệt).
- **Cách xếp (`arrangement`)**: `pattern` (bố cục chuẩn theo lượng — **mặc định**) · `tower` (dọc) · `row` (ngang) · `frame5`/`frame10` (khung 5/10) · `auto`. Mặc định luôn dùng `pattern` để trẻ học nhận mặt số; các cách xếp khác dùng cho dạy *bảo toàn số lượng* (cùng một số, xếp kiểu gì vẫn là số đó) ở dạng bài riêng.

### 3.2 Animation lõi
- `split(el, [a, b])`: tháp (giá trị a+b) **vỡ làm hai** phần a và b trượt ra, mỗi phần mọc mặt riêng.
- `merge(elA, elB)`: hai phần **trượt vào, dính lại**, hiện một mặt = tổng.
- `celebrate(el)`: nảy + lấp lánh khi đúng.
- Tôn trọng `prefers-reduced-motion`: rút gọn/tắt hiệu ứng.

### 3.3 Âm thanh
- `speak(text, {lang='vi-VN'})`: đọc tên số / lời nhắc qua `window.speechSynthesis`; feature-detect, no-op êm nếu không có giọng phù hợp.
- `sfx(name)`: `'pop'` (tách) · `'snap'` (dính) · `'correct'` · `'wrong'`, sinh bằng **WebAudio** (không cần file).
- `setMuted(bool)` + lưu trạng thái tắt tiếng qua `storage.js`.

### 3.4 Giao diện (API) dự kiến
```js
BlockEngine.COLORS                       // { 0:'#cbd5e1', 1:'#e23b3b', ... 10:'#f0a818' }
BlockEngine.render(container, {          // tạo + gắn vào container, trả về element
  value, color?, arrangement?='pattern',
  face?=true, scale?=1, label?           // label: nhãn chữ tuỳ chọn dưới khối
})
BlockEngine.split(el, [a, b], opts?)     // -> Promise (xong khi animation kết thúc)
BlockEngine.merge(elA, elB, opts?)       // -> Promise, trả về element tổng
BlockEngine.celebrate(el)
BlockEngine.speak(text, {lang}?)
BlockEngine.sfx(name)
BlockEngine.setMuted(bool); BlockEngine.isMuted()
```

## 4. Hành trình tách gộp & các dạng bài

7 chặng. Mỗi chặng = một **màn kể chuyện trực quan ngắn** (`*-intro.html`: demo khái niệm bằng khối, "chạm để tiếp", có loa đọc) + **nhiều mini-game**. Mỗi chặng ghi chú mô-típ Numberblocks tham chiếu (để định hướng nội dung, không xuất hiện cho người dùng).

### Chặng 0 — Làm quen khối số (1–10) — *mô-típ: giới thiệu nhân vật*
Thấy số như tháp khối, đếm ô, nghe tên.
- `count-blocks` — *Đếm khối*: chạm từng ô để đếm tháp, trả lời "mấy ô?".
- `tower-to-numeral` — *Khối nào đây?*: nối tháp ↔ chữ số.
- `subitize-flash` — *Nhận mặt nhanh*: loé khối ở **bố cục chuẩn** (§3.1) trong ~1s, chọn số — luyện đúng kỹ năng "nhìn lượng nhận ra số".

### Chặng 1 — Tách — *mô-típ: khối vỡ ra*
Một tháp tách thành hai phần.
- `split-free` — *Bẻ đôi khối*: kéo (hoặc chạm) một vạch để tách tháp; **không có đáp án sai** — khám phá tự do, hiện hai phần là mấy + mấy.
- `split-name` — *Tách mấy và mấy?*: tháp tự tách, trẻ gọi tên hai phần.
- `missing-part` — *Phần còn lại*: biết tổng + một phần → chọn phần kia.

### Chặng 2 — Gộp — *mô-típ: khối dính lại*
Hai phần gộp thành một.
- `merge-free` — *Ghép hai bạn*: kéo hai tháp vào nhau → chúng dính lại, ra số mấy?
- `merge-name` — *Gộp thành mấy?*: hai phần cho trước, chọn tổng.
- `pick-pair` — *Ai làm nên tớ?*: cho tổng, chọn cặp tạo nên nó.

### Chặng 3 — Toàn thể của tớ — *mô-típ: "The Whole of Me"*
Khám phá *tất cả* cách tách một số = number bonds.
- `number-rainbow` — *Cầu vồng số*: ghép các cặp bạn của 5 và của 10 thành cầu vồng.
- `all-bonds` — *Bao nhiêu cách tách?*: tìm đủ các cách tách một số nhỏ (vd 4 = 1+3 = 2+2 = 3+1).
- `doubles` — *Số đôi*: 1+1 … 5+5.

### Chặng 4 — Trốn tìm — *mô-típ: "Hide and Seek" (mầm phép trừ)*
Giấu một phần → tìm phần thiếu.
- `hide-seek` — *Khối trốn*: vài ô nấp sau bụi cây/hộp; còn thấy mấy ô, đoán mấy ô đang trốn.
- `bond-missing` — *Number bond thiếu phần*: sơ đồ tách-gộp dạng khối với một ô trống (kế thừa ý `number-bonds-k` nhưng bằng khối).
- `take-away` — *Còn lại bao nhiêu?*: lấy đi vài ô khỏi tháp → còn mấy.

### Chặng 5 — Làm bạn với 5 và 10 — *mô-típ: bàn tay của Năm, khung của Mười* — **trọng tâm**
- `five-frame` — *Đầy khung 5*: thả ô cho đầy khung 5; còn thiếu mấy?
- `ten-frame` — *Đầy khung 10*: thả ô cho đầy khung 10.
- `make-ten-pairs` — *Cặp bạn make-10*: ghép cặp cộng lại bằng 10.
- `how-many-more` — *Thiếu mấy nữa đầy 10?*: cho một số, chọn phần bù tới 10.

### Chặng 6 (nhánh mở) — Mười và vài đơn vị (11–20) — *mô-típ: "Ten Again"*
Số teen = một tháp Mười + vài ô lẻ.
- `teen-build` — *Mười và mấy?*: dựng số teen bằng khung-10 đầy + vài ô.
- `teen-split` — *Tách số teen*: tách 11–20 thành 10 và phần lẻ.

**Tổng:** ~20 mini-game + 7 màn intro. Xây theo thứ tự MVP ở §9.

## 5. Tương tác & phản hồi

- **Thao tác chữ ký: kéo-để-tách / kéo-để-gộp** bằng Pointer Events (hợp nhất chuột + cảm ứng). **Mọi thao tác kéo đều có lối tắt chạm** (chạm vạch tách / chạm hai khối / chạm đáp án) để không bé/máy nào bị kẹt.
- **No-fail, dịu nhẹ:** sai thì khối rung nhẹ và *tự diễn lại cách đúng* rồi cho đi tiếp. Không điểm trừ gây áp lực. Đúng triết lý "khám phá bình tĩnh" của site.
- **Loa 🔊** đọc tên số / lời nhắc ngắn; **âm hiệu** pop/snap/đúng/sai; **nút tắt tiếng** (lưu trạng thái).
- **Tiến độ & sao:** dùng lại `ActivityBase` (chấm tiến độ + modal kết quả) cho từng mini-game; lưu sao hoàn thành qua `storage.js` để hub hiện tiến độ.

## 6. Kiến trúc kỹ thuật

Bám khuôn mẫu hiện tại: trang tĩnh, mỗi hoạt động là HTML tự chứa, dữ liệu trong `data/*.json`, dịch trong `lang/*`, không build step.

```
number-friends/
  index.html            # hub: vẽ "bản đồ hành trình" các chặng + tiến độ
  number-friends.css
  number-friends.js
  activities/
    activity.css         # @import '../../css/activity.css'
    activity-shared.css  # @import '../../css/activity-shared.css'
    activity-base.js      # shim re-export window.ActivityBase (đúng pattern các grade)
    activity-components.js
    <stage>-intro.html    # 7 màn kể chuyện
    <mini-game>.html      # ~20 file mini-game tự chứa
data/number-friends.json  # định nghĩa hành trình
lang/vi/number-friends.json
lang/en/number-friends.json
js/block-engine.js        # BỘ MÁY DÙNG CHUNG
```

### 6.1 Schema `data/number-friends.json`
Mở rộng schema `kinder.json` (giữ `region`, `title`, `description`, `levels[]`); mỗi phần tử `levels[]` là một **chặng** và bổ sung trường `intro`:
```jsonc
{
  "region": "number-friends",
  "title": "Bạn Số",
  "description": "...",
  "levels": [
    {
      "id": "stage-0", "number": 0, "title": "...", "icon": "🧱", "goal": "...",
      "skills": ["..."],
      "numberblocksRef": "character intro",   // ghi chú nội bộ, không hiển thị
      "intro": { "id": "meet-blocks-intro", "path": "activities/meet-blocks-intro.html" },
      "activities": [
        { "id": "count-blocks", "icon": "🔢", "path": "activities/count-blocks.html", "type": "count-blocks" }
      ]
    }
  ]
}
```

### 6.2 Hub (`number-friends/index.html` + `.js`)
Đọc `data/number-friends.json` → vẽ **bản đồ hành trình** (các chặng là nút nối thành đường đi, thân thiện hơn lưới ô của các grade) → đọc tiến độ/sao từ `storage.js` → đánh dấu chặng đã xong. Chạm chặng → mở intro rồi tới các mini-game.

### 6.3 Mini-game
Mỗi file tự chứa (theo pattern `number-bonds-k.html`): nạp CSS/JS chung + `../../js/block-engine.js` + i18n; mỗi mini-game dùng `ActivityBase` cho thống kê/tiến độ/feedback; phần render khối gọi `BlockEngine`.

### 6.4 i18n & tích hợp site
- Thêm `lang/vi/number-friends.json` & `lang/en/number-friends.json` theo cơ chế nạp i18n sẵn có (khớp cách các region khác đặt khóa `section.activities.<id>.*`).
- Thêm mục **"Bạn Số"** vào sidebar (đặt ngay trước Pre-K — nền tảng sớm nhất) ở hub + các trang hoạt động, kèm `data-i18n="nav.numberFriends"`.
- Thêm một thẻ trên trang chủ `index.html`.
- Bổ sung URL vào `sitemap.xml` và kiểm `robots.txt` theo nếp commit SEO sẵn có.

### 6.5 Luồng dữ liệu
`index.html` → fetch `data/number-friends.json` → render bản đồ + đọc `storage.js`. Chạm → mở activity HTML → activity nạp `block-engine.js` + i18n → chạy vòng → cập nhật stats + lưu sao → quay lại hub hiện tiến độ.

## 7. Lỗi & biên

- **Web Speech không có giọng vi:** ẩn/làm trơ nút loa; thử giọng mặc định rồi no-op. Không bao giờ chặn chơi vì thiếu âm thanh.
- **Kéo-thả không hỗ trợ / bé khó thao tác:** luôn còn lối chạm tương đương.
- **Số 0 & biên:** xử lý 0 ("không còn ô nào") dịu dàng ở dạng tìm phần thiếu/lấy đi; lõi giới hạn 10, nhánh mở tới 20; phần tử/đáp án không âm.
- **`prefers-reduced-motion`:** rút gọn/tắt animation tách-gộp.
- **Sinh đề:** đảm bảo phần tách hợp lệ (mỗi phần ≥ 0 hoặc ≥ 1 tuỳ dạng), tránh đề trùng liên tiếp, distractor không trùng đáp án (theo cách `number-bonds-k` đang làm).

## 8. Kiểm thử

Repo hiện không có khung test tự động (trang tĩnh thuần) — giữ thực dụng:
- **`number-friends/block-engine.test.html`**: trang tự kiểm tra trực quan — render mọi số 0–20 ở các cách xếp, chạy thử mọi cách tách của 2–10, nút bấm thử `split`/`merge`/`speak`/`sfx`. Để mắt soi nhanh khi sửa bộ máy.
- **Checklist QA thủ công cho mỗi mini-game:** kéo được, chạm được (fallback), đúng/sai phản hồi đúng, loa đọc, tắt tiếng, hiển thị mobile, `prefers-reduced-motion`.

## 9. Thứ tự xây (MVP trước)

1. `js/block-engine.js` + `block-engine.test.html` (nền cho mọi thứ).
2. Hub `number-friends/` (index + css + js) + `data/number-friends.json` + i18n khung + tích hợp nav/trang chủ — với 3 chặng đầu.
3. **Lõi chơi được:** Chặng 0 (làm quen) → Chặng 1 (tách) → Chặng 2 (gộp), gồm intro + mini-game.
4. Mở tiếp Chặng 3 (toàn thể) → 4 (trốn tìm) → 5 (make 5/10).
5. Nhánh mở Chặng 6 (teen 11–20).
6. Hoàn thiện: âm thanh, sao/tiến độ, QA, SEO.

## 10. Giai đoạn sau (ngoài spec này)

- **Giai đoạn 2 — Cộng/Trừ:** spec riêng; phép cộng = `merge`, phép trừ = "trốn tìm/lấy đi"; thêm chặng vào cùng thế giới "Bạn Số", tái dùng `block-engine`.
- **Giai đoạn 3 — Cửu chương:** spec riêng; phép nhân = gộp nhiều nhóm bằng nhau (mảng/array các tháp giống nhau), vẫn tái dùng `block-engine`.

## 11. Tiêu chí thành công (Giai đoạn 1)

- Trẻ tự chơi được lõi (Chặng 0–2) trên cảm ứng mà không cần đọc chữ, nhờ hình ảnh + loa.
- Trẻ nhận ra số bằng *nhìn lượng* (subitizing) nhờ bố cục chuẩn, và bố cục đó giúp thấy ngay cách tách gộp (số đôi, 6+1, 4+4, 5+5…).
- Tách/gộp là hành động nhìn thấy được (kéo vỡ / dính lại), không chỉ chọn đáp án.
- Bộ máy `block-engine` đủ tổng quát để Giai đoạn 2 & 3 cắm vào mà không phải viết lại phần render.
- Khớp giao diện/triết lý site; song ngữ vi/en; chạy tốt mobile; không thêm build step.
