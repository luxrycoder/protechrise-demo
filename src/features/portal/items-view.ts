import type { ApiResult } from "@/lib/api/result";
import { PortalTaskSchema, type PortalAnnouncement, type PortalCompleteResponse, type PortalEvent, type PortalTask } from "@/lib/api/schemas/portal";
import { checklistSummary, completionInput, formatDay, formatInstant, isActionable, safeLink } from "@/lib/portal";

/**
 * The staff-written parts of the home: checklist, announcements and upcoming sessions, worked out with no DOM
 * involved. Everything staff write is shown as plain text (never HTML); links pass `safeLink` first. A section with
 * nothing to show is `null` (hidden).
 */

export type TaskView = {
  readonly id: number;
  readonly title: string;
  readonly body: string | null;
  readonly link: string | null;
  readonly required: boolean;
  readonly done: boolean;
  /** Only confirm and consent tasks can be completed; the rest are read-only. */
  readonly actionable: boolean;
  readonly kind: "confirm" | "consent" | "info";
  /** "I've done this" or "I accept"; null when there is nothing to press. */
  readonly button: string | null;
  /** "Done" or "Accepted"; null for a read-only task or one not done yet. */
  readonly doneLabel: string | null;
  /** A consent task shows its exact wording and cannot be accepted without a wording hash. */
  readonly canComplete: boolean;
};

const clean = (v: string | null | undefined): string | null => {
  const t = v?.trim();
  return t ? t : null;
};

export function taskView(task: PortalTask): TaskView | null {
  const title = clean(task.title);
  if (!title) return null;
  const actionable = isActionable(task);
  const kind = task.taskType === "consent" ? "consent" : task.taskType === "confirm" ? "confirm" : "info";
  const done = task.done === true;
  return {
    id: task.id,
    title,
    body: clean(task.body),
    link: safeLink(task.linkUrl),
    required: task.required === true && actionable,
    done,
    actionable,
    kind,
    button: actionable && !done ? (kind === "consent" ? "I accept" : "I've done this") : null,
    doneLabel: actionable && done ? (kind === "consent" ? "Accepted" : "Done") : null,
    canComplete: completionInput(task) !== null,
  };
}

export type ChecklistView = { readonly summary: string | null; readonly tasks: readonly TaskView[] };

export function checklistView(tasks: readonly PortalTask[]): ChecklistView | null {
  const shown = tasks.filter((t) => taskView(t) !== null);
  const views = shown.flatMap((t) => taskView(t) ?? []);
  return views.length === 0 ? null : { summary: checklistSummary(shown), tasks: views };
}

export type AnnouncementView = { readonly id: number; readonly title: string; readonly body: string | null; readonly day: string | null };

export function announcementsView(items: readonly PortalAnnouncement[], cohortTimezone: string | null | undefined): readonly AnnouncementView[] | null {
  const views = items.flatMap((a) => {
    const title = clean(a.title);
    return title ? [{ id: a.id, title, body: clean(a.body), day: formatDay(a.publishedAt, cohortTimezone) }] : [];
  });
  return views.length === 0 ? null : views;
}

export type EventView = { readonly id: number; readonly title: string; readonly body: string | null; readonly when: string; readonly link: string | null };

export function eventsView(items: readonly PortalEvent[], cohortTimezone: string | null | undefined): readonly EventView[] | null {
  const views = items.flatMap((e) => {
    const title = clean(e.title);
    const when = formatInstant(e.startsAt, cohortTimezone);
    // A session without a readable start time cannot be shown honestly.
    return title && when ? [{ id: e.id, title, body: clean(e.body), when, link: safeLink(e.linkUrl) }] : [];
  });
  return views.length === 0 ? null : views;
}

// ---- completing a task -----------------------------------------------------------------------------------------------

export const TASK_CHANGED_NOTICE = "This wording changed since you opened the page. Please read it again, then accept.";
export const TASK_FAILED_NOTICE = "We could not save that. Please try again.";

export type CompleteOutcome =
  /** Saved: show this task (now done). */
  | { readonly kind: "updated"; readonly task: PortalTask }
  /** The wording changed (409): show the fresh task and ask the learner to read it again. */
  | { readonly kind: "changed"; readonly task: PortalTask }
  /** The answer was a gate (no longer eligible) or the task is gone: load the home again. */
  | { readonly kind: "reload" }
  | { readonly kind: "signedOut" }
  | { readonly kind: "failed" };

function taskFrom(value: unknown, id: number): PortalTask | null {
  const parsed = PortalTaskSchema.safeParse(value);
  return parsed.success && parsed.data.id === id ? parsed.data : null;
}

/** Turns the API's answer to "complete this task" into what the page should do. */
export function completeOutcome(result: ApiResult<PortalCompleteResponse>, taskId: number): CompleteOutcome {
  if (result.ok) {
    if (result.data.task === undefined) return { kind: "reload" };
    const task = taskFrom(result.data.task, taskId);
    return task ? { kind: "updated", task } : { kind: "reload" };
  }
  switch (result.error.kind) {
    case "unauthorized":
      return { kind: "signedOut" };
    case "not_found":
      return { kind: "reload" };
    case "conflict": {
      const body = result.error.body;
      const task = typeof body === "object" && body !== null && "task" in body ? taskFrom((body as { task: unknown }).task, taskId) : null;
      return task ? { kind: "changed", task } : { kind: "failed" };
    }
    default:
      return { kind: "failed" };
  }
}
