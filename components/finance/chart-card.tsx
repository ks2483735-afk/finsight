import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  title: string;
  description?: string;
  /** Range tabs / actions rendered at the right of the header. */
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  className?: string;
}

/** Panel wrapper that gives every chart the same frame and header rhythm. */
export function ChartCard({
  title,
  description,
  actions,
  children,
  loading = false,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? <Skeleton className="h-48 w-full" /> : children}
      </CardContent>
    </Card>
  );
}
