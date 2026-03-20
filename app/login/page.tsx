'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      sessionStorage.setItem('user', JSON.stringify(data))

      if (data.role === 'ADVISOR') {
        router.push('/advisor/dashboard')
      } else {
        router.push('/client/portal')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (type: 'advisor' | 'client') => {
    if (type === 'advisor') {
      setEmail('tanay@accrion.co')
      setPassword('advisor123')
    } else {
      setEmail('arjun.mehta@email.com')
      setPassword('client123')
    }
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px]">
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <h1 className="font-serif text-5xl mb-3 text-fg-primary tracking-tight">
              Accrion.
            </h1>
            <p className="text-fg-secondary text-base">
              Behavioral Financial Advisory Platform
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg-primary">Sign In</h2>
                <p className="text-sm text-fg-muted">Access your account</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-fg-primary mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="w-full px-4 py-3.5 bg-bg-primary border border-border rounded-xl text-fg-primary
                             placeholder:text-fg-muted text-[15px]
                             focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-fg-primary mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full px-4 py-3.5 pr-12 bg-bg-primary border border-border rounded-xl text-fg-primary
                               placeholder:text-fg-muted text-[15px]
                               focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary
                               transition-colors disabled:opacity-50 p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-danger/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">!</span>
                  </div>
                  <div className="flex-1">{error}</div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl transition-all duration-200
                           hover:bg-accent-warm hover:shadow-lg hover:shadow-accent/25
                           active:scale-[0.99]
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent disabled:shadow-none
                           flex items-center justify-center gap-2.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </div>

          {/* Demo Credentials */}
          <div className="bg-bg-secondary/60 backdrop-blur-sm border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-fg-primary">Demo Access</p>
              <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded-md">
                Try it out
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillDemo('advisor')}
                disabled={loading}
                className="p-3 bg-bg-primary hover:bg-bg-tertiary border border-border rounded-lg
                           transition-all duration-200 text-left group disabled:opacity-50"
              >
                <div className="text-xs font-semibold text-accent mb-1.5">Advisor Account</div>
                <div className="text-[11px] font-mono text-fg-muted space-y-0.5">
                  <div className="truncate">tanay@accrion.co</div>
                  <div>advisor123</div>
                </div>
                <div className="text-[10px] text-fg-muted/70 mt-2 group-hover:text-accent transition-colors">
                  Click to fill →
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('client')}
                disabled={loading}
                className="p-3 bg-bg-primary hover:bg-bg-tertiary border border-border rounded-lg
                           transition-all duration-200 text-left group disabled:opacity-50"
              >
                <div className="text-xs font-semibold text-accent-warm mb-1.5">Client Account</div>
                <div className="text-[11px] font-mono text-fg-muted space-y-0.5">
                  <div className="truncate">arjun.mehta@email.com</div>
                  <div>client123</div>
                </div>
                <div className="text-[10px] text-fg-muted/70 mt-2 group-hover:text-accent-warm transition-colors">
                  Click to fill →
                </div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-fg-muted text-xs mt-8">
            © 2026 Accrion Advisory. Secure platform for behavioral financial insights.
          </p>
        </div>
      </div>
    </div>
  )
}
