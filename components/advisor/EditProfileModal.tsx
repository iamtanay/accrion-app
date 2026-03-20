'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface EditProfileModalProps {
  client: any
  onClose: () => void
  onSave: (updates: any) => Promise<void>
}

export function EditProfileModal({ client, onClose, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: client.user?.name || '',
    email: client.user?.email || '',
    phone: client.phone || '',
    status: client.status || 'ACTIVE',
    stated_risk_score: client.stated_risk_score || '',
    revealed_risk_score: client.revealed_risk_score || '',
    decision_temperament: client.decision_temperament || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      await onSave(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-secondary border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-fg-primary">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-fg-muted hover:text-fg-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="ACTIVE">Active</option>
                <option value="ONBOARDING">Onboarding</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">
                Stated Risk Score
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.stated_risk_score}
                onChange={(e) => setFormData({ ...formData, stated_risk_score: e.target.value })}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">
                Revealed Risk Score
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.revealed_risk_score}
                onChange={(e) => setFormData({ ...formData, revealed_risk_score: e.target.value })}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fg-secondary mb-2">
                Decision Temperament
              </label>
              <select
                value={formData.decision_temperament}
                onChange={(e) => setFormData({ ...formData, decision_temperament: e.target.value })}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded text-fg-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select...</option>
                <option value="ANALYTICAL">Analytical</option>
                <option value="IMPULSIVE">Impulsive</option>
                <option value="CAUTIOUS">Cautious</option>
                <option value="BALANCED">Balanced</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-bg-tertiary transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-accent text-white rounded hover:bg-accent/90 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
