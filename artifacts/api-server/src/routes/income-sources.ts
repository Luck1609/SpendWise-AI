import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, incomeSourcesTable } from "@workspace/db";
import {
  ListIncomeSourcesResponse,
  CreateIncomeSourceBody,
  UpdateIncomeSourceParams,
  UpdateIncomeSourceBody,
  UpdateIncomeSourceResponse,
  DeleteIncomeSourceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/income-sources", async (_req, res): Promise<void> => {
  const sources = await db.select().from(incomeSourcesTable).orderBy(incomeSourcesTable.name);
  res.json(ListIncomeSourcesResponse.parse(sources));
});

router.post("/income-sources", async (req, res): Promise<void> => {
  const parsed = CreateIncomeSourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [source] = await db.insert(incomeSourcesTable).values(parsed.data).returning();
  res.status(201).json(source);
});

router.patch("/income-sources/:id", async (req, res): Promise<void> => {
  const params = UpdateIncomeSourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateIncomeSourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [source] = await db
    .update(incomeSourcesTable)
    .set(parsed.data)
    .where(eq(incomeSourcesTable.id, params.data.id))
    .returning();
  if (!source) {
    res.status(404).json({ error: "Income source not found" });
    return;
  }
  res.json(UpdateIncomeSourceResponse.parse(source));
});

router.delete("/income-sources/:id", async (req, res): Promise<void> => {
  const params = DeleteIncomeSourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [source] = await db
    .delete(incomeSourcesTable)
    .where(eq(incomeSourcesTable.id, params.data.id))
    .returning();
  if (!source) {
    res.status(404).json({ error: "Income source not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
