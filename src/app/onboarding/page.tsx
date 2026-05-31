import { redirect } from "next/navigation";
import { createTeamProfile, getUserProfile } from "@/services/onboarding";
import { requireAuth } from "@/services/guards";

type SearchParams = Promise<{ error?: string | string[] }>;

function getErrorMessage(error?: string | string[]) {
  if (Array.isArray(error)) {
    return error[0];
  }

  return error;
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAuth();

  const existingProfile = await getUserProfile();

  if (existingProfile) {
    redirect("/dashboard");
  }

  async function createTeamProfileAction(formData: FormData) {
    "use server";

    const teamName = String(formData.get("teamName") ?? "").trim();
    const displayName = String(formData.get("displayName") ?? "").trim();

    if (!teamName) {
      redirect("/onboarding?error=Team%20name%20is%20required.");
    }

    try {
      await createTeamProfile({
        displayName: displayName || undefined,
        teamName,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create your team profile.";

      redirect(`/onboarding?error=${encodeURIComponent(message)}`);
    }

    redirect("/dashboard");
  }

  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className="flex min-h-screen flex-col gap-4 bg-zinc-50 px-6 py-16 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto w-full max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          ShiftLog
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Set Up Your Team</h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
          Create the first team workspace and manager profile for your account.
        </p>
        <form
          action={createTeamProfileAction}
          className="mt-8 flex max-w-md flex-col gap-4"
        >
          <label className="flex flex-col gap-2 text-sm font-medium">
            Team Name
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              name="teamName"
              required
              type="text"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Display Name
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              name="displayName"
              type="text"
            />
          </label>
          {errorMessage ? (
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          ) : null}
          <button
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
            type="submit"
          >
            Create team
          </button>
        </form>
      </section>
    </main>
  );
}
