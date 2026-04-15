import { redirect } from 'next/navigation';

/** Legacy URL: preferences and account live under `/app/account`. */
export default async function SettingsRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/app/account`);
}
