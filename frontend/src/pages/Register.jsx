import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function Register() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
      });
      if (!response.ok) {
        throw new Error(t('auth.registerFailed'));
      }
      const data = await response.json();
      login(data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('auth.register')}</h1>
        <p className="mt-2 text-sm text-hud-muted">{t('auth.registerIntro')}</p>
      </div>
      {error && <p className="text-sm text-status-alert">{error}</p>}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" className="block text-sm font-medium">
            {t('auth.username')}
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-hud-border bg-hud-bg px-3 py-2 text-white outline-none focus:border-hud-accent"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            {t('auth.password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-hud-border bg-hud-bg px-3 py-2 text-white outline-none focus:border-hud-accent"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg border border-hud-accent/50 bg-hud-accent/20 py-3 text-sm font-medium hover:bg-hud-accent/30 disabled:opacity-40"
        >
          {loading ? t('auth.registering') : t('auth.register')}
        </button>
      </form>
      <p className="text-center text-sm text-hud-muted">
        {t('auth.haveAccount')}{' '}
        <a href="/login" className="text-hud-accent hover:underline">
          {t('auth.login')}
        </a>
      </p>
    </div>
  );
}
