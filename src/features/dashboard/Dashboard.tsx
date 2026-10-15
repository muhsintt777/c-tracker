import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Plus,
  X
} from "lucide-react";
import packageInfo from "../../../package.json";
import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../app/AuthContext";
import { analyzeCycle, isCalendarDate, periodDuration } from "../../domain/cycle/calculations";
import type { Period } from "../../domain/cycle/types";
import { createPeriod, removePeriod, subscribeToPeriods, updatePeriod } from "../../services/periodRepository";

const today = () => format(new Date(), "yyyy-MM-dd");
const displayDate = (value: string, pattern = "MMMM d, yyyy") => format(parseISO(value), pattern);
const isDevelopmentBuild = import.meta.env.MODE === "dev";

type DialogState =
  | { kind: "start" }
  | { kind: "end"; period: Period }
  | { kind: "edit"; period: Period }
  | { kind: "delete"; period: Period }
  | null;

export function Dashboard() {
  const { user, signOut, error: authError } = useAuth();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const userId = user?.uid;

  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !profileRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [profileOpen]);

  useEffect(() => {
    if (!userId) return;
    setLoadingPeriods(true);
    return subscribeToPeriods(
      userId,
      (nextPeriods) => {
        setPeriods(nextPeriods);
        setDataError(null);
        setLoadingPeriods(false);
      },
      (error) => {
        setDataError(error.message);
        setLoadingPeriods(false);
      }
    );
  }, [userId]);

  const orderedPeriods = useMemo(
    () => [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [periods]
  );
  const ongoingPeriod = orderedPeriods.find((period) => period.endDate === null);
  const analysis = useMemo(() => analyzeCycle(periods, today()), [periods]);

  const openDialog = (nextDialog: DialogState) => {
    setFormError(null);
    setDialog(nextDialog);
  };
  const closeDialog = () => {
    if (!saving) {
      setDialog(null);
      setFormError(null);
    }
  };

  const hasOverlap = useCallback((candidate: Period, excludedId?: string) => {
    return periods.some((period) => {
      if (period.id === excludedId) return false;
      const candidateEnd = candidate.endDate ?? "9999-12-31";
      const existingEnd = period.endDate ?? "9999-12-31";
      return candidate.startDate <= existingEnd && period.startDate <= candidateEnd;
    });
  }, [periods]);

  async function saveStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    const form = new FormData(event.currentTarget);
    const startDate = String(form.get("startDate") ?? "");
    setFormError(null);
    if (!isCalendarDate(startDate)) {
      setFormError("Choose a valid start date.");
      return;
    }
    if (hasOverlap({ id: "new", startDate, endDate: null })) {
      setFormError("This date overlaps another recorded period. Update its dates first.");
      return;
    }
    setSaving(true);
    try {
      await createPeriod(userId, startDate);
      setDialog(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save this period.");
    } finally {
      setSaving(false);
    }
  }

  async function savePeriod(event: FormEvent<HTMLFormElement>, period: Period) {
    event.preventDefault();
    if (!userId) return;
    const form = new FormData(event.currentTarget);
    const startDate = String(form.get("startDate") || period.startDate);
    const endValue = String(form.get("endDate") ?? "");
    const updated: Period = { ...period, startDate, endDate: endValue || null };
    setFormError(null);
    if (!isCalendarDate(startDate) || (endValue && !isCalendarDate(endValue))) {
      setFormError("Choose valid calendar dates.");
      return;
    }
    if (endValue && endValue < startDate) {
      setFormError("End date cannot be before the start date.");
      return;
    }
    if (hasOverlap(updated, period.id)) {
      setFormError("These dates overlap another recorded period.");
      return;
    }
    setSaving(true);
    try {
      await updatePeriod(userId, updated);
      setDialog(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not update this period.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelected(period: Period) {
    if (!userId) return;
    setSaving(true);
    setFormError(null);
    try {
      await removePeriod(userId, period.id);
      setDialog(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not delete this period.");
    } finally {
      setSaving(false);
    }
  }

  function submitDialog(event: FormEvent<HTMLFormElement>) {
    if (dialog?.kind === "start") void saveStart(event);
    else if (dialog?.kind === "edit" || dialog?.kind === "end") void savePeriod(event, dialog.period);
  }

  const prediction = analysis.prediction;
  const countdownLabel = !prediction
    ? "Add your first period"
    : prediction.status === "due"
      ? "Due today"
      : prediction.status === "overdue"
        ? "Estimated date passed"
        : "Starts in";
  const countdownValue = prediction?.status === "upcoming" ? prediction.daysUntil : null;
  const ringProgress = prediction && prediction.status === "upcoming"
    ? Math.min(1, prediction.daysUntil / prediction.cycleLength)
    : prediction ? 0.08 : 0;

  return (
    <main className="page-shell">
      <section className="tracker-app" aria-label="Cycle tracker">
        <header className="top-bar">
          <div>
            <h1>Cycle</h1>
            <p>Your cycle overview</p>
          </div>
          <div className="profile-wrap" ref={profileRef}>
            <button className="icon-button profile-trigger" type="button" aria-label="Open profile menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>
              <CircleUserRound size={20} />
            </button>
            {profileOpen && (
              <div className="profile-menu">
                <span className="profile-email">{user?.email ?? "Signed in"}</span>
                <div className="profile-version">
                  <span>App version</span>
                  <span className="profile-version-value">
                    <strong>{packageInfo.version}</strong>
                    {isDevelopmentBuild && <span className="build-label">Development</span>}
                  </span>
                </div>
                <button type="button" onClick={() => void signOut()}>Sign out</button>
              </div>
            )}
          </div>
        </header>

        {authError && <div className="inline-alert" role="alert"><AlertCircle size={17} />{authError}</div>}
        {dataError && (
          <div className="inline-alert" role="alert">
            <AlertCircle size={17} />
            <span>Couldn’t load your periods: {dataError}</span>
            <button type="button" onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        <section className="countdown-card" aria-labelledby="countdown-heading">
          <p className="section-overline" id="countdown-heading">NEXT EXPECTED PERIOD</p>
          <div className="countdown-ring" style={{ "--ring-progress": ringProgress } as React.CSSProperties} aria-label={prediction ? `${countdownLabel} ${countdownValue ?? ""}` : "No prediction yet"}>
            <svg viewBox="0 0 160 160" aria-hidden="true">
              <circle className="ring-track" cx="80" cy="80" r="69" />
              <circle className="ring-value" cx="80" cy="80" r="69" />
            </svg>
            <div className="ring-copy">
              {ongoingPeriod ? (
                <>
                  <span className="ring-kicker">Current status</span>
                  <strong className="ring-ongoing">Ongoing</strong>
                  <span className="ring-small">since {displayDate(ongoingPeriod.startDate, "MMM d")}</span>
                </>
              ) : prediction ? (
                <>
                  <span className="ring-kicker">{countdownLabel}</span>
                  {countdownValue !== null && <strong className="ring-number">{countdownValue}</strong>}
                  <span className="ring-small">{countdownValue !== null ? (countdownValue === 1 ? "day" : "days") : displayDate(prediction.estimatedDate, "MMM d")}</span>
                </>
              ) : (
                <>
                  <CalendarDays size={21} />
                  <span className="ring-small">No estimate yet</span>
                </>
              )}
            </div>
          </div>
          {prediction ? (
            <>
              <h2 className="estimated-date">{displayDate(prediction.estimatedDate)}</h2>
              <p className="estimate-caption">
                {ongoingPeriod ? "Estimated from your recorded cycle starts" : prediction.isPreliminary ? "Preliminary estimate · based on a 28-day cycle" : "Estimated date based on your recorded cycles"}
              </p>
            </>
          ) : (
            <>
              <h2 className="estimated-date empty-date">Your first estimate will appear here</h2>
              <p className="estimate-caption">Record a period to get started. Estimates are not medically validated.</p>
            </>
          )}
        </section>

        <section className="history-section" aria-labelledby="history-heading">
          <div className="section-heading">
            <h2 id="history-heading">Period history</h2>
            <span>{periods.length} {periods.length === 1 ? "record" : "records"}</span>
          </div>
          {loadingPeriods ? (
            <div className="history-empty" role="status">Loading period history…</div>
          ) : orderedPeriods.length === 0 ? (
            <div className="history-empty">
              <CalendarDays size={23} />
              <strong>No periods recorded yet</strong>
              <span>Add your last period to begin tracking.</span>
            </div>
          ) : (
            <ul className="history-list">
              {orderedPeriods.map((period) => {
                const isOngoing = period.endDate === null;
                const duration = period.endDate === null ? null : periodDuration(period.startDate, period.endDate);
                return (
                  <li key={period.id}>
                    <button className="history-row" type="button" onClick={() => openDialog({ kind: "edit", period })} aria-label={`Edit period starting ${displayDate(period.startDate)}`}>
                      <span className="history-icon"><CalendarDays size={17} /></span>
                      <span className="history-copy">
                        <span className="history-title">{isOngoing ? "Ongoing period" : displayDate(period.startDate, "MMMM d")} </span>
                        <span className="history-subtitle">
                          {isOngoing ? `${displayDate(period.startDate, "MMM d")} – In progress` : `${displayDate(period.startDate, "MMM d")} – ${displayDate(period.endDate!, "MMM d")} · ${duration} ${duration === 1 ? "day" : "days"}`}
                        </span>
                      </span>
                      {isOngoing ? <span className="ongoing-pill"><span />Ongoing</span> : <ChevronRight className="history-chevron" size={18} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {analysis.issues.length > 0 && (
          <p className="data-warning" role="status">
            <AlertCircle size={15} /> Some dates need review before they can be used in estimates.
          </p>
        )}

        <button className="fab" type="button" onClick={() => openDialog(ongoingPeriod ? { kind: "end", period: ongoingPeriod } : { kind: "start" })} aria-label={ongoingPeriod ? "End period" : "Track period"}>
          <Plus size={24} />
          <span className="sr-only">{ongoingPeriod ? "End period" : "Track period"}</span>
        </button>
        <footer className="app-footer">Estimates are based on your recorded dates and may vary.</footer>
      </section>

      {dialog && (
        <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <section className="period-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <div className="dialog-heading">
              <h2 id="dialog-title">
                {dialog.kind === "start" ? "Track a period" : dialog.kind === "end" ? "End your period" : dialog.kind === "delete" ? "Delete period?" : "Edit period"}
              </h2>
              <button className="icon-button close-button" type="button" onClick={closeDialog} aria-label="Close dialog" disabled={saving}><X size={19} /></button>
            </div>
            {dialog.kind === "delete" ? (
              <>
                <p className="dialog-description">This will permanently remove the period starting {displayDate(dialog.period.startDate)}. This can’t be undone.</p>
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <div className="dialog-actions">
                  <button className="secondary-button" type="button" onClick={closeDialog} disabled={saving}>Cancel</button>
                  <button className="danger-button" type="button" onClick={() => void deleteSelected(dialog.period)} disabled={saving}>{saving ? "Deleting…" : "Delete period"}</button>
                </div>
              </>
            ) : (
              <form onSubmit={submitDialog}>
                <p className="dialog-description">
                  {dialog.kind === "start" ? "Choose the day your period started." : dialog.kind === "end" ? "Select the actual last day of your period." : "Correct the start or end date for this record."}
                </p>
                <label className="field-label" htmlFor="startDate">Start date</label>
                <input
                  id="startDate"
                  name="startDate"
                  className="date-input"
                  type="date"
                  required
                  max={today()}
                  defaultValue={dialog.kind === "start" ? today() : dialog.period.startDate}
                  disabled={dialog.kind === "end"}
                />
                {(dialog.kind === "edit" || dialog.kind === "end") && (
                  <>
                    <label className="field-label" htmlFor="endDate">End date <span>(leave blank if ongoing)</span></label>
                    <input
                      id="endDate"
                      name="endDate"
                      className="date-input"
                      type="date"
                      min={dialog.kind === "end" ? dialog.period.startDate : undefined}
                      max={today()}
                      defaultValue={dialog.kind === "end" ? today() : dialog.period.endDate ?? ""}
                      required={dialog.kind === "end"}
                    />
                  </>
                )}
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <div className="dialog-actions">
                  {dialog.kind === "edit" && <button className="text-danger-button" type="button" onClick={() => openDialog({ kind: "delete", period: dialog.period })} disabled={saving}>Delete record</button>}
                  <span className="actions-spacer" />
                  <button className="secondary-button" type="button" onClick={closeDialog} disabled={saving}>Cancel</button>
                  <button className="primary-button" type="submit" disabled={saving}>
                    {saving ? "Saving…" : dialog.kind === "end" ? <><Check size={16} /> Save end date</> : dialog.kind === "edit" ? "Save changes" : "Save period"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
