import { useState, FormEvent, ChangeEvent } from 'react'
import { Link } from 'react-router-dom'

export function Footer() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const navigationLinks = [
    { label: 'About us', href: '/about' },
    { label: 'Discover', href: '/discover' },
    { label: 'News', href: '/news' },
  ]

  const footerLinks = [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ]

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newsletter`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Successfully subscribed!' })
        setEmail('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to subscribe' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className="w-full max-w-[1280px] mx-auto px-4 py-8 sm:py-12 mt-12 sm:mt-24">
      <div className="space-y-6 sm:space-y-8">
        <section className="bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] rounded-2xl sm:rounded-3xl p-6 sm:p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="font-ubuntu font-bold text-black text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4">
                Subscribe Newsletter
              </h2>
              <p className="font-ubuntu text-black text-base sm:text-lg lg:text-xl max-w-md mx-auto lg:mx-0">
                For the latest in self-hosted news, software, and content delivered straight to your
                inbox every Friday
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="w-full flex-1 max-w-xl">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-neutral-800 rounded-2xl sm:rounded-full px-4 sm:px-6 py-3 gap-3 sm:gap-0">
                <input
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isSubmitting}
                  className="flex-1 bg-transparent text-white font-ubuntu text-base sm:text-lg outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="sm:ml-4 px-6 sm:px-8 py-2 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe Now'}
                </button>
              </div>
              {message && (
                <p className={`mt-2 text-sm font-ubuntu text-center sm:text-left ${
                  message.type === 'success' ? 'text-[#4FFFE3]' : 'text-red-400'
                }`}>
                  {message.text}
                </p>
              )}
            </form>
          </div>
        </section>

        <nav className="flex items-center justify-center gap-6 sm:gap-12 py-4 sm:py-6 flex-wrap">
          {navigationLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="font-ubuntu text-white text-base sm:text-lg hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-center">
          <img className="h-6 sm:h-8 w-auto" alt="Social media links" src="/social.png" />
        </div>

        <hr className="border-white/20" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/75 font-ubuntu text-xs sm:text-sm">
          <p className="text-center md:text-left">© 2025 <a href="https://profullstack.com" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-white transition-colors">Profullstack, Inc.</a> All rights reserved.</p>

          <Link to="/" className="order-first md:order-none">
            <img className="h-8 sm:h-10 w-auto" alt="SaaSRow logo" src="/wiresniff-logo-1-1.png" />
          </Link>

          <nav className="flex gap-4 sm:gap-8 flex-wrap justify-center">
            {footerLinks.map((link) => (
              <Link key={link.label} to={link.href} className="hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
