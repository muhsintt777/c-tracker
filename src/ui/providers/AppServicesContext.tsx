import { createContext, useContext, type ReactNode } from 'react';
import type { PeriodRepository } from '@/app/ports/PeriodRepository';

const AppServicesContext = createContext<PeriodRepository | null>(null);

export function AppServicesProvider({
  periodRepository,
  children,
}: {
  periodRepository: PeriodRepository;
  children: ReactNode;
}) {
  return (
    <AppServicesContext.Provider value={periodRepository}>
      {children}
    </AppServicesContext.Provider>
  );
}

export function usePeriodRepository(): PeriodRepository {
  const context = useContext(AppServicesContext);
  if (!context) {
    throw new Error(
      'usePeriodRepository must be used inside AppServicesProvider.',
    );
  }
  return context;
}
