import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const incomeSourcesTable = pgTable("income_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIncomeSourceSchema = createInsertSchema(incomeSourcesTable).omit({ id: true, createdAt: true });
export type InsertIncomeSource = z.infer<typeof insertIncomeSourceSchema>;
export type IncomeSource = typeof incomeSourcesTable.$inferSelect;
