import { AppRouter } from '@/routes/router';
import { Toaster } from '@/components/ui/Toaster';

export function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}
