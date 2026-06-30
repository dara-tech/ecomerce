import { useState, useEffect } from 'react';
import { 
  Store, 
  CreditCard, 
  Truck, 
  Palette, 
  Mail, 
  Save,
  Plus,
  Trash2,
  DollarSign
} from 'lucide-react';
import api from '../lib/axios';
import {
  PAGE_TAB_GROUP_CLASS,
  PAGE_PRIMARY_BTN_CLASS,
  pageTabButtonClass,
  PAGE_ROOT_CLASS,
  PAGE_BODY_CLASS,
} from '../lib/pageToolbar';
import { PageStickyHeader } from '../components/layout/PageSubTabs';
import Loading from '../components/ui/Loading';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('store');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [settings, setSettings] = useState<any>({
    storeInfo: { name: '', address: '', email: '', phone: '' },
    currency: { default: 'USD', format: '$' },
    taxes: { rate: 0, enabled: false },
    languages: { supported: ['en'], default: 'en' },
    themes: { primaryColor: '#000000', mode: 'light' },
    smtp: { host: '', port: 587, user: '', pass: '' },
    paymentGateways: {
      stripe: { publicKey: '', secretKey: '' },
      paypal: { clientId: '', secret: '' },
    },
    shippingProviders: { methods: [] },
    socialLinks: { facebook: '', instagram: '', twitter: '' },
    logoUrl: '',
    faviconUrl: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      // Merge with default structure to prevent undefined errors
      setSettings((prev: any) => ({ ...prev, ...data }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.put('/settings', settings);
      setSettings((prev: any) => ({ ...prev, ...data }));
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateNested = (category: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const updateDeepNested = (category: string, subCategory: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subCategory]: {
          ...prev[category][subCategory],
          [field]: value
        }
      }
    }));
  };

  const addShippingMethod = () => {
    setSettings((prev: any) => ({
      ...prev,
      shippingProviders: {
        methods: [...(prev.shippingProviders?.methods || []), { name: '', rate: 0 }]
      }
    }));
  };

  const updateShippingMethod = (index: number, field: string, value: any) => {
    const newMethods = [...settings.shippingProviders.methods];
    newMethods[index][field] = value;
    setSettings((prev: any) => ({
      ...prev,
      shippingProviders: { methods: newMethods }
    }));
  };

  const removeShippingMethod = (index: number) => {
    const newMethods = [...settings.shippingProviders.methods];
    newMethods.splice(index, 1);
    setSettings((prev: any) => ({
      ...prev,
      shippingProviders: { methods: newMethods }
    }));
  };

  const tabs = [
    { id: 'store', label: 'Store Information', icon: Store },
    { id: 'payments', label: 'Payments & Currency', icon: CreditCard },
    { id: 'shipping', label: 'Shipping & Taxes', icon: Truck },
    { id: 'themes', label: 'Themes & Branding', icon: Palette },
    { id: 'smtp', label: 'SMTP & Social', icon: Mail },
  ];

  if (loading) {
    return (
      <div className={PAGE_ROOT_CLASS}>
        <Loading variant="page" label="Loading settings…" />
      </div>
    );
  }

  return (
    <div className={PAGE_ROOT_CLASS}>
      <PageStickyHeader
        toolbar={
          <>
            <h1 className="text-sm font-semibold text-foreground shrink-0">Settings</h1>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={PAGE_PRIMARY_BTN_CLASS}
            >
              <Save className="size-3.5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </>
        }
        subTabs={
          <div className={PAGE_TAB_GROUP_CLASS}>
            {tabs.map((tab) => {
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
        <div className="p-3 bg-destructive/10 text-destructive text-[13px] font-medium rounded-lg border border-destructive/20">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[13px] font-medium rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-6 animate-in fade-in duration-300">
        {activeTab === 'store' && (
          <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/80 bg-muted/30">
              <h2 className="text-sm font-semibold text-foreground">Basic Information</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Store Name</label>
                <input type="text" value={settings.storeInfo.name} onChange={e => updateNested('storeInfo', 'name', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
                <input type="email" value={settings.storeInfo.email} onChange={e => updateNested('storeInfo', 'email', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Phone Number</label>
                <input type="text" value={settings.storeInfo.phone} onChange={e => updateNested('storeInfo', 'phone', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Physical Address</label>
                <textarea rows={3} value={settings.storeInfo.address} onChange={e => updateNested('storeInfo', 'address', e.target.value)} className="w-full p-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <>
            <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/80 bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">Currency Settings</h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Default Currency (ISO)</label>
                  <input type="text" value={settings.currency.default} onChange={e => updateNested('currency', 'default', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="USD" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Symbol / Format</label>
                  <input type="text" value={settings.currency.format} onChange={e => updateNested('currency', 'format', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="$" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/80 bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">Stripe Integration</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Public Key</label>
                  <input type="text" value={settings.paymentGateways.stripe.publicKey} onChange={e => updateDeepNested('paymentGateways', 'stripe', 'publicKey', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Secret Key</label>
                  <input type="password" value={settings.paymentGateways.stripe.secretKey} onChange={e => updateDeepNested('paymentGateways', 'stripe', 'secretKey', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/80 bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">PayPal Integration</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Client ID</label>
                  <input type="text" value={settings.paymentGateways.paypal.clientId} onChange={e => updateDeepNested('paymentGateways', 'paypal', 'clientId', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Secret</label>
                  <input type="password" value={settings.paymentGateways.paypal.secret} onChange={e => updateDeepNested('paymentGateways', 'paypal', 'secret', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'shipping' && (
          <>
            <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/80 bg-muted/30 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-foreground">Taxes</h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase">Enable Tax</span>
                  <input type="checkbox" checked={settings.taxes.enabled} onChange={e => updateNested('taxes', 'enabled', e.target.checked)} className="rounded border-border text-primary focus:ring-primary bg-background" />
                </label>
              </div>
              <div className="p-5">
                <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Global Tax Rate (%)</label>
                <input type="number" step="0.01" value={settings.taxes.rate} onChange={e => updateNested('taxes', 'rate', parseFloat(e.target.value) || 0)} className="w-full md:w-1/3 h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" disabled={!settings.taxes.enabled} />
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/80 bg-muted/30 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-foreground">Shipping Providers & Methods</h2>
                <button type="button" onClick={addShippingMethod} className="text-[12px] font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                  <Plus className="size-3.5" /> Add Method
                </button>
              </div>
              <div className="p-5 space-y-3">
                {settings.shippingProviders.methods.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No shipping methods configured.</p>
                ) : (
                  settings.shippingProviders.methods.map((method: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 bg-background p-3 rounded-lg border border-border/50">
                      <div className="flex-1">
                        <input type="text" value={method.name} onChange={e => updateShippingMethod(index, 'name', e.target.value)} placeholder="Method Name (e.g. Standard Shipping)" className="w-full h-8 px-2 text-[13px] bg-transparent border-b border-border/50 focus:border-primary outline-none transition-colors" />
                      </div>
                      <div className="w-32 relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <input type="number" step="0.01" value={method.rate} onChange={e => updateShippingMethod(index, 'rate', parseFloat(e.target.value) || 0)} placeholder="Rate" className="w-full h-8 pl-7 pr-2 text-[13px] bg-transparent border-b border-border/50 focus:border-primary outline-none transition-colors" />
                      </div>
                      <button type="button" onClick={() => removeShippingMethod(index)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'themes' && (
          <>
            <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/80 bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">Branding</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Logo URL</label>
                  <div className="flex gap-4 items-start">
                    <input type="url" value={settings.logoUrl} onChange={e => setSettings({ ...settings, logoUrl: e.target.value })} className="flex-1 h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="https://..." />
                    {settings.logoUrl && (
                      <div className="w-12 h-12 bg-muted/50 rounded-lg border border-border flex items-center justify-center shrink-0">
                        <img src={settings.logoUrl} alt="Logo preview" className="max-w-[40px] max-h-[40px] object-contain" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Favicon URL</label>
                  <div className="flex gap-4 items-start">
                    <input type="url" value={settings.faviconUrl} onChange={e => setSettings({ ...settings, faviconUrl: e.target.value })} className="flex-1 h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="https://..." />
                    {settings.faviconUrl && (
                      <div className="w-9 h-9 bg-muted/50 rounded-lg border border-border flex items-center justify-center shrink-0">
                        <img src={settings.faviconUrl} alt="Favicon preview" className="max-w-[24px] max-h-[24px] object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/80 bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">Theme Configuration</h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Primary Color (Hex)</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={settings.themes.primaryColor} onChange={e => updateNested('themes', 'primaryColor', e.target.value)} className="w-9 h-9 rounded cursor-pointer border-0 p-0 bg-transparent" />
                    <input type="text" value={settings.themes.primaryColor} onChange={e => updateNested('themes', 'primaryColor', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono uppercase" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'smtp' && (
          <>
            <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/80 bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">SMTP Email Server</h2>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">SMTP Host</label>
                  <input type="text" value={settings.smtp.host} onChange={e => updateNested('smtp', 'host', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">SMTP Port</label>
                  <input type="number" value={settings.smtp.port} onChange={e => updateNested('smtp', 'port', parseInt(e.target.value) || 587)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">SMTP Username / Email</label>
                  <input type="text" value={settings.smtp.user} onChange={e => updateNested('smtp', 'user', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">SMTP Password</label>
                  <input type="password" value={settings.smtp.pass} onChange={e => updateNested('smtp', 'pass', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/80 bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">Social Links</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Facebook URL</label>
                  <input type="url" value={settings.socialLinks.facebook} onChange={e => updateNested('socialLinks', 'facebook', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="https://facebook.com/..." />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Instagram URL</label>
                  <input type="url" value={settings.socialLinks.instagram} onChange={e => updateNested('socialLinks', 'instagram', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Twitter URL</label>
                  <input type="url" value={settings.socialLinks.twitter} onChange={e => updateNested('socialLinks', 'twitter', e.target.value)} className="w-full h-9 px-3 text-[13px] bg-background border border-border/80 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" placeholder="https://twitter.com/..." />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
