import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, HeartPulse, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    setLoading(true);
    try { await register(name, email, password); navigate('/dashboard', { replace: true }); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-decoration auth-decoration-one" /><div className="auth-decoration auth-decoration-two" />
      <div className="auth-card auth-card-wide">
        <div className="auth-brand"><Brand /></div>
        <div className="auth-icon"><HeartPulse size={25} /></div>
        <span className="eyebrow">START YOUR HEALTH JOURNEY</span>
        <h1>Create your account</h1>
        <p className="auth-subtitle">Your personal space to keep track of the little things that matter.</p>
        <form onSubmit={submit} className="form-stack auth-form">
          <label className="field-label">Full name
            <span className="input-with-icon"><UserRound size={17} /><input autoComplete="name" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required /></span>
          </label>
          <label className="field-label">Email address
            <span className="input-with-icon"><Mail size={17} /><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></span>
          </label>
          <label className="field-label">Password
            <span className="input-with-icon"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required /><button type="button" className="input-action" onClick={() => setShowPassword((show) => !show)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
          </label>
          <label className="field-label">Confirm password
            <span className="input-with-icon"><LockKeyhole size={17} /><input type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></span>
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary button-full" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        <p className="auth-privacy">Your password is encrypted and your readings stay private.</p>
      </div>
    </div>
  );
}
