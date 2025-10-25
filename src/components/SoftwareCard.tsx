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
}

interface SoftwareCardProps {
  software: Software
}

export function SoftwareCard({ software }: SoftwareCardProps) {
  return (
    <Link
      to={`/software/${software.id}`}
      className="bg-[#3a3a3a] rounded-2xl p-6 hover:bg-[#404040] transition-all hover:transform hover:scale-105 block"
    >
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          {software.logo && (
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white p-2 flex items-center justify-center">
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
            <h3 className="text-white text-xl font-bold font-ubuntu truncate">
              {software.title}
            </h3>
          </div>
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-ubuntu bg-[#4a4a4a] text-white/70">
          {software.category}
        </span>
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
    </Link>
  )
}
