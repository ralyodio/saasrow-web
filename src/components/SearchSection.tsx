import { useState } from 'react'

export function SearchSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'featured' | 'premium'>('all')
  const [activeCategories, setActiveCategories] = useState<string[]>(['Software', 'Security'])

  const filterButtons = [
    { id: 'all' as const, label: 'All' },
    { id: 'featured' as const, label: 'Featured' },
    { id: 'premium' as const, label: 'Premium' },
  ]

  const categoryButtons = [
    { id: 'software', label: 'Software' },
    { id: 'security', label: 'Security' },
  ]

  const handleCategoryToggle = (category: string) => {
    setActiveCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    )
  }

  return (
    <section className="w-full max-w-[1318px] mx-auto px-4 py-8">
      <div className="relative">
        <div className="relative flex items-center bg-[#4a4a4a] rounded-full px-8 py-4">
          <img className="w-8 h-8 mr-4" alt="" src="/vector.svg" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords..."
            className="flex-1 bg-transparent border-none outline-none text-white text-2xl placeholder:text-white/70 font-inter"
          />

          <div className="flex gap-3 ml-8">
            {filterButtons.map((filter) => {
              const isActive = selectedFilter === filter.id
              return (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`px-6 py-2 rounded-full font-roboto text-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800'
                      : 'bg-transparent text-transparent bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] bg-clip-text border border-[#4FFFE3]'
                  }`}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6">
          {categoryButtons.map((category) => {
            const isActive = activeCategories.includes(category.label)
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryToggle(category.label)}
                className="flex items-center gap-2 px-6 py-3 bg-[#4a4a4a] rounded-full text-white font-roboto text-xl"
              >
                {category.label}
                <img className="w-4 h-4" alt="" src="/vector-2.svg" />
              </button>
            )
          })}

          <button
            onClick={() => setActiveCategories([])}
            className="px-6 py-3 text-transparent bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] bg-clip-text font-roboto text-2xl"
          >
            Clear All
          </button>
        </div>
      </div>
    </section>
  )
}
