import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, labelsTable } from "@workspace/db";
import {
  ListLabelsResponse,
  CreateLabelBody,
  UpdateLabelParams,
  UpdateLabelBody,
  UpdateLabelResponse,
  DeleteLabelParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/labels", async (_req, res): Promise<void> => {
  const labels = await db.select().from(labelsTable).orderBy(labelsTable.name);
  res.json(ListLabelsResponse.parse(labels));
});

router.post("/labels", async (req, res): Promise<void> => {
  const parsed = CreateLabelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [label] = await db.insert(labelsTable).values(parsed.data).returning();
  res.status(201).json(label);
});

router.patch("/labels/:id", async (req, res): Promise<void> => {
  const params = UpdateLabelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateLabelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [label] = await db
    .update(labelsTable)
    .set(parsed.data)
    .where(eq(labelsTable.id, params.data.id))
    .returning();
  if (!label) {
    res.status(404).json({ error: "Label not found" });
    return;
  }
  res.json(UpdateLabelResponse.parse(label));
});

router.delete("/labels/:id", async (req, res): Promise<void> => {
  const params = DeleteLabelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [label] = await db
    .delete(labelsTable)
    .where(eq(labelsTable.id, params.data.id))
    .returning();
  if (!label) {
    res.status(404).json({ error: "Label not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
