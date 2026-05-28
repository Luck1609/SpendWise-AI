import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";
import { transactionsTable } from "./transactions";
import { labelsTable } from "./labels";

export const transactionLabelsTable = pgTable(
  "transaction_labels",
  {
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => transactionsTable.id, { onDelete: "cascade" }),
    labelId: integer("label_id")
      .notNull()
      .references(() => labelsTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.transactionId, t.labelId] })]
);

export type TransactionLabel = typeof transactionLabelsTable.$inferSelect;
