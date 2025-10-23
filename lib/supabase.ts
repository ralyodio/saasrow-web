import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type NewsletterSubscription = {
  id: string
  email: string
  subscribed_at: string
  is_active: boolean
  created_at: string
}

export type SoftwareSubmission = {
  id: string
  title: string
  url: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  created_at: string
}

export type CommunityPost = {
  id: string
  author: string
  title: string
  excerpt: string
  likes: number
  comments: number
  created_at: string
  updated_at: string
}
