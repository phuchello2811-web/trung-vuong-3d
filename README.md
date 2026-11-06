# Trường THCS Trưng Vương 3D

Mô hình 3D tỉ lệ 1:1 của Trường THCS Trưng Vương (88 Yên Bái, Hải Châu, Đà Nẵng). Chạy thẳng trên trình duyệt, máy tính và điện thoại, dựng bằng Three.js.

> **Game đang tạm tắt** theo đề nghị của nhà trường, bản đăng chỉ có chế độ tham quan. Code game vẫn nằm trong `src/game/`; build lại có game bằng `npm run build:game`.

Mô hình độc lập, dựng từ bản vẽ và ảnh đã công bố, không phải trang chính thức của nhà trường.

## Chế độ

**Tham quan trường**: xem toàn cảnh, đi bộ hoặc bay, sơ đồ từng tầng, đo khoảng cách bằng mét thật, đổi giờ trong ngày (vị trí mặt trời tính theo toạ độ thật của trường).

Khi đi bộ, nhìn vào vật và nhấn `E` (điện thoại: nút Tương tác):

| Ở đâu | Nhấn E để |
|---|---|
| Lớp học | Kéo hai tấm bảng xanh vào che tivi hoặc kéo ra; bật, tắt tivi (hộp điều khiển cạnh bảng) |
| Sân bóng rổ (khu đa năng dưới giếng trời, bảng rổ gắn cột) | Ném bóng vào rổ |
| Sân cầu lông (cạnh khán đài) | Xem một pha đánh cầu qua lại |
| Sân pickleball (dưới cầu xanh) | Xem một pha đánh qua lại |
| Phòng Âm nhạc 501 (tầng 5) | Mở đàn piano 2 quãng tám: bấm phím bằng chuột, cảm ứng hoặc bàn phím (A S D F G H J K L ; phím trắng, W E T Y U O P phím đen, Z X đổi quãng tám); nghe bài mẫu; tập chơi theo phím tô sáng. Đánh trống |
| Cầu thang chính tầng 5 | Cửa cuốn lên sân thượng đang khoá |

**Một ngày ở Trưng Vương** (game, đang tạm tắt):

| Ở đâu | Làm gì |
|---|---|
| Lớp học | Trả lời câu hỏi Toán, KHTN, Ngữ văn, Tiếng Anh, Lịch sử – Địa lí, Tin học, kiến thức về trường để nhận xu |
| Căn tin (sân có mái che) | Mua bánh mì, xôi, sữa Milo theo thực đơn thật để hồi năng lượng |
| Phòng Tin học (tầng 5) | Luyện gõ phím 30 giây kiếm xu, chơi rắn săn mồi |
| Phòng KHTN (tầng 5) | Pha chế 14 hoá chất trong SGK, 18 phản ứng có hiện tượng (kết tủa, sủi bọt, đổi màu chỉ thị), phương trình và giải thích |
| Phòng STEM (tầng 5) | Mua vật liệu, chế tạo 6 sản phẩm (xe dây thun, mạch điện, quạt mini, tên lửa nước…), trưng bày để nhận xu |
| Thư viện | Đọc sách, nhận kinh nghiệm |
| Sân trường | Nhặt rác bỏ vào thùng |

Mỗi ngày có 6 nhiệm vụ; một giây ngoài đời là một phút trong game, tan học lúc 17:30. Tiến trình lưu trên trình duyệt, hoặc lưu lên tài khoản nếu đăng nhập.

Điều khiển: `W A S D` đi, `Shift` chạy, `E` tương tác, `B` cặp sách, `Esc` đóng bảng. Trên điện thoại dùng cần điều khiển và nút Tương tác.

## Chạy và build

```bash
npm install
npm run dev      # http://localhost:5173, sửa src/ là trang tự tải lại
npm run build    # tạo docs/index.html (GitHub Pages) và dist/index.html (bản một file), chỉ tham quan
npm run build:game  # như trên nhưng có game và đăng nhập Firebase
npm test         # đi bộ qua cầu thang, cửa, giao diện, quét lỗ hổng rơi tự do (cần Google Chrome)
npm run test:game   # kiểm thử game và đăng nhập trên một bản build riêng, không ghi đè docs/
```

## Đăng lên GitHub Pages

Repo đã để sẵn bản build trong `docs/`. Vào **Settings → Pages**, chọn *Deploy from a branch*, nhánh `main`, thư mục `/docs`. Trang có địa chỉ dạng `https://<tên-tài-khoản>.github.io/trung-vuong-3d/`.

Mỗi lần sửa code: `npm run build`, commit cả thư mục `docs/`, rồi push.

## Bật đăng nhập Google và tạo tài khoản (Firebase)

Chỉ cần khi bật lại game (`npm run build:game`). Chưa cấu hình thì trang vẫn chạy, chỉ tắt đăng nhập.

1. Vào [Firebase console](https://console.firebase.google.com), tạo project mới (gói miễn phí Spark là đủ).
2. **Build → Authentication → Get started**, thẻ *Sign-in method*: bật **Google** và **Email/Password**.
3. Cùng trang đó, thẻ *Settings → Authorized domains*: thêm `<tên-tài-khoản>.github.io`.
4. **Build → Firestore Database → Create database**, chọn vùng `asia-southeast1` (Singapore), chế độ *production*.
5. Thẻ *Rules* của Firestore: dán toàn bộ nội dung file [`firestore.rules`](firestore.rules) rồi bấm **Publish**. Hoặc chạy `npm run rules:deploy` sau khi `npx firebase-tools login` và `npx firebase-tools use --add`.
6. **Project settings → General → Your apps → Web app (</>)**: đăng ký app, chép đoạn `firebaseConfig` vào [`docs/firebase-config.js`](docs/firebase-config.js).
7. Commit và push. Mở trang trên GitHub Pages, thử **Đăng nhập bằng Google**.

`apiKey` trong cấu hình web được phép công khai. Dữ liệu được bảo vệ bằng luật Firestore: mỗi người chỉ đọc và ghi được hồ sơ `users/{uid}` của chính mình, các trường bị kiểm tra kiểu và giới hạn (hồ sơ mới tối đa 500 xu, mỗi lần lưu không tăng quá 2 000 xu).

## Thư mục

| Đường dẫn | Nội dung |
|---|---|
| `src/plan.js` | Mọi số đo đọc từ bản vẽ: ranh đất, phòng, sàn, cột, cao độ tầng |
| `src/school.js` | Khung nhà, lan can, cầu thang, cầu xanh tầng 3, mái, giếng trời, mặt tiền gạch khe |
| `src/interiors.js` | Nội thất: lớp học, thí nghiệm, máy tính, STEM, thư viện, phòng hội đồng, WC |
| `src/site.js` | Sân, vườn, tượng Hai Bà Trưng, bia Tôn Sư Trọng Đạo, cổng, xe |
| `src/letters.js`, `src/letters_data.js` | Chữ nổi 3D đùn từ font thật (`npm run letters` để sinh lại) |
| `src/game/` | Game: dữ liệu câu hỏi, thực đơn, công thức, phản ứng hoá học, mini game |
| `src/auth.js` | Đăng nhập Firebase và lưu tiến trình |
| `firestore.rules`, `firebase.json` | Luật bảo mật Firestore |
| `docs/` | Bản build cho GitHub Pages và `firebase-config.js` |
| `tools/` | Build, máy chủ dev, kiểm thử, chụp hình (ảnh ra `tools/out/`) |
| `reference/` | Bản vẽ và ảnh tham khảo, chỉ giữ trên máy |

Toạ độ trong `plan.js`: `P` tăng về phía Bắc (đường Phạm Hồng Thái), `Q` tăng về phía Đông (đường Yên Bái), đổi sang mét bằng `X(Q)`, `Z(P)` với tỉ lệ 9,42 px/m (hiệu chỉnh để diện tích đất khớp 3.431,5 m²). Cao độ tầng trong mảng `Y` là ước lượng vì bản vẽ không ghi cốt.

## Nguồn và giấy phép

- Bản vẽ: [Tạp chí Kiến trúc, Giải Đồng Giải thưởng Kiến trúc Quốc gia 2024–2025](https://www.tapchikientruc.com.vn/cuoc-thi/truong-thcs-trung-vuong-giai-dong-giai-thuong-kien-truc-quoc-gia-2024-2025.html). Thiết kế: KTS Huỳnh Văn Phương, Cao Thị Thu Thảo, Nguyễn Thị Ánh Vi.
- Ảnh đối chiếu: trang của trường [trungvuongdanang.edu.vn](http://trungvuongdanang.edu.vn), Tuổi Trẻ (ảnh Trường Trung), Báo Đà Nẵng. Logo thuộc nhà trường.
- Bản đồ: © OpenStreetMap contributors (ODbL).
- Font: Be Vietnam Pro, Barlow Condensed, Dancing Script, IBM Plex Mono (SIL Open Font License).
