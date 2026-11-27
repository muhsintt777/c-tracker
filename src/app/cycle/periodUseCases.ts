import {
  overlapsAnotherPeriod,
  validatePeriod,
} from '@/domain/cycle/calculations';
import type { Period } from '@/domain/cycle/types';
import type { PeriodRepository } from '@/app/ports/PeriodRepository';

function validate(period: Period, periods: Period[], excludedId?: string) {
  const error = validatePeriod(period);
  if (error) throw new Error(error);
  if (overlapsAnotherPeriod(period, periods, excludedId)) {
    throw new Error('This period overlaps another recorded period.');
  }
}

export function subscribeToPeriods(
  repository: PeriodRepository,
  userId: string,
  onPeriods: (periods: Period[]) => void,
  onError: (error: Error) => void,
) {
  return repository.subscribe(userId, onPeriods, onError);
}

export async function startPeriod(
  repository: PeriodRepository,
  userId: string,
  periods: Period[],
  startDate: string,
): Promise<void> {
  validate({ id: 'new-period', startDate, endDate: null }, periods);
  await repository.create(userId, startDate);
}

export async function savePeriod(
  repository: PeriodRepository,
  userId: string,
  periods: Period[],
  period: Period,
): Promise<void> {
  validate(period, periods, period.id);
  await repository.update(userId, period);
}

export async function deletePeriod(
  repository: PeriodRepository,
  userId: string,
  periodId: string,
): Promise<void> {
  await repository.remove(userId, periodId);
}
