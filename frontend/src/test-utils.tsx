import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { LocaleProvider } from 'i18n';

const DEFAULT_LOCALE = 'en';

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider initialLocale={DEFAULT_LOCALE}>
      {children}
    </LocaleProvider>
  );
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: AllTheProviders,
    ...options,
  });
}

export * from '@testing-library/react';
export { customRender as render };
