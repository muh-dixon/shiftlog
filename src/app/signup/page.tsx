import { redirect } from "next/navigation";
import { signup } from "@/services/auth";

type SearchParams = Promise<{ error?: string | string[] }>;

function getErrorMessage(error?: string | string[]) {
  if (Array.isArray(error)) {
    return error[0];
  }

  return error;
}

export default function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  async function signupAction(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      redirect("/signup?error=Email%20and%20password%20are%20required.");
    }

    const { error } = await signup({ email, password });

    if (error) {
      redirect(`/signup?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/onboarding");
  }

  return <SignupForm action={signupAction} searchParams={searchParams} />;
}

async function SignupForm({
  action,
  searchParams,
}: {
  action: (formData: FormData) => Promise<void>;
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : {};
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className="flex min-h-screen flex-col gap-4 bg-zinc-50 px-6 py-16 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto w-full max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          ShiftLog
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Sign Up</h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
          Create your account, then set up your team workspace.
        </p>
        <form action={action} className="mt-8 flex max-w-md flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Email
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Password
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              minLength={6}
              name="password"
              required
              type="password"
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
            Sign up
          </button>
        </form>
      </section>
    </main>
  );
}
