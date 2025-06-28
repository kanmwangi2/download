// Force dynamic rendering for all pages under /app to avoid prerendering issues
export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}