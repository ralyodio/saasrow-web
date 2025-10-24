import { useState, useEffect } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

interface Submission {
  id: string
  title: string
  url: string
  description: string
  email: string
  category: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
      fetchSubmissions()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')

    const adminUser = import.meta.env.VITE_ADMIN_USER
    const adminPass = import.meta.env.VITE_ADMIN_PASS

    console.log('Admin credentials check:', {
      envUser: adminUser,
      envPass: adminPass,
      inputUser: username,
      inputPass: password,
      match: username === adminUser && password === adminPass
    })

    if (username === adminUser && password === adminPass) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_authenticated', 'true')
      fetchSubmissions()
    } else {
      setAuthError('Invalid username or password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_authenticated')
    setUsername('')
    setPassword('')
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions()
    }
  }, [isAuthenticated])

  const fetchSubmissions = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submissions?all=true`
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setSubmissions(result.data || [])
      } else {
        console.error('Failed to fetch submissions:', await response.text())
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSubmissionStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submissions`
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      })

      if (response.ok) {
        setSubmissions((prev) =>
          prev.map((sub) => (sub.id === id ? { ...sub, status } : sub))
        )
      } else {
        console.error('Failed to update submission:', await response.text())
        alert('Failed to update submission status')
      }
    } catch (error) {
      console.error('Failed to update submission:', error)
      alert('Failed to update submission status')
    }
  }

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'all') return true
    return sub.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-[#4FFFE3] bg-[#4FFFE3]/10 border-[#4FFFE3]'
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400'
      default:
        return 'text-[#E0FF04] bg-[#E0FF04]/10 border-[#E0FF04]'
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-800 relative flex items-center justify-center">
        <div className="absolute w-full h-1/2 top-[7.45%] left-0 pointer-events-none">
          <div className="absolute w-4/5 h-40 top-1/3 left-[12.93%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
          <div className="absolute w-4/5 h-40 top-1/4 left-[22.59%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        </div>

        <div className="relative z-10 w-full max-w-md px-4">
          <div className="bg-[#3a3a3a] rounded-2xl p-8">
            <h1 className="text-white text-3xl font-bold font-ubuntu mb-6 text-center">
              Admin Login
            </h1>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-white font-ubuntu text-sm mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-white font-ubuntu text-sm mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu"
                />
              </div>

              {authError && (
                <div className="rounded-lg p-3 bg-red-400/10 border border-red-400">
                  <p className="text-red-400 font-ubuntu text-sm text-center">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold text-lg hover:opacity-90 transition-opacity"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-800 relative">
      <div className="absolute w-full h-1/2 top-[7.45%] left-0 pointer-events-none">
        <div className="absolute w-4/5 h-40 top-1/3 left-[12.93%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 top-1/4 left-[22.59%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="w-full max-w-[1400px] mx-auto px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-white text-5xl font-bold font-ubuntu mb-4">Submissions</h1>
              <p className="text-white/70 text-xl font-ubuntu">
                Manage software submissions and approve listings
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 rounded-full bg-[#4a4a4a] text-white font-ubuntu font-bold hover:bg-[#555555] transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="flex gap-4 mb-8">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as typeof filter)}
                className={`px-6 py-3 rounded-full font-ubuntu font-bold transition-all capitalize ${
                  filter === status
                    ? 'bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800'
                    : 'bg-[#4a4a4a] text-white hover:bg-[#555555]'
                }`}
              >
                {status} ({submissions.filter((s) => status === 'all' || s.status === status).length})
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-[#3a3a3a] rounded-2xl p-12 text-center">
              <p className="text-white/70 font-ubuntu text-xl">Loading submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="bg-[#3a3a3a] rounded-2xl p-12 text-center">
              <p className="text-white/70 font-ubuntu text-xl">No submissions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-[#3a3a3a] rounded-2xl p-6 hover:bg-[#404040] transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white text-2xl font-bold font-ubuntu">
                          {submission.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-ubuntu border capitalize ${getStatusColor(
                            submission.status
                          )}`}
                        >
                          {submission.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-ubuntu bg-[#4a4a4a] text-white/70">
                          {submission.category}
                        </span>
                      </div>
                      <a
                        href={submission.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4FFFE3] font-ubuntu hover:underline block mb-2"
                      >
                        {submission.url}
                      </a>
                      <p className="text-white/70 font-ubuntu mb-2">{submission.description}</p>
                      <div className="flex items-center gap-4 text-white/50 font-ubuntu text-sm">
                        <span>Contact: {submission.email}</span>
                        <span>
                          Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {submission.status !== 'approved' && (
                        <button
                          onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                          className="px-4 py-2 rounded-lg bg-[#4FFFE3]/20 text-[#4FFFE3] border border-[#4FFFE3] font-ubuntu font-bold hover:bg-[#4FFFE3]/30 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {submission.status !== 'rejected' && (
                        <button
                          onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                          className="px-4 py-2 rounded-lg bg-red-400/20 text-red-400 border border-red-400 font-ubuntu font-bold hover:bg-red-400/30 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}
