import {
  useState,
} from 'react'

import { supabase } from '../lib/supabase.js'

function LoginPage() {
  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState('')

  async function handleLogin(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) {
      setMessage(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="mat-login-page">

      <form
        className="mat-login-card"
        onSubmit={handleLogin}
      >

        <img
          src="/mat-logo.jpg"
          alt="Michigan Academy of Taekwondo"
          className="mat-login-logo"
        />

        <h1 className="mat-login-title">
          MAT Admin
        </h1>

        <p className="mat-login-subtitle">
          Administrator Login
        </p>

        <div className="mat-form-group">
          <label>
            Email
          </label>

          <input
            className="mat-input"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            required
          />
        </div>

        <div
          className="mat-form-group"
          style={{
            marginTop: '15px',
          }}
        >
          <label>
            Password
          </label>

          <input
            className="mat-input"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            required
          />
        </div>

        {message && (
          <p
            style={{
              color: '#a01c1c',
            }}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          className="mat-login-button"
          disabled={loading}
          style={{
            marginTop: '22px',
          }}
        >
          {loading
            ? 'Signing in...'
            : 'Sign In'}
        </button>

      </form>

    </div>
  )
}

export default LoginPage