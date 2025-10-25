import { Link } from 'react-router-dom'
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
}

interface SoftwareCardProps {
  software: Software
}

export function SoftwareCard({ software }: SoftwareCardProps) {
  const isPremium = software.tier === 'premium'
  const isFeatured = software.tier === 'featured'
  const isBasic = !software.tier || software.tier === 'basic'

  return (
    <Link
      to={`/software/${software.id}`}
      className={`bg-[#3a3a3a] rounded-2xl p-4 sm:p-6 hover:bg-[#404040] transition-all sm:hover:transform sm:hover:scale-105 block relative ${
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
      {isBasic && (
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
        <a
          href={software.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[#4FFFE3] font-ubuntu text-sm hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Visit Website
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
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
    </Link>
  )
}
