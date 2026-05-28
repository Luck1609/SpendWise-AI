import { Router, type IRouter } from "express";
import { desc, eq, and, gte, sql } from "drizzle-orm";
import { db, insightsTable, transactionsTable, categoriesTable } from "@workspace/db";
import { ListInsightsResponse, GenerateInsightsResponse } from "@workspace/api-zod";
import OpenAI from "openai";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getOpenAIClient(): OpenAI | null {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseUrl || !apiKey) return null;
  return new OpenAI({ baseURL: baseUrl, apiKey });
}

router.get("/insights", async (_req, res): Promise<void> => {
  const insights = await db
    .select()
    .from(insightsTable)
    .orderBy(desc(insightsTable.generatedAt))
    .limit(20);
  res.json(ListInsightsResponse.parse(insights));
});

router.post("/insights/generate", async (req, res): Promise<void> => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split("T")[0];

  const [totalIncome] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.type, "income"), gte(transactionsTable.date, startDate)));

  const [totalExpense] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.type, "expense"), gte(transactionsTable.date, startDate)));

  const categoryBreakdown = await db
    .select({
      categoryName: categoriesTable.name,
      amount: sql<number>`SUM(${transactionsTable.amount}::numeric)`,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(and(eq(transactionsTable.type, "expense"), gte(transactionsTable.date, startDate)))
    .groupBy(categoriesTable.name)
    .orderBy(desc(sql`SUM(${transactionsTable.amount}::numeric)`))
    .limit(5);

  const income = Number(totalIncome.total);
  const expenses = Number(totalExpense.total);
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const topCategories = categoryBreakdown.map((r) => `${r.categoryName ?? "Uncategorized"}: $${Number(r.amount).toFixed(2)}`).join(", ");

  const openai = getOpenAIClient();

  let insights: { type: string; title: string; message: string }[] = [];

  if (openai) {
    try {
      const prompt = `You are a personal finance advisor. Analyze the following 30-day financial data and generate exactly 4 concise, actionable insights. Return a JSON array of objects with fields: type (one of: spending_trend, saving_tip, warning, summary), title (short, max 8 words), message (1-2 sentences, specific and actionable).

Financial data:
- Total Income: $${income.toFixed(2)}
- Total Expenses: $${expenses.toFixed(2)}
- Balance: $${(income - expenses).toFixed(2)}
- Savings Rate: ${savingsRate.toFixed(1)}%
- Top expense categories: ${topCategories || "No categorized expenses"}

Return ONLY valid JSON array, no markdown, no explanation.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        max_completion_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const content = completion.choices[0]?.message?.content ?? "[]";
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        insights = parsed.slice(0, 4);
      }
    } catch (err) {
      logger.warn({ err }, "AI insights generation failed, using rule-based fallback");
    }
  }

  if (insights.length === 0) {
    insights = [
      {
        type: "summary",
        title: "30-Day Financial Summary",
        message: `Over the last 30 days, you earned $${income.toFixed(2)} and spent $${expenses.toFixed(2)}, leaving a balance of $${(income - expenses).toFixed(2)}.`,
      },
      {
        type: savingsRate >= 20 ? "saving_tip" : "warning",
        title: savingsRate >= 20 ? "Healthy Savings Rate" : "Low Savings Rate",
        message: savingsRate >= 20
          ? `Your savings rate of ${savingsRate.toFixed(1)}% is strong. Consider putting the surplus into an emergency fund or investments.`
          : `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% — try cutting your top spending category by 10%.`,
      },
      {
        type: "spending_trend",
        title: "Top Spending Categories",
        message: topCategories
          ? `Your biggest expense categories this month: ${topCategories}. Review these areas for potential savings.`
          : "Add categories to your transactions to see a breakdown of where your money is going.",
      },
      {
        type: "saving_tip",
        title: "Track Every Transaction",
        message: "Consistent tracking is the first step to better money habits. Log expenses as they happen to get the most accurate insights.",
      },
    ];
  }

  await db.delete(insightsTable);

  const inserted = await db
    .insert(insightsTable)
    .values(insights.map((i) => ({ type: i.type, title: i.title, message: i.message })))
    .returning();

  res.json(GenerateInsightsResponse.parse(inserted));
});

export default router;
