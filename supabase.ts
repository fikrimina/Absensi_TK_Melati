
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://leqwalvbliejogwmjmsi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlcXdhbHZibGllam9nd21qbXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODc4NjcsImV4cCI6MjA4NjM2Mzg2N30.EXaxPtI9p3IHqR8EcoVGFxMSEjTF0c6BhkFk3xHunRQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
