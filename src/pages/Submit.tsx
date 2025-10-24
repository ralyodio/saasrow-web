import { useState, FormEvent, ChangeEvent } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

interface FetchedData {
  url: string
  title: string
  description: string
  category: string
  image: string | null
  favicon: string | null
}

export default function SubmitPage() {
  const [step, setStep] = useState<'url' | 'edit'>(  'url')
  const [url, setUrl] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    email: '',
    category: '',
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleFetchMetadata = async (e: FormEvent) => {
    e.preventDefault()
    setIsFetching(true)
    setMessage(null)

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-metadata`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (response.ok) {
        setFormData({
          title: data.title,
          url: data.url,
          description: data.description,
          email: '',
          category: data.category,
        })
        setPreviewImage(data.image)
        setStep('edit')
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch metadata' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please check the URL and try again.' })
    } finally {
      setIsFetching(false)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        setUrl('')
        setPreviewImage(null)
        setStep('url')
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartOver = () => {
    setStep('url')
    setUrl('')
    setFormData({ title: '', url: '', description: '', email: '', category: '' })
    setPreviewImage(null)
    setMessage(null)
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
          <h1 className="text-white text-4xl font-bold font-ubuntu mb-4 text-center">
            Submit Your Software
          </h1>
          <p className="text-white/70 text-center font-ubuntu mb-8">
            {step === 'url'
              ? 'Enter your software URL and we\'ll automatically fetch the details'
              : 'Review and edit the information before submitting'}
          </p>

          {step === 'url' ? (
            <form onSubmit={handleFetchMetadata} className="space-y-6">
              <div className="bg-[#3a3a3a] rounded-2xl p-8">
                <label htmlFor="url" className="block text-white font-ubuntu text-lg mb-4">
                  Software URL
                </label>
                <input
                  id="url"
                  name="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu text-lg"
                />
                <p className="text-white/50 text-sm font-ubuntu mt-3">
                  We'll fetch the title, description, and other details automatically using AI
                </p>
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
                disabled={isFetching || !url}
                className="w-full py-4 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold text-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? 'Fetching details...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {previewImage && (
                <div className="bg-[#3a3a3a] rounded-2xl p-8">
                  <label className="block text-white font-ubuntu text-lg mb-4">Preview Image</label>
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                    onError={() => setPreviewImage(null)}
                  />
                </div>
              )}

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
                    placeholder="Software title"
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
                    placeholder="https://example.com"
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
                    onChange={handleInputChange}
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
                    placeholder="Brief description of the software"
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-white font-ubuntu text-lg mb-2">
                    Your Email
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

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="flex-1 py-4 rounded-full bg-[#4a4a4a] text-white font-ubuntu font-bold text-xl hover:bg-[#555555] transition-colors"
                >
                  Start Over
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold text-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </main>

        <Footer />
      </div>
    </div>
  )
}
