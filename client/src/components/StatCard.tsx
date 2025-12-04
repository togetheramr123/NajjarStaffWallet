import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-chart-3 text-white',
  warning: 'bg-chart-4 text-black',
  danger: 'bg-destructive text-destructive-foreground',
};

export default function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  trend,
  variant = 'default'
}: StatCardProps) {
  const isPrimary = variant !== 'default';

  return (
    <Card className={`${variantStyles[variant]} ${isPrimary ? 'border-0' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className={`text-sm font-medium ${isPrimary ? 'opacity-90' : 'text-muted-foreground'}`}>
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${isPrimary ? 'opacity-80' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`text-stat-${title}`}>
          {typeof value === 'number' ? value.toLocaleString('ar-SA') : value}
        </div>
        {description && (
          <p className={`text-xs mt-1 ${isPrimary ? 'opacity-75' : 'text-muted-foreground'}`}>
            {description}
          </p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? 'text-chart-3' : 'text-destructive'}`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% من الشهر الماضي
          </p>
        )}
      </CardContent>
    </Card>
  );
}
