import { describe, it, expect } from 'vitest'
import { supabase } from '../../src/lib/supabase'

describe('Software Submissions API', () => {
  const testSubmission = {
    title: `Test Software ${Date.now()}`,
    url: 'https://example.com',
    description: 'This is a test software submission',
  }

  describe('POST /api/submissions', () => {
    it('should create a new software submission', async () => {
      const { data, error } = await supabase
        .from('software_submissions')
        .insert(testSubmission)
        .select()
        .maybeSingle()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.title).toBe(testSubmission.title)
      expect(data?.url).toBe(testSubmission.url)
      expect(data?.description).toBe(testSubmission.description)
      expect(data?.status).toBe('pending')
    })

    it('should reject submission with invalid URL', async () => {
      const { error } = await supabase
        .from('software_submissions')
        .insert({
          ...testSubmission,
          url: 'not-a-url',
        })
        .select()
        .maybeSingle()

      expect(error).toBeDefined()
      expect(error?.message).toContain('valid_url')
    })

    it('should require all mandatory fields', async () => {
      const { error } = await supabase
        .from('software_submissions')
        .insert({
          title: 'Test',
        } as any)
        .select()
        .maybeSingle()

      expect(error).toBeDefined()
    })

    it('should set default status to pending', async () => {
      const { data, error } = await supabase
        .from('software_submissions')
        .insert({
          title: `Auto Status ${Date.now()}`,
          url: 'https://example.com',
          description: 'Test description',
        })
        .select()
        .maybeSingle()

      expect(error).toBeNull()
      expect(data?.status).toBe('pending')
    })
  })

  describe('GET /api/submissions', () => {
    it('should only show approved submissions to anonymous users', async () => {
      const { data, error } = await supabase
        .from('software_submissions')
        .select('*')
        .eq('status', 'approved')

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
      data?.forEach((submission) => {
        expect(submission.status).toBe('approved')
      })
    })

    it('should not show pending submissions to anonymous users', async () => {
      const { data } = await supabase
        .from('software_submissions')
        .select('*')
        .eq('status', 'pending')

      expect(data?.length).toBe(0)
    })

    it('should not show rejected submissions to anonymous users', async () => {
      const { data } = await supabase
        .from('software_submissions')
        .select('*')
        .eq('status', 'rejected')

      expect(data?.length).toBe(0)
    })
  })
})
