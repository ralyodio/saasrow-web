import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Software {
  id: string
  title: string
  url: string
  description: string
  category: string
  logo?: string
  image?: string
  tags?: string[]
  submitted_at?: string
}

interface SoftwareListingsProps {
  searchQuery: string
  selectedFilter: 'all' | 'featured' | 'premium'
  activeCategories: string[]
  selectedSort: string
}

export function SoftwareListings({
  searchQuery,
  selectedFilter,
  activeCategories,
  selectedSort,
}: SoftwareListingsProps) {
  const [listings, setListings] = useState<Software[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
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
        setListings(result.data || [])
      } else {
        setError('Failed to load software listings')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="w-full max-w-[1318px] mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-white/70 text-xl font-ubuntu">Loading software...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="w-full max-w-[1318px] mx-auto px-4 py-12">
        <div className="bg-[#3a3a3a] rounded-2xl p-8 text-center">
          <p className="text-red-400 text-xl font-ubuntu">{error}</p>
        </div>
      </section>
    )
  }

  const filteredAndSortedListings = listings
    .filter((software) => {
      const matchesSearch =
        searchQuery === '' ||
        software.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        software.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        software.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory =
        activeCategories.length === 0 || activeCategories.includes(software.category)

      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (selectedSort) {
        case 'Newest':
          return new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime()
        case 'A-Z':
          return a.title.localeCompare(b.title)
        case 'Z-A':
          return b.title.localeCompare(a.title)
        case 'Most Popular':
        case 'Top Rated':
        default:
          return 0
      }
    })

  if (listings.length === 0) {
    return (
      <section className="w-full max-w-[1318px] mx-auto px-4 py-12">
        <div className="bg-[#3a3a3a] rounded-2xl p-12 text-center">
          <p className="text-white/70 text-xl font-ubuntu">No software listings available yet.</p>
          <Link
            to="/submit"
            className="inline-block mt-6 px-8 py-3 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold text-lg hover:opacity-90 transition-opacity"
          >
            Submit Your Software
          </Link>
        </div>
      </section>
    )
  }

  if (filteredAndSortedListings.length === 0) {
    return (
      <section className="w-full max-w-[1318px] mx-auto px-4 py-12">
        <div className="bg-[#3a3a3a] rounded-2xl p-12 text-center">
          <p className="text-white/70 text-xl font-ubuntu">No software matches your filters.</p>
          <p className="text-white/50 text-sm font-ubuntu mt-2">Try adjusting your search or category filters.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full max-w-[1318px] mx-auto px-4 py-12">
      <div className="mb-6">
        <p className="text-white/70 font-ubuntu">
          Showing {filteredAndSortedListings.length} of {listings.length} software listings
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedListings.map((software) => (
          <Link
            key={software.id}
            to={`/software/${software.id}`}
            className="bg-[#3a3a3a] rounded-2xl p-6 hover:bg-[#404040] transition-all hover:transform hover:scale-105 block"
          >
            <div className="flex items-start gap-4 mb-4">
              {software.logo && (
                <div className="flex-shrink-0">
                  <img
                    src={software.logo}
                    alt={`${software.title} logo`}
                    className="w-16 h-16 rounded-lg bg-white p-2 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-xl font-bold font-ubuntu mb-1 truncate">
                  {software.title}
                </h3>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-ubuntu bg-[#4a4a4a] text-white/70">
                  {software.category}
                </span>
              </div>
            </div>

            {software.image && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={software.image}
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
        ))}
      </div>
    </section>
  )
}
