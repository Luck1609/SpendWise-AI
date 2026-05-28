import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Search, Filter, Pencil, Trash2 } from "lucide-react";
import { useListTransactions, useDeleteTransaction, useCreateTransaction, useUpdateTransaction, useListCategories, useListLabels, useListIncomeSources, useGetTransaction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@workspace/api-client-react/src/generated/api.schemas";

const formSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive(),
  categoryId: z.coerce.number().optional(),
  sourceId: z.coerce.number().optional(),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  labelIds: z.array(z.number()).optional(),
});

function TransactionForm({ 
  transaction, 
  onClose 
}: { 
  transaction?: Transaction | null, 
  onClose: () => void 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  
  const { data: categories } = useListCategories();
  const { data: sources } = useListIncomeSources();
  const { data: labels } = useListLabels();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: transaction?.type || "expense",
      amount: transaction?.amount || 0,
      categoryId: transaction?.categoryId || undefined,
      sourceId: transaction?.sourceId || undefined,
      date: transaction?.date ? format(new Date(transaction.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      notes: transaction?.notes || "",
      labelIds: transaction?.labels?.map(l => l.id) || [],
    },
  });

  const type = form.watch("type");

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      ...values,
      categoryId: values.categoryId || null,
      sourceId: type === 'income' ? values.sourceId || null : null,
      notes: values.notes || undefined,
      labelIds: values.labelIds || undefined,
    };

    if (transaction) {
      updateTx.mutate({ id: transaction.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
          toast({ title: "Transaction updated" });
          onClose();
        }
      });
    } else {
      createTx.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
          toast({ title: "Transaction added" });
          onClose();
        }
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === 'expense' ? (
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() || ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.filter(c => c.type === 'expense' || c.type === 'both').map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="sourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Income Source</FormLabel>
                  <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() || ""}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sources?.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input placeholder="Optional notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createTx.isPending || updateTx.isPending}>
            {transaction ? "Update" : "Add"} Transaction
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Transactions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  const { data, isLoading } = useListTransactions({ query: { queryKey: ["/api/transactions"] } });
  const deleteTx = useDeleteTransaction();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteTx.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
          toast({ title: "Transaction deleted" });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">Manage your income and expenses.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingTx(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Transaction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTx ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
            </DialogHeader>
            <TransactionForm transaction={editingTx} onClose={() => { setIsDialogOpen(false); setEditingTx(null); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category/Source</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No transactions found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">
                    {format(new Date(tx.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={tx.type === 'income' ? 'text-primary border-primary/20 bg-primary/5' : 'text-destructive border-destructive/20 bg-destructive/5'}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tx.type === 'income' ? tx.sourceName || "—" : tx.categoryName || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {tx.notes || "—"}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-primary' : ''}`}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleEdit(tx)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(tx.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
