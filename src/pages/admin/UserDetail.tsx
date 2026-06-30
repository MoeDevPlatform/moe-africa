import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { adminService, type AdminUserDetail } from "@/lib/apiServices";
import { useCategories } from "@/contexts/CategoriesContext";

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-border/60 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="col-span-2 text-sm">{value ?? "—"}</span>
  </div>
);

type EditForm = {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  category: string;
  city: string;
  state: string;
  about: string;
};

const UserDetailPage = () => {
  const { id } = useParams();
  const { categories } = useCategories();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    category: "",
    city: "",
    state: "",
    about: "",
  });

  const loadUser = () => {
    if (!id) return;
    setIsLoading(true);
    adminService
      .getUser(Number(id))
      .then((data) => {
        setUser(data);
        setForm({
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          businessName: data.artisanProfile?.businessName ?? "",
          category: data.artisanProfile?.category ?? "",
          city: data.artisanProfile?.city ?? "",
          state: data.artisanProfile?.state ?? "",
          about: data.artisanProfile?.about ?? "",
        });
      })
      .catch((e: { status?: number; message?: string }) => {
        if (e?.status === 404) setNotFound(true);
        else toast.error(e?.message || "Failed to load user");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startEdit = () => setIsEditing(true);

  const cancelEdit = () => {
    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        businessName: user.artisanProfile?.businessName ?? "",
        category: user.artisanProfile?.category ?? "",
        city: user.artisanProfile?.city ?? "",
        state: user.artisanProfile?.state ?? "",
        about: user.artisanProfile?.about ?? "",
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!id || !user) return;
    setSaving(true);
    const body: Record<string, string> = {};
    if (form.name.trim() !== user.name) body.name = form.name.trim();
    if (form.email.trim() !== user.email) body.email = form.email.trim();
    if ((form.phone.trim() || "") !== (user.phone || "")) body.phone = form.phone.trim();

    if (user.artisanProfile) {
      if (form.businessName.trim() !== (user.artisanProfile.businessName || "")) {
        body.businessName = form.businessName.trim();
      }
      if (form.category !== (user.artisanProfile.category || "")) body.category = form.category;
      if (form.city.trim() !== (user.artisanProfile.city || "")) body.city = form.city.trim();
      if (form.state.trim() !== (user.artisanProfile.state || "")) body.state = form.state.trim();
      if (form.about.trim() !== (user.artisanProfile.about || "")) body.about = form.about.trim();
    }

    try {
      const updated = await adminService.updateUser(Number(id), body);
      setUser(updated);
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const isArtisan = (user?.roles ?? []).includes("artisan");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/admin/users"><ArrowLeft className="h-4 w-4" /> Back to users</Link>
        </Button>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : notFound ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">User not found.</CardContent></Card>
        ) : user ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {user.avatarUrl ? (
                  <img loading="lazy" decoding="async" src={user.avatarUrl} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-display">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-display font-bold">{user.name}</h1>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(user.roles ?? []).map((r) => (
                      <Badge key={r} variant="outline" className="capitalize">{r}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            {isEditing ? (
              <Card>
                <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  {isArtisan && (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Business Name</Label>
                          <Input
                            value={form.businessName}
                            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={form.category}
                            onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input
                            value={form.city}
                            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>State</Label>
                          <Input
                            value={form.state}
                            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>About / Description</Label>
                        <Textarea
                          value={form.about}
                          onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
                          rows={4}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Account</CardTitle></CardHeader>
                  <CardContent>
                    <Row label="ID" value={user.id} />
                    <Row label="Phone" value={user.phone} />
                    <Row label="Google linked" value={user.googleId ? "Yes" : "No"} />
                    <Row label="Joined" value={new Date(user.createdAt).toLocaleString()} />
                    <Row label="Updated" value={new Date(user.updatedAt).toLocaleString()} />
                  </CardContent>
                </Card>

                {user.artisanProfile && (
                  <Card>
                    <CardHeader><CardTitle>Artisan profile</CardTitle></CardHeader>
                    <CardContent>
                      <Row label="Brand" value={user.artisanProfile.brandName} />
                      <Row label="Business" value={user.artisanProfile.businessName} />
                      <Row label="Status" value={
                        <Badge
                          variant={user.artisanProfile.status === "approved" ? "default"
                            : user.artisanProfile.status === "rejected" ? "destructive" : "secondary"}
                          className="capitalize"
                        >{user.artisanProfile.status}</Badge>
                      } />
                      <Row label="Category" value={user.artisanProfile.category} />
                      <Row label="City" value={user.artisanProfile.city} />
                      <Row label="State" value={user.artisanProfile.state} />
                      <Row label="About" value={user.artisanProfile.about} />
                      <div className="pt-3">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/admin/artisans/${user.id}`}>Open artisan profile</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {user.customerProfile && (
                  <Card>
                    <CardHeader><CardTitle>Customer addresses</CardTitle></CardHeader>
                    <CardContent>
                      {Array.isArray(user.customerProfile.addresses) && user.customerProfile.addresses.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {user.customerProfile.addresses.map((a: unknown, i) => (
                            <li key={i} className="rounded-md border border-border p-3">
                              <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(a, null, 2)}</pre>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No saved addresses.</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default UserDetailPage;
