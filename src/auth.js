// Đăng nhập Google, tạo tài khoản email và lưu tiến trình lên Firestore.
// Chỉ bật khi trang có window.FIREBASE_CONFIG (file docs/firebase-config.js trên GitHub Pages).
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const MSG = {
  'auth/invalid-email': 'Email chưa đúng định dạng.',
  'auth/email-already-in-use': 'Email này đã có tài khoản. Hãy chọn Đăng nhập.',
  'auth/weak-password': 'Mật khẩu cần ít nhất 6 kí tự.',
  'auth/wrong-password': 'Sai email hoặc mật khẩu.',
  'auth/invalid-credential': 'Sai email hoặc mật khẩu.',
  'auth/user-not-found': 'Chưa có tài khoản với email này.',
  'auth/too-many-requests': 'Thử sai nhiều lần quá. Đợi vài phút rồi thử lại.',
  'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập.',
  'auth/popup-blocked': 'Trình duyệt chặn cửa sổ đăng nhập. Đang chuyển sang trang đăng nhập Google.',
  'auth/unauthorized-domain': 'Tên miền này chưa được thêm vào Authorized domains trong Firebase.',
  'auth/network-request-failed': 'Không kết nối được mạng. Kiểm tra Internet rồi thử lại.',
  'permission-denied': 'Máy chủ từ chối lưu. Kiểm tra lại firestore.rules.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'Cấu hình Firebase chưa đúng: apiKey trong firebase-config.js không hợp lệ.',
  'auth/operation-not-allowed': 'Cách đăng nhập này chưa được bật trong Firebase Authentication.',
  'auth/configuration-not-found': 'Firebase Authentication chưa được bật cho dự án này.',
};
export const errText = e => MSG[e?.code] || 'Có lỗi: ' + (e?.code || e?.message || e);

// Giới hạn này khớp với firestore.rules
export const LIMITS = { coins: 1000000, xp: 10000000, firstCoins: 500, firstXp: 1000 };

export function createAuth() {
  const cfg = window.FIREBASE_CONFIG;
  const enabled = !!(cfg && cfg.apiKey && cfg.projectId);
  if (!enabled) return { enabled: false };
  let app, auth, db;
  try { app = initializeApp(cfg); auth = getAuth(app); auth.languageCode = 'vi'; db = getFirestore(app); }
  catch (e) { console.warn('Firebase', e); return { enabled: false, error: errText(e) }; }
  getRedirectResult(auth).catch(() => {});
  return {
    enabled: true,
    onUser: cb => onAuthStateChanged(auth, cb),
    current: () => auth.currentUser,
    async google() {
      const p = new GoogleAuthProvider();
      try { return await signInWithPopup(auth, p); }
      catch (e) { if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') return signInWithRedirect(auth, p); throw e; }
    },
    async signUp(name, email, pw) { const r = await createUserWithEmailAndPassword(auth, email, pw); if (name) await updateProfile(r.user, { displayName: name }); return r; },
    signIn: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
    reset: email => sendPasswordResetEmail(auth, email),
    signOut: () => signOut(auth),
    async load(uid) { const s = await getDoc(doc(db, 'users', uid)); return s.exists() ? s.data() : null; },
    async save(uid, data) { const { updatedAt, ...rest } = data; await setDoc(doc(db, 'users', uid), { ...rest, updatedAt: serverTimestamp() }); },
  };
}
