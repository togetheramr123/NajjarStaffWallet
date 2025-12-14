import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CheckCircle, XCircle, FileText, Calendar, User, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WithdrawalRequest {
  id: string;
  amount: number;
  beneficiary?: "self" | "family";
  status: "pending" | "approved" | "rejected";
  description?: string;
  createdAt: string;
  processedAt?: string;
  processingNotes?: string;
  hasAttachment?: boolean;
  attachmentPath?: string;
  createdOnBehalfBy?: string | null;
}

interface RequestTrackerProps {
  requests: WithdrawalRequest[];
  onViewAttachment?: (path: string) => void;
}

const statusConfig = {
  pending: {
    label: "قيد المراجعة",
    icon: Clock,
    variant: "secondary" as const,
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  approved: {
    label: "تمت الموافقة",
    icon: CheckCircle,
    variant: "default" as const,
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
  },
  rejected: {
    label: "مرفوض",
    icon: XCircle,
    variant: "destructive" as const,
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    iconColor: "text-red-600 dark:text-red-400",
  },
};

const beneficiaryLabels = {
  self: "شخصي",
  family: "عائلي",
};

export default function RequestTracker({ requests, onViewAttachment }: RequestTrackerProps) {
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-yellow-600 dark:text-yellow-400 mb-2" />
            <p className="text-2xl font-bold" data-testid="text-pending-count">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">قيد المراجعة</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto text-green-600 dark:text-green-400 mb-2" />
            <p className="text-2xl font-bold" data-testid="text-approved-count">{approvedCount}</p>
            <p className="text-sm text-muted-foreground">تمت الموافقة</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 mx-auto text-red-600 dark:text-red-400 mb-2" />
            <p className="text-2xl font-bold" data-testid="text-rejected-count">{rejectedCount}</p>
            <p className="text-sm text-muted-foreground">مرفوض</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            طلباتي
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد طلبات سحب</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {requests.map((request) => {
                  const config = statusConfig[request.status];
                  const StatusIcon = config.icon;
                  
                  return (
                    <div
                      key={request.id}
                      className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                      data-testid={`card-request-${request.id}`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${config.bgColor}`}>
                            <StatusIcon className={`h-5 w-5 ${config.iconColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-lg" data-testid={`text-amount-${request.id}`}>
                                {request.amount.toLocaleString("ar-EG")} ج.م
                              </span>
                              <Badge variant={config.variant} className="text-xs">
                                {config.label}
                              </Badge>
                              {request.createdOnBehalfBy && (
                                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300" data-testid={`badge-on-behalf-${request.id}`}>
                                  المدير عمل طلب بالنيابه عنك
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(request.createdAt).toLocaleDateString("ar-EG")}
                              </span>
                              {request.beneficiary && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {beneficiaryLabels[request.beneficiary]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {request.hasAttachment && request.attachmentPath && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewAttachment?.(request.attachmentPath!)}
                            data-testid={`button-view-attachment-${request.id}`}
                          >
                            <FileText className="h-4 w-4 ml-1" />
                            عرض المرفق
                          </Button>
                        )}
                      </div>

                      {request.processingNotes && (
                        <div className="mt-3 pt-3 border-t border-current/10">
                          <p className="text-sm">
                            <span className="font-medium">ملاحظات: </span>
                            {request.processingNotes}
                          </p>
                        </div>
                      )}

                      {request.processedAt && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          تم المعالجة: {new Date(request.processedAt).toLocaleDateString("ar-EG")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
