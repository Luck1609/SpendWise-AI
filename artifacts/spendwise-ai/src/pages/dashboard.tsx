import { useGetDashboardSummary, useGetDashboardTrends, useGetDashboardCategoryBreakdown, useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { ArrowDownRight, ArrowUpRight, Wallet, Activity } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: trends, isLoading: loadingTrends } = useGetDashboardTrends();
  const { data: categories, isLoading: loadingCategories } = useGetDashboardCategoryBreakdown();
  const { data: transactions, isLoading: loadingTransactions } = useListTransactions({ query: { queryKey: ["dashboard-transactions"], limit: 5 } });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your financial overview for {format(new Date(), "MMMM yyyy")}.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">{formatCurrency(summary?.totalBalance || 0)}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold text-primary">{formatCurrency(summary?.monthlyIncome || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold text-destructive">{formatCurrency(summary?.monthlyExpenses || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">{(summary?.savingsRate ?? 0).toFixed(1)}%</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Cash Flow Trend */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Cash Flow Trend</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            {loadingTrends ? (
              <div className="h-[300px] flex items-center justify-center"><Skeleton className="h-[250px] w-[90%]" /></div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [formatCurrency(value), undefined]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="income" name="Income" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCategories ? (
              <div className="h-[300px] flex items-center justify-center"><Skeleton className="h-[200px] w-[200px] rounded-full" /></div>
            ) : (!categories || categories.length === 0) ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data for this month</div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: 'var(--radius)' }}
                    />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {transactions?.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent transactions</p>
              ) : (
                transactions?.items.map((t) => (
                  <div key={t.id} className="flex items-center justify-between border-b border-border last:border-0 pb-4 last:pb-0">
                    <div>
                      <div className="font-medium">{t.categoryName || t.sourceName || "Uncategorized"}</div>
                      <div className="text-sm text-muted-foreground">{format(new Date(t.date), "MMM d, yyyy")} {t.notes ? `— ${t.notes}` : ""}</div>
                    </div>
                    <div className={`font-bold ${t.type === 'income' ? 'text-primary' : 'text-destructive'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
