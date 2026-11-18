const CACHE = 'wolgeunmu-d4e39b24ff';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './cloud.js'];
// 설치할 때 브라우저의 HTTP 캐시(GitHub Pages는 10분)를 건너뛰고 서버에서 새로 받는다
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 열 때마다 서버 최신본을 먼저 받아 보고(최대 3.5초), 인터넷이 없거나 느리면 저장된 파일로 연다
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, {ignoreSearch: true}).then(hit => {
    const net = fetch(e.request.url, {cache: 'no-cache'}).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
    const wait = new Promise(res => setTimeout(() => res(null), 3500));
    return Promise.race([net, wait]).then(r => r || hit || net);
  })));
});
