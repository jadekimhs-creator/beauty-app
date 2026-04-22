import { supabase } from './supabaseClient.js';

// ── 데이터 변환 헬퍼 (snake_case <-> camelCase) ───────────────────────────
function toCamel(p) {
    if (!p) return null;
    return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        capacityMl: p.capacity_ml,
        dailyUseMl: p.daily_use_ml,
        openedAt: p.opened_at,
        coupangUrl: p.coupang_url,
        createdAt: p.created_at
    };
}

function toSnake(p) {
    return {
        name: p.name,
        brand: p.brand,
        category: p.category,
        capacity_ml: p.capacityMl,
        daily_use_ml: p.dailyUseMl,
        opened_at: p.openedAt,
        coupang_url: p.coupangUrl
    };
}

// ── Supabase 데이터 관리 ──────────────────────────────────────────────────
export async function getProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('opened_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }
    return data.map(toCamel);
}

export async function addProduct(product) {
    const { data, error } = await supabase
        .from('products')
        .insert([toSnake(product)])
        .select();
    
    if (error) {
        console.error('Error adding product:', error);
        return null;
    }
    return toCamel(data[0]);
}

export async function updateProduct(id, updates) {
    const { data, error } = await supabase
        .from('products')
        .update(toSnake(updates))
        .eq('id', id)
        .select();
    
    if (error) {
        console.error('Error updating product:', error);
        return null;
    }
    return toCamel(data[0]);
}

export async function deleteProduct(id) {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
    
    if (error) console.error('Error deleting product:', error);
}

export async function getProductById(id) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        console.error('Error fetching product:', error);
        return null;
    }
    return toCamel(data);
}

export async function resetToSamples() {
    const samples = [
        { name: '설화수 퍼펙팅 세럼', brand: '설화수', category: 'skincare', capacityMl: 60, dailyUseMl: 0.8, openedAt: '2026-03-01', coupangUrl: '' },
        { name: '판테닌 샴푸', brand: '판텐', category: 'hair', capacityMl: 400, dailyUseMl: 8, openedAt: '2026-03-15', coupangUrl: '' },
        { name: '에스트라 아토베리어 크림', brand: '에스트라', category: 'skincare', capacityMl: 80, dailyUseMl: 1.2, openedAt: '2026-04-01', coupangUrl: '' },
        { name: '니베아 바디로션', brand: '니베아', category: 'body', capacityMl: 250, dailyUseMl: 5, openedAt: '2026-04-10', coupangUrl: '' },
    ];
    
    // 기존 데이터 삭제 후 샘플 삽입
    const { error: delError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (!delError) {
        await supabase.from('products').insert(samples.map(toSnake));
    }
}

// 전역 스코프에 노출 (기존 인라인 스크립트 호환용)
window.getProducts = getProducts;
window.addProduct = addProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.getProductById = getProductById;
window.resetToSamples = resetToSamples;

// ── 날짜 계산 (로직 동일) ──────────────────────────────────────────────────
export function calcRunoutDate(openedAt, capacityMl, dailyUseMl) {
    const totalDays = capacityMl / dailyUseMl;
    const opened = new Date(openedAt);
    const runout = new Date(opened.getTime() + totalDays * 24 * 60 * 60 * 1000);
    return runout;
}
window.calcRunoutDate = calcRunoutDate;

export function calcDaysLeft(openedAt, capacityMl, dailyUseMl) {
    const runout = calcRunoutDate(openedAt, capacityMl, dailyUseMl);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((runout - today) / (1000 * 60 * 60 * 24));
    return diff;
}
window.calcDaysLeft = calcDaysLeft;

export function calcRemainingPct(openedAt, capacityMl, dailyUseMl) {
    const totalDays = capacityMl / dailyUseMl;
    const daysUsed = Math.floor((new Date() - new Date(openedAt)) / (1000 * 60 * 60 * 24));
    const pct = Math.max(0, Math.min(100, ((totalDays - daysUsed) / totalDays) * 100));
    return Math.round(pct);
}
window.calcRemainingPct = calcRemainingPct;

export function getStatus(daysLeft) {
    if (daysLeft <= 0) return 'empty';
    if (daysLeft <= 7) return 'danger';
    if (daysLeft <= 30) return 'warn';
    return 'safe';
}
window.getStatus = getStatus;

export function formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
}
window.formatDate = formatDate;

const CATEGORIES = {
    skincare: { label: '스킨케어', emoji: '🧴', color: 'skincare' },
    hair:     { label: '헤어',    emoji: '💇', color: 'hair' },
    body:     { label: '바디',    emoji: '🛁', color: 'body' },
    makeup:   { label: '메이크업', emoji: '💄', color: 'makeup' },
};
export function getCatInfo(cat) {
    return CATEGORIES[cat] || { label: cat, emoji: '✨', color: '' };
}
window.getCatInfo = getCatInfo;

function coupangSearchUrl(query) {
    return `https://www.coupang.com/np/search?q=${encodeURIComponent(query)}`;
}

export function renderProductCard(p) {
    const daysLeft = calcDaysLeft(p.openedAt, p.capacityMl, p.dailyUseMl);
    const pct = calcRemainingPct(p.openedAt, p.capacityMl, p.dailyUseMl);
    const status = getStatus(daysLeft);
    const cat = getCatInfo(p.category);
    const runout = calcRunoutDate(p.openedAt, p.capacityMl, p.dailyUseMl);

    const fillClass = status === 'danger' ? 'danger' : status === 'warn' ? 'warn' : '';
    const daysClass = status;
    const daysText = daysLeft <= 0 ? '소진됨' : `${daysLeft}일`;
    const coupangUrl = p.coupangUrl || coupangSearchUrl(`${p.brand || ''} ${p.name}`);

    return `
    <a class="product-card" href="detail.html?id=${p.id}">
        <div class="card-top">
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-brand">${p.brand || '브랜드 미입력'}</div>
            </div>
            <span class="category-badge ${cat.color}">${cat.emoji} ${cat.label}</span>
        </div>
        <div class="days-badge ${daysClass}">
            <span class="days-num">${daysText}</span>
            ${daysLeft > 0 ? '<span class="days-label">남음</span>' : ''}
        </div>
        <div class="progress-wrap">
            <div class="progress-labels">
                <span>남은 양 ${pct}%</span>
                <span>소진 ${formatDate(runout)}</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill ${fillClass}" style="width: ${pct}%"></div>
            </div>
        </div>
        <div class="card-actions" onclick="event.preventDefault()">
            <a class="btn-reorder" href="${coupangUrl}" target="_blank" rel="noopener">
                🛒 쿠팡 재구매
            </a>
            <a class="btn-alt" href="recommend.html?id=${p.id}">
                ✨ 다른 거?
            </a>
        </div>
    </a>`;
}
window.renderProductCard = renderProductCard;

export function renderAlerts(products) {
    const dangerous = products.filter(p => {
        const d = calcDaysLeft(p.openedAt, p.capacityMl, p.dailyUseMl);
        return d >= 0 && d <= 7;
    });
    const warning = products.filter(p => {
        const d = calcDaysLeft(p.openedAt, p.capacityMl, p.dailyUseMl);
        return d > 7 && d <= 14;
    });

    let html = '';
    dangerous.forEach(p => {
        const d = calcDaysLeft(p.openedAt, p.capacityMl, p.dailyUseMl);
        html += `
        <div class="alert-banner">
            <div class="alert-icon">🚨</div>
            <div class="alert-text">
                <h4>${p.name} 곧 소진!</h4>
                <p>${d <= 0 ? '이미 소진됐어요. 얼른 재구매하세요!' : `${d}일 후 소진 예상 — 지금 주문하면 딱 맞아요!`}</p>
            </div>
        </div>`;
    });
    warning.forEach(p => {
        const d = calcDaysLeft(p.openedAt, p.capacityMl, p.dailyUseMl);
        html += `
        <div class="alert-banner warn">
            <div class="alert-icon">⚠️</div>
            <div class="alert-text">
                <h4>${p.name} 슬슬 주문할까요?</h4>
                <p>${d}일 후 소진 예상</p>
            </div>
        </div>`;
    });
    return html;
}
window.renderAlerts = renderAlerts;
