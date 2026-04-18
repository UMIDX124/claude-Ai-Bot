import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTicket } from "@/lib/services/ticket.service";
import { serializeTicket } from "@/lib/services/ticket.serialize";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { TicketDetailView } from "@/components/tickets/ticket-detail-view";
import { buildTicketPermissions } from "@/components/tickets/server-helpers";
import type { TicketRow } from "@/components/tickets/types";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!can(user, "tickets.read")) notFound();

  const raw = await getTicket(user, id);
  if (!raw) notFound();
  const ticket = serializeTicket(raw) as unknown as TicketRow;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/tickets">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to inbox
        </Link>
      </Button>
      <TicketDetailView
        ticket={ticket}
        viewerId={user.id}
        permissions={buildTicketPermissions(user)}
      />
    </div>
  );
}
