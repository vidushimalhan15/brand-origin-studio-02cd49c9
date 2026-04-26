import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { suggestAudiences } from "@/server/brand.functions";
import { useAudiences, saveAudiencesToDB, type Audience } from "@/hooks/use-brand-store";

export type { Audience };

type Props = {
  brandName: string;
  introduction: string;
};

const emptyDraft = { name: "", roleAndIndustry: "", challenge: "" };

type SuggestedAudience = { name: string; roleAndIndustry: string; challenge: string };

export default function AudienceProfiles({ brandName, introduction }: Props) {
  const suggest = useServerFn(suggestAudiences);
  const [audiences, setAudiences] = useAudiences();
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedAudience[]>([]);

  const canSubmit = draft.name.trim() && draft.roleAndIndustry.trim() && draft.challenge.trim();

  // Sync to Supabase whenever audiences change
  useEffect(() => {
    void saveAudiencesToDB(audiences);
  }, [audiences]);

  const resetDraft = () => { setDraft(emptyDraft); setEditingId(null); };

  const handleSave = () => {
    if (!canSubmit) return;
    if (editingId) {
      setAudiences((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...draft } : a)));
    } else {
      setAudiences((prev) => [...prev, { id: crypto.randomUUID(), ...draft }]);
    }
    resetDraft();
  };

  const handleEdit = (a: Audience) => {
    setEditingId(a.id);
    setDraft({ name: a.name, roleAndIndustry: a.roleAndIndustry, challenge: a.challenge });
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
      const result = await suggest({ data: { brandName, introduction } });
      if (result.error) {
        setSuggestError(result.error);
      } else {
        setSuggestions(result.audiences);
      }
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : "Failed to suggest audiences.");
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <div className="mt-4">
      {/* Single card containing form + suggestions + saved */}
      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">

        {/* Header */}
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {editingId ? "Edit audience" : "Add audience"}
        </p>

        {/* Form fields */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="audience-name" className="text-xs font-medium">Audience name</Label>
            <Input
              id="audience-name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. Marketing Managers"
              className="h-9 rounded-lg text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audience-role" className="text-xs font-medium">Role & industry</Label>
            <Input
              id="audience-role"
              value={draft.roleAndIndustry}
              onChange={(e) => setDraft((d) => ({ ...d, roleAndIndustry: e.target.value }))}
              placeholder="e.g. Operations in Tech"
              className="h-9 rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="audience-challenge" className="text-xs font-medium">Main challenge</Label>
          <Textarea
            id="audience-challenge"
            value={draft.challenge}
            onChange={(e) => setDraft((d) => ({ ...d, challenge: e.target.value }))}
            rows={2}
            placeholder="Primary pain point this audience faces…"
            className="resize-none rounded-lg text-sm"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSuggest}
            disabled={!brandName.trim() || !introduction.trim() || suggesting}
            className="h-8 gap-1.5 rounded-lg text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            {suggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {suggesting ? "Generating…" : "+ AI Suggest"}
          </Button>
          <div className="flex gap-2">
            {editingId && (
              <>
                <Button type="button" variant="ghost" size="sm" onClick={resetDraft} className="h-8 rounded-lg text-xs">
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { handleDelete(editingId); }}
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
              className="h-8 gap-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {editingId ? <><Check className="h-3.5 w-3.5" /> Save</> : <><Plus className="h-3.5 w-3.5" /> Add</>}
            </Button>
          </div>
        </div>

        {suggestError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            {suggestError}
          </div>
        )}

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">AI Suggestions</p>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="group relative rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <div className="pr-10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-white">
                        <Users className="h-3 w-3" />
                      </div>
                      <h3 className="text-sm font-semibold text-emerald-950">{s.name}</h3>
                    </div>
                    <p className="text-xs text-emerald-800/70 mb-1">
                      <span className="font-medium text-emerald-900">Role:</span> {s.roleAndIndustry}
                    </p>
                    <p className="text-xs text-emerald-800/70">
                      <span className="font-medium text-emerald-900">Challenge:</span> {s.challenge}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newAudience = { id: crypto.randomUUID(), name: s.name, roleAndIndustry: s.roleAndIndustry, challenge: s.challenge };
                      setAudiences((prev) => [...prev, newAudience]);
                      setSuggestions((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                    className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition-colors"
                    title="Add audience"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Saved Audiences */}
        {audiences.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Added</p>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {audiences.map((a) => (
                <div
                  key={a.id}
                  className="group relative rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 transition-all hover:border-emerald-200 hover:shadow-sm"
                >
                  {editingId === a.id && (
                    <div className="absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                      <Pencil className="h-2.5 w-2.5" /> Editing
                    </div>
                  )}
                  <div className="pr-14">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Users className="h-3 w-3" />
                      </div>
                      <h3 className="text-sm font-semibold text-emerald-950">{a.name}</h3>
                    </div>
                    <p className="text-xs text-emerald-800/70 mb-1">
                      <span className="font-medium text-emerald-900">Role:</span> {a.roleAndIndustry}
                    </p>
                    <p className="text-xs text-emerald-800/70">
                      <span className="font-medium text-emerald-900">Challenge:</span> {a.challenge}
                    </p>
                  </div>
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleEdit(a)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-100 hover:text-destructive transition-colors"
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
