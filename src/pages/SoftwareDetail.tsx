import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Alert } from '../components/Alert'
import { ScreenshotGallery } from '../components/ScreenshotGallery'
import { supabase } from '../lib/supabase'

interface Submission {
  id: string
  title: string
  url: string
  description: string
  category: string
  email: string
  status: string
  created_at: string
  logo?: string
  image?: string
  tags?: string[]
  view_count?: number
  tier?: string
  upvotes?: number
  downvotes?: number
}

export default function SoftwareDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null)
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null)
  const [upvotes, setUpvotes] = useState(0)
  const [downvotes, setDownvotes] = useState(0)
  const [isVoting, setIsVoting] = useState(false)

  useEffect(() => {
    fetchSubmission()
    if (id) {
      incrementViewCount(id)
      checkUserVote()
    }
  }, [id])

  const checkUserVote = async () => {
    if (!id) return

    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      const { data: vote } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('submission_id', id)
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (vote) {
        setUserVote(vote.vote_type as 'upvote' | 'downvote')
      }
    } else {
      const anonymousVoteKey = `vote_${id}`
      const savedVote = localStorage.getItem(anonymousVoteKey)
      if (savedVote) {
        setUserVote(savedVote as 'upvote' | 'downvote')
      }
    }
  }

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!submission || isVoting) return

    setIsVoting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vote`
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      }

      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          submissionId: submission.id,
          voteType,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setUserVote(result.voteType)
        setUpvotes(result.upvotes)
        setDownvotes(result.downvotes)

        if (!session) {
          const anonymousVoteKey = `vote_${submission.id}`
          if (result.voteType) {
            localStorage.setItem(anonymousVoteKey, result.voteType)
          } else {
            localStorage.removeItem(anonymousVoteKey)
          }
        }
      } else {
        setAlertMessage({ type: 'error', message: result.error || 'Failed to vote' })
      }
    } catch (error) {
      console.error('Failed to vote:', error)
      setAlertMessage({ type: 'error', message: 'Failed to vote' })
    } finally {
      setIsVoting(false)
    }
  }

  const addReferralParam = (url: string): string => {
    try {
      const urlObj = new URL(url)
      if (urlObj.search === '' && !urlObj.pathname.endsWith('/')) {
        urlObj.pathname += '/'
      }
      urlObj.searchParams.set('ref', 'SaasRow')
      return urlObj.toString()
    } catch {
      return url
    }
  }

  const incrementViewCount = async (submissionId: string) => {
    try {
      const viewKey = `viewed_${submissionId}`
      const hasViewed = sessionStorage.getItem(viewKey)

      if (!hasViewed) {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/increment-view`
        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ submissionId }),
        })

        sessionStorage.setItem(viewKey, 'true')
      }
    } catch (error) {
      console.error('Failed to increment view count:', error)
    }
  }

  const handleOutboundClick = async (e: React.MouseEvent<HTMLAnchorElement>, submissionId: string, url: string) => {
    e.preventDefault()

    const targetUrl = url
    const openInNewTab = () => {
      window.open(targetUrl, '_blank', 'noopener,noreferrer')
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-click`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 300)

      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          referrer: document.referrer || null,
          userAgent: navigator.userAgent,
        }),
        signal: controller.signal,
        keepalive: true
      })

      clearTimeout(timeoutId)
    } catch (error) {
      console.error('Failed to track click:', error)
    } finally {
      openInNewTab()
    }
  }

  const fetchSubmission = async () => {
    setLoading(true)
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submissions`
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        const found = (result.data || []).find((sub: Submission) => sub.id === id)
        if (found) {
          setSubmission(found)
          setUpvotes(found.upvotes || 0)
          setDownvotes(found.downvotes || 0)
        } else {
          setNotFound(true)
        }
      } else {
        setNotFound(true)
      }
    } catch (error) {
      console.error('Failed to fetch submission:', error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-800 relative">
      <div className="absolute w-full h-1/2 top-[7.45%] left-0 pointer-events-none">
        <div className="absolute w-4/5 h-40 top-1/3 left-[12.93%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 top-1/4 left-[22.59%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="w-full max-w-[900px] mx-auto px-4 py-12">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-white/70 font-ubuntu text-xl">Loading...</p>
            </div>
          ) : notFound || !submission ? (
            <div className="text-center py-12">
              <h1 className="text-white text-4xl font-bold font-ubuntu mb-4">Not Found</h1>
              <p className="text-white/70 font-ubuntu text-xl mb-8">
                This software could not be found
              </p>
              <Link
                to="/discover"
                className="inline-block px-8 py-3 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold hover:opacity-90 transition-opacity"
              >
                Browse Software
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <Link
                  to={`/category/${submission.category.toLowerCase()}`}
                  className="text-[#4FFFE3] font-ubuntu hover:underline inline-flex items-center gap-2"
                >
                  ← Back to {submission.category}
                </Link>
              </div>

              <div className="bg-[#3a3a3a] rounded-2xl p-8 mb-6">
                <div className="flex items-start gap-6 mb-6">
                  {submission.logo && (
                    <div className="flex-shrink-0">
                      <img
                        src={supabase.storage.from('software-logos').getPublicUrl(submission.logo).data.publicUrl}
                        alt={`${submission.title} logo`}
                        className="w-24 h-24 rounded-xl bg-white p-3 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-white text-4xl font-bold font-ubuntu mb-3">
                      {submission.title}
                    </h1>
                    <div className="flex items-center gap-4 mb-3 flex-wrap">
                      <Link
                        to={`/category/${submission.category.toLowerCase()}`}
                        className="inline-block px-4 py-2 rounded-full text-sm font-ubuntu bg-[#4FFFE3]/20 text-[#4FFFE3] border border-[#4FFFE3] hover:bg-[#4FFFE3]/30 transition-colors"
                      >
                        {submission.category}
                      </Link>
                      {submission.view_count !== undefined && (
                        <div className="flex items-center gap-2 text-white/60 font-ubuntu text-sm">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{submission.view_count.toLocaleString()} views</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVote('upvote')}
                          disabled={isVoting}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                            userVote === 'upvote'
                              ? 'bg-[#4FFFE3]/20 text-[#4FFFE3]'
                              : 'bg-[#4a4a4a] text-white/60 hover:bg-[#555555] hover:text-white'
                          } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-ubuntu font-bold">{upvotes}</span>
                        </button>
                        <button
                          onClick={() => handleVote('downvote')}
                          disabled={isVoting}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                            userVote === 'downvote'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-[#4a4a4a] text-white/60 hover:bg-[#555555] hover:text-white'
                          } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-ubuntu font-bold">{downvotes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {submission.image && (
                  <div className="mb-6 rounded-xl overflow-hidden">
                    <img
                      src={supabase.storage.from('software-images').getPublicUrl(submission.image).data.publicUrl}
                      alt={`${submission.title} preview`}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                <p className="text-white/80 font-ubuntu text-lg leading-relaxed mb-6">
                  {submission.description}
                </p>

                {submission.tags && submission.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {submission.tags.map((tag, index) => (
                      <Link
                        key={index}
                        to={`/tags/${tag}`}
                        className="px-3 py-1 bg-[#4FFFE3]/20 text-[#4FFFE3] rounded-full text-sm font-ubuntu hover:bg-[#4FFFE3]/30 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={addReferralParam(submission.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleOutboundClick(e, submission.id, addReferralParam(submission.url))}
                    className="flex-1 text-center px-8 py-4 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold text-lg hover:opacity-90 transition-opacity"
                  >
                    Visit Website
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(submission.url)
                      setAlertMessage({ type: 'success', message: 'URL copied to clipboard!' })
                    }}
                    className="px-8 py-4 rounded-full bg-[#4a4a4a] text-white font-ubuntu font-bold text-lg hover:bg-[#555555] transition-colors"
                  >
                    Copy URL
                  </button>
                </div>
              </div>

              {submission.tier && (submission.tier === 'featured' || submission.tier === 'premium') && (
                <ScreenshotGallery submissionId={submission.id} />
              )}

              <div className="bg-[#3a3a3a] rounded-2xl p-8 mt-6">
                <h2 className="text-white text-2xl font-bold font-ubuntu mb-4">Details</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 font-ubuntu">Website:</span>
                    <a
                      href={addReferralParam(submission.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4FFFE3] font-ubuntu hover:underline"
                    >
                      {submission.url}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 font-ubuntu">Category:</span>
                    <Link
                      to={`/category/${submission.category.toLowerCase()}`}
                      className="text-[#4FFFE3] font-ubuntu hover:underline"
                    >
                      {submission.category}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 font-ubuntu">Added:</span>
                    <span className="text-white font-ubuntu">
                      {new Date(submission.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        <Footer />
      </div>

      {alertMessage && (
        <Alert
          type={alertMessage.type}
          message={alertMessage.message}
          onClose={() => setAlertMessage(null)}
        />
      )}
    </div>
  )
}
