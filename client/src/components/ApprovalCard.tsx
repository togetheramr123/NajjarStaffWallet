import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Edit3, FileText, Calendar, User, Users } from "lucide-react";
import { useState } from "react";

interface WithdrawalRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  amount: number;
  beneficiary: 'self' | 'family';
  requestDate: string;
  hasAttachment: boolean;
  notes?: string;
}

interface ApprovalCardProps {
  request: WithdrawalRequest;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, reason: string) => void;
  onModify: (id: string, newAmount: number, notes: string) => void;
  onViewAttachment?: (id: string) => void;
}

export default function ApprovalCard({ 
  request, 
  onApprove, 
  onReject, 
  onModify,
  onViewAttachment 
}: ApprovalCardProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [modifyAmount, setModifyAmount] = useState(request.amount.toString());
  const [modifyNotes, setModifyNotes] = useState('');
  const [approveNotes, setApproveNotes] = useState('');

  const initials = request.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base" data-testid={`text-employee-name-${request.id}`}>
                {request.employeeName}
              </CardTitle>
              <p className="text-xs text-muted-foreground">#{request.employeeId}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {request.beneficiary === 'self' ? (
              <><User className="h-3 w-3 ml-1" /> شخصي</>
            ) : (
              <><Users className="h-3 w-3 ml-1" /> للأسرة</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">المبلغ المطلوب</span>
          <span className="text-xl font-bold text-primary" data-testid={`text-amount-${request.id}`}>
            {request.amount.toLocaleString('ar-EG')} ج.م
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" /> تاريخ الطلب
          </span>
          <span>{new Date(request.requestDate).toLocaleDateString('ar-EG')}</span>
        </div>
        {request.notes && (
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-xs text-muted-foreground">{request.notes}</p>
          </div>
        )}
        {request.hasAttachment && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onViewAttachment?.(request.id)}
            data-testid={`button-view-attachment-${request.id}`}
          >
            <FileText className="h-4 w-4 ml-2" />
            عرض المرفق
          </Button>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="flex-1" data-testid={`button-approve-${request.id}`}>
              <Check className="h-4 w-4 ml-1" />
              موافقة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأكيد الموافقة</DialogTitle>
              <DialogDescription>
                الموافقة على طلب سحب {request.amount.toLocaleString('ar-EG')} ج.م للموظف {request.employeeName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="أي ملاحظات..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => onApprove(request.id, approveNotes)}>
                تأكيد الموافقة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" data-testid={`button-modify-${request.id}`}>
              <Edit3 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل الطلب</DialogTitle>
              <DialogDescription>
                تعديل مبلغ طلب السحب للموظف {request.employeeName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>المبلغ الجديد</Label>
                <Input
                  type="number"
                  value={modifyAmount}
                  onChange={(e) => setModifyAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>سبب التعديل</Label>
                <Textarea
                  value={modifyNotes}
                  onChange={(e) => setModifyNotes(e.target.value)}
                  placeholder="اذكر سبب التعديل..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => onModify(request.id, parseFloat(modifyAmount), modifyNotes)}>
                تأكيد التعديل
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" data-testid={`button-reject-${request.id}`}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>رفض الطلب</DialogTitle>
              <DialogDescription>
                رفض طلب سحب {request.amount.toLocaleString('ar-EG')} ج.م للموظف {request.employeeName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>سبب الرفض</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="اذكر سبب رفض الطلب..."
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="destructive" onClick={() => onReject(request.id, rejectReason)}>
                تأكيد الرفض
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
