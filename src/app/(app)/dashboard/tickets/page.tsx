import { requireUser } from "@/lib/auth";
import { listTickets } from "@/lib/services/ticket.service";
import { TicketListQuerySchema } from "@/lib/validations/ticket";
import { can } from "@/lib/rbac";
import { TicketsBrowser } from "@/components/tickets/tickets-browser";
import {
  buildTicketPermissions,
  ticketFiltersFromParams,
  toTicketListResponse,
} from "@/components/tickets/server-helpers";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  if (!can(user, "tickets.read")) {
    return <p className="text-sm text-[#71717A]">No access to tickets.</p>;
  }
  const params = await searchParams;
  const query = TicketListQuerySchema.parse(ticketFiltersFromParams(params));
  const result = await listTickets(user, query);

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            Tickets
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {result.total} tickets · support inbox across DPL · VCS · BSL
          </p>
        </div>
      </header>
      <TicketsBrowser
        initial={toTicketListResponse(result)}
        initialFilters={query}
        permissions={buildTicketPermissions(user)}
      />
    </div>
  );
}
