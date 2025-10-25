import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

interface SocialLink {
  id?: string
  platform: string
  url: string
}

interface Submission {
  id: string
  title: string
  url: string
  description: string
  category: string
  tags: string[]
  logo: string | null
  image: string | null
  status: string
  created_at: string
  email: string
  tier?: string
  homepage_featured?: boolean
  newsletter_featured?: boolean
  analytics_enabled?: boolean
  social_links?: SocialLink[]
}

export default function ManageListings() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addUrl, setAddUrl] = useState('')
  const [formData, setFormData] = useState<Partial<Submission> & { socialLinks?: SocialLink[] }>({
    title: '',
    url: '',
    description: '',
    category: 'Software',
    tags: [],
    logo: null,
    image: null,
    socialLinks: []
  })
  const [saving, setSaving] = useState(false)
  const [processing, setProcessing] = useState(false)

  const apiUrl = import.meta.env.VITE_SUPABASE_URL

  useEffect(() => {
    if (!token) {
      setError('Invalid management link')
      setLoading(false)
      return
    }

    fetchSubmissions()
  }, [token])

  const fetchSubmissions = async () => {
    try {
      const decodedToken = token ? decodeURIComponent(token) : ''
      const response = await fetch(`${apiUrl}/functions/v1/submissions?token=${encodeURIComponent(decodedToken)}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch submissions')
      }

      setSubmissions(result.data || [])

      // Store email for later use
      if (result.email) {
        sessionStorage.setItem('userEmail', result.email)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (submission: Submission) => {
    setEditingId(submission.id)
    setFormData({
      title: submission.title,
      url: submission.url,
      description: submission.description,
      category: submission.category,
      tags: submission.tags || [],
      logo: submission.logo,
      image: submission.image,
      socialLinks: submission.social_links || []
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      title: '',
      url: '',
      description: '',
      category: 'Software',
      tags: [],
      logo: null,
      image: null,
      socialLinks: []
    })
  }

  const handleAddNew = () => {
    setShowAddForm(true)
    setEditingId(null)
    setAddUrl('')
  }

  const handleProcessUrl = async () => {
    if (!addUrl || !token) return

    setProcessing(true)
    try {
      const response = await fetch(`${apiUrl}/functions/v1/fetch-metadata`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: addUrl }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch metadata')
      }

      // Get email from submissions or session storage
      const email = submissions[0]?.email || sessionStorage.getItem('userEmail')
      if (!email) {
        throw new Error('No email found. Please submit your first listing through the main submission form.')
      }

      const createResponse = await fetch(`${apiUrl}/functions/v1/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: addUrl,
          email: email,
          title: result.metadata.title,
          description: result.metadata.description,
          category: 'Software',
          tags: [],
          logo: result.metadata.logo,
          image: result.metadata.image,
        }),
      })

      if (!createResponse.ok) {
        const createResult = await createResponse.json()
        throw new Error(createResult.error || 'Failed to create submission')
      }

      // Refresh submissions list
      await fetchSubmissions()
      setShowAddForm(false)
      setAddUrl('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process URL')
    } finally {
      setProcessing(false)
    }
  }

  const handleSave = async () => {
    if (!token) return

    setSaving(true)
    try {
      const response = await fetch(`${apiUrl}/functions/v1/submissions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, submission: formData })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save submission')
      }

      await fetchSubmissions()
      setEditingId(null)
      handleCancelEdit()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save submission')
    } finally {
      setSaving(false)
    }
  }

  const addSocialLink = () => {
    setFormData({
      ...formData,
      socialLinks: [...(formData.socialLinks || []), { platform: '', url: '' }]
    })
  }

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const links = [...(formData.socialLinks || [])]
    links[index] = { ...links[index], [field]: value }
    setFormData({ ...formData, socialLinks: links })
  }

  const removeSocialLink = (index: number) => {
    const links = [...(formData.socialLinks || [])]
    links.splice(index, 1)
    setFormData({ ...formData, socialLinks: links })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-800">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-white/70">Loading your listings...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-800">
        <Header />
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto bg-[#2a2a2a] rounded-2xl border border-white/10 p-8 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
            <p className="text-white/70 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold hover:opacity-90 transition-opacity"
            >
              Go Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-800">
      <Header />
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white font-ubuntu">Manage Your Listings</h1>
              <p className="text-white/70 mt-2 font-ubuntu">
                {submissions.length === 0
                  ? 'No listings found. Add your first listing below.'
                  : `You have ${submissions.length} listing${submissions.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <button
              onClick={handleAddNew}
              className="px-8 py-3 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold hover:opacity-90 transition-opacity"
            >
              Add New Listing
            </button>
          </div>

          {showAddForm && (
            <div className="bg-[#2a2a2a] rounded-2xl border border-white/10 p-8 mb-6">
              <h2 className="text-2xl font-bold mb-4 text-white font-ubuntu">Add New Listing</h2>
              <p className="text-white/70 mb-6 font-ubuntu">
                Enter the URL of your software and we'll automatically extract the details for you.
              </p>

              <div className="flex gap-4">
                <input
                  type="url"
                  value={addUrl}
                  onChange={(e) => setAddUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 px-6 py-4 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-[#4FFFE3] focus:border-transparent font-ubuntu text-lg"
                  disabled={processing}
                />
                <button
                  onClick={handleProcessUrl}
                  disabled={processing || !addUrl}
                  className="px-8 py-4 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Add Listing'}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  disabled={processing}
                  className="px-8 py-4 border border-white/20 rounded-full hover:bg-white/5 transition text-white font-ubuntu font-bold disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-[#2a2a2a] rounded-2xl border border-white/10 p-6">
                {editingId === submission.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSave()
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2 font-ubuntu">Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-[#4FFFE3] focus:border-transparent font-ubuntu"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2 font-ubuntu">URL</label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-[#4FFFE3] focus:border-transparent font-ubuntu"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2 font-ubuntu">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-[#4FFFE3] focus:border-transparent font-ubuntu"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2 font-ubuntu">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#4FFFE3] focus:border-transparent font-ubuntu"
                        required
                      >
                        <option value="Software">Software</option>
                        <option value="Tool">Tool</option>
                        <option value="Service">Service</option>
                        <option value="Resource">Resource</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2 font-ubuntu">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={(formData.tags || []).join(', ')}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                          })
                        }
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-[#4FFFE3] focus:border-transparent font-ubuntu"
                        placeholder="productivity, automation, saas"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-white/90 font-ubuntu">Social Links</label>
                        <button
                          type="button"
                          onClick={addSocialLink}
                          className="text-sm text-[#4FFFE3] hover:text-[#E0FF04] font-ubuntu"
                        >
                          + Add Link
                        </button>
                      </div>
                      {(formData.socialLinks || []).map((link, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Platform (e.g., Twitter)"
                            value={link.platform}
                            onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                            className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-[#4FFFE3] focus:border-transparent font-ubuntu"
                          />
                          <input
                            type="url"
                            placeholder="URL"
                            value={link.url}
                            onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                            className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-[#4FFFE3] focus:border-transparent font-ubuntu"
                          />
                          <button
                            type="button"
                            onClick={() => removeSocialLink(index)}
                            className="px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg font-ubuntu"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-8 py-3 rounded-full bg-gradient-to-b from-[#E0FF04] to-[#4FFFE3] text-neutral-800 font-ubuntu font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-8 py-3 border border-white/20 rounded-full hover:bg-white/5 transition text-white font-ubuntu font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-2 font-ubuntu">{submission.title}</h2>
                        <a
                          href={submission.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4FFFE3] hover:underline text-sm font-ubuntu"
                        >
                          {submission.url}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {submission.tier === 'premium' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-cyan-400 text-gray-900">
                            PREMIUM
                          </span>
                        )}
                        {submission.tier === 'featured' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-white">
                            FEATURED
                          </span>
                        )}
                        {(!submission.tier || submission.tier === 'basic') && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-white">
                            FREE TIER
                          </span>
                        )}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            submission.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : submission.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {submission.status}
                        </span>
                        <button
                          onClick={() => handleEdit(submission)}
                          className="px-6 py-2 text-[#4FFFE3] hover:bg-[#4FFFE3]/10 rounded-full transition font-ubuntu font-bold"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    <p className="text-white/70 mb-4 font-ubuntu">{submission.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-white/10 text-white rounded-full text-sm font-ubuntu">
                        {submission.category}
                      </span>
                      {submission.tags?.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-[#4FFFE3]/20 text-[#4FFFE3] rounded-full text-sm font-ubuntu">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {(!submission.tier || submission.tier === 'basic') && (
                      <div className="bg-gradient-to-r from-[#4FFFE3]/10 to-[#E0FF04]/10 border border-[#4FFFE3]/20 rounded-xl p-4 mb-4">
                        <h3 className="font-bold text-white mb-2 flex items-center gap-2 font-ubuntu">
                          <span className="text-[#4FFFE3]">⭐</span> Free Tier Features
                        </h3>
                        <ul className="text-sm text-white/80 space-y-1 font-ubuntu">
                          <li>✓ Up to 5 software listings</li>
                          <li>✓ Featured badge on listings</li>
                          <li>✓ Priority review (2-3 days)</li>
                          <li>✓ Monthly performance analytics</li>
                          <li>✓ Logo in category pages</li>
                          <li>✓ Social media mentions</li>
                        </ul>
                      </div>
                    )}

                    {submission.tier === 'featured' && (
                      <div className="bg-gradient-to-r from-[#4FFFE3]/10 to-[#E0FF04]/10 border border-[#4FFFE3]/20 rounded-xl p-4 mb-4">
                        <h3 className="font-bold text-white mb-2 flex items-center gap-2 font-ubuntu">
                          <span className="text-[#4FFFE3]">⭐</span> Featured Tier
                        </h3>
                        <ul className="text-sm text-white/80 space-y-1 font-ubuntu">
                          <li>✓ Unlimited software listings</li>
                          <li>✓ Featured badge with priority placement</li>
                          <li>✓ Same-day review</li>
                          <li>✓ Advanced analytics dashboard</li>
                          <li>✓ Premium search positioning</li>
                          <li>✓ Logo in category pages</li>
                          <li>✓ Social media mentions</li>
                        </ul>
                      </div>
                    )}

                    {submission.tier === 'premium' && (
                      <div className="bg-gradient-to-r from-[#E0FF04]/10 to-[#4FFFE3]/10 border border-[#E0FF04]/20 rounded-xl p-4 mb-4">
                        <h3 className="font-bold text-white mb-2 flex items-center gap-2 font-ubuntu">
                          <span className="text-[#E0FF04]">⭐</span> Premium Features
                        </h3>
                        <ul className="text-sm text-white/80 space-y-1 font-ubuntu">
                          <li>✓ Unlimited software listings</li>
                          {submission.homepage_featured && <li>✓ Homepage featured spot (ACTIVE)</li>}
                          <li>✓ Same-day review</li>
                          {submission.analytics_enabled && <li>✓ Advanced analytics dashboard</li>}
                          {submission.newsletter_featured && <li>✓ Newsletter feature - 200K+ subscribers (ACTIVE)</li>}
                          <li>✓ Dedicated account manager</li>
                          <li>✓ SEO optimization support</li>
                        </ul>
                      </div>
                    )}

                    {submission.social_links && submission.social_links.length > 0 && (
                      <div className="border-t border-white/10 pt-4">
                        <h3 className="text-sm font-medium text-white/90 mb-2 font-ubuntu">Social Links:</h3>
                        <div className="flex flex-wrap gap-2">
                          {submission.social_links.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#4FFFE3] hover:underline font-ubuntu"
                            >
                              {link.platform}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-white/50 mt-4 font-ubuntu">
                      Submitted: {new Date(submission.created_at).toLocaleDateString()}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
