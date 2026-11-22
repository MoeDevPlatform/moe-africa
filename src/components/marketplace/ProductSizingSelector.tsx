import { useEffect, useMemo, useState } from "react";
import { Info, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { audienceLabel, type ProductAudience } from "@/lib/productAudience";
import {
  deriveSizingMode,
  productTypeLabel,
  type ProductSizeProfile,
  type ProductSizingSelection,
} from "@/lib/productSizing";

interface ProductSizingSelectorProps {
  profiles?: ProductSizeProfile[];
  onSelectionChange: (selection: ProductSizingSelection | null, ready: boolean) => void;
}

const FitFigure = ({ selected }: { selected: boolean }) => (
  <span aria-hidden="true" className={cn("relative block h-14 w-9 rounded-[45%_45%_35%_35%] border-2 bg-muted/40 before:absolute before:-top-3 before:left-1/2 before:h-3 before:w-3 before:-translate-x-1/2 before:rounded-full before:border-2 before:bg-background", selected ? "border-primary before:border-primary" : "border-muted-foreground/40 before:border-muted-foreground/40")} />
);

const ProductSizingSelector = ({ profiles = [], onSelectionChange }: ProductSizingSelectorProps) => {
  const [audience, setAudience] = useState<ProductAudience | null>(null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [fitChoiceId, setFitChoiceId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const availableProfiles = useMemo(() => profiles.filter((profile) => !!profile.id), [profiles]);
  const profile = availableProfiles.find((item) => item.audience === audience) ?? null;

  useEffect(() => {
    if (!availableProfiles.length) {
      setAudience(null);
      return;
    }
    if (!audience || !availableProfiles.some((item) => item.audience === audience)) {
      setAudience(availableProfiles[0].audience);
    }
  }, [audience, availableProfiles]);

  useEffect(() => {
    if (!profile?.id) {
      onSelectionChange(null, availableProfiles.length === 0);
      return;
    }
    const ready = profile.isMadeToMeasure || !!sizeId;
    onSelectionChange(
      {
        audience: profile.audience,
        profileId: profile.id,
        ...(sizeId ? { sizeId } : {}),
        ...(fitChoiceId ? { fitChoiceId } : {}),
      },
      ready,
    );
  }, [availableProfiles.length, fitChoiceId, onSelectionChange, profile, sizeId]);

  if (!availableProfiles.length || !profile) return null;

  const switchAudience = (next: ProductAudience) => {
    setAudience(next);
    setSizeId(null);
    setFitChoiceId(null);
  };

  return (
    <div className="space-y-5 rounded-xl border bg-card p-4" data-testid="product-sizing-selector">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Size & Fit</p>
          <p className="text-xs text-muted-foreground">
            {productTypeLabel(profile.productType)}
            {" · "}
            Choose the audience before selecting a size.
          </p>
        </div>
        {!profile.isMadeToMeasure && (
          <Button type="button" variant="outline" size="sm" onClick={() => setGuideOpen(true)}>
            <Ruler className="mr-2 h-4 w-4" /> Size guide
          </Button>
        )}
      </div>

      {availableProfiles.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Designed For</legend>
          <div className="flex flex-wrap gap-2">
            {availableProfiles.map((item) => (
              <button key={item.id} type="button" aria-pressed={audience === item.audience} onClick={() => switchAudience(item.audience)} className={cn("rounded-full border px-4 py-2 text-sm", audience === item.audience ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50")}>
                {audienceLabel(item.audience)}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {profile.isMadeToMeasure ? (
        <div className="rounded-lg bg-primary/5 p-3 text-sm">
          <p className="font-medium">Made to measure</p>
          <p className="mt-1 text-muted-foreground">Standard size selection is not required. Provide measurements through the product’s customisation flow.</p>
        </div>
      ) : deriveSizingMode(profile) === "one_size" ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Fit</legend>
          <div className="flex flex-wrap gap-2">
            {profile.sizes.map((size) => (
              <button key={size.id} type="button" aria-pressed={sizeId === size.id} onClick={() => setSizeId(size.id ?? null)} className={cn("min-w-12 rounded-md border px-3 py-2 text-sm", sizeId === size.id ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50")}>
                {size.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">This product is offered as a single size. Check the size guide for dimensions.</p>
        </fieldset>
      ) : (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Available {audienceLabel(profile.audience)} sizes *</legend>
          <div className="flex flex-wrap gap-2">
            {profile.sizes.map((size) => (
              <button key={size.id} type="button" aria-pressed={sizeId === size.id} onClick={() => setSizeId(size.id ?? null)} className={cn("min-w-12 rounded-md border px-3 py-2 text-sm", sizeId === size.id ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50")}>
                {size.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {profile.fitChoices.length > 0 && (
        <fieldset>
          <legend className="mb-1 text-sm font-medium">Fit preference <span className="font-normal text-muted-foreground">(optional)</span></legend>
          <p className="mb-3 text-xs text-muted-foreground">Skip this if you have no specific preference. Fit preference does not replace measurements.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {profile.fitChoices.map((fit) => {
              const selected = fitChoiceId === fit.id;
              return (
                <button key={fit.id} type="button" aria-pressed={selected} onClick={() => setFitChoiceId(selected ? null : fit.id ?? null)} className={cn("flex min-h-24 items-center gap-3 rounded-lg border p-3 text-left", selected ? "border-primary bg-primary/5" : "hover:border-primary/50")}>
                  <FitFigure selected={selected} />
                  <span><span className="block text-sm font-medium">{fit.label}</span><span className="mt-1 block text-xs text-muted-foreground">{fit.description}</span></span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{audienceLabel(profile.audience)} size guide</DialogTitle>
            <DialogDescription>{profile.sizingSystem} · Measurements in {profile.unit === "cm" ? "centimetres" : "inches"}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="flex items-center gap-2 font-medium"><Info className="h-4 w-4" /> How to read this guide</p>
            <p className="mt-1 text-muted-foreground">Body measurements describe the customer. Finished-garment measurements describe the completed item and may include ease.</p>
            {profile.instructions && <p className="mt-2">{profile.instructions}</p>}
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/60">
                <tr><th className="px-3 py-2 text-left">Size</th>{profile.measurementDefinitions.map((definition) => <th key={definition.key} className="px-3 py-2 text-left">{definition.label}<span className="block text-[10px] font-normal text-muted-foreground">{definition.kind === "body" ? "Body" : "Garment"}</span></th>)}</tr>
              </thead>
              <tbody>
                {profile.sizes.map((size) => (
                  <tr key={size.id} className="border-t"><th className="px-3 py-2 text-left">{size.label}</th>{profile.measurementDefinitions.map((definition) => { const value = size.measurements[definition.key]; return <td key={definition.key} className="px-3 py-2">{typeof value === "number" ? value : value ? `${value.min}–${value.max}` : "—"} {value ? profile.unit : ""}</td>; })}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {profile.measurementDefinitions.map((definition) => <div key={definition.key} className="rounded-lg border p-3 text-sm"><p className="font-medium">{definition.label}</p><p className="text-xs text-muted-foreground">{definition.guidance || "Follow the artisan’s measurement instructions."}</p></div>)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductSizingSelector;
