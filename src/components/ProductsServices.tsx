import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Package,
  Plus,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
  Check,
  AlertCircle,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { draftProductDescription } from "@/server/brand.functions";
import { useProducts, saveProductsToDB, type Product } from "@/hooks/use-brand-store";

export type { Product };

type Props = {
  brandName: string;
  introduction: string;
};

const emptyDraft = { name: "", description: "" };

export default function ProductsServices({ brandName, introduction }: Props) {
  const draftDescription = useServerFn(draftProductDescription);
  const [products, setProducts] = useProducts();
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const canSubmit = draft.name.trim() && draft.description.trim();

  const resetDraft = () => { setDraft(emptyDraft); setEditingId(null); };

  // Sync to Supabase whenever products change
  useEffect(() => {
    void saveProductsToDB(products);
  }, [products]);

  const handleSave = () => {
    if (!canSubmit) return;
    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => p.id === editingId ? { ...p, name: draft.name.trim(), description: draft.description.trim() } : p),
      );
    } else {
      setProducts((prev) => [...prev, { id: crypto.randomUUID(), name: draft.name.trim(), description: draft.description.trim() }]);
    }
    resetDraft();
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setDraft({ name: p.name, description: p.description });
  };

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) resetDraft();
  };

  const handleDraft = async () => {
    if (!draft.name.trim() || drafting) return;
    setDrafting(true);
    setDraftError(null);
    try {
      const result = await draftDescription({
        data: { productName: draft.name, brandName, introduction, currentDescription: draft.description },
      });
      if (result.error) {
        setDraftError(result.error);
      } else {
        setDraft((d) => ({ ...d, description: result.description }));
      }
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Failed to draft description.");
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">

        {/* Header */}
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {editingId ? "Edit product / service" : "Add product / service"}
        </p>

        {/* Form fields */}
        <div className="space-y-1.5">
          <Label htmlFor="product-name" className="text-xs font-medium">Name</Label>
          <Input
            id="product-name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Pro Subscription"
            className="h-9 rounded-lg text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="product-description" className="text-xs font-medium">Description</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDraft}
              disabled={!draft.name.trim() || drafting}
              className="h-7 gap-1 rounded-md px-2 text-[11px] text-primary hover:bg-primary/10"
            >
              {drafting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {drafting ? "Drafting…" : "AI Draft"}
            </Button>
          </div>
          <Textarea
            id="product-description"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            rows={2}
            placeholder="What does this product or service provide?"
            disabled={drafting}
            className="resize-none rounded-lg text-sm disabled:opacity-60"
          />
        </div>

        {draftError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {draftError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2">
          {editingId && (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={resetDraft} className="h-8 rounded-lg text-xs">
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDelete(editingId)}
                className="h-8 gap-1.5 rounded-lg text-xs border-destructive/30 text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!canSubmit}
            className="h-8 gap-1.5 rounded-lg text-xs bg-amber-500 text-white hover:bg-amber-600"
          >
            {editingId ? <><Check className="h-3.5 w-3.5" /> Save</> : <><Plus className="h-3.5 w-3.5" /> Add</>}
          </Button>
        </div>

        {/* Added Products */}
        {products.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Added</p>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="group relative flex flex-col rounded-xl border border-amber-100 bg-amber-50/60 p-4 transition-all hover:border-amber-200 hover:shadow-sm"
                >
                  {editingId === p.id && (
                    <div className="absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                      <Pencil className="h-2.5 w-2.5" /> Editing
                    </div>
                  )}
                  <div className="flex items-start gap-2.5 pr-14">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
                      <Tag className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-amber-950">{p.name}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-amber-800/70">{p.description}</p>
                    </div>
                  </div>
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleEdit(p)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-amber-700 hover:bg-amber-100 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
