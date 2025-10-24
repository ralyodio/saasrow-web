import { Link } from 'react-router-dom'
import { useState } from 'react'

export function Header() {
  const [activeNav, setActiveNav] = useState('apps')

  const navigationItems = [
    { id: 'apps', label: 'Apps', href: '/' },
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
        </nav>
      </div>
    </header>
  )
}
