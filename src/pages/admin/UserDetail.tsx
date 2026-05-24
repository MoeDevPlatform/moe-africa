import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { adminService, type AdminUserDetail } from "@/lib/apiServices";

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-4 py-2 border-b border-border/60 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="col-span-2 text-sm">{value ?? "—"}</span>
  </div>
);

const UserDetailPage = () => {
  const { id } = useParams();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    adminService
      .getUser(Number(id))
      .then(setUser)
      .catch((e: any) => {
        if (e?.status === 404) setNotFound(true);
        else toast.error(e?.message || "Failed to load user");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

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
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
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
                        {user.customerProfile.addresses.map((a: any, i) => (
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
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default UserDetailPage;