import { useState } from "react";
import { Link } from "wouter";
import { Wallet, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { theme, setTheme } = useTheme();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
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
          {!sent ? (
            <>
              <CardHeader className="space-y-1 pb-4 text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Forgot your password?</CardTitle>
                <CardDescription>
                  No worries — enter your email and we'll send you reset instructions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {loading ? "Sending…" : "Send reset link"}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 pb-4 text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                  <MailCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl font-bold">Check your inbox</CardTitle>
                <CardDescription>
                  We sent a password reset link to{" "}
                  <span className="font-medium text-foreground">{email}</span>.
                  It expires in 15 minutes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                  <p>Didn't receive it? Check your spam folder, or:</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSent(false);
                      setEmail("");
                    }}
                  >
                    Try a different email
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-primary"
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => setLoading(false), 1200);
                    }}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Resend email
                  </Button>
                </div>
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
