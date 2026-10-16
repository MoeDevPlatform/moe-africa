import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { X, Send } from "lucide-react";
import { toast } from "sonner";
import { customOrderService, validateUploadFile, UPLOAD_ACCEPT_ATTR } from "@/lib/apiServices";
import { useAuth } from "@/contexts/AuthContext";
import { customCategory, minimumDeadline, validateCustomOrder } from "@/lib/customOrderForm";

export interface CustomOrderRequestModalProps { open: boolean; onOpenChange: (open: boolean) => void; artisanId: number; artisanName: string; category?: string }

export default function CustomOrderRequestModal({ open, onOpenChange, artisanId, artisanName, category = "" }: CustomOrderRequestModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState("");
  const [instructions, setInstructions] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({ footSizeUnit: "EU" });
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [readingImages, setReadingImages] = useState(false);
  const kind = customCategory(category);
  useEffect(() => {
    if (open) return;
    setDescription(""); setBudgetMin(""); setBudgetMax(""); setDeadline(""); setInstructions("");
    setDetails({ footSizeUnit: "EU" }); setImages([]); setErrors({});
  }, [open, artisanId]);
  const updateDetail = (key: string, value: string) => setDetails((prev) => ({ ...prev, [key]: value }));
  const errorFor = (key: string) => errors[key] ? <p id={`co-${key}-error`} role="alert" className="text-xs text-destructive">{errors[key]}</p> : null;
  const field = (key: string, label: string, type = "text", placeholder?: string) => <div key={key} className="space-y-2"><Label htmlFor={`co-${key}`}>{label}</Label><Input id={`co-${key}`} type={type} value={details[key] ?? ""} onChange={(e) => updateDetail(key, e.target.value)} placeholder={placeholder} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} maxLength={key === "engraving" ? 30 : 200} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `co-${key}-error` : undefined} />{errorFor(key)}</div>;
  const dropdown = (key: string, label: string, options: string[]) => <div className="space-y-2"><Label htmlFor={`co-${key}`}>{label}</Label><Select value={details[key] || ""} onValueChange={(value) => updateDetail(key, value)}><SelectTrigger id={`co-${key}`}><SelectValue placeholder="Select preference" /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem value={option} key={option}>{option}</SelectItem>)}</SelectContent></Select></div>;
  const addImages = async (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    if (images.length + selected.length > 3) { setErrors((prev) => ({ ...prev, images: "Choose no more than 3 reference images." })); return; }
    setReadingImages(true);
    try {
      selected.forEach(validateUploadFile);
      const next = await Promise.all(selected.map((file) => new Promise<{ name: string; url: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve({ name: file.name, url: reader.result }) : reject(new Error("Could not read image."));
        reader.onerror = () => reject(new Error("Could not read image."));
        reader.readAsDataURL(file);
      })));
      setImages((prev) => [...prev, ...next]); setErrors((prev) => ({ ...prev, images: "" }));
    } catch (err) { setErrors((prev) => ({ ...prev, images: err instanceof Error ? err.message : "Could not read image." })); }
    finally { setReadingImages(false); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = validateCustomOrder({ description, budgetMin, budgetMax, deadline, details, imageCount: images.length });
    setErrors(next);
    if (Object.keys(next).length) return;
    if (!user) { navigate("/auth"); return; }
    setSubmitting(true);
    try {
      await customOrderService.createCommission({ artisanId, description: description.trim(), referenceImages: images.map((image) => image.url), budgetMin: budgetMin ? Number(budgetMin) : undefined, budgetMax: budgetMax ? Number(budgetMax) : undefined, deadline: deadline || undefined, specialInstructions: instructions.trim() || undefined, category, categoryDetails: Object.fromEntries(Object.entries(details).filter(([, value]) => value.trim())) });
      toast.success(`Your custom order request has been sent to ${artisanName}. They will respond within 48 hours.`);
      onOpenChange(false);
    } catch (err) { setErrors((prev) => ({ ...prev, submit: err instanceof Error ? err.message : "Could not send custom order request." })); }
    finally { setSubmitting(false); }
  };
  return <Dialog open={open} onOpenChange={(value) => { if (!submitting) onOpenChange(value); }}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Request a custom order</DialogTitle><DialogDescription>{artisanName}</DialogDescription></DialogHeader><form onSubmit={submit} noValidate className="space-y-6">
    <div className="space-y-2"><Label htmlFor="co-description">Project description *</Label><Textarea id="co-description" data-testid="custom-order-description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe exactly what you want in as much detail as possible" aria-invalid={!!errors.description} aria-describedby="co-description-error" /><p className="text-xs text-muted-foreground">{description.trim().length}/50 minimum</p>{errorFor("description")}</div>
    <div className="space-y-2"><Label htmlFor="co-images">Reference images (optional, max 3)</Label><Input id="co-images" type="file" accept={UPLOAD_ACCEPT_ATTR} multiple disabled={readingImages || submitting} onChange={(e) => { void addImages(e.target.files); e.target.value = ""; }} />{errorFor("images")}<div className="flex gap-3 flex-wrap">{images.map((image, i) => <div key={`${image.name}-${i}`} className="relative"><img src={image.url} alt={`Reference: ${image.name}`} className="h-20 w-20 rounded-lg object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }} /><Button type="button" size="icon" variant="secondary" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" aria-label={`Remove ${image.name}`} onClick={() => setImages((prev) => prev.filter((_, index) => index !== i))}><X className="h-3 w-3" /></Button></div>)}</div></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{(["budgetMin", "budgetMax"] as const).map((key) => <div key={key} className="space-y-2"><Label htmlFor={`co-${key}`}>{key === "budgetMin" ? "Min ₦" : "Max ₦"} (optional)</Label><Input id={`co-${key}`} type="number" min={0} step="any" value={key === "budgetMin" ? budgetMin : budgetMax} onChange={(e) => (key === "budgetMin" ? setBudgetMin : setBudgetMax)(e.target.value)} aria-invalid={!!errors[key]} />{errorFor(key)}</div>)}</div>
    <div className="space-y-2"><Label htmlFor="co-deadline">Deadline (optional)</Label><Input id="co-deadline" type="date" min={minimumDeadline()} value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-invalid={!!errors.deadline} />{errorFor("deadline")}</div>
    {kind !== "other" && <fieldset className="space-y-4 border-t pt-6"><legend className="font-semibold px-1">Project details</legend><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {kind === "tailoring" && <>{dropdown("occasion", "Occasion", ["Casual", "Work", "Wedding", "Traditional", "Graduation", "Other"])}{field("fabric", "Fabric preference", "text", "Ankara, blue and gold pattern")}{[ ["chest", "Chest"], ["waist", "Waist"], ["hips", "Hips"], ["shoulderWidth", "Shoulder width"], ["sleeveLength", "Sleeve length"], ["trouserLength", "Trouser length"] ].map(([key, label]) => field(key, `${label} (cm)`, "number"))}{field("lining", "Lining preference (optional)")}</>}
      {kind === "shoemaking" && <>{field("footSize", "Foot size", "number")}<div className="space-y-2"><Label>Size unit</Label><ToggleGroup type="single" variant="outline" value={details.footSizeUnit} onValueChange={(value) => { if (value) updateDetail("footSizeUnit", value); }} aria-label="Foot size unit">{["EU", "UK", "US"].map((unit) => <ToggleGroupItem key={unit} value={unit} aria-label={`${unit} size`}>{unit}</ToggleGroupItem>)}</ToggleGroup></div>{dropdown("sole", "Sole preference", ["Rubber", "Leather", "Foam", "No preference"])}{field("colour", "Colour preference")}</>}
      {kind === "jewellery" && <>{dropdown("type", "Type", ["Ring", "Bracelet", "Necklace", "Earrings", "Other"])}{dropdown("metal", "Metal preference", ["Gold", "Silver", "Rose Gold", "Brass", "No preference"])}{field("size", "Ring size / circumference (mm, optional)", "number")}{field("engraving", "Engraving text (optional, max 30)")}</>}
      {kind === "leatherwork" && <>{field("itemType", "Item type", "text", "Wallet, belt, bag")}{field("colour", "Colour preference")}{field("dimensions", "Size or dimensions")}{dropdown("hardware", "Hardware preference", ["Gold", "Silver", "Black", "No preference"])}</>}
      {kind === "home" && <>{field("width", "Width (cm)", "number")}{field("height", "Height (cm)", "number")}{field("depth", "Depth (cm)", "number")}{field("colourScheme", "Colour scheme")}{field("placement", "Room or placement (optional)")}</>}
    </div></fieldset>}
    <div className="space-y-2"><Label htmlFor="co-instructions">Special instructions (optional)</Label><Textarea id="co-instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} /></div>{errorFor("submit")}
    <DialogFooter><Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" data-testid="submit-custom-order-btn" disabled={submitting || readingImages}><Send className="h-4 w-4 mr-2" />{submitting ? "Sending…" : "Submit request"}</Button></DialogFooter>
  </form></DialogContent></Dialog>;
}