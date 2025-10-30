import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { SearchSection } from '../components/SearchSection'
import { SoftwareListings } from '../components/SoftwareListings'
import { Footer } from '../components/Footer'
import { FloatingCTA } from '../components/FloatingCTA'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'featured' | 'premium'>('all')
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [selectedSort, setSelectedSort] = useState('Most Popular')

  const handleClearAll = () => {
    setSearchQuery('')
    setSelectedFilter('all')
    setActiveCategories([])
    setActiveTags([])
  }

  return (
    <div className="min-h-screen bg-neutral-800 relative">
      <div className="absolute w-full h-1/2 top-[7.45%] left-0 pointer-events-none">
        <div className="absolute w-4/5 h-40 top-1/3 left-[12.93%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 top-1/4 left-[22.59%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 top-1/2 left-[3.22%] bg-[#e0ff044c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 bottom-0 left-[-3.60%] bg-[#e0ff044c] rotate-[37.69deg] blur-[150px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <section className="w-full max-w-[1280px] mx-auto px-4 pt-8 pb-4">
          <div className="bg-gradient-to-r from-[#4FFFE3] via-[#E0FF04] to-[#4FFFE3] rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-ubuntu font-bold text-3xl md:text-5xl text-neutral-900 mb-4">
                List Your Software for FREE
              </h2>
              <p className="font-ubuntu text-lg md:text-xl text-neutral-800 mb-6 max-w-2xl mx-auto">
                Get discovered by thousands of users. Free dofollow backlink, instant approval, and zero cost to start.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/submit"
                  className="px-8 py-4 bg-neutral-900 text-white rounded-full font-ubuntu font-bold text-lg hover:bg-neutral-800 transition-all transform hover:scale-105 shadow-lg"
                >
                  Submit Your Software Free
                </Link>
                <Link
                  to="/featured"
                  className="px-8 py-4 bg-white/90 text-neutral-900 rounded-full font-ubuntu font-semibold text-lg hover:bg-white transition-all"
                >
                  View Pricing Plans
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-6 text-neutral-800 font-ubuntu font-medium">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free Forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>DoFollow Backlink</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No Credit Card</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SearchSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          activeCategories={activeCategories}
          onCategoriesChange={setActiveCategories}
          activeTags={activeTags}
          onTagsChange={setActiveTags}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
          onClearAll={handleClearAll}
        />
        <SoftwareListings
          searchQuery={searchQuery}
          selectedFilter={selectedFilter}
          activeCategories={activeCategories}
          activeTags={activeTags}
          selectedSort={selectedSort}
        />
        <Footer />
        <FloatingCTA />
      </div>
    </div>
  )
}
