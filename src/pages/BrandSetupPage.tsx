import { useState, useEffect } from "react";
import { Building2, Package, Save, CheckCircle2, Link2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AudienceProfiles from "@/components/AudienceProfiles";
import { analyzeBrandUrl } from "@/server/brand.functions";
import {
  saveBrandProfile,
  loadBrandProfile,
  useProducts,
  saveProductsToDB,
  type Product,
} from "@/hooks/use-brand-store";

function ProductsSection() {
  const [products, setProducts] = useProducts();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleAdd() {
    if (!name.trim()) return;
    if (editingId) {
      const updated = products.map((p) =>
        p.id === editingId ? { ...p, name: name.trim(), description: description.trim() } : p,
      );
      setProducts(updated);
      saveProductsToDB(updated);
      setEditingId(null);
    } else {
      const updated: Product[] = [
        ...products,
        { id: crypto.randomUUID(), name: name.trim(), description: description.trim() },
      ];
      setProducts(updated);
      saveProductsToDB(updated);
    }
    setName("");
    setDescription("");
  }

  function handleEdit(p: Product) {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description);
  }

  function handleDelete(id: string) {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    saveProductsToDB(updated);
  }

  function handleCancel() {
    setEditingId(null);
    setName("");
    setDescription("");
  }

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Package className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-slate-800">Products & Services</h3>
      </div>

      {/* Form */}
      <div className="space-y-2">
        <Input
          placeholder="Product or service name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-sm"
        />
        <Textarea
          placeholder="Brief description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-sm resize-none"
          rows={2}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleAdd} disabled={!name.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
            {editingId ? "Save" : "+ Add"}
          </Button>
          {editingId && (
            <Button size="sm" variant="ghost" onClick={handleCancel} className="text-xs">
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {products.length > 0 && (
        <>
          <div className="border-t border-border pt-3">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Added</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="group relative rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2"
                >
                  <p className="text-sm font-semibold text-emerald-800">{p.name}</p>
                  {p.description && (
                    <p className="text-xs text-emerald-600 mt-0.5 line-clamp-2">{p.description}</p>
                  )}
                  <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-1">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1 rounded bg-white/80 hover:bg-white text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1 rounded bg-white/80 hover:bg-white text-slate-500 hover:text-red-500 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function BrandSetupPage() {
  const [brandName, setBrandName] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [url, setUrl] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [analyseError, setAnalyseError] = useState("");

  useEffect(() => {
    loadBrandProfile().then((data) => {
      if (data) {
        setBrandName(data.brandName);
        setIntroduction(data.introduction);
      }
    });
  }, []);

  async function handleAnalyse() {
    if (!url.trim()) return;
    setAnalysing(true);
    setAnalyseError("");
    const result = await analyzeBrandUrl({ data: { url: url.trim() } });
    setAnalysing(false);
    if (result.error) {
      setAnalyseError(result.error);
    } else {
      if (result.brandName) setBrandName(result.brandName);
      if (result.introduction) setIntroduction(result.introduction);
    }
  }

  async function handleSave() {
    setSaving(true);
    await saveBrandProfile(brandName, introduction);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Brand Setup</h1>
        <p className="mt-1 text-sm text-slate-500">
          Define your brand identity, audiences, and products so SocialFlow can generate on-brand content.
        </p>
      </div>

      {/* Brand Identity */}
      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-800">Brand Identity</h3>
        </div>

        {/* URL Analyser */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-600 mb-1 block">Analyse your website</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="https://yourwebsite.com"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setAnalyseError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyse()}
                className="text-sm pl-8"
              />
            </div>
            <Button
              size="sm"
              onClick={handleAnalyse}
              disabled={analysing || !url.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5 shrink-0"
            >
              {analysing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysing…</> : "✦ Analyse"}
            </Button>
          </div>
          {analyseError && (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5" /> {analyseError}
            </div>
          )}
          <p className="text-[11px] text-slate-400">Paste your website URL and we'll auto-fill your brand details.</p>
        </div>

        <div className="border-t border-border pt-3 space-y-3">
          <div>
            <Label className="text-xs text-slate-600 mb-1 block">Brand name</Label>
            <Input
              placeholder="e.g. Acme Corp"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-600 mb-1 block">What does your brand do?</Label>
            <Textarea
              placeholder="Describe your brand, what you offer, and who you help…"
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              className="text-sm resize-none"
              rows={4}
            />
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || (!brandName.trim() && !introduction.trim())}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5"
          >
            {saved ? (
              <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>
            ) : saving ? (
              "Saving…"
            ) : (
              <><Save className="w-3.5 h-3.5" /> Save Brand</>
            )}
          </Button>
        </div>
      </div>

      {/* Audiences */}
      <AudienceProfiles brandName={brandName} introduction={introduction} />

      {/* Products */}
      <ProductsSection />
    </div>
  );
}
