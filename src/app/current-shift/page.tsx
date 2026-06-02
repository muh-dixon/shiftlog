import Link from "next/link";
import { redirect } from "next/navigation";
import { getShiftLogs } from "@/services/shift-logs";
import { createShift, getCurrentShift, updateShift } from "@/services/shifts";
import { requireProfile } from "@/services/guards";

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

function toIsoDateTime(serviceDate: string, time: string) {
  return new Date(`${serviceDate}T${time}:00`).toISOString();
}

function formatTimestampTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatScheduleTime(
  clockValue: string | null,
  fallbackTimestamp?: string | null,
) {
  if (!clockValue) {
    return formatTimestampTime(fallbackTimestamp ?? null);
  }

  const [hours, minutes] = clockValue.split(":").map(Number);
  const value = new Date();
  value.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export default async function CurrentShiftPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { profile } = await requireProfile();
  const currentShift = await getCurrentShift();
  const previousShiftLogs = await getShiftLogs({
    excludeShiftId: currentShift?.id,
    limit: 1,
  });
  const previousShiftLog = previousShiftLogs[0];
  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);
  const successMessage = getSearchMessage(params.success);
  const isManager = profile.role === "manager";
  const today = new Date().toISOString().slice(0, 10);

  async function createShiftAction(formData: FormData) {
    "use server";

    const type = String(formData.get("type") ?? "");
    const serviceDate = String(formData.get("serviceDate") ?? "");
    const startTime = String(formData.get("startTime") ?? "");
    const endTime = String(formData.get("endTime") ?? "");

    try {
      await createShift({
        endTime: endTime || undefined,
        endsAt: endTime ? toIsoDateTime(serviceDate, endTime) : undefined,
        serviceDate,
        startTime,
        startsAt: toIsoDateTime(serviceDate, startTime),
        status: "active",
        type: type as "morning" | "afternoon" | "closing",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create shift.";

      redirect(`/current-shift?error=${encodeURIComponent(message)}`);
    }

    redirect(
      `/current-shift?success=${encodeURIComponent("Shift created for today.")}`,
    );
  }

  async function updateShiftStatusAction(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "");

    try {
      await updateShift(id, {
        status: status as "scheduled" | "active" | "completed" | "cancelled",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update shift.";

      redirect(`/current-shift?error=${encodeURIComponent(message)}`);
    }

    redirect(
      `/current-shift?success=${encodeURIComponent("Shift status updated.")}`,
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
            <h1 className="text-4xl font-semibold">Current Shift</h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
              View today&apos;s open shift and prepare the next handover
              workflow.
            </p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-medium">
            <Link
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
              href="/shift-log"
            >
              Shift log
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
          <h2 className="text-2xl font-semibold">Today&apos;s Shift</h2>
          {currentShift ? (
            <div className="mt-4 grid gap-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Shift Type
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
                <div>
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Start Time
                  </dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {formatScheduleTime(
                      currentShift.start_time,
                      currentShift.starts_at,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    End Time
                  </dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {formatScheduleTime(
                      currentShift.end_time,
                      currentShift.ends_at,
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Lead User
                  </dt>
                  <dd className="mt-1 break-all text-sm">
                    {currentShift.lead_user_id ?? "Not assigned"}
                  </dd>
                </div>
              </dl>
              {isManager ? (
                <form
                  action={updateShiftStatusAction}
                  className="flex flex-wrap gap-2"
                >
                  <input name="id" type="hidden" value={currentShift.id} />
                  <select
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                    defaultValue={currentShift.status}
                    name="status"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700"
                    type="submit"
                  >
                    Update status
                  </button>
                </form>
              ) : null}
              <Link
                className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
                href="/shift-log"
              >
                Create shift log
              </Link>
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
              <p className="font-medium">No current shift is scheduled.</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Managers can create today&apos;s shift below. Staff will be able
                to submit a shift log once a shift exists.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Previous Shift Log</h2>
          {previousShiftLog ? (
            <div className="mt-4 grid gap-2">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="text-sm font-semibold capitalize">
                  {previousShiftLog.status}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {new Date(previousShiftLog.created_at).toLocaleString()}
                </p>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {previousShiftLog.notes ?? "No notes added."}
              </p>
              {previousShiftLog.manager_attention_items.length > 0 ? (
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  Manager attention requested
                </p>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
              <p className="font-medium">No previous handover yet.</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                The latest submitted shift log from an earlier shift will appear
                here once the team starts logging handovers.
              </p>
            </div>
          )}
        </section>

        {isManager ? (
          <form
            action={createShiftAction}
            className="mt-8 grid gap-4 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-lg font-semibold">Create Shift</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-2 text-sm font-medium">
                Type
                <select
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  name="type"
                  required
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="closing">Closing</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Service Date
                <input
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  defaultValue={today}
                  name="serviceDate"
                  required
                  type="date"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Start Time
                <input
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  defaultValue="09:00"
                  name="startTime"
                  required
                  type="time"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium">
                End Time
                <input
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  defaultValue="17:00"
                  name="endTime"
                  type="time"
                />
              </label>
            </div>
            <button
              className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
              type="submit"
            >
              Create shift
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
