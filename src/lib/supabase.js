import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://taxwcmyhztsaybysggda.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRheHdjbXloenRzYXlieXNnZ2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODYyMTAsImV4cCI6MjA5NzE2MjIxMH0.JV6G_QqS_e76_fXT4REC9Co3ZBJdwwfxq7ytufz5RNM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
