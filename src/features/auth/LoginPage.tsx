import { Activity, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "../../app/AuthContext";
import { firebaseReady } from "../../lib/firebase";

export function LoginPage() {
  const { signIn, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    clearError();
    void signIn(email, password);
  }

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark"><Activity size={26} strokeWidth={2} /></div>
        <p className="eyebrow">MY GAAAAL’S CYCLE TRACKER</p>
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
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="date-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label className="field-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="date-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="primary-button login-submit" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="privacy-note"><ShieldCheck size={16} /> Your cycle data is private to your account.</p>
      </section>
    </main>
  );
}
