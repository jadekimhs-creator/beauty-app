-- 0. 기존 테이블이 있다면 삭제 (초기화)
DROP TABLE IF EXISTS products;

-- 1. 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 테이블 생성 (Default 값 확실히 지정)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT NOT NULL,
    capacity_ml FLOAT8 NOT NULL,
    daily_use_ml FLOAT8 NOT NULL,
    opened_at DATE NOT NULL,
    coupang_url TEXT
);

-- 3. RLS (Row Level Security) 설정
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access" 
ON products FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. 샘플 데이터 삽입
INSERT INTO products (name, brand, category, capacity_ml, daily_use_ml, opened_at)
VALUES 
('설화수 퍼펙팅 세럼', '설화수', 'skincare', 60, 0.8, '2026-03-01'),
('판테닌 샴푸', '판텐', 'hair', 400, 8, '2026-03-15'),
('에스트라 아토베리어 크림', '에스트라', 'skincare', 80, 1.2, '2026-04-01');
