import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex h-svh w-full items-center justify-center bg-paper">
      <Loader2 className="size-6 animate-spin text-board" aria-label="Loading" />
    </div>
  );
}
