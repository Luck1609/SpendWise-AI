import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useListLabels, useCreateLabel, useUpdateLabel, useDeleteLabel } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Category, Label } from "@workspace/api-client-react/src/generated/api.schemas";

const catSchema = z.object({
  name: z.string().min(1, "Name required"),
  color: z.string().min(1, "Color required"),
  type: z.enum(["income", "expense", "both"]),
});

const labelSchema = z.object({
  name: z.string().min(1, "Name required"),
  color: z.string().min(1, "Color required"),
});

function CategoryForm({ cat, onClose }: { cat?: Category | null, onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();

  const form = useForm<z.infer<typeof catSchema>>({
    resolver: zodResolver(catSchema),
    defaultValues: {
      name: cat?.name || "",
      color: cat?.color || "#3B82F6",
      type: cat?.type || "expense",
    },
  });

  const onSubmit = (values: z.infer<typeof catSchema>) => {
    if (cat) {
      updateCat.mutate({ id: cat.id, data: values }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/categories"] }); toast({ title: "Updated" }); onClose(); }
      });
    } else {
      createCat.mutate({ data: values }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/categories"] }); toast({ title: "Created" }); onClose(); }
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="color" render={({ field }) => (
            <FormItem><FormLabel>Color</FormLabel><FormControl><div className="flex gap-2"><Input type="color" className="w-12 p-1 h-10" {...field} /><Input {...field} /></div></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="expense">Expense</SelectItem><SelectItem value="income">Income</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent></Select><FormMessage /></FormItem>
          )} />
        </div>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </Form>
  );
}

function LabelForm({ label, onClose }: { label?: Label | null, onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createLab = useCreateLabel();
  const updateLab = useUpdateLabel();

  const form = useForm<z.infer<typeof labelSchema>>({
    resolver: zodResolver(labelSchema),
    defaultValues: { name: label?.name || "", color: label?.color || "#3B82F6" },
  });

  const onSubmit = (values: z.infer<typeof labelSchema>) => {
    if (label) {
      updateLab.mutate({ id: label.id, data: values }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/labels"] }); toast({ title: "Updated" }); onClose(); }
      });
    } else {
      createLab.mutate({ data: values }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/labels"] }); toast({ title: "Created" }); onClose(); }
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="color" render={({ field }) => (
          <FormItem><FormLabel>Color</FormLabel><FormControl><div className="flex gap-2"><Input type="color" className="w-12 p-1 h-10" {...field} /><Input {...field} /></div></FormControl><FormMessage /></FormItem>
        )} />
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div>
      </form>
    </Form>
  );
}

export default function Categories() {
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  
  const [labDialogOpen, setLabDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Label | null>(null);

  const { data: categories, isLoading: catLoading } = useListCategories();
  const { data: labels, isLoading: labLoading } = useListLabels();
  
  const delCat = useDeleteCategory();
  const delLab = useDeleteLabel();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories & Labels</h1>
        <p className="text-muted-foreground mt-1">Organize your transactions.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Categories Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Main grouping for transactions</CardDescription>
            </div>
            <Dialog open={catDialogOpen} onOpenChange={(open) => { setCatDialogOpen(open); if (!open) setEditingCat(null); }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>{editingCat ? "Edit" : "Add"} Category</DialogTitle></DialogHeader><CategoryForm cat={editingCat} onClose={() => setCatDialogOpen(false)} /></DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {catLoading ? <Skeleton className="h-10 w-full" /> : categories?.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No categories yet.</p> : categories?.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{c.type}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCat(c); setCatDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if(confirm("Delete?")) delCat.mutate({id: c.id}, { onSuccess: () => { queryClient.invalidateQueries({queryKey: ["/api/categories"]}); toast({title:"Deleted"}); } }) }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Labels Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Labels</CardTitle>
              <CardDescription>Tags for detailed tracking</CardDescription>
            </div>
            <Dialog open={labDialogOpen} onOpenChange={(open) => { setLabDialogOpen(open); if (!open) setEditingLab(null); }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add</Button></DialogTrigger>
              <DialogContent><DialogHeader><DialogTitle>{editingLab ? "Edit" : "Add"} Label</DialogTitle></DialogHeader><LabelForm label={editingLab} onClose={() => setLabDialogOpen(false)} /></DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {labLoading ? <Skeleton className="h-8 w-24" /> : labels?.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4 w-full">No labels yet.</p> : labels?.map(l => (
                <div key={l.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-card text-sm font-medium group">
                  <Tag className="w-3.5 h-3.5" style={{ color: l.color }} />
                  {l.name}
                  <div className="flex -mr-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:text-primary transition-colors" onClick={() => { setEditingLab(l); setLabDialogOpen(true); }}><Pencil className="w-3 h-3" /></button>
                    <button className="p-1 hover:text-destructive transition-colors" onClick={() => { if(confirm("Delete?")) delLab.mutate({id: l.id}, { onSuccess: () => { queryClient.invalidateQueries({queryKey: ["/api/labels"]}); toast({title:"Deleted"}); } }) }}><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
