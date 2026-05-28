import { useState } from "react";
import { useListInsights, useGenerateInsights } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Sparkles, TrendingDown, PiggyBank, AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const iconMap = {
  spending_trend: <TrendingDown className="w-5 h-5" />,
  saving_tip: <PiggyBank className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  summary: <FileText className="w-5 h-5" />
};

const colorMap = {
  spending_trend: "text-blue-500 bg-blue-50 dark:bg-blue-950/50",
  saving_tip: "text-green-500 bg-green-50 dark:bg-green-950/50",
  warning: "text-amber-500 bg-amber-50 dark:bg-amber-950/50",
  summary: "text-purple-500 bg-purple-50 dark:bg-purple-950/50"
};

export default function Insights() {
  const { data: insights, isLoading } = useListInsights();
  const generate = useGenerateInsights();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleGenerate = () => {
    generate.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/insights"] });
        toast({ title: "Insights generated", description: "Your AI financial analysis is ready." });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-muted-foreground mt-1">Smart analysis of your financial habits.</p>
        </div>
        <Button onClick={handleGenerate} disabled={generate.isPending} className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white border-0">
          {generate.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate New Insights
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          [1, 2, 3].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>)
        ) : insights?.length === 0 ? (
          <div className="py-20 text-center border rounded-xl bg-card border-dashed">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No insights yet</h3>
            <p className="text-muted-foreground mt-1 mb-6">Generate insights to see your AI-powered financial analysis.</p>
            <Button variant="outline" onClick={handleGenerate} disabled={generate.isPending}>Generate Now</Button>
          </div>
        ) : (
          insights?.map(insight => (
            <Card key={insight.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: `var(--${insight.type === 'warning' ? 'destructive' : 'primary'})` }}>
              <CardContent className="p-6 flex gap-4">
                <div className={`shrink-0 p-3 rounded-xl h-fit ${colorMap[insight.type as keyof typeof colorMap] || colorMap.summary}`}>
                  {iconMap[insight.type as keyof typeof iconMap] || iconMap.summary}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{insight.title}</h3>
                    <span className="text-xs text-muted-foreground">{format(new Date(insight.generatedAt), "MMM d")}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{insight.message}</p>
                  <div className="pt-2">
                    <Badge variant="secondary" className="capitalize text-xs">
                      {insight.type.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
