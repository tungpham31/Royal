import { Loader2 } from "lucide-react";

export default function AccountsLoading() {
  return (
    <div className="fixed inset-0 bg-background/60 z-50 flex items-center justify-center">
      <div className="flex items-center gap-3 bg-card px-6 py-4 rounded-lg shadow-lg border">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    </div>
  );
}
