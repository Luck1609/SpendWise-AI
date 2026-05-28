import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, BriefcaseBusiness } from "lucide-react";
import { useListIncomeSources, useCreateIncomeSource, useUpdateIncomeSource, useDeleteIncomeSource } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { IncomeSource } from "@workspace/api-client-react/src/generated/api.schemas";

const sourceSchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
});

function SourceForm({ source, onClose }: { source?: IncomeSource | null, onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createSrc = useCreateIncomeSource();
  const updateSrc = useUpdateIncomeSource();

  const form = useForm<z.infer<typeof sourceSchema>>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      name: source?.name || "",
      description: source?.description || "",
    },
  });

  const onSubmit = (values: z.infer<typeof sourceSchema>) => {
    if (source) {
      updateSrc.mutate({ id: source.id, data: values }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/income-sources"] }); toast({ title: "Updated" }); onClose(); }
      });
    } else {
      createSrc.mutate({ data: values }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/income-sources"] }); toast({ title: "Created" }); onClose(); }
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </Form>
  );
}

export default function IncomeSources() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSrc, setEditingSrc] = useState<IncomeSource | null>(null);

  const { data: sources, isLoading } = useListIncomeSources();
  const delSrc = useDeleteIncomeSource();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Income Sources</h1>
          <p className="text-muted-foreground mt-1">Manage where your money comes from.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingSrc(null); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Source</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>{editingSrc ? "Edit" : "Add"} Income Source</DialogTitle></DialogHeader><SourceForm source={editingSrc} onClose={() => setDialogOpen(false)} /></DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [1, 2, 3].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>)
        ) : sources?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl bg-card border-dashed">
            No income sources found. Add your salary or side hustle to start tracking.
          </div>
        ) : (
          sources?.map(s => (
            <Card key={s.id} className="group hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                      <BriefcaseBusiness className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{s.name}</h3>
                      {s.description && <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingSrc(s); setDialogOpen(true); }}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { if(confirm("Delete?")) delSrc.mutate({id: s.id}, { onSuccess: () => { queryClient.invalidateQueries({queryKey: ["/api/income-sources"]}); toast({title:"Deleted"}); } }) }}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
