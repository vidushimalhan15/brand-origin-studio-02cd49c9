import { useState } from "react";
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

export type Product = {
  id: string;
  name: string;
  description: string;
};

type Props = {
  brandName: string;
  introduction: string;
};

const emptyDraft = { name: "", description: "" };

export default function ProductsServices({ brandName, introduction }: Props) {
  const draftDescription = useServerFn(draftProductDescription);

  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const canSubmit = draft.name.trim() && draft.description.trim();

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!canSubmit) return;
    if (editingId) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: draft.name.trim(),
                description: draft.description.trim(),
              }
            : p,
        ),
      );
    } else {
      setProducts((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: draft.name.trim(),
          description: draft.description.trim(),
        },
      ]);
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
        data: {
          productName: draft.name,
          brandName,
          introduction,
          currentDescription: draft.description,
        },
      });
      if (result.error) {
        setDraftError(result.error);
      } else {
        setDraft((d) => ({ ...d, description: result.description }));
      }
    } catch (err) {
      setDraftError(
        err instanceof Error ? err.message : "Failed to draft description.",
      );
    } finally {
      setDrafting(false);
    }
  };

  return (
    <section className="mt-8 antialiased">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Package className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Products &amp; services
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            What do you offer? Add each product or service you want to promote.
          </p>
        </div>
      </div>

      {/* Add Form */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="product-name" className="text-sm font-medium">
              Name
            </Label>
            <Input
              id="product-name"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
              placeholder="e.g. Pro Subscription"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="product-description"
                className="text-sm font-medium"
              >
                Description
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDraft}
                disabled={!draft.name.trim() || drafting}
                className="h-8 gap-1.5 rounded-lg text-primary hover:bg-primary/10 hover:text-primary"
              >
                {drafting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {drafting ? "Drafting…" : "Draft Description"}
              </Button>
            </div>
            <Textarea
              id="product-description"
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
              rows={3}
              placeholder="What does this product do or what does this service provide?"
              className={drafting ? "resize-none rounded-xl opacity-60" : "resize-none rounded-xl"}
              disabled={drafting}
            />
          </div>

          {draftError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{draftError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                onClick={resetDraft}
                className="h-10 rounded-lg"
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canSubmit}
              className="group h-10 gap-1.5 rounded-lg bg-green-600 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md focus-visible:ring-green-600/40"
            >
              {editingId ? (
                <>
                  <Check className="h-4 w-4" />
                  Save changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                  Add Product/Service
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Saved Products */}
      {products.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="group relative flex flex-col rounded-xl border border-green-100 bg-green-50 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start gap-3 pr-14">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-green-500 text-white shadow-sm">
                  <Tag className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-semibold text-green-950">
                    {p.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-green-900/80">
                    {p.description}
                  </p>
                </div>
              </div>

              <div className="absolute right-3 top-3 flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleEdit(p)}
                  aria-label={`Edit ${p.name}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-green-800 transition-colors hover:bg-green-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  aria-label={`Delete ${p.name}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-green-800 transition-colors hover:bg-green-100 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {editingId === p.id && (
                <div className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                  <Pencil className="h-2.5 w-2.5" />
                  Editing
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {products.length === 0 && (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          No products yet — add your first one above.
        </p>
      )}
    </section>
  );
}
