'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import Link from 'next/link'

export function Footer() {
  const [email, setEmail] = useState('')

  const navigationLinks = [
    { label: 'About us', href: '/about' },
    { label: 'Discover', href: '/discover' },
    { label: 'Explore', href: '/explore' },
    { label: 'News', href: '/news' },
  ]

  const footerLinks = [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ]

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault()
    console.log('Subscribing email:', email)
  }

  return (
    <footer className="w-full max-w-[1280px] mx-auto px-4 py-12 mt-24">
      <div className="space-y-8">
        <section className="bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] rounded-3xl p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="font-ubuntu font-bold text-black text-5xl mb-4">
                Subscribe Newsletter
              </h2>
              <p className="font-ubuntu text-black text-xl max-w-md">
                For the latest in self-hosted news, software, and content delivered straight to your
                inbox every Friday
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex-1 max-w-xl">
              <div className="flex items-center bg-neutral-800 rounded-full px-6 py-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 bg-transparent text-white font-ubuntu text-lg outline-none"
                />
                <button
                  type="submit"
                  className="ml-4 px-8 py-2 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-medium hover:opacity-90 transition-opacity"
                >
                  Subscribe Now
                </button>
              </div>
            </form>
          </div>
        </section>

        <nav className="flex items-center justify-center gap-12 py-6">
          {navigationLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-ubuntu text-white text-lg hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-center">
          <img className="h-8 w-auto" alt="Social media links" src="/social.png" />
        </div>

        <hr className="border-white/20" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/75 font-ubuntu text-sm">
          <p>© 2019 SaaSRow. All rights reserved.</p>

          <Link href="/">
            <img className="h-10 w-auto" alt="Wiresniff logo" src="/wiresniff-logo-1-1.png" />
          </Link>

          <nav className="flex gap-8">
            {footerLinks.map((link) => (
              <Link key={link.label} href={link.href} className="hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
