// Bản không có game: trang mở thẳng vào chế độ tham quan.
// Bật lại game khi build: GAME=1 npm run build
export function createGame() {
  document.body.classList.remove('mode-menu'); document.body.classList.add('mode-tour');
  document.getElementById('gToMenu')?.remove();
  return { enabled: false, update() {}, get mode() { return 'tour'; } };
}
