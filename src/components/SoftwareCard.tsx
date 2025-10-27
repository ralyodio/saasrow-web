import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Software {
  id: string
  title: string
  url: string
  description: string
  category: string
  logo?: string
  image?: string
  tags?: string[]
  tier?: string
  homepage_featured?: boolean
  newsletter_featured?: boolean
  view_count?: number
  upvotes?: number
  downvotes?: number
}

interface SoftwareCardProps {
  software: Software
}

export function SoftwareCard({ software }: SoftwareCardProps) {
  const isPremium = software.tier === 'premium'
  const isFeatured = software.tier === 'featured'
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null)
  const [upvotes, setUpvotes] = useState(software.upvotes || 0)
  const [downvotes, setDownvotes] = useState(software.downvotes || 0)
  const [isVoting, setIsVoting] = useState(false)

  useEffect(() => {
    checkAuthAndVote()
  }, [])

  useEffect(() => {
    setUpvotes(software.upvotes || 0)
    setDownvotes(software.downvotes || 0)
  }, [software.upvotes, software.downvotes])

  const checkAuthAndVote = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)

    if (session) {
      const { data: vote } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('submission_id', software.id)
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (vote) {
        setUserVote(vote.vote_type as 'upvote' | 'downvote')
      }
    }
  }

  const handleVote = async (voteType: 'upvote' | 'downvote', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isVoting) return

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
          submissionId: software.id,
          voteType,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setUserVote(result.voteType)
        setUpvotes(result.upvotes)
        setDownvotes(result.downvotes)
      } else {
        alert(result.error || 'Failed to vote')
      }
    } catch (error) {
      console.error('Failed to vote:', error)
      alert('Failed to vote')
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

  const handleOutboundClick = async (e: React.MouseEvent<HTMLAnchorElement>, submissionId: string, url: string) => {
    e.preventDefault()
    e.stopPropagation()

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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a')) {
      return
    }
    window.location.href = `/software/${software.id}`
  }

  return (
    <div
      onClick={handleCardClick}
      className={`bg-[#3a3a3a] rounded-2xl p-4 sm:p-6 hover:bg-[#404040] transition-all sm:hover:transform sm:hover:scale-105 block relative cursor-pointer ${
        isPremium ? 'ring-2 ring-[#E0FF04]' : ''
      }`}
    >
      {isPremium && (
        <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-gradient-to-r from-[#E0FF04] to-[#4FFFE3] text-neutral-800 px-3 py-1 rounded-full text-xs font-bold font-ubuntu shadow-lg">
          PREMIUM
        </div>
      )}
      {isFeatured && (
        <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-gradient-to-r from-[#4FFFE3] to-[#00d4ff] text-neutral-800 px-3 py-1 rounded-full text-xs font-bold font-ubuntu shadow-lg">
          FEATURED
        </div>
      )}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          {software.logo && (
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white p-1.5 sm:p-2 flex items-center justify-center">
              <img
                src={supabase.storage.from('software-logos').getPublicUrl(software.logo).data.publicUrl}
                alt={`${software.title} logo`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-lg sm:text-xl font-bold font-ubuntu truncate">
              {software.title}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-ubuntu bg-[#4a4a4a] text-white/70">
            {software.category}
          </span>
          {isPremium && (
            <>
              {software.homepage_featured && (
                <span className="inline-block px-2 py-1 rounded-full text-xs font-ubuntu bg-[#E0FF04]/20 text-[#E0FF04]">
                  Homepage Featured
                </span>
              )}
              {software.newsletter_featured && (
                <span className="inline-block px-2 py-1 rounded-full text-xs font-ubuntu bg-[#4FFFE3]/20 text-[#4FFFE3]">
                  Newsletter Featured
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {software.image && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img
            src={supabase.storage.from('software-images').getPublicUrl(software.image).data.publicUrl}
            alt={`${software.title} preview`}
            className="w-full h-32 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      <p className="text-white/70 font-ubuntu text-sm mb-4 line-clamp-3">
        {software.description}
      </p>

      {software.tags && software.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {software.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-[#4FFFE3]/20 text-[#4FFFE3] rounded-full text-xs font-ubuntu"
            >
              {tag}
            </span>
          ))}
          {software.tags.length > 3 && (
            <span className="px-2 py-1 bg-[#4a4a4a] text-white/50 rounded-full text-xs font-ubuntu">
              +{software.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href={addReferralParam(software.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#4FFFE3] font-ubuntu text-sm hover:underline"
            onClick={(e) => handleOutboundClick(e, software.id, addReferralParam(software.url))}
          >
            Visit Website
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => handleVote('upvote', e)}
              disabled={isVoting}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                userVote === 'upvote'
                  ? 'bg-[#4FFFE3]/20 text-[#4FFFE3]'
                  : 'bg-[#4a4a4a] text-white/60 hover:bg-[#555555] hover:text-white'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-ubuntu">{upvotes}</span>
            </button>
            <button
              onClick={(e) => handleVote('downvote', e)}
              disabled={isVoting}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                userVote === 'downvote'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-[#4a4a4a] text-white/60 hover:bg-[#555555] hover:text-white'
              } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-ubuntu">{downvotes}</span>
            </button>
          </div>
        </div>
        {software.view_count !== undefined && software.view_count > 0 && (
          <div className="flex items-center gap-1.5 text-white/40 font-ubuntu text-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{software.view_count.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
