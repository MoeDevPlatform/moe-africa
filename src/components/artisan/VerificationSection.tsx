import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Upload, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  verificationService,
  VERIFICATION_ACCEPT_ATTR,
  type VerificationDocument,
  type VerificationDocumentType,
} from "@/lib/apiServices";
import {
  documentKey,
  documentationScore,
  groupDocuments,
  uploadDecision,
  type BusinessType,
} from "@/lib/verificationRules";
import { useAuth } from "@/contexts/AuthContext";

const DOC_LABELS: Record<VerificationDocumentType, string> = {
  cac: "CAC registration",
  id: "Government ID",
  address_proof: "Proof of address",
  other: "Other document",
};

const GUIDANCE: Record<VerificationDocumentType, { purpose: string; steps: string[]; rejections: string[] }> = {
  id: {
    purpose: "Confirms the identity of the person running this storefront.",
    steps: ["Use a valid National ID, passport, driver's licence or voter's card.", "Photograph the full card on a flat surface in good light.", "Make sure your name, photo and expiry date are readable."],
    rejections: ["Expired document", "Blurry or cropped photo", "Name doesn't match your account"],
  },
  address_proof: {
    purpose: "Confirms where your business operates.",
    steps: ["Use a utility bill, bank statement or tenancy agreement from the last 3 months.", "Your name and address must be visible."],
    rejections: ["Older than 3 months", "Address not visible", "Different name with no explanation"],
  },
  cac: {
    purpose: "Confirms your business is registered with the Corporate Affairs Commission. Only needed for registered businesses.",
    steps: ["Upload the CAC certificate or status report.", "The business name and RC/BN number must be readable."],
    rejections: ["Business name doesn't match your storefront", "Registration number unreadable", "Partial page"],
  },
  other: {
    purpose: "Any extra supporting document, such as a trade licence or certification.",
    steps: ["Give the document a clear name, e.g. \"Tailoring guild certificate\".", "Upload one file per document."],
    rejections: ["Missing or unclear name", "Unrelated to your business", "Unreadable file"],
  },
};

/** Illustrative template only — not a real document. */
const SampleIllustration = ({ label }: { label: string }) => (
  <svg viewBox="0 0 240 150" role="img" aria-label={`Sample illustration of a ${label}, not a real document`} className="w-full max-w-[240px] rounded-md border bg-muted">
    <rect x="12" y="14" width="56" height="68" rx="4" className="fill-muted-foreground/20" />
    {[20, 36, 52, 68].map((y) => <rect key={y} x="80" y={y} width={y === 20 ? 120 : 140} height="8" rx="3" className="fill-muted-foreground/25" />)}
    <rect x="12" y="100" width="216" height="8" rx="3" className="fill-muted-foreground/20" />
    <rect x="12" y="116" width="160" height="8" rx="3" className="fill-muted-foreground/20" />
    <text x="120" y="88" textAnchor="middle" transform="rotate(-18 120 88)" className="fill-destructive/70" fontSize="30" fontWeight="700">SAMPLE</text>
  </svg>
);

const statusBadge = (status: VerificationDocument["status"]) => {
  if (status === "approved") return <Badge className="bg-primary text-primary-foreground">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary">Pending review</Badge>;
};

const docTitle = (d: VerificationDocument) => (d.type === "other" && d.documentName ? d.documentName : DOC_LABELS[d.type] ?? d.type);

const VerificationSection = () => {
  const { user } = useAuth();
  const btKey = `moe_business_type:${user?.id ?? "anon"}`;
  const [businessType, setBusinessType] = useState<BusinessType>(() => (localStorage.getItem(btKey) as BusinessType) || "individual");
  const [docs, setDocs] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<VerificationDocumentType>("id");
  const [docName, setDocName] = useState("");
  const [uploading, setUploading] = useState(false);
  const inFlight = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    verificationService.listMine().then(setDocs).catch(() => toast.error("Could not load verification documents")).finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => localStorage.setItem(btKey, businessType), [btKey, businessType]);

  const currentKey = documentKey(docType, docName);
  const decision = docType === "other" && !docName.trim() ? null : uploadDecision(docs, currentKey);
  const score = documentationScore(docs, businessType);
  const groups = groupDocuments(docs);

  const startUpload = (type: VerificationDocumentType, name = "") => {
    setDocType(type);
    setDocName(name);
    requestAnimationFrame(() => fileRef.current?.click());
  };

  const handleUpload = async (file: File) => {
    // Lock synchronously so double clicks / repeated change events can't send a second request.
    if (inFlight.current) return;
    const d = uploadDecision(docs, currentKey);
    if (!d.allowed) { toast.error(d.reason); return; }
    if (docType === "other" && !docName.trim()) { toast.error("Enter a document name first"); return; }
    inFlight.current = true;
    setUploading(true);
    try {
      const created = await verificationService.upload(docType, file, docType === "other" ? { documentName: docName.trim(), documentKey: currentKey } : undefined);
      // Merge the one created record, then reconcile with the server list (deduped by id).
      setDocs((prev) => [...prev.filter((x) => x.id !== created.id), created]);
      toast.success(d.replace ? "Replacement submitted for review" : "Document uploaded");
      if (docType === "other") setDocName("");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      inFlight.current = false;
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const guide = GUIDANCE[docType];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Documentation verification — {score.percent}%</CardTitle>
          <CardDescription>
            Separate from profile completion. This percentage doesn't grant a verified badge — MOE admins decide that.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="business-type">I am registering as</Label>
            <Select value={businessType} onValueChange={(v) => setBusinessType(v as BusinessType)}>
              <SelectTrigger id="business-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual artisan</SelectItem>
                <SelectItem value="registered_business">Registered business</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Progress value={score.percent} aria-label="Documentation verification" />
          <p className="text-sm text-muted-foreground">
            {score.approved} of {score.total} required documents approved · {score.pending} pending · {score.rejected} rejected.
            Each required document counts equally and only approved documents count. Other documents are optional and don't change the score.
          </p>
          <ul className="grid gap-2 sm:grid-cols-3">
            {score.items.map((i) => (
              <li key={i.type} className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
                <span>{DOC_LABELS[i.type]}</span>
                {i.status === "not_submitted" ? <Badge variant="outline">Not submitted</Badge> : statusBadge(i.status)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Upload a document</CardTitle>
          <CardDescription>MOE admins review uploads manually. JPEG, PNG, WebP or PDF, up to 5MB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="doc-type">Document type</Label>
              <Select value={docType} onValueChange={(v) => { setDocType(v as VerificationDocumentType); setDocName(""); }}>
                <SelectTrigger id="doc-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(DOC_LABELS) as VerificationDocumentType[]).map((t) => <SelectItem key={t} value={t}>{DOC_LABELS[t]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {docType === "other" ? (
              <div className="space-y-2">
                <Label htmlFor="doc-name">Document name (required)</Label>
                <Input id="doc-name" value={docName} maxLength={80} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. Trade licence" />
              </div>
            ) : <div className="hidden sm:block" />}
            <input ref={fileRef} type="file" accept={VERIFICATION_ACCEPT_ATTR} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f); }} />
            <Button type="button" variant="outline" className="gap-2" disabled={uploading || !decision?.allowed} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : decision?.allowed && decision.replace ? <RefreshCw className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              {decision?.allowed && decision.replace ? "Replace document" : "Upload document"}
            </Button>
          </div>
          {decision && !decision.allowed ? <p className="text-sm text-muted-foreground">{decision.reason}</p> : null}

          <Accordion type="single" collapsible>
            <AccordionItem value="guide">
              <AccordionTrigger>How to prepare: {DOC_LABELS[docType]}</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
                  <div className="space-y-3 text-sm">
                    <p>{guide.purpose}</p>
                    <ol className="list-decimal space-y-1 pl-5">{guide.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                    <p className="text-muted-foreground">Accepted: JPEG, PNG, WebP or PDF · max 5MB · one file per upload.</p>
                    <div>
                      <p className="font-medium">Common reasons for rejection</p>
                      <ul className="list-disc pl-5 text-muted-foreground">{guide.rejections.map((r) => <li key={r}>{r}</li>)}</ul>
                    </div>
                  </div>
                  <figure className="space-y-1">
                    <SampleIllustration label={DOC_LABELS[docType]} />
                    <figcaption className="text-xs text-muted-foreground">Illustration only — not a real document.</figcaption>
                  </figure>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your documents</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-3">
              {groups.map(({ key, active, history }) => (
                <li key={key} className="space-y-2 rounded-lg border p-3" data-testid="verification-doc">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{docTitle(active)}</p>
                      <p className="text-xs text-muted-foreground">Uploaded {new Date(active.uploadedAt).toLocaleString()}</p>
                      {active.status === "rejected" && active.adminNotes ? (
                        <p className="mt-2 text-xs text-destructive">Reason: {active.adminNotes}</p>
                      ) : active.adminNotes ? <p className="mt-2 text-xs text-muted-foreground">Admin note: {active.adminNotes}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(active.status)}
                      {active.fileUrl ? <a href={active.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">View</a> : null}
                      {active.status === "rejected" ? (
                        <Button size="sm" variant="outline" disabled={uploading} onClick={() => startUpload(active.type, active.documentName ?? "")}>
                          <RefreshCw className="mr-1 h-3.5 w-3.5" />Replace document
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {history.length > 0 ? (
                    <p className="text-xs text-muted-foreground">{history.length} earlier submission{history.length === 1 ? "" : "s"} kept for review history.</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationSection;
