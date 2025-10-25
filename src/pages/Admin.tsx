import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { supabase } from '../lib/supabase'

interface Submission {
  id: string
  title: string
  url: string
  description: string
  email: string
  category: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  logo?: string
  image?: string
  tags?: string[]
}

interface NewsPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  published: boolean
  created_at: string
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [activeTab, setActiveTab] = useState<'submissions' | 'news'>('submissions')
  const [newsTopic, setNewsTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPost, setGeneratedPost] = useState<NewsPost | null>(null)
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
      fetchSubmissions()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')

    const adminUser = import.meta.env.VITE_ADMIN_USER
    const adminPass = import.meta.env.VITE_ADMIN_PASS

    console.log('Admin credentials check:', {
      envUser: adminUser,
      envPass: adminPass,
      inputUser: username,
      inputPass: password,
      match: username === adminUser && password === adminPass
    })

    if (username === adminUser && password === adminPass) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_authenticated', 'true')
      fetchSubmissions()
    } else {
      setAuthError('Invalid username or password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_authenticated')
    setUsername('')
    setPassword('')
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions()
    }
  }, [isAuthenticated])

  const fetchSubmissions = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submissions?all=true`
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setSubmissions(result.data || [])
      } else {
        console.error('Failed to fetch submissions:', await response.text())
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSubmissionStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submissions`
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        setSubmissions((prev) =>
          prev.map((sub) => (sub.id === id ? { ...sub, status } : sub))
        )
      } else {
        console.error('Failed to update submission:', await response.text())
        alert('Failed to update submission status')
      }
    } catch (error) {
      console.error('Failed to update submission:', error)
      alert('Failed to update submission status')
    }
  }

  const deleteSubmission = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will permanently remove the submission and all associated data (logo, image, social links).`)) {
      return
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submissions`
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        setSubmissions((prev) => prev.filter((sub) => sub.id !== id))
        alert('Submission deleted successfully')
      } else {
        console.error('Failed to delete submission:', await response.text())
        alert('Failed to delete submission')
      }
    } catch (error) {
      console.error('Failed to delete submission:', error)
      alert('Failed to delete submission')
    }
  }

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'all') return true
    return sub.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-[#4FFFE3] bg-[#4FFFE3]/10 border-[#4FFFE3]'
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400'
      default:
        return 'text-[#E0FF04] bg-[#E0FF04]/10 border-[#E0FF04]'
    }
  }

  const fetchNewsPosts = async () => {
    setLoadingPosts(true)
    try {
      const { data, error } = await supabase
        .from('news_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNewsPosts(data || [])
    } catch (error) {
      console.error('Failed to fetch news posts:', error)
      alert('Failed to load news posts')
    } finally {
      setLoadingPosts(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && activeTab === 'news') {
      fetchNewsPosts()
    }
  }, [isAuthenticated, activeTab])

  const handleGeneratePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setGeneratedPost(null)

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-news-post`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: newsTopic }),
      })

      if (response.ok) {
        const post = await response.json()
        setGeneratedPost(post)
        setNewsTopic('')
        alert('Post generated successfully! Review and publish below.')
        await fetchNewsPosts()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate post')
      }
    } catch (error) {
      console.error('Failed to generate post:', error)
      alert('Failed to generate post')
    } finally {
      setIsGenerating(false)
    }
  }

  const togglePublishStatus = async (id: string, currentStatus: boolean) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-news-posts`
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, published: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update post')
      }

      setNewsPosts(prev =>
        prev.map(post => post.id === id ? { ...post, published: !currentStatus } : post)
      )
      alert(`Post ${!currentStatus ? 'published' : 'unpublished'} successfully`)
    } catch (error) {
      console.error('Failed to update post:', error)
      alert('Failed to update post status')
    }
  }

  const deleteNewsPost = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-news-posts`
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      setNewsPosts(prev => prev.filter(post => post.id !== id))
      if (generatedPost?.id === id) {
        setGeneratedPost(null)
      }
      alert('Post deleted successfully')
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('Failed to delete post')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-800 relative flex items-center justify-center">
        <div className="absolute w-full h-1/2 top-[7.45%] left-0 pointer-events-none">
          <div className="absolute w-4/5 h-40 top-1/3 left-[12.93%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
          <div className="absolute w-4/5 h-40 top-1/4 left-[22.59%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        </div>

        <div className="relative z-10 w-full max-w-md px-4">
          <div className="bg-[#3a3a3a] rounded-2xl p-8">
            <h1 className="text-white text-3xl font-bold font-ubuntu mb-6 text-center">
              Admin Login
            </h1>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-white font-ubuntu text-sm mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-white font-ubuntu text-sm mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu"
                />
              </div>

              {authError && (
                <div className="rounded-lg p-3 bg-red-400/10 border border-red-400">
                  <p className="text-red-400 font-ubuntu text-sm text-center">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold text-lg hover:opacity-90 transition-opacity"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-800 relative">
      <div className="absolute w-full h-1/2 top-[7.45%] left-0 pointer-events-none">
        <div className="absolute w-4/5 h-40 top-1/3 left-[12.93%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 top-1/4 left-[22.59%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="w-full max-w-[1400px] mx-auto px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-white text-5xl font-bold font-ubuntu mb-4">Admin Dashboard</h1>
              <p className="text-white/70 text-xl font-ubuntu">
                Manage software submissions and news posts
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 rounded-full bg-[#4a4a4a] text-white font-ubuntu font-bold hover:bg-[#555555] transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-8 py-3 rounded-full font-ubuntu font-bold transition-all ${
                activeTab === 'submissions'
                  ? 'bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800'
                  : 'bg-[#4a4a4a] text-white hover:bg-[#555555]'
              }`}
            >
              Submissions
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`px-8 py-3 rounded-full font-ubuntu font-bold transition-all ${
                activeTab === 'news'
                  ? 'bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800'
                  : 'bg-[#4a4a4a] text-white hover:bg-[#555555]'
              }`}
            >
              News Posts
            </button>
          </div>

          {activeTab === 'submissions' && (
            <>
              <div className="flex gap-4 mb-8">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as typeof filter)}
                className={`px-6 py-3 rounded-full font-ubuntu font-bold transition-all capitalize ${
                  filter === status
                    ? 'bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800'
                    : 'bg-[#4a4a4a] text-white hover:bg-[#555555]'
                }`}
              >
                {status} ({submissions.filter((s) => status === 'all' || s.status === status).length})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-[#3a3a3a] rounded-2xl p-12 text-center">
              <p className="text-white/70 font-ubuntu text-xl">Loading submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="bg-[#3a3a3a] rounded-2xl p-12 text-center">
              <p className="text-white/70 font-ubuntu text-xl">No submissions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-[#3a3a3a] rounded-2xl p-6 hover:bg-[#404040] transition-colors"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {submission.logo && (
                      <div className="flex-shrink-0">
                        <img
                          src={submission.logo}
                          alt={`${submission.title} logo`}
                          className="w-16 h-16 rounded-lg bg-white p-2 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white text-2xl font-bold font-ubuntu">
                          {submission.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-ubuntu border capitalize ${getStatusColor(
                            submission.status
                          )}`}
                        >
                          {submission.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-ubuntu bg-[#4a4a4a] text-white/70">
                          {submission.category}
                        </span>
                      </div>
                      <a
                        href={submission.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4FFFE3] font-ubuntu hover:underline block mb-2"
                      >
                        {submission.url}
                      </a>
                      <p className="text-white/70 font-ubuntu mb-2">{submission.description}</p>
                      {submission.tags && submission.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {submission.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-[#4FFFE3]/20 text-[#4FFFE3] rounded-full text-xs font-ubuntu"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-white/50 font-ubuntu text-sm">
                        <span>Contact: {submission.email}</span>
                        <span>
                          Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <div className="flex gap-2">
                        {submission.status !== 'approved' && (
                          <button
                            onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                            className="px-4 py-2 rounded-lg bg-[#4FFFE3]/20 text-[#4FFFE3] border border-[#4FFFE3] font-ubuntu font-bold hover:bg-[#4FFFE3]/30 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {submission.status !== 'rejected' && (
                          <button
                            onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                            className="px-4 py-2 rounded-lg bg-red-400/20 text-red-400 border border-red-400 font-ubuntu font-bold hover:bg-red-400/30 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => deleteSubmission(submission.id, submission.title)}
                        className="px-4 py-2 rounded-lg bg-red-600/20 text-red-500 border border-red-600 font-ubuntu font-bold hover:bg-red-600/30 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </>
          )}

          {activeTab === 'news' && (
            <div className="space-y-8">
              <div className="bg-[#3a3a3a] rounded-2xl p-8">
                <h2 className="text-white text-3xl font-bold font-ubuntu mb-4">
                  Generate News Post with AI
                </h2>
                <p className="text-white/70 font-ubuntu mb-6">
                  Enter a topic and AI will generate a complete blog post
                </p>

                <form onSubmit={handleGeneratePost} className="space-y-4">
                  <div>
                    <label htmlFor="topic" className="block text-white font-ubuntu mb-2">
                      Topic
                    </label>
                    <input
                      id="topic"
                      type="text"
                      value={newsTopic}
                      onChange={(e) => setNewsTopic(e.target.value)}
                      placeholder="e.g., The Future of AI in Software Development"
                      required
                      disabled={isGenerating}
                      className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isGenerating || !newsTopic.trim()}
                    className="px-8 py-3 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Post'}
                  </button>
                </form>
              </div>

              <div>
                <h2 className="text-white text-3xl font-bold font-ubuntu mb-4">
                  All News Posts ({newsPosts.length})
                </h2>

                {loadingPosts ? (
                  <div className="bg-[#3a3a3a] rounded-2xl p-12 text-center">
                    <p className="text-white/70 font-ubuntu text-xl">Loading posts...</p>
                  </div>
                ) : newsPosts.length === 0 ? (
                  <div className="bg-[#3a3a3a] rounded-2xl p-12 text-center">
                    <p className="text-white/70 font-ubuntu text-xl">No news posts yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {newsPosts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-[#3a3a3a] rounded-2xl p-6 hover:bg-[#404040] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-white text-2xl font-bold font-ubuntu">
                                {post.title}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-ubuntu border ${
                                  post.published
                                    ? 'text-[#4FFFE3] bg-[#4FFFE3]/10 border-[#4FFFE3]'
                                    : 'text-[#E0FF04] bg-[#E0FF04]/10 border-[#E0FF04]'
                                }`}
                              >
                                {post.published ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <p className="text-white/70 font-ubuntu mb-3">{post.excerpt}</p>
                            <div className="flex items-center gap-4 text-white/50 font-ubuntu text-sm">
                              <span>Slug: {post.slug}</span>
                              <span>
                                Created: {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => togglePublishStatus(post.id, post.published)}
                              className={`px-4 py-2 rounded-lg font-ubuntu font-bold border transition-colors ${
                                post.published
                                  ? 'bg-[#E0FF04]/20 text-[#E0FF04] border-[#E0FF04] hover:bg-[#E0FF04]/30'
                                  : 'bg-[#4FFFE3]/20 text-[#4FFFE3] border-[#4FFFE3] hover:bg-[#4FFFE3]/30'
                              }`}
                            >
                              {post.published ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              onClick={() => deleteNewsPost(post.id, post.title)}
                              className="px-4 py-2 rounded-lg bg-red-600/20 text-red-500 border border-red-600 font-ubuntu font-bold hover:bg-red-600/30 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}
