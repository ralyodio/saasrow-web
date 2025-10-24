import { describe, it, expect, beforeEach } from 'vitest'
import { supabase } from '../../src/lib/supabase'

describe('Newsletter API', () => {
  const testEmail = `test-${Date.now()}@example.com`

  describe('POST /api/newsletter', () => {
    it('should subscribe a new email successfully', async () => {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .insert({ email: testEmail })
        .select()
        .maybeSingle()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.email).toBe(testEmail)
      expect(data?.is_active).toBe(true)
    })

    it('should reject invalid email format', async () => {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({ email: 'invalid-email' })
        .select()
        .maybeSingle()

      expect(error).toBeDefined()
      expect(error?.message).toContain('valid_email')
    })

    it('should reject duplicate email subscription', async () => {
      const duplicateEmail = `duplicate-${Date.now()}@example.com`

      const { error: firstError } = await supabase
        .from('newsletter_subscriptions')
        .insert({ email: duplicateEmail })
        .select()
        .maybeSingle()

      expect(firstError).toBeNull()

      const { error: secondError } = await supabase
        .from('newsletter_subscriptions')
        .insert({ email: duplicateEmail })
        .select()
        .maybeSingle()

      expect(secondError).toBeDefined()
      expect(secondError?.message).toContain('duplicate')
    })

    it('should return subscription with default values', async () => {
      const newEmail = `defaults-${Date.now()}@example.com`

      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .insert({ email: newEmail })
        .select()
        .maybeSingle()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.is_active).toBe(true)
      expect(data?.subscribed_at).toBeDefined()
      expect(data?.created_at).toBeDefined()
      expect(data?.id).toBeDefined()
    })
  })

  describe('GET /api/newsletter', () => {
    it('should retrieve active subscriptions', async () => {
      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .eq('is_active', true)
        .limit(10)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should not expose inactive subscriptions to anonymous users', async () => {
      const { data } = await supabase
        .from('newsletter_subscriptions')
        .select('*')
        .eq('is_active', false)

      expect(data?.length).toBe(0)
    })
  })
})
