import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | undefined

function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      // Return a mock client during build if env vars aren't available
      if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') {
        console.warn('Supabase env vars not available, using mock client')
        // Create a proxy that throws on any method call
        return new Proxy({} as SupabaseClient, {
          get: () => {
            throw new Error('Supabase client not properly initialized')
          }
        })
      }
      throw new Error('Supabase environment variables are required')
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    return getSupabaseClient()[prop as keyof SupabaseClient]
  }
})

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
