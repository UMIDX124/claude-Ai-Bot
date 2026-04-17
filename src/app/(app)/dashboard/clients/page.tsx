import { requireUser } from "@/lib/auth";
import { listClients } from "@/lib/services/client.service";
import { ClientListQuerySchema } from "@/lib/validations/client";
import { can } from "@/lib/rbac";
import { ClientsBrowser } from "@/components/clients/clients-browser";
import {
  buildClientPermissions,
  clientFiltersFromParams,
  toClientListResponse,
} from "@/components/clients/server-helpers";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  if (!can(user, "clients.read")) {
    return <p className="text-sm text-[#71717A]">You don&apos;t have access to clients.</p>;
  }
  const params = await searchParams;
  const query = ClientListQuerySchema.parse(clientFiltersFromParams(params));
  const result = await listClients(user, query);

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            Clients
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {result.total} accounts across DPL · VCS · BSL
          </p>
        </div>
      </header>
      <ClientsBrowser
        initial={toClientListResponse(result)}
        initialFilters={query}
        permissions={buildClientPermissions(user)}
      />
    </div>
  );
}
