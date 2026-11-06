// Dữ liệu game "Một ngày ở Trưng Vương". Giá tính bằng xu trong game.

// Thực đơn căn tin, lấy theo bảng thực đơn trong ảnh khu căn tin của trường
export const FOOD = {
  bm_cha:   { n: 'Bánh mì thịt chả',   price: 15, energy: 30 },
  bm_trung: { n: 'Bánh mì trứng',      price: 12, energy: 25 },
  bm_nuong: { n: 'Bánh mì thịt nướng', price: 18, energy: 35 },
  bm_opla:  { n: 'Bánh mì ốp la',      price: 12, energy: 25 },
  xoi:      { n: 'Xôi',                price: 10, energy: 22 },
  milo:     { n: 'Sữa Milo',           price: 8,  energy: 15 },
  nuoc:     { n: 'Nước suối',          price: 5,  energy: 8 },
};

// Vật liệu phòng STEM
export const MATERIALS = {
  que_kem:  { n: 'Que kem',        price: 1 },
  ong_hut:  { n: 'Ống hút',        price: 1 },
  day_thun: { n: 'Dây thun',       price: 1 },
  nap_chai: { n: 'Nắp chai',       price: 1 },
  chai:     { n: 'Chai nhựa',      price: 2 },
  bia:      { n: 'Bìa các-tông',   price: 2 },
  keo:      { n: 'Keo dán',        price: 3 },
  day_dien: { n: 'Dây điện',       price: 3 },
  led:      { n: 'Bóng LED',       price: 4 },
  pin:      { n: 'Pin AA',         price: 6 },
  motor:    { n: 'Động cơ mini',   price: 12 },
};

// Công thức chế tạo: value là số xu nhận được khi đem trưng bày ở Ngày hội STEM
export const RECIPES = {
  xe_thun:  { n: 'Xe chạy bằng dây thun', need: { nap_chai: 4, que_kem: 6, day_thun: 2, ong_hut: 1 }, value: 28, xp: 15,
              note: 'Dây thun xoắn tích thế năng đàn hồi, khi thả ra chuyển thành động năng làm bánh xe quay.' },
  cau_que:  { n: 'Cầu que kem',           need: { que_kem: 12, keo: 1 }, value: 26, xp: 12,
              note: 'Kết cấu tam giác giúp cầu cứng, chia đều lực ra các thanh.' },
  mach:     { n: 'Mạch điện đơn giản',    need: { pin: 1, led: 2, day_dien: 3 }, value: 34, xp: 18,
              note: 'Mạch kín mới có dòng điện. Bóng LED chỉ sáng khi mắc đúng cực.' },
  den_pin:  { n: 'Đèn pin tự chế',        need: { pin: 1, led: 1, day_dien: 2, bia: 1 }, value: 30, xp: 16,
              note: 'Pin biến hoá năng thành điện năng, LED biến điện năng thành quang năng.' },
  quat:     { n: 'Quạt mini',             need: { motor: 1, pin: 1, day_dien: 2, bia: 1 }, value: 42, xp: 22,
              note: 'Động cơ điện biến điện năng thành cơ năng làm cánh quạt quay.' },
  ten_lua:  { n: 'Tên lửa nước',          need: { chai: 2, bia: 2, keo: 1 }, value: 32, xp: 18,
              note: 'Nước bị đẩy ra phía sau thì tên lửa bị đẩy về phía trước: lực và phản lực.' },
};

// Hoá chất phòng thí nghiệm KHTN (đều là dung dịch loãng dùng trong SGK)
export const REAGENTS = {
  hcl:    { n: 'Dung dịch HCl loãng',      f: 'HCl',      color: [235, 240, 238, .25], kind: 'liq', hazard: 'Gây kích ứng da và mắt' },
  naoh:   { n: 'Dung dịch NaOH loãng',     f: 'NaOH',     color: [236, 240, 240, .25], kind: 'liq', hazard: 'Ăn mòn, gây bỏng da' },
  cuso4:  { n: 'Dung dịch CuSO₄',          f: 'CuSO₄',    color: [52, 136, 222, .7],   kind: 'liq', hazard: 'Độc nếu nuốt, hại môi trường nước' },
  agno3:  { n: 'Dung dịch AgNO₃ loãng',    f: 'AgNO₃',    color: [236, 238, 240, .25], kind: 'liq', hazard: 'Làm đen da, độc nếu nuốt' },
  bacl2:  { n: 'Dung dịch BaCl₂',          f: 'BaCl₂',    color: [236, 238, 240, .25], kind: 'liq', hazard: 'Độc nếu nuốt' },
  na2so4: { n: 'Dung dịch Na₂SO₄',         f: 'Na₂SO₄',   color: [236, 238, 240, .25], kind: 'liq', hazard: 'Ít độc' },
  nacl:   { n: 'Dung dịch NaCl (muối ăn)', f: 'NaCl',     color: [236, 238, 240, .25], kind: 'liq', hazard: 'An toàn' },
  giam:   { n: 'Giấm ăn',                  f: 'CH₃COOH',  color: [244, 236, 214, .35], kind: 'liq', hazard: 'An toàn, tránh vào mắt' },
  quy:    { n: 'Dung dịch quỳ tím',        f: 'quỳ tím',  color: [128, 76, 168, .75],  kind: 'ind', hazard: 'An toàn' },
  phenol: { n: 'Phenolphtalein',           f: 'phenolphtalein', color: [240, 240, 240, .2], kind: 'ind', hazard: 'Không được nuốt' },
  fe:     { n: 'Đinh sắt',                 f: 'Fe',       color: [120, 124, 130, 1],   kind: 'solid', hazard: 'An toàn' },
  zn:     { n: 'Kẽm viên',                 f: 'Zn',       color: [170, 174, 180, 1],   kind: 'solid', hazard: 'An toàn' },
  soda:   { n: 'Baking soda (NaHCO₃)',     f: 'NaHCO₃',   color: [250, 250, 250, 1],   kind: 'powder', hazard: 'An toàn' },
  nuoc:   { n: 'Nước cất',                 f: 'H₂O',      color: [230, 240, 246, .15], kind: 'liq', hazard: 'An toàn' },
};

// Phản ứng: need là tập hoá chất có trong ống. Ưu tiên quy tắc nhiều chất hơn.
// fx: hiệu ứng trong ống nghiệm. liquid = màu dung dịch sau phản ứng.
export const REACTIONS = [
  { id: 'trung_hoa_phenol', need: ['naoh', 'phenol', 'hcl'], last: 'hcl', n: 'Trung hoà axit và bazơ',
    eq: 'HCl + NaOH → NaCl + H₂O', see: 'Dung dịch đang hồng mất màu dần khi thêm đủ HCl.',
    why: 'Phenolphtalein hồng trong môi trường bazơ. Khi axit trung hoà hết bazơ, dung dịch không còn bazơ nên mất màu.',
    fx: { liquid: [240, 236, 238, .3] } },
  { id: 'quy_axit', need: ['hcl', 'quy'], n: 'Axit làm đổi màu quỳ tím',
    eq: 'Quỳ tím + HCl → màu đỏ', see: 'Dung dịch chuyển sang màu đỏ.', why: 'Axit làm quỳ tím hoá đỏ.', fx: { liquid: [212, 40, 56, .75] } },
  { id: 'quy_bazo', need: ['naoh', 'quy'], n: 'Bazơ làm đổi màu quỳ tím',
    eq: 'Quỳ tím + NaOH → màu xanh', see: 'Dung dịch chuyển sang màu xanh.', why: 'Bazơ làm quỳ tím hoá xanh.', fx: { liquid: [44, 92, 200, .75] } },
  { id: 'quy_giam', need: ['giam', 'quy'], n: 'Giấm ăn có tính axit',
    eq: 'Quỳ tím + CH₃COOH → màu đỏ nhạt', see: 'Dung dịch chuyển hồng đỏ nhạt.', why: 'Giấm ăn chứa axit axetic, một axit yếu.', fx: { liquid: [196, 82, 120, .7] } },
  { id: 'phenol_bazo', need: ['naoh', 'phenol'], n: 'Phenolphtalein gặp bazơ',
    eq: 'Phenolphtalein + NaOH → màu hồng', see: 'Dung dịch không màu chuyển sang hồng.', why: 'Phenolphtalein là chất chỉ thị, hoá hồng trong môi trường bazơ.', fx: { liquid: [236, 72, 150, .7] } },
  { id: 'phenol_axit', need: ['hcl', 'phenol'], n: 'Phenolphtalein gặp axit',
    eq: 'Phenolphtalein + HCl → không đổi màu', see: 'Dung dịch vẫn không màu.', why: 'Phenolphtalein không đổi màu trong môi trường axit hoặc trung tính.', fx: { liquid: [240, 240, 240, .25] } },
  { id: 'hcl_naoh', need: ['hcl', 'naoh'], n: 'Phản ứng trung hoà',
    eq: 'HCl + NaOH → NaCl + H₂O', see: 'Không thấy đổi màu, ống nghiệm hơi ấm lên.',
    why: 'Phản ứng trung hoà toả nhiệt. Muốn thấy rõ thời điểm trung hoà, hãy cho phenolphtalein vào NaOH trước rồi nhỏ HCl.', fx: { liquid: [236, 240, 240, .25], warm: true } },
  { id: 'cu_oh2', need: ['cuso4', 'naoh'], n: 'Kết tủa đồng(II) hiđroxit',
    eq: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄', see: 'Xuất hiện kết tủa màu xanh lam.',
    why: 'Ion Cu²⁺ kết hợp với OH⁻ tạo Cu(OH)₂ không tan.', fx: { liquid: [150, 200, 236, .45], ppt: [40, 110, 210] } },
  { id: 'fe_cuso4', need: ['cuso4', 'fe'], n: 'Sắt đẩy đồng ra khỏi muối',
    eq: 'Fe + CuSO₄ → FeSO₄ + Cu', see: 'Đinh sắt phủ lớp màu đỏ, màu xanh của dung dịch nhạt dần.',
    why: 'Sắt hoạt động hoá học mạnh hơn đồng nên đẩy được đồng ra khỏi dung dịch muối.', fx: { liquid: [150, 196, 186, .45], coat: [176, 82, 52] } },
  { id: 'zn_cuso4', need: ['cuso4', 'zn'], n: 'Kẽm đẩy đồng ra khỏi muối',
    eq: 'Zn + CuSO₄ → ZnSO₄ + Cu', see: 'Viên kẽm phủ lớp đỏ, dung dịch nhạt màu dần.',
    why: 'Kẽm hoạt động mạnh hơn đồng.', fx: { liquid: [170, 206, 228, .35], coat: [176, 82, 52] } },
  { id: 'zn_hcl', need: ['hcl', 'zn'], n: 'Kim loại tác dụng với axit',
    eq: 'Zn + 2HCl → ZnCl₂ + H₂↑', see: 'Sủi bọt khí trên bề mặt viên kẽm.', why: 'Kẽm đứng trước hiđro trong dãy hoạt động hoá học nên đẩy được hiđro khỏi axit.', fx: { liquid: [236, 240, 240, .25], bubbles: 1 } },
  { id: 'fe_hcl', need: ['hcl', 'fe'], n: 'Sắt tác dụng với axit',
    eq: 'Fe + 2HCl → FeCl₂ + H₂↑', see: 'Sủi bọt khí chậm, dung dịch có màu lục rất nhạt.', why: 'Sắt phản ứng với axit chậm hơn kẽm.', fx: { liquid: [214, 236, 214, .35], bubbles: .45 } },
  { id: 'soda_giam', need: ['giam', 'soda'], n: 'Baking soda gặp giấm',
    eq: 'NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂↑', see: 'Sủi bọt rất mạnh, có bọt dâng lên.', why: 'Axit phản ứng với muối hiđrocacbonat giải phóng khí CO₂.', fx: { liquid: [244, 240, 228, .35], bubbles: 1.6, foam: true } },
  { id: 'soda_hcl', need: ['hcl', 'soda'], n: 'Muối cacbonat tác dụng với axit',
    eq: 'NaHCO₃ + HCl → NaCl + H₂O + CO₂↑', see: 'Sủi bọt khí mạnh.', why: 'Khí sinh ra là CO₂.', fx: { liquid: [240, 240, 240, .3], bubbles: 1.3 } },
  { id: 'baso4', need: ['bacl2', 'na2so4'], n: 'Kết tủa bari sunfat',
    eq: 'BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl', see: 'Xuất hiện kết tủa trắng.', why: 'BaSO₄ không tan trong nước. Đây là cách nhận biết ion sunfat.', fx: { liquid: [236, 238, 240, .4], ppt: [248, 248, 248] } },
  { id: 'baso4_cu', need: ['bacl2', 'cuso4'], n: 'Nhận biết muối sunfat',
    eq: 'BaCl₂ + CuSO₄ → BaSO₄↓ + CuCl₂', see: 'Kết tủa trắng, dung dịch vẫn còn màu xanh.', why: 'Gốc sunfat trong CuSO₄ tạo BaSO₄ không tan.', fx: { liquid: [90, 160, 220, .55], ppt: [248, 248, 248] } },
  { id: 'agcl', need: ['agno3', 'nacl'], n: 'Kết tủa bạc clorua',
    eq: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃', see: 'Xuất hiện kết tủa trắng.', why: 'AgCl không tan. Đây là cách nhận biết ion clorua.', fx: { liquid: [236, 238, 240, .4], ppt: [246, 246, 240] } },
  { id: 'agcl_hcl', need: ['agno3', 'hcl'], n: 'Nhận biết axit clohiđric',
    eq: 'AgNO₃ + HCl → AgCl↓ + HNO₃', see: 'Xuất hiện kết tủa trắng.', why: 'Gốc clorua trong HCl tạo AgCl không tan.', fx: { liquid: [236, 238, 240, .4], ppt: [246, 246, 240] } },
];

// Câu hỏi trong lớp (chương trình THCS). a là chỉ số đáp án đúng.
export const QUESTIONS = {
  'Toán': [
    { q: 'Kết quả của 2³ + 3² là?', c: ['13', '17', '15', '12'], a: 1, e: '2³ = 8, 3² = 9, cộng lại bằng 17.' },
    { q: 'Nghiệm của phương trình 2x − 6 = 0 là?', c: ['x = −3', 'x = 6', 'x = 3', 'x = 12'], a: 2, e: '2x = 6 nên x = 3.' },
    { q: 'Tổng ba góc trong một tam giác bằng?', c: ['90°', '180°', '270°', '360°'], a: 1, e: 'Định lí tổng ba góc của tam giác.' },
    { q: 'Số nào là số nguyên tố?', c: ['21', '27', '29', '33'], a: 2, e: '29 chỉ chia hết cho 1 và chính nó.' },
    { q: 'Căn bậc hai số học của 81 là?', c: ['9', '−9', '8', '40,5'], a: 0, e: '9² = 81 và căn bậc hai số học không âm.' },
    { q: 'Diện tích hình tròn bán kính r là?', c: ['2πr', 'πr²', 'πd', '4πr²'], a: 1, e: 'S = πr².' },
    { q: 'ƯCLN(12, 18) bằng?', c: ['3', '2', '6', '36'], a: 2, e: '6 là số lớn nhất chia hết cả 12 và 18.' },
    { q: 'Hình chữ nhật dài 8 cm, rộng 5 cm có chu vi là?', c: ['13 cm', '26 cm', '40 cm', '18 cm'], a: 1, e: '(8 + 5) × 2 = 26 cm.' },
    { q: 'Tam giác vuông có hai cạnh góc vuông 3 và 4 thì cạnh huyền bằng?', c: ['5', '7', '6', '12'], a: 0, e: 'Theo định lí Pythagore: √(9 + 16) = 5.' },
    { q: '(−5) · (−4) bằng?', c: ['−20', '20', '−9', '9'], a: 1, e: 'Tích hai số âm là số dương.' },
  ],
  'Khoa học tự nhiên': [
    { q: 'Công thức hoá học của nước là?', c: ['H₂O₂', 'HO', 'H₂O', 'O₂H'], a: 2, e: 'Mỗi phân tử nước gồm 2 nguyên tử H và 1 nguyên tử O.' },
    { q: 'Dung dịch nào làm quỳ tím hoá đỏ?', c: ['NaOH', 'HCl', 'Nước cất', 'NaCl'], a: 1, e: 'HCl là axit.' },
    { q: 'Đơn vị đo lực trong hệ SI là?', c: ['Jun (J)', 'Oát (W)', 'Niutơn (N)', 'Pascal (Pa)'], a: 2, e: 'Lực đo bằng niutơn.' },
    { q: 'Bộ phận chủ yếu thực hiện quang hợp ở cây xanh là?', c: ['Rễ', 'Thân', 'Lá', 'Hoa'], a: 2, e: 'Lá chứa nhiều lục lạp.' },
    { q: 'Khí chiếm khoảng 21% thể tích không khí là?', c: ['Nitơ', 'Oxygen', 'Carbon dioxide', 'Argon'], a: 1, e: 'Oxygen khoảng 21%, nitơ khoảng 78%.' },
    { q: 'Kim loại nào ở thể lỏng ở nhiệt độ phòng?', c: ['Sắt', 'Thuỷ ngân', 'Nhôm', 'Đồng'], a: 1, e: 'Thuỷ ngân (Hg) là kim loại lỏng.' },
    { q: 'Đơn vị cơ bản cấu tạo nên cơ thể sống là?', c: ['Mô', 'Cơ quan', 'Tế bào', 'Phân tử'], a: 2, e: 'Mọi cơ thể sống đều được cấu tạo từ tế bào.' },
    { q: 'Cho đinh sắt vào dung dịch CuSO₄, trên đinh xuất hiện lớp màu?', c: ['Trắng', 'Đỏ', 'Đen', 'Vàng'], a: 1, e: 'Lớp đồng màu đỏ bám lên đinh sắt.' },
    { q: 'Dung dịch trung tính ở 25 °C có pH bằng?', c: ['0', '5', '7', '14'], a: 2, e: 'pH = 7 là trung tính.' },
    { q: 'Ánh sáng truyền trong chân không với tốc độ khoảng?', c: ['300 km/s', '3 000 km/s', '300 000 km/s', '340 m/s'], a: 2, e: 'Khoảng 300 000 km/s. 340 m/s là tốc độ âm thanh trong không khí.' },
  ],
  'Ngữ văn': [
    { q: '"Truyện Kiều" là tác phẩm của?', c: ['Nguyễn Trãi', 'Nguyễn Du', 'Hồ Xuân Hương', 'Nguyễn Đình Chiểu'], a: 1, e: 'Đại thi hào Nguyễn Du.' },
    { q: '"Lặng lẽ Sa Pa" là truyện ngắn của?', c: ['Nguyễn Thành Long', 'Kim Lân', 'Nguyễn Quang Sáng', 'Tô Hoài'], a: 0, e: 'Nguyễn Thành Long viết năm 1970.' },
    { q: 'Câu "Mặt trời xuống biển như hòn lửa" dùng biện pháp tu từ?', c: ['Nhân hoá', 'Ẩn dụ', 'So sánh', 'Hoán dụ'], a: 2, e: 'Có từ so sánh "như".' },
    { q: 'Bài thơ "Đồng chí" là của?', c: ['Phạm Tiến Duật', 'Chính Hữu', 'Huy Cận', 'Tố Hữu'], a: 1, e: 'Chính Hữu viết năm 1948.' },
    { q: 'Từ nào là từ láy?', c: ['Nhà cửa', 'Quần áo', 'Xinh xắn', 'Sách vở'], a: 2, e: '"Xinh xắn" lặp lại phụ âm đầu.' },
    { q: '"Bánh trôi nước" là bài thơ của?', c: ['Bà Huyện Thanh Quan', 'Hồ Xuân Hương', 'Đoàn Thị Điểm', 'Nguyễn Khuyến'], a: 1, e: 'Hồ Xuân Hương.' },
    { q: '"Chiếc lược ngà" là truyện ngắn của?', c: ['Nguyễn Quang Sáng', 'Nguyễn Minh Châu', 'Lê Minh Khuê', 'Nam Cao'], a: 0, e: 'Nguyễn Quang Sáng viết năm 1966.' },
  ],
  'Tiếng Anh': [
    { q: 'She ___ to school every day.', c: ['go', 'goes', 'going', 'gone'], a: 1, e: 'Chủ ngữ ngôi thứ ba số ít ở thì hiện tại đơn: goes.' },
    { q: 'Quá khứ của "go" là?', c: ['goed', 'gone', 'went', 'goes'], a: 2, e: 'go – went – gone.' },
    { q: '"Thư viện" trong tiếng Anh là?', c: ['bookstore', 'library', 'laboratory', 'canteen'], a: 1, e: 'Library.' },
    { q: 'I have lived here ___ 2020.', c: ['for', 'since', 'at', 'in'], a: 1, e: 'Since + mốc thời gian.' },
    { q: 'Từ trái nghĩa với "difficult" là?', c: ['hard', 'easy', 'busy', 'early'], a: 1, e: 'Easy.' },
    { q: 'He is good ___ maths.', c: ['in', 'on', 'at', 'for'], a: 2, e: 'Be good at something.' },
    { q: 'Số nhiều của "child" là?', c: ['childs', 'childes', 'children', 'childrens'], a: 2, e: 'Danh từ bất quy tắc: children.' },
  ],
  'Lịch sử và Địa lí': [
    { q: 'Khởi nghĩa Hai Bà Trưng nổ ra vào năm?', c: ['Năm 40', 'Năm 248', 'Năm 938', 'Năm 1288'], a: 0, e: 'Mùa xuân năm 40.' },
    { q: 'Hai Bà Trưng khởi nghĩa chống ách đô hộ của?', c: ['Nhà Tống', 'Nhà Hán', 'Nhà Minh', 'Nhà Thanh'], a: 1, e: 'Chống ách đô hộ của nhà Hán (Đông Hán).' },
    { q: 'Chiến thắng Bạch Đằng năm 938 gắn với tên tuổi?', c: ['Lý Thường Kiệt', 'Ngô Quyền', 'Trần Hưng Đạo', 'Lê Lợi'], a: 1, e: 'Ngô Quyền đánh tan quân Nam Hán.' },
    { q: 'Ngày Quốc khánh nước Việt Nam là?', c: ['30/4', '1/5', '2/9', '19/8'], a: 2, e: 'Ngày 2/9/1945.' },
    { q: 'Đỉnh núi cao nhất Việt Nam là?', c: ['Bạch Mã', 'Phan-xi-păng', 'Ngọc Linh', 'Bà Đen'], a: 1, e: 'Phan-xi-păng cao khoảng 3 143 m.' },
    { q: 'Cây cầu hình con rồng bắc qua sông Hàn ở Đà Nẵng là?', c: ['Cầu Rồng', 'Cầu Long Biên', 'Cầu Trường Tiền', 'Cầu Mỹ Thuận'], a: 0, e: 'Cầu Rồng khánh thành năm 2013.' },
    { q: 'Thành phố Đà Nẵng giáp với biển nào?', c: ['Biển Đông', 'Biển Đỏ', 'Biển Bắc', 'Biển Đen'], a: 0, e: 'Đà Nẵng nằm bên bờ Biển Đông.' },
  ],
  'Tin học': [
    { q: '1 byte bằng bao nhiêu bit?', c: ['4', '8', '16', '1024'], a: 1, e: '1 byte = 8 bit.' },
    { q: 'Thiết bị nào là thiết bị vào?', c: ['Màn hình', 'Loa', 'Bàn phím', 'Máy in'], a: 2, e: 'Bàn phím dùng để đưa dữ liệu vào máy.' },
    { q: 'Phím tắt sao chép trên Windows là?', c: ['Ctrl + V', 'Ctrl + X', 'Ctrl + C', 'Ctrl + Z'], a: 2, e: 'Ctrl + C để sao chép, Ctrl + V để dán.' },
    { q: 'Mật khẩu nào an toàn nhất?', c: ['123456', 'hocsinh', 'Tv@2025!xq', 'abcdef'], a: 2, e: 'Dài, có chữ hoa, chữ thường, số và kí hiệu.' },
    { q: 'Vòng lặp trong lập trình dùng để?', c: ['Lặp lại một nhóm lệnh', 'Xoá chương trình', 'Tắt máy', 'Đổi màu chữ'], a: 0, e: 'Vòng lặp thực hiện lặp lại các lệnh.' },
    { q: 'HTML dùng để làm gì?', c: ['Tạo cấu trúc trang web', 'Diệt virus', 'Nén tệp', 'Soạn nhạc'], a: 0, e: 'HTML là ngôn ngữ đánh dấu siêu văn bản.' },
  ],
  'Về trường mình': [
    { q: 'Trường THCS Trưng Vương ở địa chỉ nào?', c: ['88 Yên Bái', '12 Trần Phú', '5 Lê Lợi', '50 Bạch Đằng'], a: 0, e: '88 Yên Bái, Hải Châu, Đà Nẵng.' },
    { q: 'Năm 2025 trường kỷ niệm bao nhiêu năm thành lập?', c: ['30 năm', '40 năm', '50 năm', '60 năm'], a: 2, e: 'Lễ kỷ niệm 50 năm thành lập tổ chức tháng 3/2025.' },
    { q: 'Công trình trường mới hoàn thành năm nào?', c: ['2015', '2018', '2021', '2024'], a: 2, e: 'Công trình hoàn thành năm 2021.' },
    { q: 'Tượng giữa sân trường khắc hoạ ai?', c: ['Hai Bà Trưng', 'Bà Triệu', 'Trần Hưng Đạo', 'Lý Thái Tổ'], a: 0, e: 'Hai Bà Trưng trên lưng voi.' },
    { q: 'Bia đá trong sân trường khắc dòng chữ nào?', c: ['Học, học nữa', 'Tôn Sư Trọng Đạo', 'Uống nước nhớ nguồn', 'Tiên học lễ'], a: 1, e: 'Tôn Sư Trọng Đạo.' },
    { q: 'Công trình trường đạt giải gì ở Giải thưởng Kiến trúc Quốc gia 2024–2025?', c: ['Giải Vàng', 'Giải Bạc', 'Giải Đồng', 'Giải Khuyến khích'], a: 2, e: 'Giải Đồng, hạng mục công trình công cộng.' },
  ],
};

export const TYPING_WORDS = ('hoc sinh truong hoc thu vien ban be thay co bai tap san truong cau xanh may tinh ban phim man hinh lap trinh ' +
  'thi nghiem hoa hoc vat ly sinh hoc toan hoc ngu van tieng anh lich su dia ly da nang yen bai trung vuong chao co ' +
  'giai lao can tin banh mi sua milo xoi sang tao cong nghe robot dong co den led pin dien tuong voi bia da hoa giay ' +
  'gieng troi hanh lang cau thang phong hoc bang den phan trang vo ghi chep kiem tra diem muoi chuyen can').split(' ');

export const BOOK_FACTS = [
  'Khởi nghĩa Hai Bà Trưng nổ ra mùa xuân năm 40 ở Mê Linh.',
  'Nước sôi ở 100 °C khi áp suất bằng 1 atm. Lên núi cao, nước sôi ở nhiệt độ thấp hơn.',
  'Mắt người phân biệt được khoảng một triệu màu.',
  'Cầu Rồng ở Đà Nẵng dài 666 m và phun lửa, phun nước vào tối cuối tuần.',
  'Lá cây có màu xanh vì chất diệp lục hấp thụ ánh sáng đỏ, xanh lam và phản xạ ánh sáng xanh lục.',
  'Số π là số vô tỉ: phần thập phân của nó kéo dài mãi không lặp lại.',
  'Trái Đất quay quanh trục hết khoảng 24 giờ và quanh Mặt Trời hết khoảng 365,25 ngày.',
  'Kim cương và than chì đều được tạo thành từ nguyên tố carbon.',
];

export const TITLES = [[0, 'Học sinh mới'], [120, 'Học sinh chăm chỉ'], [320, 'Học sinh khá'], [700, 'Học sinh giỏi'], [1400, 'Học sinh xuất sắc']];

export const QUESTS = {
  an_sang: { n: 'Ăn sáng ở căn tin', goal: 1, reward: 5 },
  hoc_bai: { n: 'Trả lời đúng 3 câu hỏi trong lớp', goal: 3, reward: 10 },
  thi_nghiem: { n: 'Làm 1 thí nghiệm ở phòng KHTN', goal: 1, reward: 10 },
  stem: { n: 'Chế tạo 1 sản phẩm STEM', goal: 1, reward: 10 },
  nhat_rac: { n: 'Nhặt 5 rác bỏ vào thùng', goal: 5, reward: 8 },
  go_phim: { n: 'Luyện gõ phím ở phòng Tin học', goal: 1, reward: 8 },
};
