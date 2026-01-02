/**
 * Skeleton Loader Components
 * Specialized skeleton loaders for different UI elements
 */
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Dashboard Card Skeleton
export const DashboardCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </CardContent>
    </Card>
  );
};

// Table Skeleton
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) => {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-label="Loading table data">
      {/* Header */}
      <div className="flex gap-4 border-b pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              className={cn(
                "h-4 flex-1",
                colIndex === 0 && "w-12 flex-none" // First column narrower
              )} 
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// Student Card Skeleton
export const StudentCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
};

// Chart Skeleton
export const ChartSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("space-y-4", className)} role="status" aria-label="Loading chart">
      <div className="flex h-48 items-end justify-between gap-2">
        {Array.from({ length: 8 }).map((_, i) => {
          const height = Math.random() * 60 + 40; // Random height between 40-100%
          return (
            <Skeleton 
              key={i} 
              className="flex-1 rounded-t" 
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
};

// Assessment Card Skeleton
export const AssessmentCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
};

// Dashboard Grid Skeleton
export const DashboardGridSkeleton = ({ 
  cards = 4,
  className 
}: { 
  cards?: number;
  className?: string;
}) => {
  return (
    <div 
      className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}
      role="status"
      aria-label="Loading dashboard"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <DashboardCardSkeleton key={i} />
      ))}
    </div>
  );
};

// List Item Skeleton
export const ListItemSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-4 border-b p-4", className)}>
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
};

// Profile Skeleton
export const ProfileSkeleton = ({ className }: { className?: string }) => {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
};



