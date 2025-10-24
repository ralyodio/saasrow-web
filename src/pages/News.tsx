import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export default function NewsPage() {
  const newsItems = [
    {
      title: 'New AI Tools Transform Software Development',
      date: 'October 20, 2025',
      excerpt: 'Discover how the latest AI-powered tools are revolutionizing the way developers build software.',
    },
    {
      title: 'Top 10 Productivity Apps of 2025',
      date: 'October 15, 2025',
      excerpt: 'Our curated list of the best productivity applications that will boost your workflow.',
    },
    {
      title: 'Security Best Practices for SaaS Applications',
      date: 'October 10, 2025',
      excerpt: 'Essential security measures every SaaS provider should implement to protect user data.',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-800 relative">
      <div className="absolute w-full h-1/2 top-[7.45%] left-0 pointer-events-none">
        <div className="absolute w-4/5 h-40 top-1/3 left-[12.93%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 top-1/4 left-[22.59%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="w-full max-w-[1000px] mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-white text-5xl font-bold font-ubuntu mb-4">News & Updates</h1>
            <p className="text-white/70 text-xl font-ubuntu max-w-2xl mx-auto">
              Stay updated with the latest in software, tools, and technology
            </p>
          </div>

          <div className="space-y-6">
            {newsItems.map((item, idx) => (
              <article
                key={idx}
                className="bg-[#3a3a3a] rounded-2xl p-8 hover:bg-[#404040] transition-colors cursor-pointer"
              >
                <p className="text-[#4FFFE3] font-ubuntu text-sm mb-2">{item.date}</p>
                <h2 className="text-white text-3xl font-bold font-ubuntu mb-3">{item.title}</h2>
                <p className="text-white/70 font-ubuntu text-lg">{item.excerpt}</p>
              </article>
            ))}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
