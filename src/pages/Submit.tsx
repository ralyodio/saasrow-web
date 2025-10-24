import { useState, FormEvent, ChangeEvent } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export default function SubmitPage() {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    email: '',
    category: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submissions`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Software submitted successfully! We\'ll contact you at the provided email.' })
        setFormData({ title: '', url: '', description: '', email: '', category: '' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-800">
      <div className="absolute w-full h-1/2 top-0 left-0 pointer-events-none">
        <div className="absolute w-4/5 h-40 top-1/3 left-[12.93%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
        <div className="absolute w-4/5 h-40 top-1/4 left-[22.59%] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="w-full max-w-[800px] mx-auto px-4 py-12">
          <h1 className="text-white text-4xl font-bold font-ubuntu mb-8 text-center">
            Submit Your Software
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#3a3a3a] rounded-2xl p-8 space-y-6">
              <div>
                <label htmlFor="title" className="block text-white font-ubuntu text-lg mb-2">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your Title"
                  required
                  className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu"
                />
              </div>

              <div>
                <label htmlFor="url" className="block text-white font-ubuntu text-lg mb-2">
                  URL
                </label>
                <input
                  id="url"
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="Enter your URL"
                  required
                  className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-white font-ubuntu text-lg mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  required
                  className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-white font-ubuntu text-lg mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu"
                >
                  <option value="">Select a category</option>
                  <option value="Software">Software</option>
                  <option value="Security">Security</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Communication">Communication</option>
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-white font-ubuntu text-lg mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter your Description"
                  required
                  rows={4}
                  className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu resize-none"
                />
              </div>
            </div>

            <div className="bg-[#3a3a3a] rounded-2xl p-8">
              <h2 className="text-white text-xl font-bold font-ubuntu mb-4">Upload Files</h2>

              <div className="border-2 border-dashed border-[#4a4a4a] rounded-2xl p-12 text-center mb-4">
                <div className="flex flex-col items-center gap-4">
                  <svg
                    className="w-16 h-16 text-[#4FFFE3]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div className="text-white font-ubuntu">
                    <span>Drag your file(s) or </span>
                    <button
                      type="button"
                      className="text-[#4FFFE3] underline hover:opacity-80"
                    >
                      browse
                    </button>
                  </div>
                  <p className="text-white/50 text-sm font-ubuntu">Max 10 MB files are allowed</p>
                </div>
              </div>

              <p className="text-white/50 text-sm font-ubuntu mb-4">
                Only support .jpg, .png and .svg
              </p>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-[#4a4a4a]" />
                <span className="text-white/50 font-ubuntu">OR</span>
                <div className="flex-1 h-px bg-[#4a4a4a]" />
              </div>

              <div className="flex gap-4">
                <input
                  type="url"
                  placeholder="Add file URL"
                  className="flex-1 px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu"
                />
                <button
                  type="button"
                  className="px-8 py-3 rounded-lg bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold hover:opacity-90 transition-opacity"
                >
                  Upload
                </button>
              </div>
            </div>

            {message && (
              <div
                className={`rounded-2xl p-4 ${
                  message.type === 'success'
                    ? 'bg-[#4FFFE3]/10 border border-[#4FFFE3]'
                    : 'bg-red-400/10 border border-red-400'
                }`}
              >
                <p
                  className={`text-center font-ubuntu ${
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
              className="w-full py-4 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold text-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </main>

        <Footer />
      </div>
    </div>
  )
}
