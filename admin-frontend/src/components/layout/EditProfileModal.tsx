import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../ui/Loading';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.put('/auth/profile', {
        name,
        email,
        password: password || undefined,
      });

      // Update local storage and context
      localStorage.setItem('user', JSON.stringify(data));
      // Hacky way to update context without a dedicated update function, forcing a reload or if AuthContext exposes setUser we should use it.
      // But typically we can just reload the page or let the user re-login if we changed important things.
      setSuccess('Profile updated successfully');
      
      setTimeout(() => {
        onClose();
        window.location.reload(); // Quick way to sync auth state
      }, 1000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
          <h3 className="font-semibold text-[15px] tracking-tight">Edit Profile</h3>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-[12px] font-medium rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-500/10 text-emerald-600 text-[12px] font-medium rounded-lg">
              {success}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 text-[13px] bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-9 px-3 text-[13px] bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
            />
          </div>

          <div className="h-px bg-border/50 my-2" />
          
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">New Password <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="w-full h-9 px-3 text-[13px] bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
            />
          </div>

          {password && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[12px] font-medium text-foreground">Confirm New Password</label>
              <input
                type="password"
                required={!!password}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-6 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <LoadingSpinner size="xs" className="border-primary-foreground/30 border-t-primary-foreground" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
