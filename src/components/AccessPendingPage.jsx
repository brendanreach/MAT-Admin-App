import { Clock3, LogOut, ShieldCheck } from 'lucide-react'
import './AccessPendingPage.css'

export default function AccessPendingPage({ email, onLogout }) {
  return (
    <main className="mat-access-pending-page">
      <section className="mat-access-pending-card" aria-labelledby="access-pending-title">
        <img
          src="/mat-logo.jpg"
          alt="Michigan Academy of Taekwondo"
          className="mat-access-pending-logo"
        />

        <div className="mat-access-pending-icon" aria-hidden="true">
          <Clock3 size={34} />
        </div>

        <div className="mat-access-pending-eyebrow">
          <ShieldCheck size={16} />
          Account approval required
        </div>

        <h1 id="access-pending-title">Access Pending</h1>

        <p className="mat-access-pending-summary">
          Your account was authenticated successfully, but access to the
          MAT Competition Team Portal has not yet been granted.
        </p>

        <div className="mat-access-pending-notice">
          <strong>What happens next?</strong>
          <p>
            A team administrator must approve the account, assign the proper
            role, and link the account to the appropriate athlete when needed.
          </p>
        </div>

        <div className="mat-access-pending-account">
          <span>Signed in as</span>
          <strong>{email || 'Authenticated account'}</strong>
        </div>

        <p className="mat-access-pending-help">
          Please contact a Mr. Brendan to request
          access. After approval, sign out and sign back in to refresh the
          account permissions.
        </p>

        <button type="button" className="mat-access-pending-logout" onClick={onLogout}>
          <LogOut size={18} />
          Sign Out
        </button>
      </section>
    </main>
  )
}
