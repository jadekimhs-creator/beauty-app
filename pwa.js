// ────────────────────────────────────────────────────────────────────────────
// PWA + 알림 + Supabase 동기화 레이어
// ────────────────────────────────────────────────────────────────────────────

// ── PWA Service Worker 등록 ───────────────────────────────────────────────
export async function registerSW() {
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            console.log('[PWA] Service Worker 등록 성공', reg.scope);

            // 백그라운드 소진 체크 등록
            if ('periodicSync' in reg) {
                try {
                    await reg.periodicSync.register('check-runout', { minInterval: 24 * 60 * 60 * 1000 });
                } catch (e) { /* periodicSync 미지원 환경 */ }
            }

            // Service Worker 메시지 수신 (소진 체크 요청)
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data?.type === 'CHECK_RUNOUT') triggerRunoutNotifications();
            });

        } catch (e) {
            console.warn('[PWA] Service Worker 등록 실패', e);
        }
    }
}

// ── Web Push 알림 권한 요청 ───────────────────────────────────────────────
export async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
}

// ── 소진 임박 알림 발송 ───────────────────────────────────────────────────
export function triggerRunoutNotifications() {
    if (Notification.permission !== 'granted') return;
    const products = getProducts();

    products.forEach(p => {
        const d = calcDaysLeft(p.openedAt, p.capacityMl, p.dailyUseMl);
        if (d === 7 || d === 3 || d === 1 || d === 0) {
            const msg = d === 0 ? '오늘 소진돼요!' : `${d}일 후 소진 예상`;
            new Notification(`💄 ${p.name}`, {
                body: `${msg} — 지금 재구매하러 가볼까요?`,
                icon: '/icons/icon-192.png',
                tag: `runout-${p.id}`,
            });
        }
    });
}

// ── Supabase 연동: 제품 동기화 ────────────────────────────────────────────
// 주의: supabase 변수는 caller 측에서 import해서 전달해야 합니다.
// localStorage와 Supabase DB를 함께 사용 (오프라인 우선 아키텍처)

export async function syncToSupabase(supabase, userId) {
    if (!supabase || !userId) return;
    const products = getProducts();
    for (const p of products) {
        const { error } = await supabase.from('products').upsert({
            id: p.id,
            user_id: userId,
            name: p.name,
            brand: p.brand || null,
            category: p.category,
            capacity_ml: p.capacityMl,
            daily_use_ml: p.dailyUseMl,
            opened_at: p.openedAt,
            coupang_url: p.coupangUrl || null,
        }, { onConflict: 'id' });
        if (error) console.warn('sync error:', error.message);
    }
}

export async function loadFromSupabase(supabase, userId) {
    if (!supabase || !userId) return false;
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

    if (error || !data) return false;

    const mapped = data.map(r => ({
        id: r.id,
        name: r.name,
        brand: r.brand,
        category: r.category,
        capacityMl: r.capacity_ml,
        dailyUseMl: r.daily_use_ml,
        openedAt: r.opened_at,
        coupangUrl: r.coupang_url,
        createdAt: r.created_at,
    }));

    saveProducts(mapped);
    return true;
}

// ── Gemini AI 추천 ────────────────────────────────────────────────────────
// 주의: GEMINI_API_KEY를 발급 후 아래 상수에 입력하세요
// https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'; // 🔑 여기에 붙여넣기
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function getGeminiRecommendations(productName, brand, category) {
    if (GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') return null; // 키 없으면 fallback

    const catLabels = { skincare: '스킨케어', hair: '헤어', body: '바디', makeup: '메이크업' };
    const prompt = `
뷰티 전문가로서 다음 제품의 대안을 추천해주세요:
- 제품명: ${productName}
- 브랜드: ${brand || '미입력'}
- 카테고리: ${catLabels[category] || category}

비슷한 효과의 대안 제품 3개를 한국 뷰티 시장 기준으로 추천해주세요.
반드시 아래 JSON 형식으로만 응답하세요:
[
  { "name": "제품명", "brand": "브랜드", "reason": "추천 이유 1~2문장", "search": "쿠팡 검색어" },
  { "name": "제품명", "brand": "브랜드", "reason": "추천 이유 1~2문장", "search": "쿠팡 검색어" },
  { "name": "제품명", "brand": "브랜드", "reason": "추천 이유 1~2문장", "search": "쿠팡 검색어" }
]`;

    try {
        const res = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
            }),
        });

        if (!res.ok) throw new Error(`Gemini API Error: ${res.status}`);
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // JSON 파싱
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.warn('[Gemini] 추천 실패, fallback 사용:', e.message);
    }
    return null; // null이면 정적 큐레이션 fallback
}
