import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { usePlayer } from "@/store/player";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Heart, 
  ListMusic, 
  Download, 
  Sparkles,
  Calendar,
  KeyRound,
  Disc,
  ArrowLeft
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_player/account")({
  head: () => ({
    meta: [
      { title: "Account — MUTUNES" },
      {
        name: "description",
        content: "Manage your MUTUNES profile, subscription and security settings.",
      },
    ],
  }),
  component: AccountPage,
});

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  colorClass 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value: number | string; 
  colorClass: string;
}) {
  return (
    <div className="relative bg-card p-5 rounded-xl border border-border/80 hover:border-foreground/20 transition-all group overflow-hidden select-none wobbly-border">
      {/* Background soft glow on hover */}
      <div className="absolute inset-0 bg-radial-gradient from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-extrabold text-foreground tracking-tight">{value}</span>
          <p className="text-xs text-muted-foreground font-serif mt-1">{label}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${colorClass} bg-opacity-10 border border-current/25 shadow-sm transition-transform group-hover:scale-110 duration-300`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function AccountPage() {
  const user = usePlayer((s) => s.user);
  const likedTracks = usePlayer((s) => s.likedTracksList);
  const customPlaylists = usePlayer((s) => s.customPlaylists);
  const downloadedTracks = usePlayer((s) => s.downloadedTracksList);

  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const formattedJoinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown Date";

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() },
      });

      if (error) throw error;

      if (data.user) {
        usePlayer.setState({ user: data.user });
        localStorage.setItem("mutunes-user", JSON.stringify(data.user));
      }

      toast.success("Profile details updated successfully!");
    } catch (err: any) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.error("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      if (data.user) {
        usePlayer.setState({ user: data.user });
        localStorage.setItem("mutunes-user", JSON.stringify(data.user));
      }

      toast.success("Password changed successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Password update error:", err);
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header & Back Action */}
      <div className="flex flex-col gap-2">
        <Link 
          to="/" 
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold uppercase tracking-wider transition-colors w-fit"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Music
        </Link>
        <div>
          <h1 className="font-display text-4xl font-extrabold text-foreground tracking-tight">Account</h1>
          <p className="font-handwritten text-lg text-primary/80 -mt-1">
            Control your studio-grade credentials and monitor loyalty metrics.
          </p>
        </div>
      </div>

      {/* Library Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          icon={Heart} 
          label="Liked Songs" 
          value={likedTracks.length} 
          colorClass="text-rose-500" 
        />
        <StatCard 
          icon={ListMusic} 
          label="Playlists Created" 
          value={customPlaylists.length} 
          colorClass="text-emerald-500" 
        />
        <StatCard 
          icon={Download} 
          label="Cached Downloads" 
          value={downloadedTracks.length} 
          colorClass="text-blue-500" 
        />
      </div>

      {/* Two Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Profile & Password Settings */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Profile Form */}
          <section className="bg-card p-6 rounded-xl border border-border/80 relative overflow-hidden wobbly-border">
            <div className="absolute top-3 right-4 h-1.5 w-6 bg-muted/40 rounded border border-foreground/5" />
            
            <div className="flex items-center gap-3 mb-6">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-sm">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Profile Information</h2>
                <p className="text-[11px] text-muted-foreground/80 font-serif">Update your public identity details.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/90 font-bold">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/40 pointer-events-none">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full bg-surface-elevated/40 border border-white/5 opacity-60 rounded-xl py-2.5 pl-10 pr-4 text-xs text-muted-foreground outline-none cursor-not-allowed"
                  />
                </div>
                <p className="text-[9px] text-muted-foreground/60 italic font-serif">Email cannot be modified directly.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/90 font-bold">
                  Display Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/60 pointer-events-none">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl py-2.5 pl-10 pr-4 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/40"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-primary-foreground font-semibold rounded-xl py-2.5 text-xs transition-all cursor-pointer active:scale-[0.98] shadow-md disabled:cursor-not-allowed"
              >
                {isUpdatingProfile ? "Saving Details..." : "Save Profile"}
              </button>
            </form>
          </section>

          {/* Password Security Form */}
          <section className="bg-card p-6 rounded-xl border border-border/80 relative overflow-hidden wobbly-border">
            <div className="absolute top-3 right-4 h-1.5 w-6 bg-muted/40 rounded border border-foreground/5" />

            <div className="flex items-center gap-3 mb-6">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-sm">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Change Password</h2>
                <p className="text-[11px] text-muted-foreground/80 font-serif">Secure your account with a unique password.</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/90 font-bold">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/60 pointer-events-none">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl py-2.5 pl-10 pr-4 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/45"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground/90 font-bold">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/60 pointer-events-none">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl py-2.5 pl-10 pr-4 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground/45"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full bg-surface-elevated hover:bg-white/10 border border-border/80 disabled:opacity-50 text-foreground font-semibold rounded-xl py-2.5 text-xs transition-all cursor-pointer active:scale-[0.98] shadow-sm disabled:cursor-not-allowed"
              >
                {isUpdatingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </section>
        </div>

        {/* Right Side: Subscription Status & Member Info */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Subscription Gold Card */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-black p-6 shadow-xl select-none group wobbly-border">
            {/* Pulsing glow background */}
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-amber-500/10 blur-[60px] group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
            
            {/* Header info */}
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-amber-500 border border-amber-500/20">
                  <Sparkles className="h-3 w-3 fill-amber-500/20" /> Active Plan
                </span>
                <h3 className="mt-3 text-xl font-extrabold tracking-tight text-foreground uppercase">
                  Hi-Fi Premium
                </h3>
                <p className="text-[10px] text-muted-foreground/80 font-serif">Studio Quality Audio subscription active.</p>
              </div>
              <Disc className="h-10 w-10 text-amber-500/40 animate-[spin_10s_linear_infinite]" />
            </div>

            {/* Premium Perks details list */}
            <div className="mt-6 space-y-2.5 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground/80 font-serif">Fidelity Level</span>
                <span className="font-bold text-amber-500">24-bit/192kHz Master FLAC</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground/80 font-serif">Subscription Cost</span>
                <span className="font-bold text-foreground">$14.99 / mo</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground/80 font-serif">Offline Storage Limit</span>
                <span className="font-bold text-foreground">Unlimited Cache</span>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-black/30 border border-white/5 px-4 py-3 text-[10px] text-muted-foreground/90 font-serif flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>MUTUNES enthusiast since <strong className="text-foreground">{formattedJoinDate}</strong>.</span>
            </div>
          </div>

          {/* Security & Access Box */}
          <div className="bg-card p-5 rounded-xl border border-border/80 wobbly-border">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">Account Verified</h4>
                <p className="mt-1 text-xs text-muted-foreground/90 leading-normal font-serif">
                  Your email is linked and verified with Supabase. Security triggers monitor database requests to safeguard your library configurations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
