import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Send } from 'lucide-react';
import api from '../lib/axios';
import { opsInputClass, opsLabelClass } from '../lib/opsUi';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import { PAGE_TOOLBAR_ROW_CLASS, PAGE_TAB_GROUP_CLASS, pageTabButtonClass, PAGE_PRIMARY_BTN_CLASS, PAGE_ROOT_CLASS, PAGE_BODY_CLASS } from '../lib/pageToolbar';

type Tab = 'inbox' | 'settings';

const TYPE_LABELS: Record<string, string> = {
  new_order: 'New order',
  refund_request: 'Refund request',
  low_stock: 'Low stock',
  new_customer: 'New customer',
  system: 'System',
};

export default function Notifications() {
  const [tab, setTab] = useState<Tab>('inbox');
  const [inbox, setInbox] = useState<{ items: any[]; unread: number }>({ items: [], unread: 0 });
  const [settings, setSettings] = useState<any>({});

  const loadInbox = () => api.get('/ops/notifications').then((r) => setInbox(r.data)).catch(() => setInbox({ items: [], unread: 0 }));
  const loadSettings = () => api.get('/ops/notifications/settings').then((r) => setSettings(r.data)).catch(() => {});

  useEffect(() => {
    if (tab === 'inbox') loadInbox();
    else loadSettings();
  }, [tab]);

  const markRead = async (id: string) => {
    await api.put(`/ops/notifications/${id}/read`);
    loadInbox();
  };

  const saveSettings = async () => {
    await api.put('/ops/notifications/settings', settings);
    alert('Notification settings saved');
  };

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={
          <div className={PAGE_TOOLBAR_ROW_CLASS}>
            <h1 className="text-sm font-semibold flex items-center gap-2"><Bell className="size-4" /> Notifications</h1>
            {inbox.unread > 0 && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-none">{inbox.unread} unread</span>}
          </div>
        }
        subTabs={
          <div className={PAGE_TAB_GROUP_CLASS}>
            <button type="button" className={pageTabButtonClass(tab === 'inbox')} onClick={() => setTab('inbox')}>Real-time Inbox</button>
            <button type="button" className={pageTabButtonClass(tab === 'settings')} onClick={() => setTab('settings')}>Channels & Alerts</button>
          </div>
        }
      />

      <div className={PAGE_BODY_CLASS}>
        {tab === 'inbox' && (
          <>
            <button type="button" className="text-xs text-primary font-medium" onClick={() => api.put('/ops/notifications/all/read').then(loadInbox)}>Mark all read</button>
            {inbox.items.map((n) => (
              <div key={n._id} className={`bg-card border rounded-none p-4 ${n.isRead ? 'border-border/60 opacity-70' : 'border-primary/30'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground">{TYPE_LABELS[n.type] || n.type}</span>
                    <p className="font-semibold text-sm mt-0.5">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.isRead && <button type="button" className="text-xs text-primary shrink-0" onClick={() => markRead(n._id)}>Mark read</button>}
                </div>
              </div>
            ))}
            {!inbox.items.length && <p className="text-muted-foreground text-sm">No notifications yet.</p>}
          </>
        )}

        {tab === 'settings' && (
          <div className="max-w-lg bg-card border border-border/80 rounded-none p-5 space-y-5">
            <section>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Alert types</p>
              {[
                ['notifyNewOrder', 'New order'],
                ['notifyRefundRequest', 'Refund request'],
                ['notifyLowStock', 'Low stock'],
                ['notifyNewCustomer', 'New customer'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between py-2 text-sm">
                  {label}
                  <input type="checkbox" checked={!!settings[key]} onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })} />
                </label>
              ))}
            </section>
            <section>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Channels</p>
              <label className="flex items-center gap-2 py-2 text-sm"><Mail className="size-4" /> Email <input type="checkbox" className="ml-auto" checked={!!settings.emailEnabled} onChange={(e) => setSettings({ ...settings, emailEnabled: e.target.checked })} /></label>
              <label className="flex items-center gap-2 py-2 text-sm"><MessageSquare className="size-4" /> SMS <input type="checkbox" className="ml-auto" checked={!!settings.smsEnabled} onChange={(e) => setSettings({ ...settings, smsEnabled: e.target.checked })} /></label>
              <label className="flex items-center gap-2 py-2 text-sm"><Send className="size-4" /> Telegram <input type="checkbox" className="ml-auto" checked={!!settings.telegramEnabled} onChange={(e) => setSettings({ ...settings, telegramEnabled: e.target.checked })} /></label>
              {settings.telegramEnabled && (
                <div className="mt-2"><label className={opsLabelClass}>Telegram Chat ID</label><input className={opsInputClass} value={settings.telegramChatId || ''} onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })} /></div>
              )}
            </section>
            <div><label className={opsLabelClass}>Low stock threshold</label><input type="number" className={opsInputClass} value={settings.lowStockThreshold ?? 5} onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })} /></div>
            <button type="button" className={PAGE_PRIMARY_BTN_CLASS} onClick={saveSettings}>Save Settings</button>
          </div>
        )}
      </div>
    </div>
  );
}
