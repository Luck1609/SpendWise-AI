import { useGetDashboardSummary, useGetDashboardTrends, useGetDashboardCategoryBreakdown, useGetDashboardIncomeBySource, useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";

export default function Reports() {
  const { data: summary, isLoading: loadSum } = useGetDashboardSummary();
  const { data: trends, isLoading: loadTrends } = useGetDashboardTrends({ query: { queryKey: ["reports-trends"] } });
  const { data: catData, isLoading: loadCats } = useGetDashboardCategoryBreakdown();
  const { data: srcData, isLoading: loadSrc } = useGetDashboardIncomeBySource();
  const { data: txData } = useListTransactions({ query: { queryKey: ["reports-tx"], limit: 1000 } });

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const exportCSV = () => {
    if (!txData?.items.length) return;
    
    const headers = ["ID", "Date", "Type", "Amount", "Category/Source", "Notes", "Labels"];
    const rows = txData.items.map(tx => [
      tx.id,
      format(new Date(tx.date), "yyyy-MM-dd"),
      tx.type,
      tx.amount,
      tx.type === 'income' ? tx.sourceName || "" : tx.categoryName || "",
      `"${(tx.notes || "").replace(/"/g, '""')}"`,
      `"${(tx.labels?.map(l => l.name).join(", ") || "")}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `spendwise_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Deep dive into your financial data.</p>
        </div>
        <Button variant="outline" onClick={exportCSV} disabled={!txData?.items.length}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Income vs Expenses (6 Months)</CardTitle>
            <CardDescription>Visual breakdown of your cash flow over time</CardDescription>
          </CardHeader>
          <CardContent>
            {loadTrends ? <div className="h-[350px] flex items-center justify-center"><Skeleton className="h-[300px] w-full" /></div> : (
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                    <RechartsTooltip 
                      formatter={(val: number) => formatCurrency(val)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Current month expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {loadCats ? <div className="h-[300px] flex items-center justify-center"><Skeleton className="h-[250px] w-[250px] rounded-full" /></div> : (!catData?.length) ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No expense data</div>
            ) : (
              <div className="h-[300px] w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="amount" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {catData.map((e, i) => <Cell key={i} fill={e.color || `hsl(var(--chart-${(i%5)+1}))`} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ borderRadius: 'var(--radius)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Sources Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
            <CardDescription>Current month income</CardDescription>
          </CardHeader>
          <CardContent>
            {loadSrc ? <div className="h-[300px] flex items-center justify-center"><Skeleton className="h-[250px] w-[250px] rounded-full" /></div> : (!srcData?.length) ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No income data</div>
            ) : (
              <div className="h-[300px] w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={srcData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="amount" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {srcData.map((e, i) => <Cell key={i} fill={`hsl(var(--chart-${((i+2)%5)+1}))`} />)}
                    </Pie>
                    <RechartsTooltip formatter={(val: number) => formatCurrency(val)} contentStyle={{ borderRadius: 'var(--radius)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
