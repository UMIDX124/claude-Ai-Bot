import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TasksListAlias({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) for (const x of v) sp.append(k, x);
    else sp.set(k, v);
  }
  sp.set("view", "list");
  redirect(`/dashboard/tasks?${sp.toString()}`);
}
