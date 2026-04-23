-- 0. 기존 테이블이 있다면 삭제 (초기화)
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS profiles;

-- 1. 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 프로필 테이블 생성 (auth.users와 연동)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'user',
    last_login_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로필 RLS (어드민 또는 본인만)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING ( auth.uid() = id );

-- 어드민 여부 확인용 함수 (무한 루프 방지)
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 어드민은 모든 프로필을 볼 수 있음
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING ( is_admin() );

-- 3. 유저 자동 생성 트리거 함수 (회원가입 시 profiles에 자동 삽입)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 설정
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. 화장품 제품 테이블 생성 (user_id 추가)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT NOT NULL,
    capacity_ml FLOAT8 NOT NULL,
    daily_use_ml FLOAT8 NOT NULL,
    opened_at DATE NOT NULL,
    coupang_url TEXT
);

-- 5. Products RLS (Row Level Security) 설정
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own products" 
ON products FOR ALL 
USING (auth.uid() = user_id OR is_admin()) 
WITH CHECK (auth.uid() = user_id OR is_admin());

-- *참고: 특정 유저에게 어드민 권한을 주려면 앱에서 회원가입 완료 후, Supabase SQL Editor에서 아래 코드를 실행하세요.
-- UPDATE profiles SET role = 'admin' WHERE email = '당신의이메일@주소.com';

-- ============================================================
-- 6. profiles 테이블 수동 INSERT 예시
-- ============================================================

-- [방법 1] 이미 가입된 유저를 profiles에 수동으로 추가할 때
-- (회원가입 트리거가 실행 안 됐거나, 기존 유저를 마이그레이션할 때 사용)
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'user'
FROM auth.users
WHERE email = '유저이메일@주소.com'
ON CONFLICT (id) DO NOTHING;

-- [방법 2] 어드민 계정을 직접 profiles에 추가할 때
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = '어드민이메일@주소.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- [방법 3] 모든 기존 auth.users를 profiles에 한꺼번에 동기화할 때
-- (트리거 추가 전에 이미 가입된 유저들이 있을 경우 사용)
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- [방법 4] 특정 유저의 권한을 어드민으로 변경할 때
-- UPDATE public.profiles SET role = 'admin' WHERE email = '어드민이메일@주소.com';

