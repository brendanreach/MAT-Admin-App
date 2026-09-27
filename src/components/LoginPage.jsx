import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mat-google-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
    >
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  )
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    }

    setLoading(false)
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      setMessage(error.message)
      setGoogleLoading(false)
    }
  }

  const busy = loading || googleLoading

  return (
    <div className="mat-login-page">
      <form className="mat-login-card" onSubmit={handleLogin}>
        <img
          src="/mat-logo.jpg"
          alt="Michigan Academy of Taekwondo"
          className="mat-login-logo"
        />

        <h1 className="mat-login-title">Team Portal</h1>
        <p className="mat-login-subtitle">
          Sign in to access team information, discussions, and tournament details.
        </p>

        <button
          type="button"
          className="mat-google-login-button"
          disabled={busy}
          onClick={handleGoogleSignIn}
        >
          <GoogleIcon />
          <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="mat-login-divider" aria-hidden="true">
          <span>or sign in with email</span>
        </div>

        <div className="mat-form-group">
          <label htmlFor="mat-login-email">Email</label>
          <input
            id="mat-login-email"
            className="mat-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
            required
          />
        </div>

        <div className="mat-form-group mat-login-password-group">
          <label htmlFor="mat-login-password">Password</label>
          <input
            id="mat-login-password"
            className="mat-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
            required
          />
        </div>

        {message && (
          <p className="mat-login-error" role="alert">
            {message}
          </p>
        )}

        <button
          type="submit"
          className="mat-login-button"
          disabled={busy}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="mat-login-help">
          Access is limited to approved Northville Martial Arts team accounts.
        </p>
      </form>

      <style>{`
        .mat-google-login-button {
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          margin-top: 20px;
          padding: 10px 16px;
          color: #173957;
          border: 1px solid #c7d8e3;
          border-radius: 10px;
          background: #ffffff;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
          transition: border-color .15s ease, background .15s ease, transform .15s ease;
        }

        .mat-google-login-button:hover:not(:disabled) {
          border-color: #7cb9dc;
          background: #f4faff;
          transform: translateY(-1px);
        }

        .mat-google-login-button:disabled,
        .mat-login-button:disabled {
          cursor: wait;
          opacity: .7;
        }

        .mat-google-icon {
          flex: 0 0 20px;
        }

        .mat-login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 21px 0;
          color: #71879a;
          font-size: 12px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: .035em;
        }

        .mat-login-divider::before,
        .mat-login-divider::after {
          content: '';
          height: 1px;
          flex: 1;
          background: #d9e4eb;
        }

        .mat-login-password-group {
          margin-top: 15px;
        }

        .mat-login-error {
          margin: 16px 0 0;
          padding: 10px 12px;
          color: #921f28;
          border: 1px solid #e7b8bd;
          border-radius: 8px;
          background: #fff1f2;
          font-size: 13px;
        }

        .mat-login-button {
          margin-top: 22px;
        }

        .mat-login-help {
          margin: 16px 0 0;
          color: #71879a;
          font-size: 12px;
          line-height: 1.5;
          text-align: center;
        }

        :root[data-theme='dark'] .mat-google-login-button {
          color: #e8f1f7;
          border-color: #46677a;
          background: #193444;
        }

        :root[data-theme='dark'] .mat-google-login-button:hover:not(:disabled) {
          border-color: #70c9fa;
          background: #203e51;
        }

        :root[data-theme='dark'] .mat-login-divider,
        :root[data-theme='dark'] .mat-login-help {
          color: #b8cbd8;
        }

        :root[data-theme='dark'] .mat-login-divider::before,
        :root[data-theme='dark'] .mat-login-divider::after {
          background: #3f6074;
        }

        :root[data-theme='dark'] .mat-login-error {
          color: #ffc6cb;
          border-color: #75454c;
          background: #44272d;
        }
      `}</style>
    </div>
  )
}

export default LoginPage
