/**
 * Momentul față de care se calculează stările din datele mock (mentenanța în curs, certificările
 * expirate). Implicit este ora curentă; cu `VITE_MOCK_NOW` (de exemplu `2026-11-20T10:00:00+02:00`,
 * în timpul calibrării SEM) se poate arăta o resursă în mentenanță la demo.
 */
export function catalogMoment(): Date {
  const configured = import.meta.env.VITE_MOCK_NOW;
  return configured ? new Date(configured) : new Date();
}
