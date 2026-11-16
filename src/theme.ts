import { createTheme } from '@mantine/core';
import type { DatesProviderSettings } from '@mantine/dates';

/** Tema Mantine a aplicației; culorile stărilor se definesc aici, o singură dată. */
export const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
});

/** Datele și calendarele în română, cu săptămâna începând luni. */
export const DATES_SETTINGS: DatesProviderSettings = { locale: 'ro', firstDayOfWeek: 1 };
