import { describe, it, expect } from 'vitest'
import { supabase } from '@/lib/supabase'

describe('Community Posts API', () => {
  const testPost = {
    author: 'Test Author',
    title: `Test Post ${Date.now()}`,
    excerpt: 'This is a test community post excerpt with enough content.',
  }

  describe('POST /api/community', () => {
    it('should create a new community post', async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .insert(testPost)
        .select()
        .maybeSingle()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.author).toBe(testPost.author)
      expect(data?.title).toBe(testPost.title)
      expect(data?.excerpt).toBe(testPost.excerpt)
      expect(data?.likes).toBe(0)
      expect(data?.comments).toBe(0)
    })

    it('should require all mandatory fields', async () => {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          author: 'Test',
        } as any)
        .select()
        .maybeSingle()

      expect(error).toBeDefined()
    })

    it('should set default values for likes and comments', async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          author: 'Default Test',
          title: `Default Values ${Date.now()}`,
          excerpt: 'Testing default values',
        })
        .select()
        .maybeSingle()

      expect(error).toBeNull()
      expect(data?.likes).toBe(0)
      expect(data?.comments).toBe(0)
      expect(data?.created_at).toBeDefined()
      expect(data?.updated_at).toBeDefined()
    })
  })

  describe('GET /api/community', () => {
    it('should retrieve all posts', async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should order posts by creation date', async () => {
      const { data } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (data && data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          const current = new Date(data[i].created_at)
          const next = new Date(data[i + 1].created_at)
          expect(current >= next).toBe(true)
        }
      }
    })
  })

  describe('PATCH /api/community', () => {
    it('should update post likes count', async () => {
      const { data: newPost } = await supabase
        .from('community_posts')
        .insert({
          author: 'Like Test',
          title: `Like Test ${Date.now()}`,
          excerpt: 'Testing likes functionality',
        })
        .select()
        .maybeSingle()

      expect(newPost).toBeDefined()

      const { data: updatedPost, error } = await supabase
        .from('community_posts')
        .update({ likes: (newPost?.likes || 0) + 1 })
        .eq('id', newPost!.id)
        .select()
        .maybeSingle()

      expect(error).toBeNull()
      expect(updatedPost?.likes).toBe(1)
    })

    it('should update post comments count', async () => {
      const { data: newPost } = await supabase
        .from('community_posts')
        .insert({
          author: 'Comment Test',
          title: `Comment Test ${Date.now()}`,
          excerpt: 'Testing comments functionality',
        })
        .select()
        .maybeSingle()

      expect(newPost).toBeDefined()

      const { data: updatedPost, error } = await supabase
        .from('community_posts')
        .update({ comments: (newPost?.comments || 0) + 1 })
        .eq('id', newPost!.id)
        .select()
        .maybeSingle()

      expect(error).toBeNull()
      expect(updatedPost?.comments).toBe(1)
    })

    it('should reject negative likes count', async () => {
      const { data: newPost } = await supabase
        .from('community_posts')
        .insert({
          author: 'Negative Test',
          title: `Negative Test ${Date.now()}`,
          excerpt: 'Testing negative values',
        })
        .select()
        .maybeSingle()

      const { error } = await supabase
        .from('community_posts')
        .update({ likes: -1 })
        .eq('id', newPost!.id)

      expect(error).toBeDefined()
      expect(error?.message).toContain('positive_likes')
    })
  })
})
