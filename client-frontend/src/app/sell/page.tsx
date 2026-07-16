"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, TrendingUp, ShieldCheck, Globe, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { InlineLoader } from "@/components/ui/PageLoader";

const authLabelClass = "text-[13px] font-semibold text-foreground/80";
const authInputClass =
  "h-11 rounded-xl border-border/60 bg-muted/20 px-4 text-[15px] placeholder:text-muted-foreground/50 hover:border-border focus:border-foreground focus:ring-1 focus:ring-foreground transition-all";

export default function SellPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [newVendorAuth, setNewVendorAuth] = useState<any>(null);

  const { user, login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res;
      if (user) {
        // User already logged in, just create the store
        res = await fetch(`${getApiUrl()}/vendor/create-store`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}` 
          },
          body: JSON.stringify({ storeName, storeDescription }),
        });
      } else {
        // Create new user and store
        res = await fetch(`${getApiUrl()}/vendor/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, storeName, storeDescription }),
        });
      }
      const data = await res.json();

      if (res.ok && data.vendor) {
        // Log the user in on the client side
        const authData = {
          _id: data.vendor._id,
          name: data.vendor.name,
          email: data.vendor.email,
          role: data.vendor.role,
          isAdmin: data.vendor.role === "admin" || data.vendor.isAdmin === true,
          token: data.vendor.token,
          accessToken: data.vendor.token,
        };
        login(authData);
        setNewVendorAuth(authData);
        setSuccess(true);
        toast.success("Store created successfully!");
      } else {
        setError(data.message || "Failed to register store.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[40%] -left-[20%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center max-w-6xl mx-auto">
          
          {/* Left Column: Copy & Features */}
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                <Store className="w-3.5 h-3.5" /> Vendor Program
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Sell with us. <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                  Reach millions.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
                Join our rapidly growing marketplace. Set up your store in minutes, tap into our massive customer base, and take your business to the next level.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <FeatureCard 
                icon={Globe} 
                title="Global Audience" 
                description="Get your products in front of millions of active shoppers." 
              />
              <FeatureCard 
                icon={TrendingUp} 
                title="Low Commissions" 
                description="Keep more of what you earn with our competitive rates." 
              />
              <FeatureCard 
                icon={ShieldCheck} 
                title="Secure Payments" 
                description="Fast, reliable, and guaranteed payouts direct to you." 
              />
              <FeatureCard 
                icon={Store} 
                title="Storefront Tools" 
                description="Powerful analytics and management tools included." 
              />
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="relative w-full max-w-md mx-auto lg:max-w-none">
            {/* Glassmorphism Card */}
            <div className="relative rounded-[2rem] border border-border bg-card/60 backdrop-blur-2xl shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 pointer-events-none" />
              
              <div className="relative p-6 sm:p-10">
                {success ? (
                  <div className="text-center py-10 space-y-6">
                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Welcome aboard!</h2>
                    <p className="text-muted-foreground text-lg">
                      Your store has been created successfully. You can now access your vendor dashboard to start adding products.
                    </p>
                    <div className="pt-6">
                      <a 
                        href={`${process.env.NEXT_PUBLIC_ADMIN_URL || 'https://107-175-91-211.sslip.io'}/login?token=${newVendorAuth?.token}&user=${encodeURIComponent(JSON.stringify(newVendorAuth))}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-foreground text-background font-semibold text-lg hover:scale-105 transition-transform active:scale-95 shadow-xl"
                      >
                        Go to Dashboard <ArrowRight className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold tracking-tight">
                        {user ? "Set up your Store" : "Create your Store"}
                      </h2>
                      <p className="text-muted-foreground mt-1">
                        {user ? `Welcome back, ${user.name}! Fill out your store details below.` : "Fill out the details below to get started."}
                      </p>
                    </div>

                    {error && (
                      <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Personal Details - Only show if NOT logged in */}
                      {!user && (
                        <>
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="name" className={authLabelClass}>Full Name</Label>
                              <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={authInputClass}
                                placeholder="John Doe"
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="email" className={authLabelClass}>Email Address</Label>
                              <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={authInputClass}
                                placeholder="john@example.com"
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="password" className={authLabelClass}>Password</Label>
                              <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={authInputClass}
                                placeholder="Min. 8 characters"
                                required
                                minLength={8}
                              />
                            </div>
                          </div>
                          <hr className="border-border/60" />
                        </>
                      )}

                      {/* Store Details */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="storeName" className={authLabelClass}>Store Name</Label>
                          <Input
                            id="storeName"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className={authInputClass}
                            placeholder="e.g. Acme Electronics"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="storeDesc" className={authLabelClass}>Store Description (Optional)</Label>
                          <textarea
                            id="storeDesc"
                            value={storeDescription}
                            onChange={(e) => setStoreDescription(e.target.value)}
                            className="w-full min-h-[100px] rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-[15px] placeholder:text-muted-foreground/50 hover:border-border focus:border-foreground focus:ring-1 focus:ring-foreground transition-all outline-none resize-y"
                            placeholder="What are you selling?"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-12 mt-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] flex items-center justify-center"
                      >
                        {loading ? <InlineLoader /> : "Register Store"}
                      </button>

                      <p className="text-center text-[12px] text-muted-foreground mt-4">
                        By registering, you agree to our <Link href="#" className="underline hover:text-foreground">Terms of Service</Link> and <Link href="#" className="underline hover:text-foreground">Seller Agreement</Link>.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <div className="group p-5 rounded-2xl bg-card border border-border/40 hover:border-border/80 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
