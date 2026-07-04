import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  version: string;
  api_secret: string;
  is_active: boolean;
  created_at: string;
}

export interface License {
  id: string;
  app_id: string;
  owner_id: string | null;
  license_key: string;
  status: 'active' | 'suspended' | 'expired' | 'banned';
  license_type: 'daily' | 'monthly' | 'lifetime';
  expires_at: string | null;
  note: string | null;
  created_at: string;
}

export interface HwidBinding {
  id: string;
  license_id: string;
  hwid: string | null;
  last_reset_at: string | null;
  reset_count: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  license_id: string | null;
  user_id: string | null;
  app_id: string | null;
  event_type: string;
  ip_address: string | null;
  hwid: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
