# Mô hình 3D Trường THCS Trưng Vương, Đà Nẵng

Mô hình đi bộ được của trường (88 Yên Bái, Hải Châu), dựng bằng Three.js từ bản vẽ kiến trúc đã công bố và dữ liệu OpenStreetMap. Đơn vị là mét thật.

## Bắt đầu

```bash
npm install
npm run dev      # mở http://localhost:5173, sửa src/ là trang tự tải lại
npm run build    # tạo dist/index.html (bản rút gọn để đăng)
npm test         # kiểm thử đi bộ qua cầu thang, cửa và giao diện
```

Cần Google Chrome để chạy kiểm thử và chụp hình (`tools/*.mjs` dùng Chrome của máy).

## Thư mục

| Đường dẫn | Nội dung |
|---|---|
| `src/plan.js` | **Mọi số đo đọc từ bản vẽ**: ranh đất, phòng, sàn, cột, cao độ tầng. Sửa kích thước ở đây trước tiên. |
| `src/school.js` | Khung nhà: sàn, tường, cửa, lan can, cầu thang, mái, mặt tiền gạch hoa gió, sân đa năng |
| `src/interiors.js` | Nội thất từng loại phòng: lớp học, thí nghiệm, máy tính, thư viện, phòng hội đồng, WC |
| `src/site.js` | Sân trường, vườn, tượng Hai Bà Trưng, cổng, hàng rào, xe |
| `src/vegetation.js` | Cây, bụi, dây leo (có gió) |
| `src/city.js` | Phố xung quanh từ `src/osm_data.js` |
| `src/sky.js` | Bầu trời và vị trí mặt trời thật theo toạ độ trường |
| `src/player.js` | Đi bộ, bay, xoay toàn cảnh, va chạm |
| `src/textures.js` | Vật liệu vẽ bằng code |
| `src/builder.js` | Bộ gộp hình học (giảm draw call) |
| `src/main.js` | Khởi tạo cảnh, ánh sáng, hậu kỳ, giao diện, điểm nhìn |
| `src/index.template.html` | Giao diện HTML/CSS, logo |
| `tools/` | Build, máy chủ dev, kiểm thử, chụp hình (ảnh ra `tools/out/`) |
| `reference/` | Bản vẽ và ảnh thật dùng để dựng mô hình, chỉ giữ trên máy (xem `reference/README.md`) |

## Toạ độ

- Trong `plan.js` số đo ghi theo điểm ảnh bản vẽ: `P` tăng về phía Bắc (đường Phạm Hồng Thái), `Q` tăng về phía Đông (đường Yên Bái).
- `X(Q)`, `Z(P)` đổi sang mét. Tỉ lệ `S = 9,42 px/m`, hiệu chỉnh để diện tích đất khớp 3.431,5 m².
- Cao độ sàn nằm trong mảng `Y`; đây là số ước lượng vì bản vẽ không ghi cốt.

## Đăng

`npm run build`, rồi đăng `dist/index.html` lên đúng link artifact cũ.

## Nguồn

- [Tạp chí Kiến trúc: Giải Đồng Giải thưởng Kiến trúc Quốc gia 2024–2025](https://www.tapchikientruc.com.vn/cuoc-thi/truong-thcs-trung-vuong-giai-dong-giai-thuong-kien-truc-quoc-gia-2024-2025.html). Thiết kế: KTS Huỳnh Văn Phương, Cao Thị Thu Thảo, Nguyễn Thị Ánh Vi.
- © OpenStreetMap contributors (ODbL)
