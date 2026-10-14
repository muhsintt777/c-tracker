import { Activity, ShieldCheck } from "lucide-react";
import { useAuth } from "../../app/AuthContext";
import { firebaseReady } from "../../lib/firebase";

export function LoginPage() {
  const { signIn, loading, error, clearError } = useAuth();

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark"><Activity size={26} strokeWidth={2} /></div>
        <p className="eyebrow">My GAAAAL’S CYCLE TRACKER</p>
        <h1 id="login-title">A little more in tune.</h1>
        <p className="login-description">
          Keep track of your period and get a gentle estimate of what’s ahead.
        </p>
        {!firebaseReady && (
          <div className="notice-box" role="status">
            Firebase isn’t configured yet. Copy <code>.env.example</code> to <code>.env.local</code> and add your Firebase web app settings.
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button
          className="primary-button google-button"
          type="button"
          onClick={() => { clearError(); void signIn(); }}
          disabled={loading}
        >
          <GoogleMark />
          {loading ? "Connecting…" : "Continue with Google"}
        </button>
        <p className="privacy-note"><ShieldCheck size={16} /> Your cycle data is private to your account.</p>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" width="19" height="19">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.72 5.99c4.51-4.16 7.06-10.3 7.06-17.64Z" transform="translate(0 0)" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1-.76-4.59c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19Z" transform="translate(0 0)" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.81l-7.72-5.99c-2.14 1.45-4.89 2.3-8.19 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -4)" />
    </svg>
  );
}
