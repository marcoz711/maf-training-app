export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    [key: string]: any;
  };
  app_metadata?: {
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
  aud?: string;
  role?: string;
  phone?: string;
  confirmation_sent_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  last_sign_in_at?: string;
  banned_until?: string;
  confirmed_at?: string;
  email_change_confirm_new?: string;
  email_change_sent_at?: string;
  recovery_sent_at?: string;
  new_email?: string;
  new_phone?: string;
  invited_at?: string;
  action_link?: string;
  hcaptcha_token?: string;
  channel?: string;
} 