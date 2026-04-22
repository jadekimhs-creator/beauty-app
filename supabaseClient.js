// ────────────────────────────────────────────────────────────────────────────
// supabaseClient.js — Supabase 연결 설정
//
// ✅ 설정 방법:
//   1. https://supabase.com 에서 새 프로젝트 생성
//   2. Settings → API → Project URL / anon public key 복사 후 아래에 붙여넣기
// ────────────────────────────────────────────────────────────────────────────
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';       // 🔑 여기에 붙여넣기
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON'; // 🔑 여기에 붙여넣기

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
