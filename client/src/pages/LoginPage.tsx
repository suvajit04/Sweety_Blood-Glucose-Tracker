import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, HeartPulse, LockKeyhole, Mail } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/dashboard', { replace: true }); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-decoration auth-decoration-one" /><div className="auth-decoration auth-decoration-two" />
      <div className="auth-card">
        <div className="auth-brand"><Brand /></div>
        <div className="auth-icon"><HeartPulse size={25} /></div>
        <span className="eyebrow">YOUR PERSONAL HEALTH JOURNAL</span>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">A little check-in can make a big difference. Sign in to continue.</p>
        <form onSubmit={submit} className="form-stack auth-form">
          <label className="field-label">Email address
            <span className="input-with-icon"><Mail size={17} /><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></span>
          </label>
          <label className="field-label">Password
            <span className="input-with-icon"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="input-action" onClick={() => setShowPassword((show) => !show)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary button-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="auth-switch">New to Sweety? <Link to="/register">Create an account</Link></p>
        <p className="auth-privacy">Your readings are private and only visible to you.</p>
      </div>
    </div>
  );
}
