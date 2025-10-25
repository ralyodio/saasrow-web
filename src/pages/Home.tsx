import { useState } from 'react'
import { Header } from '../components/Header'
import { SearchSection } from '../components/SearchSection'
import { SoftwareListings } from '../components/SoftwareListings'
import { Footer } from '../components/Footer'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'featured' | 'premium'>('all')
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [selectedSort, setSelectedSort] = useState('Most Popular')

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
        />
        <SoftwareListings
          searchQuery={searchQuery}
          selectedFilter={selectedFilter}
          activeCategories={activeCategories}
          activeTags={activeTags}
          selectedSort={selectedSort}
        />
        <Footer />
      </div>
    </div>
  )
}
