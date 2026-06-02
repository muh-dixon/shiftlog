import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/services/guards";
import { createShiftLog, getShiftLogs } from "@/services/shift-logs";
import { getCurrentShift } from "@/services/shifts";
import type {
  CustomerIncident,
  EquipmentIssue,
  ManagerAttentionItem,
  ShiftTaskEntry,
} from "@/types";

type SearchParams = Promise<{
  error?: string | string[];
  success?: string | string[];
}>;

function getErrorMessage(error?: string | string[]) {
  if (Array.isArray(error)) {
    return error[0];
  }

  return error;
}

function getSearchMessage(message?: string | string[]) {
  if (Array.isArray(message)) {
    return message[0];
  }

  return message;
}

function getLines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildTaskEntries(
  lines: string[],
  state: ShiftTaskEntry["state"],
): ShiftTaskEntry[] {
  return lines.map((title) => ({
    id: randomUUID(),
    state,
    title,
  }));
}

function buildEquipmentIssues(lines: string[]): EquipmentIssue[] {
  return lines.map((description) => ({
    affectsService: false,
    description,
    id: randomUUID(),
    severity: "medium",
  }));
}

function buildCustomerIncidents(lines: string[]): CustomerIncident[] {
  return lines.map((summary) => ({
    followUpRequired: true,
    id: randomUUID(),
    severity: "medium",
    summary,
  }));
}

function buildManagerAttentionItems(lines: string[]): ManagerAttentionItem[] {
  return lines.map((summary) => ({
    id: randomUUID(),
    summary,
  }));
}

export default async function ShiftLogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { profile } = await requireProfile();
  const currentShift = await getCurrentShift();
  const recentLogs = currentShift
    ? await getShiftLogs({ limit: 5, shiftId: currentShift.id })
    : [];
  const currentUserShiftLog = recentLogs.find((log) => log.user_id === profile.id);
  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);
  const successMessage = getSearchMessage(params.success);

  async function createShiftLogAction(formData: FormData) {
    "use server";

    const shiftId = String(formData.get("shiftId") ?? "");
    const notes = String(formData.get("notes") ?? "").trim();

    try {
      await createShiftLog({
        completedTasks: buildTaskEntries(
          getLines(formData.get("completedTasks")),
          "completed",
        ),
        customerIncidents: buildCustomerIncidents(
          getLines(formData.get("customerIncidents")),
        ),
        equipmentIssues: buildEquipmentIssues(
          getLines(formData.get("equipmentIssues")),
        ),
        managerAttentionItems: buildManagerAttentionItems(
          getLines(formData.get("managerAttentionItems")),
        ),
        notes: notes || undefined,
        outstandingTasks: buildTaskEntries(
          getLines(formData.get("outstandingTasks")),
          "outstanding",
        ),
        shiftId,
        status: "submitted",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create shift log.";

      redirect(`/shift-log?error=${encodeURIComponent(message)}`);
    }

    redirect(
      `/shift-log?success=${encodeURIComponent("Shift log saved for the current shift.")}`,
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 px-6 py-16 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto w-full max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          ShiftLog
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Shift Log</h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
              Submit a structured handover for the current shift.
            </p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-medium">
            <Link
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
              href="/current-shift"
            >
              Current shift
            </Link>
            <Link
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
              href="/recurring-tasks"
            >
              Recurring tasks
            </Link>
            <Link
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
              href="/dashboard"
            >
              Dashboard
            </Link>
          </nav>
        </div>

        {successMessage ? (
          <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            {successMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {errorMessage}
          </p>
        ) : null}

        <section className="mt-8 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-semibold">Current Shift</h2>
          {currentShift ? (
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Type
                </dt>
                <dd className="mt-1 text-lg font-semibold capitalize">
                  {currentShift.type}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Service Date
                </dt>
                <dd className="mt-1 text-lg font-semibold">
                  {currentShift.service_date}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Status
                </dt>
                <dd className="mt-1 text-lg font-semibold capitalize">
                  {currentShift.status}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="mt-4 grid gap-3">
              <p className="text-zinc-600 dark:text-zinc-300">
                There is no active or scheduled shift for today, so a shift log
                cannot be submitted yet.
              </p>
              <Link
                className="w-fit rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700"
                href="/current-shift"
              >
                Go to Current Shift
              </Link>
            </div>
          )}
        </section>

        {currentShift ? (
          <form
            action={createShiftLogAction}
            className="mt-8 grid gap-4 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <input name="shiftId" type="hidden" value={currentShift.id} />
            <div>
              <h2 className="text-lg font-semibold">
                {currentUserShiftLog ? "Update Your Shift Log" : "Create Shift Log"}
              </h2>
              {currentUserShiftLog ? (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  You already submitted a log for this shift. Submitting again
                  will update that log instead of creating a duplicate.
                </p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Completed Tasks
                <textarea
                  className="min-h-28 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  name="completedTasks"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Outstanding Tasks
                <textarea
                  className="min-h-28 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  name="outstandingTasks"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Equipment Issues
                <textarea
                  className="min-h-28 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  name="equipmentIssues"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Customer Incidents
                <textarea
                  className="min-h-28 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  name="customerIncidents"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
                Manager Attention Items
                <textarea
                  className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  name="managerAttentionItems"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium sm:col-span-2">
                Notes
                <textarea
                  className="min-h-28 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  name="notes"
                />
              </label>
            </div>
            <button
              className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
              type="submit"
            >
              {currentUserShiftLog ? "Update shift log" : "Submit shift log"}
            </button>
          </form>
        ) : null}

        <section className="mt-8 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Recent Logs</h2>
          {recentLogs.length > 0 ? (
            <ul className="mt-4 grid gap-3">
              {recentLogs.map((log) => (
                <li
                  className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                  key={log.id}
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="text-sm font-semibold capitalize">
                      {log.status}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {log.notes ?? "No notes added."}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
              <p className="font-medium">No logs for this shift yet.</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Once a team member submits the first handover, it will appear
                here for quick reference.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
