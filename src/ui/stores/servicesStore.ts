import { create } from 'zustand';
import type { PeriodRepository } from '@/app/ports/PeriodRepository';

interface ServicesState {
  periodRepository: PeriodRepository | null;
}

const useServices = create<ServicesState>(() => ({
  periodRepository: null,
}));

export function initializeServices(periodRepository: PeriodRepository) {
  useServices.setState({ periodRepository });
}

export function usePeriodRepository(): PeriodRepository {
  const repository = useServices((state) => state.periodRepository);
  if (!repository) throw new Error('Period repository is not initialized.');
  return repository;
}
