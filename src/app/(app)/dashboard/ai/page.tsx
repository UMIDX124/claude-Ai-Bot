import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Plus, MessageSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { listConversations } from "@/lib/services/ai.service";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AiIndexPage() {
  const user = await requireUser();
  const convos = await listConversations(user);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            Alpha AI
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Your CRM-aware assistant · Groq llama-3.3-70b
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/ai/new">
            <Plus className="h-4 w-4 mr-1" /> New conversation
          </Link>
        </Button>
      </header>

      {convos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1F1F1F] p-12 text-center">
          <MessageSquare className="h-8 w-8 mx-auto text-[#F59E0B] mb-2" />
          <p className="text-sm text-[#FAFAFA]">No AI conversations yet.</p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/ai/new">Start one</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {convos.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/ai/${c.id}`}
                className="block rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] px-4 py-3 hover:border-[#F59E0B]/40"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#FAFAFA]">
                    {c.title ?? "Untitled conversation"}
                  </p>
                  <span className="text-[10px] text-[#71717A]">
                    {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[11px] text-[#71717A] mt-0.5">
                  {c._count.messages} messages · {c.model ?? "default model"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
