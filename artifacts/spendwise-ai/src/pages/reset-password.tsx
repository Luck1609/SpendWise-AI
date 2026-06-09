import { useState } from "react";
import { Link } from "wouter";
import { Wallet, Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
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

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { theme, setTheme } = useTheme();

  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordMismatch = confirm.length > 0 && password !== confirm;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 1500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <button
        className="absolute top-4 right-4 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2 font-bold text-xl text-primary justify-center">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          SpendWise AI
        </div>

        <Card className="border-border shadow-lg">
          {!done ? (
            <>
              <CardHeader className="space-y-1 pb-4 text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
                <CardDescription>
                  Choose a strong password for your account. You'll use it to sign in going forward.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
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
                          {[
                            { met: password.length >= 8, label: "8+ characters" },
                            { met: /[A-Z]/.test(password), label: "Uppercase letter" },
                            { met: /[0-9]/.test(password), label: "Number" },
                            { met: /[^A-Za-z0-9]/.test(password), label: "Special character" },
                          ].map(({ met, label }) => (
                            <div
                              key={label}
                              className={`flex items-center gap-1.5 text-xs ${met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                            >
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${met ? "bg-green-100 dark:bg-green-900/40" : "bg-muted"}`}>
                                {met && <Check className="w-2.5 h-2.5" />}
                              </div>
                              {label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm new password</Label>
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

                  <Button type="submit" className="w-full" disabled={loading || passwordMismatch || !password}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {loading ? "Updating password…" : "Update password"}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 pb-4 text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                  <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl font-bold">Password updated!</CardTitle>
                <CardDescription>
                  Your password has been changed successfully. You can now sign in with your new password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/login">
                  <Button className="w-full">Sign in to your account</Button>
                </Link>
              </CardContent>
            </>
          )}
        </Card>

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
