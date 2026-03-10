import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://adouakjxvjpiwpgfuuln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkb3Vha2p4dmpwaXdwZ2Z1dWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjE1NjMsImV4cCI6MjA4ODczNzU2M30.JNzPAYytO7ToRuFtvxlkaGl7k5adVlP1XGX8su6vKG8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
