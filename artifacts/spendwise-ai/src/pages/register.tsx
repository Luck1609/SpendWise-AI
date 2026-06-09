import { useState } from "react";
import { Link } from "wouter";
import { Wallet, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";

function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"];

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? colors[score] : "bg-border"}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className="font-medium text-foreground">{labels[score]}</span>
      </p>
    </div>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${met ? "bg-green-100 dark:bg-green-900/40" : "bg-muted"}`}>
        {met && <Check className="w-2.5 h-2.5" />}
      </div>
      {label}
    </div>
  );
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { theme, setTheme } = useTheme();

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordMismatch = confirm.length > 0 && password !== confirm;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <div className="min-h-screen flex bg-background">
      <button
        className="absolute top-4 right-4 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/10 border-r border-border flex-col justify-between p-12">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          SpendWise AI
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-foreground leading-snug">
              Start your journey<br />to financial clarity.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Join thousands of young professionals who've taken control of their money with SpendWise AI.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: "📊", title: "Smart dashboards", desc: "Visual breakdowns of where your money goes" },
              { icon: "🤖", title: "AI-powered insights", desc: "Personalized tips based on your spending" },
              { icon: "📁", title: "CSV reports", desc: "Export your data anytime, no lock-in" },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 items-start bg-background/60 rounded-xl p-4 border border-border">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <div className="font-semibold text-foreground text-sm">{f.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© 2026 SpendWise AI. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2 font-bold text-xl text-primary mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            SpendWise AI
          </div>

          <Card className="border-border shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
              <CardDescription>Free forever. No credit card required.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="space-y-2 pt-1">
                      <StrengthBar password={password} />
                      <div className="grid grid-cols-2 gap-1">
                        <RequirementItem met={password.length >= 8} label="8+ characters" />
                        <RequirementItem met={/[A-Z]/.test(password)} label="Uppercase letter" />
                        <RequirementItem met={/[0-9]/.test(password)} label="Number" />
                        <RequirementItem met={/[^A-Za-z0-9]/.test(password)} label="Special character" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={`pr-10 ${passwordMismatch ? "border-destructive focus-visible:ring-destructive" : passwordsMatch ? "border-green-500 focus-visible:ring-green-500" : ""}`}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordMismatch && (
                    <p className="text-xs text-destructive">Passwords don't match</p>
                  )}
                  {passwordsMatch && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  By creating an account you agree to our{" "}
                  <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                </p>

                <Button type="submit" className="w-full" disabled={loading || passwordMismatch}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs text-muted-foreground">
                  <span className="bg-card px-3">or sign up with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" type="button" className="gap-2 text-sm">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
                <Button variant="outline" type="button" className="gap-2 text-sm">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
