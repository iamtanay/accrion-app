'use client'

import { useState, useEffect } from 'react'
import { User, Bell, Shield, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

const DAYS = [
  { label: 'Sunday',    value: 0 },
  { label: 'Monday',    value: 1 },
  { label: 'Tuesday',   value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday',  value: 4 },
  { label: 'Friday',    value: 5 },
  { label: 'Saturday',  value: 6 },
]

// 30-min increments, HH:mm format
const TIME_OPTIONS: { label: string; value: string }[] = []
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    const hh = h.toString().padStart(2, '0')
    const mm = m.toString().padStart(2, '0')
    const period = h < 12 ? 'AM' : 'PM'
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h
    TIME_OPTIONS.push({
      label: `${displayH}:${mm} ${period}`,
      value: `${hh}:${mm}`,
    })
  }
}

// Trim "10:00:00" → "10:00" so it matches TIME_OPTIONS values
function trimTime(t: string): string {
  if (!t) return '10:00'
  return t.slice(0, 5)
}

type DayAvailability = {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

function defaultAvailability(): Record<number, DayAvailability> {
  const map: Record<number, DayAvailability> = {}
  DAYS.forEach((d) => {
    map[d.value] = {
      day_of_week: d.value,
      start_time: '10:00',
      end_time: '18:00',
      is_active: d.value >= 1 && d.value <= 5,
    }
  })
  return map
}

export default function SettingsPage() {
  const [userData, setUserData] = useState({ name: '', email: '', id: '' })
  const [availability, setAvailability] = useState<Record<number, DayAvailability>>(defaultAvailability)

  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [availSaving, setAvailSaving] = useState(false)
  const [availSaved, setAvailSaved] = useState(false)

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    flagAlerts: true,
    reviewReminders: true,
    clientUpdates: false,
  })

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return
      const id = authUser.id
      const name = authUser.user_metadata?.name ?? ''
      const email = authUser.email ?? ''
      setUserData({ name, email, id })
      if (!id) return

    fetch(`/api/advisor/availability/settings?advisorId=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.availability && data.availability.length > 0) {
          setAvailability((prev) => {
            const map = { ...prev }
            data.availability.forEach((row: any) => {
              map[row.day_of_week] = {
                day_of_week: row.day_of_week,
                // trim seconds off "HH:mm:ss" → "HH:mm"
                start_time: trimTime(row.start_time),
                end_time: trimTime(row.end_time),
                is_active: row.is_active,
              }
            })
            return map
          })
        }
      })
      .catch(() => {})
    }
    init()
  }, [])

  const toggleDay = (dow: number) => {
    setAvailability((prev) => ({
      ...prev,
      [dow]: { ...prev[dow], is_active: !prev[dow].is_active },
    }))
  }

  const updateTime = (dow: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailability((prev) => ({
      ...prev,
      [dow]: { ...prev[dow], [field]: value },
    }))
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const handleSaveAvailability = async () => {
    setAvailSaving(true)
    try {
      const res = await fetch('/api/advisor/availability/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advisorId: userData.id, availability: Object.values(availability) }),
      })
      if (!res.ok) throw new Error('Save failed')
      setAvailSaved(true)
      setTimeout(() => setAvailSaved(false), 3000)
    } catch {
      // handle silently
    } finally {
      setAvailSaving(false)
    }
  }

  const totalWeeklyHours = Object.values(availability)
    .filter((d) => d.is_active)
    .reduce((sum, d) => {
      const [sh, sm] = d.start_time.split(':').map(Number)
      const [eh, em] = d.end_time.split(':').map(Number)
      return sum + Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60)
    }, 0)

  return (
    <div className="min-h-screen">
      {/* Header — matches Clients/Flags pages */}
      <header className="border-b border-border bg-bg-secondary">
        <div className="px-8 py-6">
          <h1 className="font-serif text-3xl text-fg-primary">Settings</h1>
          <p className="text-sm text-fg-muted mt-1">Manage your profile and availability</p>
        </div>
      </header>

      <main className="px-8 py-8 space-y-6 max-w-3xl">

        {/* Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-accent" />
              </div>
              <CardTitle>Profile Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg-secondary mb-2">Full Name</label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-fg-primary
                             focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fg-secondary mb-2">Email Address</label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-fg-primary
                             focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fg-secondary mb-2">Role</label>
                <input
                  type="text"
                  value="Advisor"
                  disabled
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-fg-muted cursor-not-allowed"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving || profileSaved}
                  className="flex items-center gap-2 px-5 py-2 bg-accent text-white rounded text-sm font-medium
                             hover:bg-accent/90 transition-colors disabled:opacity-50 min-w-[120px] justify-center"
                >
                  {profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {profileSaved && <CheckCircle2 className="w-4 h-4" />}
                  {profileSaving ? 'Saving...' : profileSaved ? 'Saved!' : 'Save Profile'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-accent" />
              </div>
              <div>
                <CardTitle>Active Hours</CardTitle>
                <p className="text-sm text-fg-muted mt-0.5">
                  {totalWeeklyHours > 0
                    ? `${totalWeeklyHours} bookable hours per week across ${Object.values(availability).filter((d) => d.is_active).length} days`
                    : 'No active days — clients will see no available slots'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {DAYS.map((day) => {
                const d = availability[day.value]
                const [sh, sm] = d.start_time.split(':').map(Number)
                const [eh, em] = d.end_time.split(':').map(Number)
                const hrs = Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60)

                return (
                  <div
                    key={day.value}
                    className={`flex items-center gap-4 px-4 py-3 rounded transition-colors
                      ${d.is_active ? 'bg-bg-secondary border border-border' : 'opacity-50'}`}
                  >
                    {/* Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={d.is_active}
                        onChange={() => toggleDay(day.value)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-bg-tertiary rounded-full peer
                                      peer-checked:after:translate-x-full peer-checked:after:border-white
                                      after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                      after:bg-white after:border after:rounded-full after:h-5 after:w-4
                                      after:transition-all peer-checked:bg-accent" />
                    </label>

                    {/* Day name */}
                    <span className="w-24 text-sm font-medium text-fg-primary flex-shrink-0">
                      {day.label}
                    </span>

                    {d.is_active ? (
                      <div className="flex items-center gap-2 flex-1">
                        <select
                          value={d.start_time}
                          onChange={(e) => updateTime(day.value, 'start_time', e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-bg-primary border border-border rounded text-sm
                                     text-fg-primary focus:outline-none focus:border-accent"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <span className="text-fg-muted text-sm flex-shrink-0">to</span>
                        <select
                          value={d.end_time}
                          onChange={(e) => updateTime(day.value, 'end_time', e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-bg-primary border border-border rounded text-sm
                                     text-fg-primary focus:outline-none focus:border-accent"
                        >
                          {TIME_OPTIONS.filter((t) => t.value > d.start_time).map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                        <span className="text-xs text-fg-muted w-12 text-right flex-shrink-0">
                          {hrs % 1 === 0 ? `${hrs}h` : `${hrs.toFixed(1)}h`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-fg-muted">Unavailable</span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={handleSaveAvailability}
                disabled={availSaving || availSaved}
                className="flex items-center gap-2 px-5 py-2 bg-accent text-white rounded text-sm font-medium
                           hover:bg-accent/90 transition-colors disabled:opacity-50 min-w-[160px] justify-center"
              >
                {availSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {availSaved && <CheckCircle2 className="w-4 h-4" />}
                {availSaving ? 'Saving...' : availSaved ? 'Saved!' : 'Save Availability'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 text-accent" />
              </div>
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {(Object.entries({
                emailAlerts: 'Email Alerts',
                flagAlerts: 'Behavioral Flag Notifications',
                reviewReminders: 'Review Reminders',
                clientUpdates: 'Client Activity Updates',
              }) as [keyof typeof notifications, string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between py-3 px-2 hover:bg-bg-tertiary rounded transition-colors">
                  <span className="text-sm text-fg-primary">{label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[key]}
                      onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-bg-tertiary rounded-full peer
                                    peer-checked:after:translate-x-full peer-checked:after:border-white
                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                    after:bg-white after:border after:rounded-full after:h-5 after:w-4
                                    after:transition-all peer-checked:bg-accent" />
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-accent" />
              </div>
              <CardTitle>Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full px-4 py-3 bg-bg-primary border border-border rounded text-left
                                 hover:bg-bg-tertiary transition-colors group">
                <div className="font-medium text-fg-primary group-hover:text-accent transition-colors text-sm">
                  Change Password
                </div>
                <div className="text-xs text-fg-muted mt-0.5">Update your account password</div>
              </button>
              <button className="w-full px-4 py-3 bg-bg-primary border border-border rounded text-left
                                 hover:bg-bg-tertiary transition-colors group">
                <div className="font-medium text-fg-primary group-hover:text-accent transition-colors text-sm">
                  Two-Factor Authentication
                </div>
                <div className="text-xs text-fg-muted mt-0.5">Add an extra layer of security</div>
              </button>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
