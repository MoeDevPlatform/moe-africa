import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Circle, Copy, Plus, Ruler, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { audienceLabel, type ProductAudience } from "@/lib/productAudience";
import {
  CURATED_FIT_CHOICES,
  applyProductTypeToProfile,
  applySizingMode,
  createSizeProfile,
  deriveSizingMode,
  getProductTypeOption,
  isProfileComplete,
  isSizingCategory,
  normalizeProductType,
  productTypesForCategory,
  sizingSummary,
  suggestedSizeLabelsFor,
  type MeasurementValue,
  type ProductSizeProfile,
  type SizingMode,
} from "@/lib/productSizing";

interface ProductSizingEditorProps {
  category: string;
  audiences: ProductAudience[];
  value: ProductSizeProfile[];
  onChange: (profiles: ProductSizeProfile[]) => void;
  disabled?: boolean;
  error?: string;
}

const freshLocalId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `00000000-0000-4000-8000-${Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12)}`;

const FitFigure = ({ selected }: { selected: boolean }) => (
  <span
    aria-hidden="true"
    className={cn(
      "relative block h-14 w-9 rounded-[45%_45%_35%_35%] border-2 bg-muted/40 before:absolute before:-top-3 before:left-1/2 before:h-3.5 before:w-3.5 before:-translate-x-1/2 before:rounded-full before:border-2 before:bg-background",
      selected ? "border-primary before:border-primary" : "border-muted-foreground/40 before:border-muted-foreground/40",
    )}
  />
);

const ProductSizingEditor = ({
  category,
  audiences,
  value,
  onChange,
  disabled,
  error,
}: ProductSizingEditorProps) => {
  const typeOptions = useMemo(() => productTypesForCategory(category), [category]);
  const sharedProductType = normalizeProductType(
    category,
    value.find((profile) => audiences.includes(profile.audience))?.productType
      ?? value[0]?.productType
      ?? typeOptions[0]?.value
      ?? "",
  );
  const typeOption = getProductTypeOption(category, sharedProductType);
  const sizingNeeded = !!typeOption?.sizingApplicable;
  const [activeAudience, setActiveAudience] = useState<ProductAudience>(audiences[0] ?? "men");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const missing = useMemo(
    () => audiences.filter((audience) => !value.some((profile) => profile.audience === audience)),
    [audiences, value],
  );

  useEffect(() => {
    if (audiences.length && !audiences.includes(activeAudience)) setActiveAudience(audiences[0]);
  }, [activeAudience, audiences]);

  useEffect(() => {
    if (!missing.length || !isSizingCategory(category) || !sizingNeeded) return;
    onChange([
      ...value,
      ...missing.map((audience) => createSizeProfile(category, audience, sharedProductType)),
    ]);
  }, [category, missing, onChange, sharedProductType, sizingNeeded, value]);

  if (!isSizingCategory(category)) return null;

  if (!typeOptions.length) return null;

  const setProductType = (productType: string) => {
    const option = getProductTypeOption(category, productType);
    if (!option?.sizingApplicable) {
      // Non-sizing types keep a lightweight profile marker without charts.
      const next = audiences.map((audience) => {
        const existing = value.find((profile) => profile.audience === audience);
        return existing
          ? applyProductTypeToProfile(existing, category, productType)
          : createSizeProfile(category, audience, productType);
      });
      onChange(next);
      return;
    }
    const nextAudiences = audiences.length ? audiences : value.map((profile) => profile.audience);
    const base = nextAudiences.length
      ? nextAudiences.map((audience) => {
          const existing = value.find((profile) => profile.audience === audience);
          const profile = existing ?? createSizeProfile(category, audience, productType);
          return applyProductTypeToProfile(profile, category, productType);
        })
      : [];
    onChange(base);
  };

  const updateProfile = (audience: ProductAudience, patch: Partial<ProductSizeProfile>) => {
    onChange(value.map((profile) => (profile.audience === audience ? { ...profile, ...patch } : profile)));
  };

  const duplicateFrom = (source: ProductSizeProfile, audience: ProductAudience) => {
    const copy: ProductSizeProfile = {
      ...source,
      id: undefined,
      audience,
      version: undefined,
      measurementDefinitions: measurementsPreservingAudience(source, audience, category),
      sizes: source.sizes.map((size) => ({
        ...size,
        id: undefined,
        measurements: { ...size.measurements },
      })),
      fitChoices: audience === "children" ? [] : source.fitChoices.map((fit) => ({ ...fit, id: undefined })),
    };
    onChange(value.map((profile) => (profile.audience === audience ? copy : profile)));
  };

  if (!audiences.length) {
    return (
      <div className="space-y-4 rounded-xl border bg-card p-4" data-testid="product-sizing-editor">
        <StepHeader step={1} title="What are you selling?" />
        <ProductTypePicker
          options={typeOptions}
          value={sharedProductType}
          disabled={disabled}
          onChange={setProductType}
        />
        {sizingNeeded ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Next, choose who the product is for (Men, Women, Children or Unisex) above. Size charts stay separate for each audience.
          </p>
        ) : (
          <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
            This product type does not need clothing-style size charts. You can continue with colours and other variations.
          </p>
        )}
      </div>
    );
  }

  if (!sizingNeeded) {
    return (
      <div className="space-y-4 rounded-xl border bg-card p-4" data-testid="product-sizing-editor">
        <StepHeader step={1} title="What are you selling?" />
        <ProductTypePicker
          options={typeOptions}
          value={sharedProductType}
          disabled={disabled}
          onChange={setProductType}
        />
        <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
          No clothing or footwear size chart is required for this product type. Continue with colours and other options.
        </p>
      </div>
    );
  }

  const summaryLines = sizingSummary(value, audiences);

  return (
    <div className="space-y-5 rounded-xl border bg-card p-4" data-testid="product-sizing-editor">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-primary/10 p-2 text-primary">
          <Ruler className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">Size & Fit</h3>
          <p className="text-sm text-muted-foreground">
            A few guided steps. Only measurements that matter for this product are shown.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <StepHeader step={1} title="What are you selling?" />
        <ProductTypePicker
          options={typeOptions}
          value={sharedProductType}
          disabled={disabled}
          onChange={setProductType}
        />
      </section>

      <section className="space-y-3">
        <StepHeader step={2} title="Who is it for?" hint="Audience charts stay independent — Men's XL is never assumed equal to Women's XL." />
        <div className="flex flex-wrap gap-2">
          {audiences.map((audience) => {
            const profile = value.find((item) => item.audience === audience);
            const complete = profile ? isProfileComplete(profile) : false;
            const active = activeAudience === audience;
            return (
              <button
                key={audience}
                type="button"
                onClick={() => setActiveAudience(audience)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50",
                )}
              >
                {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5 opacity-60" />}
                {audienceLabel(audience)}
              </button>
            );
          })}
        </div>
      </section>

      {audiences.map((audience) => {
        const profile = value.find((item) => item.audience === audience);
        if (!profile || audience !== activeAudience) return null;
        const mode = deriveSizingMode(profile);
        const copySource = value.find((item) => item.audience !== audience && item.sizes.length > 0);
        const suggested = suggestedSizeLabelsFor(category, profile.productType, audience);
        const selectedLabels = new Set(profile.sizes.map((size) => size.label.trim().toUpperCase()));
        const modeOptions = [
          typeOption?.allowsStandard !== false && {
            value: "standard" as const,
            title: "Standard sizes",
            description: "Customers pick labels like S, M, L. You enter the measurements for each size you offer.",
          },
          typeOption?.allowsMadeToMeasure !== false && {
            value: "made_to_measure" as const,
            title: "Made to measure",
            description: "Customers provide measurements through customisation. No S/M/L chart is required.",
          },
          typeOption?.allowsOneSize && {
            value: "one_size" as const,
            title: "One size",
            description: "Only when this product truly fits as a single size. Not a shortcut for items that need size choice.",
          },
        ].filter(Boolean) as Array<{ value: SizingMode; title: string; description: string }>;

        return (
          <div key={audience} className="space-y-5 rounded-xl border border-primary/15 bg-muted/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{audienceLabel(audience)} sizing</p>
                <p className="text-xs text-muted-foreground">
                  {getProductTypeOption(category, profile.productType)?.label ?? profile.productType}
                </p>
              </div>
              {copySource && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => duplicateFrom(copySource, audience)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy from {audienceLabel(copySource.audience)} as starting point
                </Button>
              )}
            </div>

            <section className="space-y-3">
              <StepHeader step={3} title="How will customers choose their size?" />
              <div className="grid gap-3 sm:grid-cols-3">
                {modeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => updateProfile(audience, applySizingMode(profile, option.value, freshLocalId))}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      mode === option.value ? "border-primary bg-primary/5" : "hover:border-primary/40",
                    )}
                  >
                    <span className="block text-sm font-medium">{option.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{option.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <StepHeader step={4} title="Enter the relevant measurements" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Chart name</Label>
                  <Input
                    value={profile.sizingSystem}
                    disabled={disabled}
                    placeholder="e.g. Studio shirt chart v1"
                    onChange={(event) => updateProfile(audience, { sizingSystem: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Units</Label>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={profile.unit}
                    disabled={disabled}
                    onChange={(event) => updateProfile(audience, { unit: event.target.value as "cm" | "in" })}
                  >
                    <option value="cm">Centimetres (cm)</option>
                    <option value="in">Inches (in)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.measurementDefinitions.map((definition) => (
                  <span key={definition.key} className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    {definition.label}
                    {" · "}
                    {definition.kind === "body" ? "Body measure" : "Garment measure"}
                    {definition.required ? "" : " (optional)"}
                  </span>
                ))}
              </div>

              {mode === "made_to_measure" ? (
                <div className="rounded-lg border border-dashed bg-background p-4 text-sm text-muted-foreground">
                  Made to measure selected. Customers will use the customisation measurement flow. A standard size chart is not required.
                </div>
              ) : (
                <div className="space-y-4">
                  {mode === "standard" && (
                    <div className="space-y-2">
                      <Label>Sizes you offer</Label>
                      <div className="flex flex-wrap gap-2">
                        {suggested.map((label) => {
                          const active = selectedLabels.has(label.toUpperCase());
                          return (
                            <button
                              key={label}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                if (active) {
                                  updateProfile(audience, {
                                    sizes: profile.sizes.filter((size) => size.label.trim().toUpperCase() !== label.toUpperCase()),
                                  });
                                  return;
                                }
                                updateProfile(audience, {
                                  sizes: [
                                    ...profile.sizes,
                                    { id: freshLocalId(), label, measurements: {}, position: profile.sizes.length },
                                  ],
                                });
                              }}
                              className={cn(
                                "rounded-md border px-3 py-1.5 text-sm",
                                active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/40",
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={disabled}
                          onClick={() => updateProfile(audience, {
                            sizes: [...profile.sizes, { id: freshLocalId(), label: "", measurements: {}, position: profile.sizes.length }],
                          })}
                        >
                          <Plus className="mr-1 h-4 w-4" /> Custom label
                        </Button>
                      </div>
                    </div>
                  )}

                  {profile.sizes.length === 0 ? (
                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      Select the sizes you sell, then fill in only the measurements shown.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border bg-background">
                      <table className="min-w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                          <tr>
                            <th className="px-3 py-2 font-medium">Size</th>
                            {profile.measurementDefinitions.map((definition) => (
                              <th key={definition.key} className="px-3 py-2 font-medium">
                                <span className="block">{definition.label} ({profile.unit})</span>
                                <span className="block text-[10px] font-normal text-muted-foreground">
                                  {definition.kind === "body" ? "Body" : "Garment"}
                                  {definition.required ? " · required" : " · optional"}
                                </span>
                              </th>
                            ))}
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {profile.sizes.map((size, sizeIndex) => (
                            <tr key={size.id ?? sizeIndex} className="border-t align-top">
                              <td className="px-3 py-2">
                                <Input
                                  value={size.label}
                                  disabled={disabled || mode === "one_size"}
                                  placeholder="e.g. L"
                                  className="min-w-20"
                                  onChange={(event) => updateProfile(audience, {
                                    sizes: profile.sizes.map((item, index) =>
                                      index === sizeIndex ? { ...item, label: event.target.value } : item,
                                    ),
                                  })}
                                />
                              </td>
                              {profile.measurementDefinitions.map((definition) => {
                                const measurement = size.measurements[definition.key];
                                const updateMeasurement = (next: MeasurementValue | undefined) => {
                                  const measurements = { ...size.measurements };
                                  if (next === undefined) delete measurements[definition.key];
                                  else measurements[definition.key] = next;
                                  updateProfile(audience, {
                                    sizes: profile.sizes.map((item, index) =>
                                      index === sizeIndex ? { ...item, measurements } : item,
                                    ),
                                  });
                                };
                                return (
                                  <td key={definition.key} className="px-3 py-2">
                                    {definition.key.endsWith("_range") ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          min="0"
                                          placeholder="Min"
                                          className="w-20"
                                          value={typeof measurement === "object" ? measurement.min : ""}
                                          onChange={(event) => updateMeasurement({
                                            min: Number(event.target.value),
                                            max: typeof measurement === "object" ? measurement.max : 0,
                                          })}
                                        />
                                        <span>–</span>
                                        <Input
                                          type="number"
                                          min="0"
                                          placeholder="Max"
                                          className="w-20"
                                          value={typeof measurement === "object" ? measurement.max : ""}
                                          onChange={(event) => updateMeasurement({
                                            min: typeof measurement === "object" ? measurement.min : 0,
                                            max: Number(event.target.value),
                                          })}
                                        />
                                      </div>
                                    ) : (
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        className="w-24"
                                        value={typeof measurement === "number" ? measurement : ""}
                                        placeholder="0"
                                        title={definition.guidance}
                                        onChange={(event) =>
                                          updateMeasurement(event.target.value ? Number(event.target.value) : undefined)
                                        }
                                      />
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2">
                                {mode !== "one_size" && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={disabled}
                                    aria-label={`Remove size ${size.label || sizeIndex + 1}`}
                                    onClick={() => updateProfile(audience, {
                                      sizes: profile.sizes.filter((_, index) => index !== sizeIndex),
                                    })}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </section>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="h-auto w-full justify-between px-0 py-2 text-sm font-medium">
                  Advanced sizing options
                  <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pb-1">
                <div className="space-y-1.5">
                  <Label>Customer measuring tips</Label>
                  <Input
                    value={profile.instructions ?? ""}
                    disabled={disabled}
                    placeholder="Optional guidance shown in the size guide"
                    onChange={(event) => updateProfile(audience, { instructions: event.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Optional measurements</Label>
                  <p className="text-xs text-muted-foreground">
                    Required fields stay in the table above. Toggle extras only when you need them.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.measurementDefinitions.map((definition) => (
                      <button
                        key={definition.key}
                        type="button"
                        disabled={disabled || definition.required}
                        onClick={() => updateProfile(audience, {
                          measurementDefinitions: profile.measurementDefinitions.map((item) =>
                            item.key === definition.key ? { ...item, required: !item.required } : item,
                          ),
                        })}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs",
                          definition.required ? "border-primary/40 bg-primary/5" : "bg-background",
                        )}
                      >
                        {definition.label}
                        {definition.required ? " · required" : " · optional"}
                      </button>
                    ))}
                  </div>
                </div>

                {audience !== "children" && typeOption?.allowsFitGuide !== false && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium">Optional visual fit guide</h4>
                      <p className="text-xs text-muted-foreground">
                        Supporting ease preference only — never a substitute for measurements. Leave off if not useful.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {CURATED_FIT_CHOICES[audience].map((choice) => {
                        const selected = profile.fitChoices.some((item) => item.label === choice.label);
                        return (
                          <button
                            key={choice.label}
                            type="button"
                            disabled={disabled}
                            aria-pressed={selected}
                            onClick={() => updateProfile(audience, {
                              fitChoices: selected
                                ? profile.fitChoices.filter((item) => item.label !== choice.label)
                                : [...profile.fitChoices, { ...choice, id: freshLocalId(), position: profile.fitChoices.length }],
                            })}
                            className={cn(
                              "flex min-h-24 items-center gap-3 rounded-lg border p-3 text-left",
                              selected ? "border-primary bg-primary/5" : "hover:border-primary/50",
                            )}
                          >
                            <FitFigure selected={selected} />
                            <span>
                              <span className="block text-sm font-medium">{choice.label}</span>
                              <span className="mt-1 block text-xs text-muted-foreground">{choice.description}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      })}

      <div className="rounded-lg border bg-muted/30 p-3 text-sm" data-testid="sizing-summary">
        <p className="font-medium">Sizing configured</p>
        <ul className="mt-1 space-y-0.5 text-muted-foreground">
          {summaryLines.map((line) => (
            <li key={line} className="capitalize">{line}</li>
          ))}
          {value.some((profile) => profile.fitChoices.length > 0) ? (
            <li>Fit guide: Optional</li>
          ) : (
            <li>Fit guide: Off</li>
          )}
        </ul>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

function measurementsPreservingAudience(
  source: ProductSizeProfile,
  audience: ProductAudience,
  category: string,
) {
  return applyProductTypeToProfile(
    { ...source, audience },
    category,
    source.productType,
  ).measurementDefinitions;
}

function StepHeader({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">Step {step}</p>
      <h4 className="text-sm font-semibold">{title}</h4>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ProductTypePicker({
  options,
  value,
  onChange,
  disabled,
}: {
  options: ReturnType<typeof productTypesForCategory>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
            value === option.value ? "border-primary bg-primary/5 font-medium" : "bg-background hover:border-primary/40",
          )}
        >
          {option.label}
          {!option.sizingApplicable && (
            <span className="mt-1 block text-xs font-normal text-muted-foreground">No size chart needed</span>
          )}
        </button>
      ))}
    </div>
  );
}

export default ProductSizingEditor;
