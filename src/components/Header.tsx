import { Link } from 'react-router-dom'
import { useState } from 'react'

export function Header() {
  const [activeNav, setActiveNav] = useState('apps')
  const [showSignIn, setShowSignIn] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-management-link`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Check your email for the management link!' })
        setEmail('')

        if (data.managementUrl) {
          const localUrl = data.managementUrl.replace(/^https?:\/\/[^\/]+/, window.location.origin)
          setTimeout(() => {
            window.location.href = localUrl
          }, 2000)
        } else {
          setTimeout(() => {
            setShowSignIn(false)
            setMessage(null)
          }, 3000)
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send link' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const navigationItems = [
    { id: 'apps', label: 'Apps', href: '/' },
    { id: 'categories', label: 'Categories', href: '/categories' },
    { id: 'tags', label: 'Tags', href: '/tags' },
    { id: 'community', label: 'Community', href: '/community' },
  ]

  return (
    <header className="w-full max-w-[1335px] mx-auto px-4 py-9">
      <div className="flex items-center justify-between">
        <Link to="/">
          <img
            className="h-16 w-auto object-contain"
            alt="SaaSRow logo"
            src="/wiresniff-logo-1-1.png"
          />
        </Link>

        <nav className="flex items-center gap-8">
          {navigationItems.map((item) => (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => setActiveNav(item.id)}
              className={`font-roboto text-2xl transition-all ${
                activeNav === item.id
                  ? 'bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] bg-clip-text text-transparent'
                  : 'text-white hover:opacity-80'
              }`}
            >
              {item.label}
            </Link>
          ))}

          <Link
            to="/featured"
            className="px-8 py-3 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-roboto text-xl hover:opacity-90 transition-opacity"
          >
            Get Featured
          </Link>

          <button
            onClick={() => setShowSignIn(true)}
            className="px-6 py-3 rounded-full border-2 border-white text-white font-roboto text-xl hover:bg-white hover:text-neutral-800 transition-all"
          >
            Sign In
          </button>
        </nav>
      </div>

      {showSignIn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSignIn(false)}>
          <div className="bg-neutral-800 rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white text-2xl font-bold font-ubuntu">Sign In</h2>
              <button
                onClick={() => setShowSignIn(false)}
                className="text-white hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-white/70 mb-6 font-ubuntu">
              Enter your email to receive a link to manage your listings
            </p>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className="block text-white font-ubuntu mb-2">
                  Email Address
                </label>
                <input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu"
                />
              </div>

              {message && (
                <div
                  className={`rounded-lg p-3 ${
                    message.type === 'success'
                      ? 'bg-[#4FFFE3]/10 border border-[#4FFFE3]'
                      : 'bg-red-400/10 border border-red-400'
                  }`}
                >
                  <p
                    className={`text-sm font-ubuntu ${
                      message.type === 'success' ? 'text-[#4FFFE3]' : 'text-red-400'
                    }`}
                  >
                    {message.text}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
