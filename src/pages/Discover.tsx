import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export default function DiscoverPage() {
  const categories = [
    { name: 'Trending This Week', count: 24 },
    { name: 'New Releases', count: 18 },
    { name: 'Top Rated', count: 32 },
    { name: 'Editor\'s Choice', count: 15 },
    { name: 'Open Source', count: 67 },
    { name: 'Free Tools', count: 89 },
  ]

  return (
    <div className="min-h-screen bg-neutral-800 relative">
      <div className="absolute w-full h-1/2 top-[7.45%] left-0 pointer-events-none">
        <div className="absolute w-4/5 h-40 top-1/3 left-[12.93%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 top-1/4 left-[22.59%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="w-full max-w-[1200px] mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-white text-5xl font-bold font-ubuntu mb-4">Discover Software</h1>
            <p className="text-white/70 text-xl font-ubuntu max-w-2xl mx-auto">
              Explore curated collections and find your next favorite tool
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, idx) => (
              <div
                key={idx}
                className="bg-[#3a3a3a] rounded-2xl p-8 hover:bg-[#404040] transition-colors cursor-pointer"
              >
                <h3 className="text-white text-2xl font-bold font-ubuntu mb-3">{category.name}</h3>
                <p className="text-white/70 font-ubuntu text-lg">
                  {category.count} {category.count === 1 ? 'app' : 'apps'}
                </p>
              </div>
            ))}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
