import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Layout } from "@/components/layout";

import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Categories from "@/pages/categories";
import IncomeSources from "@/pages/income-sources";
import Insights from "@/pages/insights";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/categories" component={Categories} />
        <Route path="/income-sources" component={IncomeSources} />
        <Route path="/insights" component={Insights} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="spendwise-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
