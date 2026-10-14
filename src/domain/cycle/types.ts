export interface Period {
  id: string;
  startDate: string;
  endDate: string | null;
}

export interface CycleInterval {
  from: string;
  to: string;
  days: number;
}

export interface CyclePrediction {
  estimatedDate: string;
  cycleLength: number;
  daysUntil: number;
  isPreliminary: boolean;
  intervalsUsed: number;
  status: "upcoming" | "due" | "overdue";
}

export interface CycleAnalysis {
  prediction: CyclePrediction | null;
  validPeriods: Period[];
  issues: string[];
}
