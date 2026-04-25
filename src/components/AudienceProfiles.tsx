import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  Plus,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { suggestAudiences } from "@/server/brand.functions";

export type Audience = {
  id: string;
  name: string;
  roleAndIndustry: string;
  challenge: string;
};

type Props = {
  brandName: string;
  introduction: string;
};

const emptyDraft = { name: "", roleAndIndustry: "", challenge: "" };

export default function AudienceProfiles({ brandName, introduction }: Props) {
  const suggest = useServerFn(suggestAudiences);

  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const canSubmit =
    draft.name.trim() && draft.roleAndIndustry.trim() && draft.challenge.trim();

  const resetDraft = () => {
    setDraft(emptyDraft);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!canSubmit) return;
    if (editingId) {
      setAudiences((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, ...draft } : a)),
      );
    } else {
      setAudiences((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: draft.name.trim(),
          roleAndIndustry: draft.roleAndIndustry.trim(),
          challenge: draft.challenge.trim(),
        },
      ]);
    }
    resetDraft();
  };

  const handleEdit = (a: Audience) => {
    setEditingId(a.id);
    setDraft({
      name: a.name,
      roleAndIndustry: a.roleAndIndustry,
      challenge: a.challenge,
    });
  };

  const handleDelete = (id: string) => {
    setAudiences((prev) => prev.filter((a) => a.id !== id));
    if (editingId === id) resetDraft();
  };

  const handleSuggest = async () => {
    if (!brandName.trim() || !introduction.trim() || suggesting) return;
    setSuggesting(true);
    setSuggestError(null);
    try {
      const result = await suggest({
        data: { brandName, introduction },
      });
      if (result.error) {
        setSuggestError(result.error);
      } else {
        setAudiences((prev) => [
          ...prev,
          ...result.audiences.map((a) => ({
            id: crypto.randomUUID(),
            ...a,
          })),
        ]);
      }
    } catch (err) {
      setSuggestError(
        err instanceof Error ? err.message : "Failed to suggest audiences.",
      );
    } finally {
      setSuggesting(false);
    }
  };

  const suggestDisabled =
    suggesting || !brandName.trim() || !introduction.trim();

  return (
    <section className="mt-8 antialiased">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Audience profiles
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Define who you&apos;re creating content for.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSuggest}
          disabled={suggestDisabled}
          className="h-9 gap-1.5 rounded-lg border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
        >
          {suggesting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {suggesting ? "Generating…" : "Suggest Audience"}
        </Button>
      </div>

      {suggestError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{suggestError}</span>
        </div>
      )}

      {/* Add Audience Form */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="audience-name" className="text-sm font-medium">
                Audience name
              </Label>
              <Input
                id="audience-name"
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                placeholder="e.g. Marketing Managers"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="audience-role"
                className="text-sm font-medium"
              >
                Role & industry
              </Label>
              <Input
                id="audience-role"
                value={draft.roleAndIndustry}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, roleAndIndustry: e.target.value }))
                }
                placeholder="e.g. Operations in Tech"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience-challenge" className="text-sm font-medium">
              Main challenge
            </Label>
            <Textarea
              id="audience-challenge"
              value={draft.challenge}
              onChange={(e) =>
                setDraft((d) => ({ ...d, challenge: e.target.value }))
              }
              rows={3}
              placeholder="Describe the primary pain point this audience faces…"
              className="resize-none rounded-xl"
            />
          </div>

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
              className="h-10 gap-1.5 rounded-lg shadow-sm transition-all hover:shadow-md"
            >
              {editingId ? (
                <>
                  <Check className="h-4 w-4" />
                  Save changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Audience
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Saved Audiences */}
      {audiences.length > 0 && (
        <div className="mt-5 grid gap-4">
          {audiences.map((a) => (
            <div
              key={a.id}
              className="group relative rounded-xl border border-green-100 bg-green-50 p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3 pr-16">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-green-950">
                    {a.name}
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-sm text-green-900/80">
                    <li className="flex gap-2">
                      <span
                        className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-green-700"
                        aria-hidden
                      />
                      <span>
                        <span className="font-medium text-green-900">
                          Role & industry:
                        </span>{" "}
                        {a.roleAndIndustry}
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span
                        className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-green-700"
                        aria-hidden
                      />
                      <span>
                        <span className="font-medium text-green-900">
                          Challenge:
                        </span>{" "}
                        {a.challenge}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="absolute right-3 top-3 flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleEdit(a)}
                  aria-label={`Edit ${a.name}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-green-800 transition-colors hover:bg-green-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  aria-label={`Delete ${a.name}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-green-800 transition-colors hover:bg-green-100 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {editingId === a.id && (
                <div className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                  <Pencil className="h-2.5 w-2.5" />
                  Editing
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {audiences.length === 0 && !suggesting && (
        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
          <X className="h-4 w-4" />
          No audiences yet — add one above or generate suggestions.
        </div>
      )}
    </section>
  );
}
