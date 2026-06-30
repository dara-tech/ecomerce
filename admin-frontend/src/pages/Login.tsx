import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const labelClass = 'text-xs font-medium leading-tight text-foreground/80';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const completeLogin = (data: any) => {
    const accessToken = data.accessToken || data.token;
    const { refreshToken, sessionId, ...userData } = data;
    if (!accessToken || !refreshToken) {
      setError('Invalid login response');
      return;
    }
    if (userData.role === 'customer') {
      setError('This account does not have admin panel access.');
      return;
    }
    login(accessToken, refreshToken, userData, sessionId);
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.requires2FA) {
        setRequires2FA(true);
        setTempToken(response.data.tempToken);
        return;
      }
      completeLogin(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await api.post('/auth/2fa/verify-login', {
        tempToken,
        code: twoFactorCode,
      });
      completeLogin(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-card px-3 py-6 sm:px-4 font-sans">
      <div className="mx-auto w-full max-w-sm overflow-hidden border border-border/80 bg-card shadow-xl shadow-black/8">
        <div className="h-1.5 w-full bg-primary" />
        <div className="border-b border-border/80 bg-muted/70 px-4 py-4 text-center">
          <h1 className="text-lg font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            {requires2FA ? 'Enter your authenticator code' : 'Sign in to continue to the admin portal'}
          </p>
        </div>

        <form className="grid gap-4 p-4 sm:p-5" onSubmit={requires2FA ? handle2FASubmit : handleSubmit}>
          {error && (
            <div className="border border-destructive/30 bg-destructive/10 px-3 py-2">
              <p className="text-xs font-medium text-destructive text-center">{error}</p>
            </div>
          )}

          {!requires2FA ? (
            <>
              <div className="grid gap-2">
                <span className={labelClass}>Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    required
                    className="h-10 w-full rounded-none border border-border/80 bg-background pl-10 pr-3 text-sm shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <span className={labelClass}>Password</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                    className="h-10 w-full rounded-none border border-border/80 bg-background py-0 pl-10 pr-10 text-sm shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground transition hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid gap-2">
              <span className={labelClass}>Authentication code</span>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/50" />
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  className="h-10 w-full rounded-none border border-border/80 bg-background pl-10 pr-3 text-sm tracking-widest shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </div>
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground text-left"
                onClick={() => {
                  setRequires2FA(false);
                  setTwoFactorCode('');
                  setTempToken('');
                }}
              >
                ← Back to login
              </button>
            </div>
          )}

          <div className="-mx-4 -mb-4 mt-1 flex flex-col gap-2 border-t border-border/80 bg-muted/25 px-4 py-4 sm:-mx-5 sm:-mb-5 sm:px-5">
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 min-h-10 w-full rounded-none bg-primary text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Please wait…' : requires2FA ? 'Verify' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
