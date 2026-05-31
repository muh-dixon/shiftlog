import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createRecurringTask,
  getRecurringTasks,
  updateRecurringTask,
} from "@/services/recurring-tasks";
import { requireProfile } from "@/services/guards";

type SearchParams = Promise<{ error?: string | string[] }>;

function getErrorMessage(error?: string | string[]) {
  if (Array.isArray(error)) {
    return error[0];
  }

  return error;
}

export default async function RecurringTasksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { profile } = await requireProfile();
  const tasks = await getRecurringTasks();
  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);
  const isManager = profile.role === "manager";
  const visibleTasks = tasks.filter((task) => task.status !== "archived");
  const archivedTasks = tasks.filter((task) => task.status === "archived");

  async function createRecurringTaskAction(formData: FormData) {
    "use server";

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const priority = String(formData.get("priority") ?? "normal");
    const shiftTypes = formData.getAll("shiftTypes").map(String);

    try {
      await createRecurringTask({
        description: description || undefined,
        priority: priority as "low" | "normal" | "high",
        shiftTypes: shiftTypes as Array<"morning" | "afternoon" | "closing">,
        title,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create recurring task.";

      redirect(`/recurring-tasks?error=${encodeURIComponent(message)}`);
    }

    redirect("/recurring-tasks");
  }

  async function updateRecurringTaskStatusAction(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "");

    try {
      await updateRecurringTask(id, {
        status: status as "active" | "paused" | "archived",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update recurring task.";

      redirect(`/recurring-tasks?error=${encodeURIComponent(message)}`);
    }

    redirect("/recurring-tasks");
  }

  async function archiveRecurringTaskAction(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");

    try {
      await updateRecurringTask(id, {
        status: "archived",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to archive recurring task.";

      redirect(`/recurring-tasks?error=${encodeURIComponent(message)}`);
    }

    redirect("/recurring-tasks");
  }

  async function restoreRecurringTaskAction(formData: FormData) {
    "use server";

    const id = String(formData.get("id") ?? "");

    try {
      await updateRecurringTask(id, {
        status: "active",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to restore recurring task.";

      redirect(`/recurring-tasks?error=${encodeURIComponent(message)}`);
    }

    redirect("/recurring-tasks");
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 px-6 py-16 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto w-full max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          ShiftLog
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Recurring Tasks</h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
              Manage repeatable opening, service, and closing tasks for your
              team.
            </p>
          </div>
          <Link
            className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        </div>

        {errorMessage ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {errorMessage}
          </p>
        ) : null}

        {isManager ? (
          <form
            action={createRecurringTaskAction}
            className="mt-8 grid gap-4 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-lg font-semibold">Create Task</h2>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Title
              <input
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                name="title"
                required
                type="text"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Description
              <textarea
                className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                name="description"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="grid gap-2 text-sm font-medium">
                <legend>Shift Types</legend>
                {(["morning", "afternoon", "closing"] as const).map((type) => (
                  <label
                    className="flex items-center gap-2 font-normal capitalize"
                    key={type}
                  >
                    <input name="shiftTypes" type="checkbox" value={type} />
                    {type}
                  </label>
                ))}
              </fieldset>
              <label className="flex flex-col gap-2 text-sm font-medium">
                Priority
                <select
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  defaultValue="normal"
                  name="priority"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            <button
              className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
              type="submit"
            >
              Create recurring task
            </button>
          </form>
        ) : null}

        <section className="mt-8 grid gap-4">
          <h2 className="text-2xl font-semibold">Active Tasks</h2>
          {visibleTasks.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-300">
              No active recurring tasks have been created yet.
            </p>
          ) : (
            visibleTasks.map((task) => (
              <article
                className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                key={task.id}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{task.title}</h3>
                    {task.description ? (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {task.description}
                      </p>
                    ) : null}
                    <p className="mt-3 text-sm capitalize text-zinc-500 dark:text-zinc-400">
                      {task.shift_types.join(", ")} - {task.priority} priority
                      - {task.status}
                    </p>
                  </div>
                  {isManager ? (
                    <div className="flex flex-wrap gap-2">
                      <form action={updateRecurringTaskStatusAction}>
                        <input name="id" type="hidden" value={task.id} />
                        <select
                          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                          defaultValue={task.status}
                          name="status"
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                        </select>
                        <button
                          className="ml-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700"
                          type="submit"
                        >
                          Update
                        </button>
                      </form>
                      <form action={archiveRecurringTaskAction}>
                        <input name="id" type="hidden" value={task.id} />
                        <button
                          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700"
                          type="submit"
                        >
                          Archive
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </section>

        {archivedTasks.length > 0 ? (
          <section className="mt-10 grid gap-4">
            <h2 className="text-2xl font-semibold">Archived Tasks</h2>
            {archivedTasks.map((task) => (
              <article
                className="rounded-md border border-zinc-200 bg-white p-4 opacity-75 dark:border-zinc-800 dark:bg-zinc-900"
                key={task.id}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{task.title}</h3>
                    {task.description ? (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {task.description}
                      </p>
                    ) : null}
                    <p className="mt-3 text-sm capitalize text-zinc-500 dark:text-zinc-400">
                      {task.shift_types.join(", ")} - {task.priority} priority
                      - {task.status}
                    </p>
                  </div>
                  {isManager ? (
                    <form action={restoreRecurringTaskAction}>
                      <input name="id" type="hidden" value={task.id} />
                      <button
                        className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700"
                        type="submit"
                      >
                        Restore
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </section>
    </main>
  );
}
