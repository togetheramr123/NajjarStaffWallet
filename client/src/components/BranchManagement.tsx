import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Edit, Trash2, Users, Loader2 } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  employeeNumber: string;
  role: string;
  branchId: string | null;
}

export default function BranchManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [newBranch, setNewBranch] = useState({ name: "", code: "" });

  const { data: branches, isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createBranchMutation = useMutation({
    mutationFn: async (data: { name: string; code: string }) => {
      const res = await apiRequest("POST", "/api/branches", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      setIsAddDialogOpen(false);
      setNewBranch({ name: "", code: "" });
      toast({ title: "تم إنشاء الفرع بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; code: string } }) => {
      const res = await apiRequest("PATCH", `/api/branches/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      setEditingBranch(null);
      toast({ title: "تم تحديث الفرع بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/branches/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({ title: "تم حذف الفرع بنجاح" });
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const getBranchEmployeesCount = (branchId: string) => {
    return employees?.filter((e) => e.branchId === branchId).length || 0;
  };

  const getBranchManagersCount = (branchId: string) => {
    return employees?.filter((e) => e.branchId === branchId && e.role === "branch_manager").length || 0;
  };

  const handleCreateBranch = () => {
    if (!newBranch.name || !newBranch.code) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    createBranchMutation.mutate(newBranch);
  };

  const handleUpdateBranch = () => {
    if (!editingBranch || !editingBranch.name || !editingBranch.code) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    updateBranchMutation.mutate({
      id: editingBranch.id,
      data: { name: editingBranch.name, code: editingBranch.code },
    });
  };

  if (branchesLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          إدارة الفروع
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-branch">
              <Plus className="h-4 w-4 ml-2" />
              إضافة فرع
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة فرع جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="branch-name">اسم الفرع</Label>
                <Input
                  id="branch-name"
                  data-testid="input-branch-name"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  placeholder="مثال: فرع القاهرة"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch-code">كود الفرع</Label>
                <Input
                  id="branch-code"
                  data-testid="input-branch-code"
                  value={newBranch.code}
                  onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
                  placeholder="مثال: CAI"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleCreateBranch}
                disabled={createBranchMutation.isPending}
                data-testid="button-confirm-add-branch"
              >
                {createBranchMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : null}
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {branches?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد فروع بعد</p>
            <p className="text-sm">أضف فرعاً جديداً للبدء</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {branches?.map((branch) => (
                <div
                  key={branch.id}
                  className="p-4 rounded-lg border bg-card flex items-center justify-between gap-4 flex-wrap"
                  data-testid={`card-branch-${branch.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold" data-testid={`text-branch-name-${branch.id}`}>
                          {branch.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {branch.code}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {getBranchEmployeesCount(branch.id)} موظف
                        </span>
                        <span>
                          {getBranchManagersCount(branch.id)} مدير فرع
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog
                      open={editingBranch?.id === branch.id}
                      onOpenChange={(open) => !open && setEditingBranch(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingBranch(branch)}
                          data-testid={`button-edit-branch-${branch.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>تعديل الفرع</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-branch-name">اسم الفرع</Label>
                            <Input
                              id="edit-branch-name"
                              value={editingBranch?.name || ""}
                              onChange={(e) =>
                                setEditingBranch(editingBranch ? { ...editingBranch, name: e.target.value } : null)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-branch-code">كود الفرع</Label>
                            <Input
                              id="edit-branch-code"
                              value={editingBranch?.code || ""}
                              onChange={(e) =>
                                setEditingBranch(editingBranch ? { ...editingBranch, code: e.target.value } : null)
                              }
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingBranch(null)}>
                            إلغاء
                          </Button>
                          <Button onClick={handleUpdateBranch} disabled={updateBranchMutation.isPending}>
                            {updateBranchMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            ) : null}
                            حفظ
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          data-testid={`button-delete-branch-${branch.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            سيتم حذف الفرع "{branch.name}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteBranchMutation.mutate(branch.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
