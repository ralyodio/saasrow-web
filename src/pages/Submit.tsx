import { useState, FormEvent, ChangeEvent } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { supabase } from '../lib/supabase'

interface FetchedData {
  url: string
  title: string
  description: string
  category: string
  tags: string[]
  image: string | null
  logo: string | null
}

export default function SubmitPage() {
  const [step, setStep] = useState<'url' | 'review' | 'edit'>('url')
  const [urls, setUrls] = useState('')
  const [url, setUrl] = useState('')
  const [submissions, setSubmissions] = useState<FetchedData[]>([])
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    email: '',
    category: '',
    tags: [] as string[],
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [fetchedLogoPath, setFetchedLogoPath] = useState<string | null>(null)
  const [fetchedImagePath, setFetchedImagePath] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [managementToken, setManagementToken] = useState<string | null>(null)

  const handleFetchMetadata = async (e: FormEvent) => {
    e.preventDefault()
    setIsFetching(true)
    setMessage(null)

    try {
      const urlInput = urls.trim()

      if (!urlInput) {
        setMessage({ type: 'error', text: 'Please enter a URL' })
        setIsFetching(false)
        return
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-metadata`

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ url: urlInput }),
        })

        const data = await response.json()

        if (response.ok) {
          const fetchedData: FetchedData = {
            url: data.url,
            title: data.title,
            description: data.description,
            category: data.category,
            tags: data.tags || [],
            image: data.image,
            logo: data.logo,
          }

          setSubmissions([fetchedData])
          setStep('review')
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to fetch metadata' })
        }
      } catch (error) {
        console.error('Error fetching metadata:', error)
        setMessage({
          type: 'error',
          text: 'Failed to fetch metadata. Please try again.'
        })
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setMessage({
        type: 'error',
        text: `Something went wrong: ${error instanceof Error ? error.message : 'Please try again.'}`
      })
    } finally {
      setIsFetching(false)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Logo file must be less than 5MB' })
        return
      }
      setLogoFile(file)
      setLogoUrl(URL.createObjectURL(file))
    }
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image file must be less than 10MB' })
        return
      }
      setImageFile(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      let uploadedLogoPath: string | null = null
      let uploadedImagePath: string | null = null

      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: logoError } = await supabase.storage
          .from('software-logos')
          .upload(fileName, logoFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (logoError) {
          setMessage({ type: 'error', text: 'Failed to upload logo' })
          setIsSubmitting(false)
          return
        }
        uploadedLogoPath = fileName
      } else if (fetchedLogoPath) {
        uploadedLogoPath = fetchedLogoPath
      }

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: imageError } = await supabase.storage
          .from('software-images')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (imageError) {
          setMessage({ type: 'error', text: 'Failed to upload image' })
          setIsSubmitting(false)
          return
        }
        uploadedImagePath = fileName
      } else if (fetchedImagePath) {
        uploadedImagePath = fetchedImagePath
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submissions`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          logo: uploadedLogoPath,
          image: uploadedImagePath,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (currentEditIndex !== null) {
          const updatedSubmissions = [...submissions]
          updatedSubmissions[currentEditIndex] = {
            ...updatedSubmissions[currentEditIndex],
            ...formData,
            logo: uploadedLogoPath,
            image: uploadedImagePath,
          }
          setSubmissions(updatedSubmissions)
          setCurrentEditIndex(null)
          setStep('review')
          setMessage({ type: 'success', text: 'Changes saved!' })
        } else {
          if (data.managementToken) {
            setManagementToken(data.managementToken)
          }
          setMessage({ type: 'success', text: 'Software submitted successfully!' })
        }
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
    setUrls('')
    setUrl('')
    setSubmissions([])
    setCurrentEditIndex(null)
    setFormData({ title: '', url: '', description: '', email: '', category: '', tags: [] })
    setPreviewImage(null)
    setLogoUrl(null)
    setLogoFile(null)
    setImageFile(null)
    setFetchedLogoPath(null)
    setFetchedImagePath(null)
    setMessage(null)
  }

  const handleEditSubmission = (index: number) => {
    const submission = submissions[index]
    setCurrentEditIndex(index)
    setFormData({
      title: submission.title,
      url: submission.url,
      description: submission.description,
      email: '',
      category: submission.category,
      tags: submission.tags,
    })

    if (submission.image) {
      setFetchedImagePath(submission.image)
      const { data: imageData } = supabase.storage.from('software-images').getPublicUrl(submission.image)
      setPreviewImage(imageData.publicUrl)
    }

    if (submission.logo) {
      setFetchedLogoPath(submission.logo)
      const { data: logoData } = supabase.storage.from('software-logos').getPublicUrl(submission.logo)
      setLogoUrl(logoData.publicUrl)
    }

    setStep('edit')
  }

  const handleRemoveSubmission = (index: number) => {
    setSubmissions(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmitAll = async () => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const email = prompt('Enter your email address for all submissions:')
      if (!email) {
        setIsSubmitting(false)
        return
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submissions`
      let successCount = 0

      for (const submission of submissions) {
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: submission.title,
              url: submission.url,
              description: submission.description,
              email,
              category: submission.category,
              tags: submission.tags,
              logo: submission.logo,
              image: submission.image,
            }),
          })

          if (response.ok) {
            successCount++
          }
        } catch (error) {
          console.error('Error submitting', submission.url, error)
        }
      }

      if (successCount > 0) {
        const lastResponseData = await fetch(`${apiUrl}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: submissions[submissions.length - 1].title,
            url: submissions[submissions.length - 1].url,
            description: submissions[submissions.length - 1].description,
            email,
            category: submissions[submissions.length - 1].category,
            tags: submissions[submissions.length - 1].tags,
            logo: submissions[submissions.length - 1].logo,
            image: submissions[submissions.length - 1].image,
          }),
        }).then(r => r.json())

        if (lastResponseData.managementToken) {
          setManagementToken(lastResponseData.managementToken)
        }

        setMessage({
          type: 'success',
          text: `Successfully submitted ${successCount} of ${submissions.length} software entries!`
        })
        setTimeout(() => {
          handleStartOver()
        }, 2000)
      } else {
        setMessage({ type: 'error', text: 'Failed to submit any entries' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackToReview = () => {
    setCurrentEditIndex(null)
    setFormData({ title: '', url: '', description: '', email: '', category: '', tags: [] })
    setPreviewImage(null)
    setLogoUrl(null)
    setLogoFile(null)
    setImageFile(null)
    setFetchedLogoPath(null)
    setFetchedImagePath(null)
    setStep('review')
  }

  const handleRemoveTag = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove),
    }))
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const input = e.currentTarget
      const newTag = input.value.trim().toLowerCase()
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }))
        input.value = ''
      }
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
          <h1 className="text-white text-4xl font-bold font-ubuntu mb-4 text-center">
            Submit Your Software
          </h1>
          <p className="text-white/70 text-center font-ubuntu mb-8">
            {step === 'url'
              ? 'Enter your software URL and we\'ll automatically fetch the details'
              : step === 'review'
              ? 'Review your submission and edit if needed'
              : 'Review and edit the information before submitting'}
          </p>

          {step === 'url' ? (
            <form onSubmit={handleFetchMetadata} className="space-y-6">
              <div className="bg-[#3a3a3a] rounded-2xl p-8">
                <label htmlFor="urls" className="block text-white font-ubuntu text-lg mb-4">
                  Software URL
                </label>
                <input
                  id="urls"
                  name="urls"
                  type="url"
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu text-lg"
                />
                <p className="text-white/50 text-sm font-ubuntu mt-3">
                  We'll fetch the title, description, and other details automatically using AI
                </p>
                <div className="mt-4 bg-[#4a4a4a] rounded-lg p-4 border border-[#4FFFE3]/20">
                  <p className="text-white/70 text-sm font-ubuntu flex items-start gap-2">
                    <span className="text-[#4FFFE3] text-lg">✨</span>
                    <span>
                      <strong className="text-white">Want to submit multiple URLs at once?</strong>
                      <br />
                      Upgrade to <span className="text-[#4FFFE3]">Featured</span> or <span className="text-[#E0FF04]">Premium</span> tier for bulk submissions and additional benefits!
                    </span>
                  </p>
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
                  {managementToken && message.type === 'success' && (
                    <div className="mt-4 space-y-2">
                      <p className="text-white text-center font-ubuntu text-sm">
                        Save this link to manage your listings:
                      </p>
                      <div className="bg-[#4a4a4a] rounded-lg p-3">
                        <p className="text-[#4FFFE3] text-sm font-mono break-all text-center">
                          {window.location.origin}/manage/{managementToken}
                        </p>
                      </div>
                      <a
                        href={`/manage/${managementToken}`}
                        className="block text-center text-[#4FFFE3] hover:underline text-sm font-ubuntu"
                      >
                        Go to Management Page
                      </a>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isFetching || !urls}
                className="w-full py-4 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold text-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? 'Fetching details...' : 'Continue'}
              </button>
            </form>
          ) : step === 'review' ? (
            <div className="space-y-6">
              <div className="space-y-4">
                {submissions.map((submission, index) => (
                  <div key={index} className="bg-[#3a3a3a] rounded-2xl p-6 flex items-start gap-4">
                    {submission.logo && (
                      <div className="w-16 h-16 rounded-lg bg-white p-2 flex-shrink-0">
                        <img
                          src={supabase.storage.from('software-logos').getPublicUrl(submission.logo).data.publicUrl}
                          alt={submission.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-ubuntu text-xl font-bold mb-2">{submission.title}</h3>
                      <p className="text-white/70 font-ubuntu text-sm mb-2">{submission.url}</p>
                      <p className="text-white/60 font-ubuntu text-sm line-clamp-2">{submission.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-3 py-1 bg-[#4FFFE3]/20 text-[#4FFFE3] rounded-full text-xs font-ubuntu">
                          {submission.category}
                        </span>
                        {submission.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-3 py-1 bg-white/10 text-white/70 rounded-full text-xs font-ubuntu">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditSubmission(index)}
                        className="px-4 py-2 bg-[#4a4a4a] text-white rounded-lg hover:bg-[#555555] transition-colors font-ubuntu text-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubmission(index)}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-ubuntu text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
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
                  type="button"
                  onClick={handleSubmitAll}
                  disabled={isSubmitting || submissions.length === 0}
                  className="flex-1 py-4 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold text-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-[#3a3a3a] rounded-2xl p-8">
                <h3 className="text-white font-ubuntu text-lg mb-4">Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-ubuntu text-sm mb-2">Logo</label>
                    {logoUrl ? (
                      <div className="relative">
                        <div className="w-32 h-32 rounded-lg bg-white p-4 flex items-center justify-center mx-auto">
                          <img
                            src={logoUrl}
                            alt="Logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl(null)
                            setLogoFile(null)
                            setFetchedLogoPath(null)
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#4a4a4a] rounded-lg cursor-pointer hover:border-[#4FFFE3] transition-colors">
                        <svg className="w-8 h-8 text-white/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-white/50 font-ubuntu text-sm">Upload Logo</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/x-icon"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                    <p className="text-white/50 text-xs font-ubuntu mt-2">Max 5MB. PNG, JPG, SVG, ICO</p>
                  </div>

                  <div>
                    <label className="block text-white font-ubuntu text-sm mb-2">Preview Image</label>
                    {previewImage ? (
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(null)
                            setImageFile(null)
                            setFetchedImagePath(null)
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#4a4a4a] rounded-lg cursor-pointer hover:border-[#4FFFE3] transition-colors">
                        <svg className="w-8 h-8 text-white/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-white/50 font-ubuntu text-sm">Upload Image</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                    <p className="text-white/50 text-xs font-ubuntu mt-2">Max 10MB. PNG, JPG, WEBP</p>
                  </div>
                </div>
              </div>

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

                <div>
                  <label className="block text-white font-ubuntu text-lg mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-[#4FFFE3]/20 text-[#4FFFE3] rounded-full text-sm font-ubuntu"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(index)}
                          className="hover:text-white transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    onKeyDown={handleAddTag}
                    placeholder="Type a tag and press Enter"
                    className="w-full px-4 py-3 bg-[#4a4a4a] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#4FFFE3] font-ubuntu"
                  />
                  <p className="text-white/50 text-sm font-ubuntu mt-2">
                    Press Enter to add tags. AI suggested: {formData.tags.join(', ')}
                  </p>
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
                  onClick={currentEditIndex !== null ? handleBackToReview : handleStartOver}
                  className="flex-1 py-4 rounded-full bg-[#4a4a4a] text-white font-ubuntu font-bold text-xl hover:bg-[#555555] transition-colors"
                >
                  {currentEditIndex !== null ? 'Back to Review' : 'Start Over'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold text-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : currentEditIndex !== null ? 'Save Changes' : 'Submit'}
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
