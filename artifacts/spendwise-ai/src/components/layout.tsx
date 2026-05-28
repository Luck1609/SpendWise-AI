import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Receipt, 
  Tags, 
  Wallet, 
  Lightbulb, 
  BarChart3, 
  Moon, 
  Sun 
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/categories", label: "Categories & Labels", icon: Tags },
  { href: "/income-sources", label: "Income Sources", icon: Wallet },
  { href: "/insights", label: "AI Insights", icon: Lightbulb },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            SpendWise AI
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 border-b border-border bg-card flex items-center px-4 md:hidden justify-between">
          <div className="font-bold text-primary flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            SpendWise AI
          </div>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
