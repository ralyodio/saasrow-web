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
      const response = await fetch(`${apiUrl}/functions/v1/submissions?token=${token}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch submissions')
      }

      setSubmissions(result.data || [])
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
    setShowAddForm(false)
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

  const handleSave = async (isNew: boolean = false) => {
    if (!token) return

    setSaving(true)
    try {
      const endpoint = isNew ? 'POST' : 'PUT'
      const body = isNew
        ? { ...formData, email: submissions[0]?.email }
        : { token, submission: formData }

      const response = await fetch(`${apiUrl}/functions/v1/submissions`, {
        method: endpoint,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save submission')
      }

      await fetchSubmissions()
      setEditingId(null)
      setShowAddForm(false)
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-gray-600">Loading your listings...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-700 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Your Listings</h1>
              <p className="text-gray-600 mt-2">
                {submissions.length === 0
                  ? 'No listings found. Add your first listing below.'
                  : `You have ${submissions.length} listing${submissions.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <button
              onClick={handleAddNew}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add New Listing
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Add New Listing</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSave(true)
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Software">Software</option>
                    <option value="Tool">Tool</option>
                    <option value="Service">Service</option>
                    <option value="Resource">Resource</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="productivity, automation, saas"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Social Links</label>
                    <button
                      type="button"
                      onClick={addSocialLink}
                      className="text-sm text-blue-600 hover:text-blue-700"
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeSocialLink(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Add Listing'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-6">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-xl shadow-sm p-6">
                {editingId === submission.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSave(false)
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="Software">Software</option>
                        <option value="Tool">Tool</option>
                        <option value="Service">Service</option>
                        <option value="Resource">Resource</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="productivity, automation, saas"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Social Links</label>
                        <button
                          type="button"
                          onClick={addSocialLink}
                          className="text-sm text-blue-600 hover:text-blue-700"
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
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <input
                            type="url"
                            placeholder="URL"
                            value={link.url}
                            onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => removeSocialLink(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{submission.title}</h2>
                        <a
                          href={submission.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {submission.url}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
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
                          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{submission.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {submission.category}
                      </span>
                      {submission.tags?.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {submission.social_links && submission.social_links.length > 0 && (
                      <div className="border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Social Links:</h3>
                        <div className="flex flex-wrap gap-2">
                          {submission.social_links.map((link, i) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {link.platform}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-gray-500 mt-4">
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
