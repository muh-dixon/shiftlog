import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "@/services/auth";
import { requireProfile } from "@/services/guards";

export default async function DashboardPage() {
  const { authUser, profile } = await requireProfile();

  async function logoutAction() {
    "use server";

    await logout();
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col gap-4 bg-zinc-50 px-6 py-16 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto w-full max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          ShiftLog
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
          Welcome back, {profile.name}. Your ShiftLog workspace is ready for the
          next MVP workflow.
        </p>
        <dl className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Role
            </dt>
            <dd className="mt-1 text-lg font-semibold capitalize">
              {profile.role}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Team ID
            </dt>
            <dd className="mt-1 break-all text-sm">{profile.team_id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Profile Status
            </dt>
            <dd className="mt-1 text-lg font-semibold capitalize">
              {profile.status}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Account Email
            </dt>
            <dd className="mt-1 break-all text-sm">
              {authUser.email ?? profile.email}
            </dd>
          </div>
        </dl>
        <nav className="mt-10 flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
            href="/current-shift"
          >
            Current shift
          </Link>
          <Link
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
            href="/recurring-tasks"
          >
            Recurring tasks
          </Link>
        </nav>
        <form action={logoutAction} className="mt-10">
          <button
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700"
            type="submit"
          >
            Log out
          </button>
        </form>
      </section>
    </main>
  );
}
