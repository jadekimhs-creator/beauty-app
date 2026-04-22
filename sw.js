const CACHE_NAME = 'beauty-app-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/add.html',
    '/detail.html',
    '/recommend.html',
    '/style.css',
    '/app.js',
    '/supabaseClient.js',
];

// ── 설치: 정적 파일 캐시 ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// ── 활성화: 이전 캐시 삭제 ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// ── Fetch: 캐시 우선, 네트워크 폴백 ─────────────────────────────────────
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(cached =>
            cached || fetch(event.request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
        ).catch(() => caches.match('/index.html'))
    );
});

// ── Push 알림 수신 ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || '💄 화장품 소진 임박!';
    const options = {
        body: data.body || '재구매 타이밍을 놓치지 마세요!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: data.tag || 'beauty-alert',
        renotify: true,
        data: { url: data.url || '/' },
        actions: [
            { action: 'reorder', title: '🛒 쿠팡 재구매', icon: '/icons/icon-192.png' },
            { action: 'close', title: '나중에', icon: '/icons/icon-192.png' },
        ],
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// ── 알림 클릭 처리 ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'reorder') {
        // 쿠팡 링크는 클라이언트에서 처리
        event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
    } else if (event.action !== 'close') {
        event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
    }
});

// ── 백그라운드 동기화 (소진 체크) ────────────────────────────────────────
self.addEventListener('sync', (event) => {
    if (event.tag === 'check-runout') {
        event.waitUntil(checkRunoutProducts());
    }
});

async function checkRunoutProducts() {
    // Service Worker에서는 localStorage 접근 불가 → 클라이언트에 메시지 전송
    const allClients = await self.clients.matchAll({ type: 'window' });
    allClients.forEach(client => client.postMessage({ type: 'CHECK_RUNOUT' }));
}
