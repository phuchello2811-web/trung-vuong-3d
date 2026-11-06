// Dữ liệu đọc trực tiếp từ bản vẽ công bố trên Tạp chí Kiến trúc (mặt bằng tầng 1–5, mái, mặt cắt A-A).
// Hệ toạ độ bản vẽ: P tăng về phía Bắc (đường Phạm Hồng Thái), Q tăng về phía Đông (đường Yên Bái).
// Đơn vị P, Q: điểm ảnh trên bản vẽ. S là số điểm ảnh mỗi mét, hiệu chỉnh để diện tích đất khớp 3.431,5 m².
export const S = 9.42;
export const X = q => (q - 294) / S;       // Đông  -> +x
export const Z = p => (480 - p) / S;       // Bắc   -> -z
export const M = px => px / S;

// Cao độ mặt sàn: 5 tầng + mái, tổng 20,7 m theo chỉ tiêu kiến trúc.
export const Y = [0, 0.02, 4.2, 8.1, 12.0, 15.9, 19.8];
export const TOTAL_H = 20.7;

export const SITE = [[292,45],[790,45],[808,250],[808,322],[825,530],[557,538],[497,539],[142,543],[135,208],[293,205]];

const room = (L,P0,P1,Q0,Q1,name,kind,door,outer,board) => ({L,P0,P1,Q0,Q1,name,kind,door,outer,board});
export const ROOMS = [
  // Tầng 1
  room(1,303,366,57,127,'Khu vệ sinh','wc','Qmax','Qmin'),
  room(1,366,540,57,127,'Thư viện','lib','Qmax','Qmin'),
  room(1,606,691,57,127,'Văn phòng','office','Qmax','Qmin'),
  room(1,691,737,57,127,'Phòng Công đoàn','office','Qmax','Qmin'),
  room(1,737,788,57,127,'Phòng Kỹ thuật','store','Qmax','Qmin'),
  room(1,716.5,788,381,428,'Phòng Y tế','office','Pmin','Pmax'),
  room(1,716.5,788,428,467,'Phòng Bảo vệ','office','Pmin','Pmax'),
  room(1,135,224,207,255,'Kho','store','Qmax','Pmin'),
  // Tầng 2
  room(2,303,368,57,127,'WC giáo viên','wc','Qmax','Qmin'),
  room(2,368,452,57,127,'Phòng Chuẩn bị cho Giảng dạy','office','Qmax','Qmin'),
  room(2,452,491,57,127,'Phòng Phó Hiệu trưởng','office','Qmax','Qmin'),
  room(2,491,540,57,127,'Phòng Phó Hiệu trưởng','office','Qmax','Qmin'),
  room(2,606,649,57,127,'Phòng Tài vụ','office','Qmax','Qmin'),
  room(2,649,691,57,127,'Phòng Hiệu trưởng','office','Qmax','Qmin'),
  room(2,716.5,788,57,92,'WC nam','wc','Pmin','Pmax'),
  room(2,716.5,788,92,127,'WC nữ','wc','Pmin','Pmax'),
  ...[[127,210],[210,296],[296,381],[381,467]].map(([a,b])=>room(2,716.5,788,a,b,'Lớp học','class','Pmin','Pmax','Qmax')),
  room(2,152,237,207,255,'Kho dụng cụ','store','Pmax','Pmin'),
  room(2,152,237,255,340,'Phòng Truyền thống','office','Pmax','Pmin'),
  room(2,142,237,340,512,'Hội trường','hall','Pmax','Pmin'),
];
for (const L of [3,4]) ROOMS.push(
  room(L,303,368,57,127,'WC nữ','wc','Qmax','Qmin'),
  room(L,368,452,57,127,'Lớp học','class','Qmax','Qmin','Pmax'),
  room(L,452,540,57,127,'Lớp học','class','Qmax','Qmin','Pmax'),
  room(L,606,691,57,127,'Lớp học','class','Qmax','Qmin','Pmax'),
  room(L,716.5,788,57,127,'WC nam','wc','Pmin','Pmax'),
  ...[[127,210],[210,296],[296,381],[381,467]].map(([a,b])=>room(L,716.5,788,a,b,'Lớp học','class','Pmin','Pmax','Qmax')),
  ...[[168,254],[254,340],[340,424]].map(([a,b])=>room(L,325,397,a,b,'Lớp học','class','Pmin','Pmax','Qmax')),
  room(L,153,224,207,255,'Phòng nghỉ giáo viên','office','Pmax','Pmin'),
  ...[[255,340],[340,424],[424,512]].map(([a,b])=>room(L,153,224,a,b,'Lớp học','class','Pmax','Pmin','Qmin')),
);
ROOMS.push(
  room(5,303,368,57,127,'WC nữ','wc','Qmax','Qmin'),
  room(5,368,410,57,127,'Phòng Chuẩn bị','office','Qmax','Qmin'),
  room(5,410,540,57,127,'Phòng Thí nghiệm Vật lý','lab','Qmax','Qmin','Pmax'),
  room(5,606,691,57,127,'Lớp học','class','Qmax','Qmin','Pmax'),
  room(5,716.5,788,57,127,'WC nam','wc','Pmin','Pmax'),
  room(5,716.5,788,127,254,'Phòng Thí nghiệm Sinh học','lab','Pmin','Pmax','Qmax'),
  room(5,716.5,788,254,298,'Phòng Chuẩn bị','office','Pmin','Pmax'),
  room(5,716.5,788,298,345,'Phòng Chuẩn bị','office','Pmin','Pmax'),
  room(5,716.5,788,345,467,'Phòng học Công nghệ','lab','Pmin','Pmax','Qmax'),
  room(5,325,397,168,298,'Phòng học Máy tính','comp','Pmin','Pmax','Qmax'),
  room(5,325,397,298,424,'Phòng học Máy tính','comp','Pmin','Pmax','Qmax'),
  room(5,153,224,207,255,'Phòng Chuẩn bị','office','Pmax','Pmin'),
  room(5,153,224,255,390,'Phòng Thí nghiệm Hoá học','lab','Pmax','Pmin','Qmin'),
  room(5,153,224,390,512,'Phòng học Ngoại ngữ','lab','Pmax','Pmin','Qmin'),
);

// Mặt sàn hành lang (P0,P1,Q0,Q1), các hình chữ nhật không chồng lên nhau.
const coreW = [[303,540,57,153],[540,606,127,153],[606,716.5,57,153],[716.5,788,57,127]];
const north = [[695,716.5,153,467],[716.5,788,127,467],[788,800,127,467]];
const northEnd = [[695,716.5,467,512]];
export const SLABS = {
  2: [...coreW,...north,...northEnd,[662,695,430,510],
      [303,333,153,212],[237,333,212,255],[237,264,255,424],[237,397,424,433],
      [142,237,340,512],[152,237,207,340]],
  3: null, 4: null, 5: null,
};
const up = [...coreW,...north,...northEnd,
  [303,417,153,168],[303,325,168,424],[325,397,168,424],[397,417,168,398],
  [224,303,212,255],[224,247,255,424],[224,397,424,433],
  [153,224,207,512],[142,153,255,505],[224,245,467,512]];
SLABS[3] = up; SLABS[4] = up; SLABS[5] = up;

// Mép sàn cần lan can: danh sách đoạn thẳng (P,Q)->(P,Q)
export const RAILS = {
  2: [[[333,153],[695,153]],[[695,153],[695,430]],[[695,430],[662,430]],[[662,430],[662,510]],[[662,510],[716.5,510]],
      [[333,153],[333,255]],[[333,255],[264,255]],[[264,255],[264,424]],[[264,424],[325,424]],
      [[397,424],[397,433]]],
  3: null,4: null,5: null,
};
const railsUp = [[[417,153],[695,153]],[[695,153],[695,512]],[[695,512],[716.5,512]],
  [[417,153],[417,398]],[[417,398],[400,401]],[[400,401],[397,424]],
  [[247,255],[303,255]],[[303,255],[303,424]],[[303,424],[247,424]],[[247,424],[247,255]],
  [[788,127],[800,127]],[[800,127],[800,467]],[[800,467],[788,467]],
  [[142,255],[142,505]],[[142,505],[153,505]],[[142,255],[153,255]],
  [[245,467],[245,512]],[[224,512],[245,512]],[[397,424],[397,433]]];
RAILS[3]=railsUp; RAILS[4]=railsUp; RAILS[5]=railsUp;

// Cột tròn tầng 1 đọc từ mặt bằng tầng 1
export const COLS = [
  [304,168,.2],[326,168,.34],[394,168,.34],[304,213,.2],[262,214,.34],[262,254,.34],[326,254,.34],[394,254,.34],
  [155,340,.34],[222,340,.34],[262,340,.34],[326,340,.34],[394,340,.34],[155,425,.34],[222,425,.34],[262,425,.34],
  [327,424,.34],[393,425,.34],[262,468,.34],
  [718,211,.34],[785,211,.34],[718,297,.34],[785,297,.34],
];
// Cột hàng hiên khối phía Tây (Q=151) và dàn hoa phía Đông
export const WEST_COLS = [411,453.6,496,538,607,650,693];
export const PERGOLA_P = [444,508,572,636,694];
export const PERGOLA_Q = [436,512];

// Vườn sân trường
const v = (vx,vy)=>[150+(vx-62)/2.096, 50+(vy-21)/2.096];
export const GARDENS = [
  [[650,238],[843,238],[843,320],[820,360],[780,366],[722,342],[680,300]],
  [[1005,238],[1203,238],[1203,405],[1100,442],[1050,462],[1020,445],[1005,400]],
  [[628,322],[700,358],[770,410],[815,490],[800,540],[740,556],[628,545]],
  [[1203,500],[1110,525],[1062,585],[1090,642],[1203,688]],
  [[628,598],[700,606],[780,640],[802,692],[790,770],[760,793],[628,793]],
  [[977,793],[1000,752],[1060,716],[1130,702],[1203,722],[1203,793]],
].map(g=>g.map(p=>v(p[0],p[1])));
export const COURT_TREES = [[471,180,11],[633,183,11],[676,219,7.5],[624,240,8],[440,253,8],[489,279,11],[672,276,11],[661,322,8.5],[449,341,7.5],[474,381,11],[635,388,10]];
export const ROUND_BEDS = [[598,283,15],[496,323,10],[608,363,12],[515,399,10]];
export const STATUE = [560,232];
export const FLAG = [560,214];
export const EAST_TREES = [[163,527,7],[196,530,7.5],[230,527,8],[270,527,7]];

export const ROOF_RECTS = [[292,694,45,155],[694,800,45,517],[137,243,205,517]];
export const ROOF_MID = [[295,148],[415,148],[415,290],[400,395],[395,430],[318,515],[297,462],[243,462],[243,205],[295,205]];
export const SKYLIGHT = [247,303,255,424];

export function levelFromY(y){ for(let l=5;l>=1;l--) if(y>=Y[l]-0.9) return l; return 1; }
export function pqFromXZ(x,z){ return [480 - z*S, 294 + x*S]; }

export function locate(x,y,z){
  const [P,Q]=pqFromXZ(x,z); const L=levelFromY(y);
  if (y>Y[6]-0.5) return {L:'Mái',name:'Sân thượng'};
  for(const r of ROOMS) if(r.L===L&&P>=r.P0&&P<=r.P1&&Q>=r.Q0&&Q<=r.Q1) return {L,name:r.name};
  if(L===1){
    if(P>=540&&P<=606&&Q>=80&&Q<=127) return {L,name:'Cầu thang chính'};
    if(Q>545) return {L,name:'Đường Yên Bái'};
    if(P>825||P>805&&Q<300) return {L,name:'Đường Phạm Hồng Thái'};
    if(P<135||Q<45) return {L,name:'Khu phố lân cận'};
    if(P>=331&&P<=390&&Q>=191&&Q<=318) return {L,name:'Sân cầu lông'};
    if(P>=142&&P<394&&Q>=205) return {L,name:'Sân đa năng'};
    if(P>=695&&Q>=155&&Q<=370) return {L,name:'Khu để xe'};
    if(P>=394&&P<=694&&Q>=155&&Q<=425) return {L,name:'Sân trường'};
    if(Q>425) return {L,name:'Lối vào chính'};
    return {L,name:'Hành lang'};
  }
  if(P>=303&&P<=417&&Q>=153&&Q<=424||P>=695&&P<=716.5||Q>=127&&Q<=153||P>=224&&P<=264) return {L,name:'Hành lang'};
  return {L,name:'Hành lang'};
}
