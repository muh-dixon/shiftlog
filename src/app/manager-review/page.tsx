import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getManagerFlags,
  updateManagerFlag,
  type ManagerFlagRow,
} from "@/services/manager-flags";
import { requireRole } from "@/services/guards";

type SearchParams = Promise<{
  error?: string | string[];
  success?: string | string[];
}>;

function getSearchMessage(message?: string | string[]) {
  if (Array.isArray(message)) {
    return message[0];
  }

  return message;
}

function getShiftLabel(flag: ManagerFlagRow) {
  const shift = flag.shift_logs?.shifts;

  if (!shift) {
    return `Shift log ${flag.shift_log_id}`;
  }

  return `${shift.service_date} ${shift.type} shift`;
}

function getStatusGroups(flags: ManagerFlagRow[]) {
  return {
    open: flags.filter((flag) => flag.status === "open"),
    reviewing: flags.filter((flag) => flag.status === "reviewing"),
    resolved: flags.filter((flag) => flag.status === "resolved"),
  };
}

function ManagerFlagCard({ flag }: { flag: ManagerFlagRow }) {
  async function updateFlagStatusAction(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "");

    try {
      await updateManagerFlag(id, {
        status: status as "reviewing" | "resolved",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update manager flag.";

      redirect(`/manager-review?error=${encodeURIComponent(message)}`);
    }

    redirect(
      `/manager-review?success=${encodeURIComponent("Manager flag updated.")}`,
    );
  }

  return (
    <li className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{flag.reason}</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {getShiftLabel(flag)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Submitted {new Date(flag.created_at).toLocaleString()}
          </p>
        </div>
        <span className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-semibold capitalize dark:border-zinc-700">
          {flag.priority}
        </span>
      </div>

      {flag.shift_logs?.notes ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          {flag.shift_logs.notes}
        </p>
      ) : null}

      {flag.status !== "resolved" ? (
        <form action={updateFlagStatusAction} className="mt-4 flex flex-wrap gap-2">
          <input name="id" type="hidden" value={flag.id} />
          {flag.status !== "reviewing" ? (
            <button
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700"
              name="status"
              type="submit"
              value="reviewing"
            >
              Mark reviewing
            </button>
          ) : null}
          <button
            className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
            name="status"
            type="submit"
            value="resolved"
          >
            Mark resolved
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Resolved {flag.resolved_at ? new Date(flag.resolved_at).toLocaleString() : ""}
        </p>
      )}
    </li>
  );
}

function ManagerFlagGroup({
  emptyText,
  flags,
  title,
}: {
  emptyText: string;
  flags: ManagerFlagRow[];
  title: string;
}) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {flags.length}
        </span>
      </div>
      {flags.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {flags.map((flag) => (
            <ManagerFlagCard flag={flag} key={flag.id} />
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-md border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {emptyText}
          </p>
        </div>
      )}
    </section>
  );
}

export default async function ManagerReviewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["manager"]);
  const flags = await getManagerFlags();
  const groups = getStatusGroups(flags);
  const params = await searchParams;
  const errorMessage = getSearchMessage(params.error);
  const successMessage = getSearchMessage(params.success);

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 px-6 py-16 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto w-full max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          ShiftLog
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Manager Review</h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
              Review manager attention items raised during shift handovers.
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
              href="/shift-log"
            >
              Shift log
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

        <div className="mt-8 grid gap-6">
          <ManagerFlagGroup
            emptyText="No open manager attention items are waiting."
            flags={groups.open}
            title="Open"
          />
          <ManagerFlagGroup
            emptyText="No items are currently marked as reviewing."
            flags={groups.reviewing}
            title="Reviewing"
          />
          <ManagerFlagGroup
            emptyText="Resolved items will appear here after managers close them."
            flags={groups.resolved}
            title="Resolved"
          />
        </div>
      </section>
    </main>
  );
}
