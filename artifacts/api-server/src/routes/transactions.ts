import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { db, transactionsTable, categoriesTable, incomeSourcesTable, labelsTable, transactionLabelsTable } from "@workspace/db";
import {
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  CreateTransactionBody,
  GetTransactionParams,
  GetTransactionResponse,
  UpdateTransactionParams,
  UpdateTransactionBody,
  UpdateTransactionResponse,
  DeleteTransactionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getTransactionWithLabels(id: number) {
  const [tx] = await db
    .select({
      id: transactionsTable.id,
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      categoryId: transactionsTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      sourceId: transactionsTable.sourceId,
      sourceName: incomeSourcesTable.name,
      date: transactionsTable.date,
      notes: transactionsTable.notes,
      createdAt: transactionsTable.createdAt,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .leftJoin(incomeSourcesTable, eq(transactionsTable.sourceId, incomeSourcesTable.id))
    .where(eq(transactionsTable.id, id));

  if (!tx) return null;

  const txLabels = await db
    .select({ id: labelsTable.id, name: labelsTable.name, color: labelsTable.color, createdAt: labelsTable.createdAt })
    .from(transactionLabelsTable)
    .innerJoin(labelsTable, eq(transactionLabelsTable.labelId, labelsTable.id))
    .where(eq(transactionLabelsTable.transactionId, id));

  return { ...tx, amount: parseFloat(tx.amount), labels: txLabels };
}

router.get("/transactions", async (req, res): Promise<void> => {
  const queryParams = ListTransactionsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  const { type, categoryId, startDate, endDate, limit = 50, offset = 0 } = queryParams.data;

  const conditions = [];
  if (type) conditions.push(eq(transactionsTable.type, type));
  if (categoryId) conditions.push(eq(transactionsTable.categoryId, categoryId));
  if (startDate) conditions.push(gte(transactionsTable.date, startDate));
  if (endDate) conditions.push(lte(transactionsTable.date, endDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactionsTable)
    .where(whereClause);

  const txRows = await db
    .select({
      id: transactionsTable.id,
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      categoryId: transactionsTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      sourceId: transactionsTable.sourceId,
      sourceName: incomeSourcesTable.name,
      date: transactionsTable.date,
      notes: transactionsTable.notes,
      createdAt: transactionsTable.createdAt,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .leftJoin(incomeSourcesTable, eq(transactionsTable.sourceId, incomeSourcesTable.id))
    .where(whereClause)
    .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const txIds = txRows.map((t) => t.id);
  let labelsByTx: Record<number, { id: number; name: string; color: string; createdAt: Date }[]> = {};

  if (txIds.length > 0) {
    const allLabels = await db
      .select({
        transactionId: transactionLabelsTable.transactionId,
        id: labelsTable.id,
        name: labelsTable.name,
        color: labelsTable.color,
        createdAt: labelsTable.createdAt,
      })
      .from(transactionLabelsTable)
      .innerJoin(labelsTable, eq(transactionLabelsTable.labelId, labelsTable.id))
      .where(sql`${transactionLabelsTable.transactionId} = ANY(${sql.raw(`ARRAY[${txIds.join(",")}]`)})`);

    for (const row of allLabels) {
      if (!labelsByTx[row.transactionId]) labelsByTx[row.transactionId] = [];
      labelsByTx[row.transactionId].push({ id: row.id, name: row.name, color: row.color, createdAt: row.createdAt });
    }
  }

  const items = txRows.map((tx) => ({
    ...tx,
    amount: parseFloat(tx.amount as string),
    labels: labelsByTx[tx.id] ?? [],
  }));

  res.json(ListTransactionsResponse.parse({ items, total: countResult.count }));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { labelIds, ...txData } = parsed.data as typeof parsed.data & { labelIds?: number[] };

  const [tx] = await db.insert(transactionsTable).values(txData).returning();

  if (labelIds && labelIds.length > 0) {
    await db.insert(transactionLabelsTable).values(
      labelIds.map((labelId) => ({ transactionId: tx.id, labelId }))
    );
  }

  const full = await getTransactionWithLabels(tx.id);
  res.status(201).json(full);
});

router.get("/transactions/:id", async (req, res): Promise<void> => {
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const tx = await getTransactionWithLabels(params.data.id);
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(GetTransactionResponse.parse(tx));
});

router.patch("/transactions/:id", async (req, res): Promise<void> => {
  const params = UpdateTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { labelIds, ...txData } = parsed.data as typeof parsed.data & { labelIds?: number[] };

  const hasUpdate = Object.keys(txData).length > 0;
  if (hasUpdate) {
    const [updated] = await db
      .update(transactionsTable)
      .set(txData)
      .where(eq(transactionsTable.id, params.data.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
  }

  if (labelIds !== undefined) {
    await db.delete(transactionLabelsTable).where(eq(transactionLabelsTable.transactionId, params.data.id));
    if (labelIds.length > 0) {
      await db.insert(transactionLabelsTable).values(
        labelIds.map((labelId) => ({ transactionId: params.data.id, labelId }))
      );
    }
  }

  const full = await getTransactionWithLabels(params.data.id);
  if (!full) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(UpdateTransactionResponse.parse(full));
});

router.delete("/transactions/:id", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [tx] = await db
    .delete(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
