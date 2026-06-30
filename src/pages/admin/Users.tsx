import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Eye, MoreHorizontal, Plus, Search } from "lucide-react";
import {
  adminService,
  type AdminUserRow,
  type Pagination,
  type UserRole,
} from "@/lib/apiServices";
import { useCategories } from "@/contexts/CategoriesContext";

type FilterTab = "all" | UserRole | "suspended";

const Users = () => {
  const { categories } = useCategories();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalPages: 1,
    totalItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "customer" as UserRole,
    temporaryPassword: "",
    businessName: "",
    category: "",
  });

  const [resetResult, setResetResult] = useState<{ id: number; password: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "delete";
    user: AdminUserRow;
  } | null>(null);

  const load = (page = 1, tab: FilterTab = filterTab) => {
    setIsLoading(true);
    const params: { page: number; pageSize: number; role?: UserRole; status?: string } = {
      page,
      pageSize: 20,
    };
    if (tab === "suspended") {
      params.status = "suspended";
    } else if (tab !== "all") {
      params.role = tab;
    }
    adminService
      .listUsers(params)
      .then((res) => {
        setRows(res.data ?? []);
        setPagination(
          res.pagination ?? { page, pageSize: 20, totalPages: 1, totalItems: 0 },
        );
      })
      .catch((e: Error) => toast.error(e?.message || "Failed to load users"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load(1, filterTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTab]);

  const filtered = rows.filter((r) =>
    !search
      ? true
      : r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.temporaryPassword.trim()) {
      toast.error("Name, email, and temporary password are required");
      return;
    }
    if (form.role === "artisan" && !form.businessName.trim()) {
      toast.error("Business name is required for artisans");
      return;
    }
    setCreating(true);
    try {
      await adminService.createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
        temporaryPassword: form.temporaryPassword,
        businessName: form.role === "artisan" ? form.businessName.trim() : undefined,
        category: form.role === "artisan" ? form.category || undefined : undefined,
      });
      toast.success("User created successfully");
      setCreateOpen(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        role: "customer",
        temporaryPassword: "",
        businessName: "",
        category: "",
      });
      load(pagination.page);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (user: AdminUserRow) => {
    try {
      const res = await adminService.resetPassword(user.id);
      setResetResult({ id: user.id, password: res.temporaryPassword });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to reset password");
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, user } = confirmAction;
    try {
      if (type === "suspend") {
        await adminService.setUserStatus(user.id, "suspended");
        toast.success(`${user.name} has been suspended`);
      } else {
        await adminService.deleteUser(user.id);
        toast.success(`${user.name} has been deleted`);
      }
      setConfirmAction(null);
      load(pagination.page);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "customer", label: "Customers" },
    { id: "artisan", label: "Artisans" },
    { id: "admin", label: "Admins" },
    { id: "suspended", label: "Suspended" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Users</h1>
            <p className="mt-1 text-muted-foreground">Manage platform accounts</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={filterTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-input bg-card"
          />
        </div>

        <Card className="border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Artisan status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-sm">{row.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(row.roles ?? []).map((r) => (
                            <Badge key={r} variant="outline" className="capitalize">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.status === "suspended" ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.artisanStatus ? (
                          <Badge variant="outline" className="capitalize">
                            {row.artisanStatus}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild size="sm" variant="ghost">
                            <Link to={`/admin/users/${row.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleResetPassword(row)}>
                                Reset Password
                              </DropdownMenuItem>
                              {row.status === "suspended" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    adminService
                                      .setUserStatus(row.id, "active")
                                      .then(() => {
                                        toast.success(`${row.name} reactivated`);
                                        load(pagination.page);
                                      })
                                      .catch((e: Error) => toast.error(e.message))
                                  }
                                >
                                  Reactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setConfirmAction({ type: "suspend", user: row })
                                  }
                                >
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setConfirmAction({ type: "delete", user: row })}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} total
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => load(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => load(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
              <Label>Phone (optional)</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="artisan">Artisan</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input
                type="text"
                value={form.temporaryPassword}
                onChange={(e) => setForm((f) => ({ ...f, temporaryPassword: e.target.value }))}
              />
            </div>
            {form.role === "artisan" && (
              <>
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
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetResult} onOpenChange={() => setResetResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary password</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            Share this with the user securely:
          </p>
          <Input readOnly value={resetResult?.password ?? ""} className="font-mono" />
          <DialogFooter>
            <Button
              onClick={() => {
                if (resetResult?.password) {
                  navigator.clipboard.writeText(resetResult.password);
                  toast.success("Copied to clipboard");
                }
              }}
            >
              Copy password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "suspend" ? "Suspend user?" : "Delete user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "suspend"
                ? `Suspend ${confirmAction.user.name}? They will not be able to log in until reactivated.`
                : `This permanently deletes ${confirmAction?.user.name} and all their data. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {confirmAction?.type === "suspend" ? "Suspend" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Users;
