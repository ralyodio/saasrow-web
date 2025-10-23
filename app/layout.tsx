import type { Metadata } from 'next'
import '../tailwind.css'

export const metadata: Metadata = {
  title: 'SaaSRow - Software Marketplace',
  description: 'Save hours finding the perfect productivity software with our platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
