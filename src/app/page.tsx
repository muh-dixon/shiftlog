export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 px-6 py-16 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          ShiftLog
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Structured shift handovers for small service teams.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          ShiftLog helps teams create clear handovers, submit shift logs, and
          keep important operational context from getting lost between shifts.
        </p>
        <div className="mt-8 grid gap-4 text-base text-zinc-700 dark:text-zinc-300 sm:grid-cols-3">
          <div>
            <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
              Handover Notes
            </h2>
            <p className="mt-2">
              Capture structured updates for the next person on shift.
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
              Staff Logs
            </h2>
            <p className="mt-2">
              Staff can submit completed tasks, open work, and shift notes.
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
              Manager Review
            </h2>
            <p className="mt-2">
              Managers can review flagged issues and follow-up needs.
            </p>
          </div>
        </div>
        <nav className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            className="rounded-md bg-zinc-950 px-4 py-2 text-center text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
            href="/signup"
          >
            Sign up
          </a>
          <a
            className="rounded-md border border-zinc-300 px-4 py-2 text-center text-sm font-semibold dark:border-zinc-700"
            href="/login"
          >
            Log in
          </a>
          <a
            className="rounded-md border border-zinc-300 px-4 py-2 text-center text-sm font-semibold dark:border-zinc-700"
            href="/dashboard"
          >
            Dashboard
          </a>
        </nav>
      </section>
    </main>
  );
}
