import type { Period } from '@/domain/cycle/types';

export interface PeriodRepository {
  subscribe(
    userId: string,
    onPeriods: (periods: Period[]) => void,
    onError: (error: Error) => void,
  ): () => void;
  create(userId: string, startDate: string): Promise<void>;
  update(userId: string, period: Period): Promise<void>;
  remove(userId: string, periodId: string): Promise<void>;
}
