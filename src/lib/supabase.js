import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://izezwhhuxmqrnltythzk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6ZXp3aGh1eG1xcm5sdHl0aHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTAxMDUsImV4cCI6MjA5NzM2NjEwNX0.Ert5T5GJIj9KWu__LFNxFjhAtodk6-6u77JixbFBmWk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
