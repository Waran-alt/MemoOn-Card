/** Product shell (nav, layout) for everything under `/app`. */
import { AppLayoutShell } from '@/components/AppLayoutShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutShell>{children}</AppLayoutShell>;
}
