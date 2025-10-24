import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

interface Submission {
  id: string
  title: string
  url: string
  description: string
  category: string
  status: string
  created_at: string
}

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubmissions()
  }, [category])

  const fetchSubmissions = async () => {
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
        const filtered = (result.data || []).filter(
          (sub: Submission) => sub.category.toLowerCase() === category?.toLowerCase()
        )
        setSubmissions(filtered)
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
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

        <main className="w-full max-w-[1200px] mx-auto px-4 py-12">
          <div className="mb-8">
            <Link
              to="/discover"
              className="text-[#4FFFE3] font-ubuntu hover:underline inline-flex items-center gap-2"
            >
              ← Back to Discover
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-white text-5xl font-bold font-ubuntu mb-4 capitalize">
              {category}
            </h1>
            <p className="text-white/70 text-xl font-ubuntu">
              {submissions.length} {submissions.length === 1 ? 'app' : 'apps'} in this category
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-white/70 font-ubuntu text-xl">Loading...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/70 font-ubuntu text-xl">No apps found in this category</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((submission) => (
                <Link
                  key={submission.id}
                  to={`/software/${submission.id}`}
                  className="bg-[#3a3a3a] rounded-2xl p-6 hover:bg-[#404040] transition-colors block"
                >
                  <h3 className="text-white text-2xl font-bold font-ubuntu mb-3">
                    {submission.title}
                  </h3>
                  <p className="text-white/70 font-ubuntu mb-4 line-clamp-3">
                    {submission.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-sm font-ubuntu bg-[#4FFFE3]/20 text-[#4FFFE3] border border-[#4FFFE3]">
                      {submission.category}
                    </span>
                    <span className="text-[#4FFFE3] font-ubuntu text-sm hover:underline">
                      View Details →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}
