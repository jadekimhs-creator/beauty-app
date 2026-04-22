// ── 데이터 관리 (localStorage) ──────────────────────────────────────────────
const STORAGE_KEY = 'beauty_products';

function getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function addProduct(product) {
    const products = getProducts();
    product.id = Date.now().toString();
    product.createdAt = new Date().toISOString();
    products.push(product);
    saveProducts(products);
    return product;
}

function updateProduct(id, updates) {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
        products[idx] = { ...products[idx], ...updates };
        saveProducts(products);
    }
}

function deleteProduct(id) {
    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
}

function getProductById(id) {
    return getProducts().find(p => p.id === id);
}

// ── 날짜 계산 ─────────────────────────────────────────────────────────────
/**
 * 소진 예상일 계산
 * @param {string} openedAt - 개봉일 (YYYY-MM-DD)
 * @param {number} capacityMl - 전체 용량
 * @param {number} dailyUseMl - 1일 사용량
 * @returns {Date} 소진 예상일
 */
function calcRunoutDate(openedAt, capacityMl, dailyUseMl) {
    const totalDays = capacityMl / dailyUseMl;
    const opened = new Date(openedAt);
    const runout = new Date(opened.getTime() + totalDays * 24 * 60 * 60 * 1000);
    return runout;
}

/**
 * 오늘 기준 남은 일수
 */
function calcDaysLeft(openedAt, capacityMl, dailyUseMl) {
    const runout = calcRunoutDate(openedAt, capacityMl, dailyUseMl);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((runout - today) / (1000 * 60 * 60 * 24));
    return diff;
}

/**
 * 남은 % (0~100)
 */
function calcRemainingPct(openedAt, capacityMl, dailyUseMl) {
    const totalDays = capacityMl / dailyUseMl;
    const daysUsed = Math.floor((new Date() - new Date(openedAt)) / (1000 * 60 * 60 * 24));
    const pct = Math.max(0, Math.min(100, ((totalDays - daysUsed) / totalDays) * 100));
    return Math.round(pct);
}

/**
 * 상태 등급 반환
 * @returns {'safe' | 'warn' | 'danger' | 'empty'}
 */
function getStatus(daysLeft) {
    if (daysLeft <= 0) return 'empty';
    if (daysLeft <= 7) return 'danger';
    if (daysLeft <= 30) return 'warn';
    return 'safe';
}

// ── 포맷 헬퍼 ─────────────────────────────────────────────────────────────
function formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
}

function formatRunout(openedAt, capacityMl, dailyUseMl) {
    const runout = calcRunoutDate(openedAt, capacityMl, dailyUseMl);
    const daysLeft = calcDaysLeft(openedAt, capacityMl, dailyUseMl);
    if (daysLeft <= 0) return '이미 소진됨';
    return `${formatDate(runout)} (${daysLeft}일 후)`;
}

// ── 카테고리 정보 ─────────────────────────────────────────────────────────
const CATEGORIES = {
    skincare: { label: '스킨케어', emoji: '🧴', color: 'skincare' },
    hair:     { label: '헤어',    emoji: '💇', color: 'hair' },
    body:     { label: '바디',    emoji: '🛁', color: 'body' },
    makeup:   { label: '메이크업', emoji: '💄', color: 'makeup' },
};

function getCatInfo(cat) {
    return CATEGORIES[cat] || { label: cat, emoji: '✨', color: '' };
}

// ── 쿠팡 검색 URL 생성 ─────────────────────────────────────────────────────
function coupangSearchUrl(query) {
    return `https://www.coupang.com/np/search?q=${encodeURIComponent(query)}`;
}

// ── 제품 카드 HTML 생성 ────────────────────────────────────────────────────
function renderProductCard(p) {
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

// ── 알림 배너 생성 ─────────────────────────────────────────────────────────
function renderAlerts(products) {
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
