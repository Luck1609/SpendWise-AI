import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, transactionsTable, categoriesTable, incomeSourcesTable } from "@workspace/db";
import {
  GetDashboardSummaryQueryParams,
  GetDashboardSummaryResponse,
  GetDashboardTrendsQueryParams,
  GetDashboardTrendsResponse,
  GetDashboardCategoryBreakdownQueryParams,
  GetDashboardCategoryBreakdownResponse,
  GetDashboardIncomeBySourceQueryParams,
  GetDashboardIncomeBySourceResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthRange(month: string): { start: string; end: string } {
  const [year, mon] = month.split("-").map(Number);
  const start = `${year}-${String(mon).padStart(2, "0")}-01`;
  const lastDay = new Date(year, mon, 0).getDate();
  const end = `${year}-${String(mon).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const queryParams = GetDashboardSummaryQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const month = queryParams.data.month ?? getCurrentMonth();
  const { start, end } = getMonthRange(month);

  const [incomeResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.type, "income"),
        gte(transactionsTable.date, start),
        lte(transactionsTable.date, end)
      )
    );

  const [expenseResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.type, "expense"),
        gte(transactionsTable.date, start),
        lte(transactionsTable.date, end)
      )
    );

  const [allIncomeResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
    .from(transactionsTable)
    .where(eq(transactionsTable.type, "income"));

  const [allExpenseResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
    .from(transactionsTable)
    .where(eq(transactionsTable.type, "expense"));

  const monthlyIncome = Number(incomeResult.total);
  const monthlyExpenses = Number(expenseResult.total);
  const totalBalance = Number(allIncomeResult.total) - Number(allExpenseResult.total);
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  res.json(
    GetDashboardSummaryResponse.parse({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate: Math.max(0, savingsRate),
      month,
    })
  );
});

router.get("/dashboard/trends", async (req, res): Promise<void> => {
  const queryParams = GetDashboardTrendsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const months = queryParams.data.months ?? 6;
  const trends: { month: string; income: number; expenses: number }[] = [];

  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const { start, end } = getMonthRange(month);

    const [inc] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.type, "income"), gte(transactionsTable.date, start), lte(transactionsTable.date, end)));

    const [exp] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)` })
      .from(transactionsTable)
      .where(and(eq(transactionsTable.type, "expense"), gte(transactionsTable.date, start), lte(transactionsTable.date, end)));

    trends.push({ month, income: Number(inc.total), expenses: Number(exp.total) });
  }

  res.json(GetDashboardTrendsResponse.parse(trends));
});

router.get("/dashboard/category-breakdown", async (req, res): Promise<void> => {
  const queryParams = GetDashboardCategoryBreakdownQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const month = queryParams.data.month ?? getCurrentMonth();
  const { start, end } = getMonthRange(month);

  const rows = await db
    .select({
      categoryId: transactionsTable.categoryId,
      categoryName: categoriesTable.name,
      color: categoriesTable.color,
      amount: sql<number>`SUM(${transactionsTable.amount}::numeric)`,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(
      and(
        eq(transactionsTable.type, "expense"),
        gte(transactionsTable.date, start),
        lte(transactionsTable.date, end)
      )
    )
    .groupBy(transactionsTable.categoryId, categoriesTable.name, categoriesTable.color);

  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);

  const breakdown = rows.map((r) => ({
    categoryId: r.categoryId ?? 0,
    categoryName: r.categoryName ?? "Uncategorized",
    color: r.color ?? "#94A3B8",
    amount: Number(r.amount),
    percentage: total > 0 ? (Number(r.amount) / total) * 100 : 0,
  }));

  res.json(GetDashboardCategoryBreakdownResponse.parse(breakdown));
});

router.get("/dashboard/income-by-source", async (req, res): Promise<void> => {
  const queryParams = GetDashboardIncomeBySourceQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const month = queryParams.data.month ?? getCurrentMonth();
  const { start, end } = getMonthRange(month);

  const rows = await db
    .select({
      sourceId: transactionsTable.sourceId,
      sourceName: incomeSourcesTable.name,
      amount: sql<number>`SUM(${transactionsTable.amount}::numeric)`,
    })
    .from(transactionsTable)
    .leftJoin(incomeSourcesTable, eq(transactionsTable.sourceId, incomeSourcesTable.id))
    .where(
      and(
        eq(transactionsTable.type, "income"),
        gte(transactionsTable.date, start),
        lte(transactionsTable.date, end)
      )
    )
    .groupBy(transactionsTable.sourceId, incomeSourcesTable.name);

  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);

  const result = rows.map((r) => ({
    sourceId: r.sourceId ?? 0,
    sourceName: r.sourceName ?? "Other",
    amount: Number(r.amount),
    percentage: total > 0 ? (Number(r.amount) / total) * 100 : 0,
  }));

  res.json(GetDashboardIncomeBySourceResponse.parse(result));
});

export default router;
