import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe
} from "firebase/firestore";
import { validatePeriod } from "../domain/cycle/calculations";
import type { Period } from "../domain/cycle/types";
import { db } from "../lib/firebase";

function userPeriods(uid: string) {
  if (!db) throw new Error("Firebase is not configured.");
  return collection(db, "users", uid, "periods");
}

export function subscribeToPeriods(
  uid: string,
  onPeriods: (periods: Period[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const periodsQuery = query(userPeriods(uid), orderBy("startDate", "desc"));
  return onSnapshot(
    periodsQuery,
    (snapshot) => {
      try {
        const periods = snapshot.docs.map((entry) => {
          const data = entry.data();
          if (typeof data.startDate !== "string" || (data.endDate !== null && typeof data.endDate !== "string")) {
            throw new Error(`Period ${entry.id} has invalid date fields.`);
          }
          const period: Period = {
            id: entry.id,
            startDate: data.startDate,
            endDate: data.endDate
          };
          const validationError = validatePeriod(period);
          if (validationError) throw new Error(`Period ${entry.id}: ${validationError}`);
          return period;
        });
        onPeriods(periods);
      } catch (error) {
        onError(error instanceof Error ? error : new Error("Period data could not be read."));
      }
    },
    onError
  );
}

export async function createPeriod(uid: string, startDate: string): Promise<void> {
  const newPeriod: Period = { id: "new-period", startDate, endDate: null };
  const error = validatePeriod(newPeriod);
  if (error) throw new Error(error);
  await addDoc(userPeriods(uid), {
    startDate,
    endDate: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updatePeriod(uid: string, period: Period): Promise<void> {
  const error = validatePeriod(period);
  if (error) throw new Error(error);
  if (!db) throw new Error("Firebase is not configured.");
  await updateDoc(doc(db, "users", uid, "periods", period.id), {
    startDate: period.startDate,
    endDate: period.endDate,
    updatedAt: serverTimestamp()
  });
}

export async function removePeriod(uid: string, periodId: string): Promise<void> {
  if (!db) throw new Error("Firebase is not configured.");
  await deleteDoc(doc(db, "users", uid, "periods", periodId));
}
