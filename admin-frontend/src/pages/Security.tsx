import { useState, useEffect } from 'react';
import {
  Shield, Smartphone, Monitor, History, ScrollText, Users, LogOut, Copy, Check,
} from 'lucide-react';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import {
  PAGE_TAB_GROUP_CLASS,
  PAGE_PRIMARY_BTN_CLASS,
  PAGE_SECONDARY_BTN_CLASS,
  pageTabButtonClass,
  PAGE_ROOT_CLASS,
  PAGE_BODY_CLASS,
} from '../lib/pageToolbar';
import { cn } from '../lib/utils';
import Loading from '../components/ui/Loading';

type Tab = '2fa' | 'sessions' | 'login-history' | 'activity' | 'rbac';

interface Session {
  _id: string;
  deviceLabel: string;
  ip: string;
  lastUsedAt: string;
  createdAt: string;
  isCurrent: boolean;
}

interface LoginEntry {
  _id: string;
  email: string;
  success: boolean;
  failureReason?: string;
  ip: string;
  deviceLabel: string;
  twoFactorUsed: boolean;
  createdAt: string;
}

interface ActivityEntry {
  _id: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  ip: string;
  status: string;
  createdAt: string;
}

const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
  { id: '2fa', label: 'Two-Factor Auth', icon: Smartphone },
  { id: 'sessions', label: 'Sessions', icon: Monitor },
  { id: 'login-history', label: 'Login History', icon: History },
  { id: 'activity', label: 'Activity Logs', icon: ScrollText },
  { id: 'rbac', label: 'Roles & Access', icon: Users },
];

export default function Security() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('2fa');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [enableCode, setEnableCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityEntry[]>([]);
  const [rolesInfo, setRolesInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  useEffect(() => {
    setError('');
    const load = async () => {
      setLoading(true);
      try {
        if (activeTab === 'sessions') {
          const { data } = await api.get('/auth/sessions');
          setSessions(data);
        } else if (activeTab === 'login-history') {
          const { data } = await api.get('/auth/login-history');
          setLoginHistory(data.history);
        } else if (activeTab === 'activity') {
          const { data } = await api.get('/auth/activity-logs');
          setActivityLogs(data.logs);
        } else if (activeTab === 'rbac') {
          const { data } = await api.get('/auth/roles');
          setRolesInfo(data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    if (activeTab !== '2fa') load();
  }, [activeTab]);

  const start2FASetup = async () => {
    setError('');
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setSetupData(data);
      setBackupCodes([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Setup failed');
    }
  };

  const confirmEnable2FA = async () => {
    setError('');
    try {
      const { data } = await api.post('/auth/2fa/enable', { code: enableCode });
      setBackupCodes(data.backupCodes);
      setSetupData(null);
      setEnableCode('');
      await refreshUser();
      flash('Two-factor authentication enabled');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid code');
    }
  };

  const disable2FA = async () => {
    setError('');
    try {
      await api.post('/auth/2fa/disable', { password: disablePassword, code: disableCode });
      setDisablePassword('');
      setDisableCode('');
      await refreshUser();
      flash('Two-factor authentication disabled');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  const revokeSession = async (id: string) => {
    await api.delete(`/auth/sessions/${id}`);
    setSessions((s) => s.filter((x) => x._id !== id));
    flash('Session revoked');
  };

  const logoutAll = async () => {
    await api.post('/auth/logout-all');
    setSessions((s) => s.filter((x) => x.isCurrent));
    flash('All other sessions signed out');
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={<h1 className="text-sm font-semibold text-foreground">Security</h1>}
        subTabs={
          <div className={PAGE_TAB_GROUP_CLASS}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={pageTabButtonClass(activeTab === tab.id)}
                >
                  <Icon className="size-3.5 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        }
      />

      <div className={PAGE_BODY_CLASS}>
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-[13px] rounded-lg border border-destructive/20">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-emerald-500/10 text-emerald-600 text-[13px] rounded-lg border border-emerald-500/20">{success}</div>
      )}

      {activeTab === '2fa' && (
        <div className="bg-card rounded-xl border border-border/80 shadow-sm p-5 space-y-4 max-w-2xl">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Shield className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Two-Factor Authentication (2FA)</h2>
              <p className="text-[13px] text-muted-foreground mt-1">
                Status:{' '}
                <span className={cn('font-medium', user?.twoFactorEnabled ? 'text-emerald-600' : 'text-amber-600')}>
                  {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </p>
            </div>
          </div>

          {!user?.twoFactorEnabled && !setupData && (
            <button type="button" onClick={start2FASetup} className={PAGE_PRIMARY_BTN_CLASS}>
              Set up 2FA
            </button>
          )}

          {setupData && (
            <div className="space-y-3 border border-border/80 rounded-lg p-4 bg-muted/20">
              <p className="text-[13px] text-muted-foreground">
                Add this secret to Google Authenticator, Authy, or 1Password:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[12px] font-mono bg-background border border-border/80 rounded-md px-3 py-2 break-all">
                  {setupData.secret}
                </code>
                <button type="button" onClick={copySecret} className={PAGE_SECONDARY_BTN_CLASS}>
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground break-all">URI: {setupData.otpauthUrl}</p>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Verify code</label>
                  <input
                    value={enableCode}
                    onChange={(e) => setEnableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="mt-1 w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md"
                  />
                </div>
                <button type="button" onClick={confirmEnable2FA} className={PAGE_PRIMARY_BTN_CLASS}>
                  Enable
                </button>
              </div>
            </div>
          )}

          {backupCodes.length > 0 && (
            <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-4">
              <p className="text-[13px] font-medium text-amber-700 mb-2">Save these backup codes — shown once:</p>
              <div className="grid grid-cols-2 gap-2 font-mono text-[12px]">
                {backupCodes.map((c) => (
                  <span key={c} className="bg-background px-2 py-1 rounded border">{c}</span>
                ))}
              </div>
            </div>
          )}

          {user?.twoFactorEnabled && (
            <div className="space-y-3 border-t border-border/80 pt-4">
              <p className="text-[13px] font-medium">Disable 2FA</p>
              <input
                type="password"
                placeholder="Password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md"
              />
              <input
                placeholder="Authenticator or backup code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md"
              />
              <button type="button" onClick={disable2FA} className={PAGE_SECONDARY_BTN_CLASS}>
                Disable 2FA
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/80 flex justify-between items-center">
            <h2 className="text-sm font-semibold">Active sessions</h2>
            <button type="button" onClick={logoutAll} className={PAGE_SECONDARY_BTN_CLASS}>
              <LogOut className="size-3.5" /> Sign out others
            </button>
          </div>
          {loading ? (
            <Loading variant="inline" label="Loading…" className="p-8" />
          ) : sessions.length === 0 ? (
            <p className="p-8 text-center text-muted-foreground text-[13px]">No active sessions</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {sessions.map((s) => (
                <li key={s._id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium">{s.deviceLabel}</p>
                    <p className="text-[11px] text-muted-foreground">{s.ip} · Last active {new Date(s.lastUsedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.isCurrent && (
                      <span className="text-[10px] uppercase font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Current</span>
                    )}
                    {!s.isCurrent && (
                      <button type="button" onClick={() => revokeSession(s._id)} className="text-[12px] text-destructive hover:underline">
                        Revoke
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'login-history' && (
        <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 font-medium text-[10px] uppercase text-muted-foreground">Date</th>
                  <th className="px-4 py-3 font-medium text-[10px] uppercase text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-[10px] uppercase text-muted-foreground">Device</th>
                  <th className="px-4 py-3 font-medium text-[10px] uppercase text-muted-foreground">IP</th>
                  <th className="px-4 py-3 font-medium text-[10px] uppercase text-muted-foreground">2FA</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((h) => (
                  <tr key={h._id} className="border-t border-border/40">
                    <td className="px-4 py-3 text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={cn('font-medium', h.success ? 'text-emerald-600' : 'text-destructive')}>
                        {h.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{h.deviceLabel}</td>
                    <td className="px-4 py-3 font-mono">{h.ip || '—'}</td>
                    <td className="px-4 py-3">{h.twoFactorUsed ? 'Yes' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 font-medium text-[10px] uppercase text-muted-foreground">Time</th>
                  <th className="px-4 py-3 font-medium text-[10px] uppercase text-muted-foreground">User</th>
                  <th className="px-4 py-3 font-medium text-[10px] uppercase text-muted-foreground">Action</th>
                  <th className="px-4 py-3 font-medium text-[10px] uppercase text-muted-foreground">IP</th>
                  <th className="px-4 py-3 font-medium text-[10px] uppercase text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log) => (
                  <tr key={log._id} className="border-t border-border/40">
                    <td className="px-4 py-3 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{log.userEmail || '—'}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">{log.action}</td>
                    <td className="px-4 py-3 font-mono">{log.ip || '—'}</td>
                    <td className="px-4 py-3 capitalize">{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rbac' && rolesInfo && (
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(rolesInfo.rolePermissions as Record<string, string[]>).map(([role, perms]) => (
            <div key={role} className="bg-card rounded-xl border border-border/80 shadow-sm p-4">
              <h3 className="text-sm font-semibold capitalize mb-2">{role}</h3>
              <p className="text-[11px] text-muted-foreground mb-3">{perms.length} permissions</p>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {perms.map((p) => (
                  <li key={p} className="text-[11px] font-mono text-muted-foreground">{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
