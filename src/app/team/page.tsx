import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/services/guards";
import { createTeamInvite, getTeamInvites } from "@/services/team-invites";
import {
  getTeamMembers,
  updateTeamMember,
  type TeamMemberRow,
} from "@/services/team-members";

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

function TeamMemberCard({
  currentManagerId,
  member,
}: {
  currentManagerId: string;
  member: TeamMemberRow;
}) {
  const isCurrentManager = member.id === currentManagerId;

  async function updateMemberAction(formData: FormData) {
    "use server";

    const memberId = String(formData.get("memberId") ?? "");
    const role = String(formData.get("role") ?? "");
    const status = String(formData.get("status") ?? "");

    try {
      await updateTeamMember(memberId, {
        role: role as "staff" | "manager",
        status: status as "active" | "inactive",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update team member.";

      redirect(`/team?error=${encodeURIComponent(message)}`);
    }

    redirect(
      `/team?success=${encodeURIComponent("Team member updated.")}`,
    );
  }

  return (
    <li className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-lg font-semibold">{member.name}</p>
          <p className="mt-1 break-all text-sm text-zinc-600 dark:text-zinc-300">
            {member.email}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Role
              </dt>
              <dd className="mt-1 text-sm font-semibold capitalize">
                {member.role}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Status
              </dt>
              <dd className="mt-1 text-sm font-semibold capitalize">
                {member.status}
              </dd>
            </div>
          </dl>
        </div>

        <form action={updateMemberAction} className="grid gap-3 sm:min-w-80">
          <input name="memberId" type="hidden" value={member.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              Role
              <select
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                defaultValue={member.role === "manager" ? "manager" : "staff"}
                disabled={isCurrentManager}
                name="role"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Status
              <select
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                defaultValue={member.status}
                disabled={isCurrentManager}
                name="status"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          {isCurrentManager ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              You cannot deactivate or demote your own manager account.
            </p>
          ) : (
            <button
              className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
              type="submit"
            >
              Update member
            </button>
          )}
        </form>
      </div>
    </li>
  );
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { profile } = await requireRole(["manager"]);
  const [members, invites] = await Promise.all([
    getTeamMembers(),
    getTeamInvites(),
  ]);
  const params = await searchParams;
  const errorMessage = getSearchMessage(params.error);
  const successMessage = getSearchMessage(params.success);

  async function createInviteAction() {
    "use server";

    try {
      await createTeamInvite();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create invite code.";

      redirect(`/team?error=${encodeURIComponent(message)}`);
    }

    redirect(`/team?success=${encodeURIComponent("Invite code created.")}`);
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 px-6 py-16 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <section className="mx-auto w-full max-w-5xl">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          ShiftLog
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">Team Management</h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
              Manage team member roles and access status.
            </p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-medium">
            <Link
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
              href="/manager-review"
            >
              Manager review
            </Link>
            <Link
              className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
              href="/current-shift"
            >
              Current shift
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Team Members</h2>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {members.length}
            </span>
          </div>
          {members.length > 0 ? (
            <ul className="mt-4 grid gap-3">
              {members.map((member) => (
                <TeamMemberCard
                  currentManagerId={profile.id}
                  key={member.id}
                  member={member}
                />
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                No team members are available yet.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Invite Codes</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Share an active code manually with staff who need to join this
                team.
              </p>
            </div>
            <form action={createInviteAction}>
              <button
                className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
                type="submit"
              >
                Create invite
              </button>
            </form>
          </div>
          {invites.length > 0 ? (
            <ul className="mt-4 grid gap-3">
              {invites.map((invite) => (
                <li
                  className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
                  key={invite.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-lg font-semibold tracking-wide">
                        {invite.code}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        Role: {invite.role} - Status: {invite.status}
                      </p>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Created {new Date(invite.created_at).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                No active invite codes have been created yet.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
