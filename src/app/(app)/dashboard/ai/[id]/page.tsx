import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getConversation } from "@/lib/services/ai.service";
import { Button } from "@/components/ui/button";
import { AiConversationView } from "@/components/comms/ai-conversation-view";

export const dynamic = "force-dynamic";

export default async function AiConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  let convo;
  try {
    convo = await getConversation(user, id);
  } catch {
    notFound();
  }

  const initial = convo.messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/ai">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>
      </Button>
      <header className="border-b border-[#1F1F1F] pb-3">
        <h1 className="text-xl font-semibold text-[#FAFAFA]">
          {convo.title ?? "Conversation"}
        </h1>
        <p className="text-xs text-[#71717A]">{convo.model ?? "default model"}</p>
      </header>
      <AiConversationView conversationId={id} initialMessages={initial} />
    </div>
  );
}
