import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePlayer } from "@/store/player";
import { toast } from "sonner";
import { Eye, EyeOff, Music2, ShieldCheck, Mail, Lock, User, Sparkles } from "lucide-react";
import { z } from "zod";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => loginSearchSchema.parse(search),
  beforeLoad: ({ search }) => {
    const user = usePlayer.getState().user;
    if (user) {
      throw redirect({
        to: search.redirect || "/",
      });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          toast.error("Please enter your name.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) throw error;

        // If automatic login occurs
        if (data.session) {
          toast.success("Welcome to MUTUNES!");
          navigate({ to: search.redirect || "/" });
        } else {
          toast.success("Sign up successful! Please check your email to verify your account.");
          // Enable demo bypass as fallback option
          toast.info("If email confirmation is required, you can use 'Demo Bypass' for instant access.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        toast.success("Logged in successfully!");
        navigate({ to: search.redirect || "/" });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      toast.error(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = () => {
    setLoading(true);
    const demoUser = {
      id: "demo-user-id",
      email: "demo@mutunes.com",
      user_metadata: {
        full_name: "Demo Listener",
      },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };

    usePlayer.setState({ user: demoUser as any });
    if (typeof window !== "undefined") {
      localStorage.setItem("mutunes-user", JSON.stringify(demoUser));
    }

    toast.success("Welcome to MUTUNES! Entered via Demo Bypass.");
    setLoading(false);
    navigate({ to: search.redirect || "/" });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background px-4 py-12 select-none">
      {/* Visual background details */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--primary-foreground)_0%,_transparent_60%)] opacity-5 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main glassmorphic card container */}
      <div className="w-full max-w-[420px] bg-surface/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl p-8 relative z-10 wobbly-border">
        {/* Top Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 mb-3 border border-primary/30">
            <Music2 className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground uppercase">
            Mutunes
          </h1>
          <p className="text-xs text-muted-foreground/80 font-serif mt-1">
            Studio-quality playback, curated for you.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-2 p-1.5 bg-black/40 rounded-xl border border-white/5 mb-6 text-sm shrink-0">
          <button
            onClick={() => {
              setIsSignUp(false);
              setEmail("");
              setPassword("");
            }}
            className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              !isSignUp
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground/80 hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              setEmail("");
              setPassword("");
              setFullName("");
            }}
            className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              isSignUp
                ? "bg-primary text-primary-foreground shadow"
                : "text-muted-foreground/80 hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Forms */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/90 font-bold">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/60 pointer-events-none">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/45"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/90 font-bold">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/60 pointer-events-none">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/45"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground/90 font-bold">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground/60 pointer-events-none">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-xl py-3 pl-10 pr-10 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/45"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground/60 hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl py-3.5 text-sm font-semibold shadow-lg shadow-primary/20 hover:scale-101 active:scale-99 transition-all cursor-pointer flex justify-center items-center gap-2 mt-4"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-[10px] text-muted-foreground/40 uppercase tracking-widest font-semibold">
            Or
          </span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* Demo Bypass Action Button */}
        <button
          onClick={handleDemoBypass}
          disabled={loading}
          className="w-full bg-surface-elevated hover:bg-surface border border-white/5 hover:border-white/10 text-foreground text-xs rounded-xl py-3 font-semibold transition-all hover:scale-101 active:scale-99 cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>Demo Bypass (Instant Access)</span>
        </button>
      </div>
    </div>
  );
}
