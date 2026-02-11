import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE } from 'i18n';

/**
 * Root path: redirect to default locale so the app is accessible at /
 */
export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}`);
}
