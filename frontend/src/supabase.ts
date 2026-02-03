import { createClient } from '@supabase/supabase-js';

// 알림: 아래 URL과 KEY는 사용자의 Supabase 프로젝트 정보로 교체해야 합니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
