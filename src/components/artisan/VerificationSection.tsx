import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  verificationService,
  type VerificationDocument,
  type VerificationDocumentType,
} from "@/lib/apiServices";

const DOC_LABELS: Record<VerificationDocumentType, string> = {
  cac: "CAC registration",
  id: "Government ID",
  address_proof: "Proof of address",
  other: "Other document",
};

const statusBadge = (status: VerificationDocument["status"]) => {
  if (status === "approved") return <Badge className="bg-green-600">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary">Pending review</Badge>;
};

const VerificationSection = () => {
  const [docs, setDocs] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState<VerificationDocumentType>("cac");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    verificationService
      .listMine()
      .then(setDocs)
      .catch(() => toast.error("Could not load verification documents"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await verificationService.upload(docType, file);
      toast.success("Document uploaded");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Account verification
        </CardTitle>
        <CardDescription>
          Upload business documents so customers can trust your storefront. MoE admins review uploads manually.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="space-y-2 flex-1">
            <Label>Document type</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as VerificationDocumentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DOC_LABELS) as VerificationDocumentType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {DOC_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload document
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-3">
            {docs.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">{DOC_LABELS[doc.type] ?? doc.type}</p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {new Date(doc.uploadedAt).toLocaleString()}
                  </p>
                  {doc.adminNotes ? (
                    <p className="text-xs mt-2 text-amber-800 dark:text-amber-200">
                      Admin note: {doc.adminNotes}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(doc.status)}
                  {doc.fileUrl ? (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                        View
                      </a>
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationSection;
