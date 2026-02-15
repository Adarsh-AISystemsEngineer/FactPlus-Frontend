import { Skeleton } from "@/components/ui/skeleton";

export function ChatMessageSkeleton() {
  return (
    <div className="flex justify-start mb-4">
      <div className="space-y-2 w-full">
        <Skeleton className="h-16 w-2/3 rounded-2xl" />
      </div>
    </div>
  );
}

export function AnalysisResultSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function ChatHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-white/10">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  );
}

export function SidebarChatSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}
