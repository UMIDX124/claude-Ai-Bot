import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Hash,
  Target,
  Building2,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getClient } from "@/lib/services/client.service";
import { serializeClient } from "@/lib/services/client.serialize";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { ClientHealthBadge } from "@/components/clients/client-health-badge";
import { ClientDetailClient } from "./client-detail-client";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!can(user, "clients.read")) notFound();

  const row = await getClient(user, id);
  if (!row) notFound();
  const client = serializeClient(row);

  const ownerName =
    client.ownerEmployee?.user.fullName ??
    `${client.ownerEmployee?.user.firstName ?? ""} ${client.ownerEmployee?.user.lastName ?? ""}`.trim() ??
    null;

  const [contacts, notes, deals, activity] = await Promise.all([
    db.contact.findMany({
      where: { clientId: id, deletedAt: null },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    }),
    db.clientNote.findMany({
      where: { clientId: id, deletedAt: null },
      include: {
        author: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
    db.deal.findMany({
      where: { clientId: id, deletedAt: null },
      include: {
        stage: { select: { id: true, name: true, color: true, isWon: true, isLost: true } },
        ownerEmployee: {
          select: {
            id: true,
            user: { select: { fullName: true, email: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.auditLog.findMany({
      where: { resourceType: "Client", resourceId: id },
      include: { actor: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const canEdit =
    can(user, "clients.update.any") ||
    (can(user, "clients.update") &&
      client.ownerEmployee?.user.id === user.id) ||
    can(user, "clients.update.any");
  const canComment = can(user, "clients.update");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/dashboard/clients">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Link>
          </Button>
        </div>
        <div className="flex-1 flex items-start gap-4 min-w-[300px]">
          {client.logoUrl ? (
            <Image
              src={client.logoUrl}
              alt={client.name}
              width={56}
              height={56}
              className="rounded-lg bg-[#1F1F1F] object-contain"
              unoptimized
            />
          ) : (
            <span className="h-14 w-14 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] grid place-items-center text-lg font-bold">
              {client.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[#FAFAFA]">{client.name}</h1>
            <p className="text-sm text-[#A1A1AA] mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-[#F59E0B]">{client.company.type}</span>
              {client.accountTier && (
                <>
                  <span>·</span>
                  <span>{client.accountTier}</span>
                </>
              )}
              {client.industry && (
                <>
                  <span>·</span>
                  <span>{client.industry}</span>
                </>
              )}
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <ClientStatusBadge status={client.status} />
              <ClientHealthBadge health={client.health} score={client.healthScore} />
              {client.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex text-[10px] px-1.5 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts · {contacts.length}</TabsTrigger>
          <TabsTrigger value="deals">Deals · {deals.length}</TabsTrigger>
          <TabsTrigger value="notes">Notes · {notes.length}</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Contact">
              <Row icon={<Mail className="h-4 w-4" />} label="Email" value={client.email ?? "—"} />
              <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={client.phone ?? "—"} />
              <Row icon={<Globe className="h-4 w-4" />} label="Website" value={client.website ?? "—"} />
              <Row
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={[client.city, client.country].filter(Boolean).join(", ") || "—"}
              />
              {client.slackChannel && (
                <Row
                  icon={<Hash className="h-4 w-4" />}
                  label="Slack"
                  value={client.slackChannel}
                />
              )}
            </InfoCard>
            <InfoCard title="Revenue">
              <Row label="MRR" value={client.mrr ? `$${Number.parseFloat(client.mrr).toLocaleString()}` : "—"} />
              <Row label="ARR" value={client.arr ? `$${Number.parseFloat(client.arr).toLocaleString()}` : "—"} />
              <Row label="LTV" value={client.lifetimeValue ? `$${Number.parseFloat(client.lifetimeValue).toLocaleString()}` : "—"} />
              <Row
                icon={<Target className="h-4 w-4" />}
                label="Renewal"
                value={client.renewalDate ? format(new Date(client.renewalDate), "MMM d, yyyy") : "—"}
              />
              <Row
                icon={<Building2 className="h-4 w-4" />}
                label="Signed up"
                value={client.signupDate ? format(new Date(client.signupDate), "MMM d, yyyy") : "—"}
              />
              <Row label="Owner" value={ownerName ?? "Unassigned"} />
            </InfoCard>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <ul className="space-y-2">
            {contacts.length === 0 && (
              <li className="text-sm text-[#71717A]">No contacts yet.</li>
            )}
            {contacts.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] p-3 flex items-center gap-3"
              >
                {c.avatarUrl ? (
                  <Image
                    src={c.avatarUrl}
                    alt={c.fullName ?? ""}
                    width={36}
                    height={36}
                    className="rounded-full"
                    unoptimized
                  />
                ) : (
                  <span className="h-9 w-9 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] grid place-items-center text-xs font-bold">
                    {(c.firstName?.[0] ?? "?")}
                    {(c.lastName?.[0] ?? "")}
                  </span>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#FAFAFA]">
                    {c.fullName ?? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()}
                    {c.isPrimary && (
                      <span className="ml-2 text-[10px] text-[#F59E0B] uppercase tracking-wider">
                        Primary
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-[#71717A]">
                    {c.title ?? ""}{c.department ? ` · ${c.department}` : ""}
                  </p>
                </div>
                <div className="text-[11px] text-[#A1A1AA] text-right">
                  {c.email && <p>{c.email}</p>}
                  {c.phone && <p>{c.phone}</p>}
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="deals">
          {deals.length === 0 ? (
            <p className="text-sm text-[#71717A]">No deals linked.</p>
          ) : (
            <ul className="space-y-2">
              {deals.map((d) => (
                <li
                  key={d.id}
                  className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] p-3 flex items-center justify-between"
                >
                  <Link
                    href={`/dashboard/deals/${d.id}`}
                    className="flex-1 group"
                  >
                    <p className="text-sm font-medium text-[#FAFAFA] group-hover:text-[#F59E0B]">
                      {d.title}
                    </p>
                    <p className="text-[11px] text-[#71717A]">
                      {d.currency} {Number.parseFloat(d.value.toString()).toLocaleString()} ·{" "}
                      {d.stage.name} · {d.probability}%
                    </p>
                  </Link>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: d.stage.color ?? "#F59E0B" }}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <ClientDetailClient
            clientId={id}
            initialNotes={notes.map((n) => ({
              ...n,
              createdAt: n.createdAt.toISOString(),
              updatedAt: n.updatedAt.toISOString(),
            }))}
            viewerId={user.id}
            canEdit={canComment}
          />
        </TabsContent>

        <TabsContent value="activity">
          <ol className="space-y-2">
            {activity.length === 0 && (
              <li className="text-sm text-[#71717A]">No audit history.</li>
            )}
            {activity.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] px-3 py-2 text-[11px] text-[#A1A1AA]"
              >
                <span className="inline-flex px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] uppercase tracking-wider mr-2">
                  {a.action}
                </span>
                <span className="text-[#FAFAFA] font-medium">
                  {a.actor?.fullName ?? a.actor?.email ?? "system"}
                </span>
                <span className="ml-auto float-right text-[10px] text-[#71717A]">
                  {format(new Date(a.createdAt), "MMM d · HH:mm")}
                </span>
              </li>
            ))}
          </ol>
        </TabsContent>
      </Tabs>

      {canEdit && (
        <div className="flex justify-end">
          <Button asChild variant="secondary">
            <Link href={`/dashboard/clients/${id}/edit`}>Edit client</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-5 space-y-2">
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#71717A]">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon ? <span className="mt-0.5 text-[#F59E0B]">{icon}</span> : <span className="w-4" />}
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-wider text-[#71717A]">{label}</p>
        <p className="text-sm text-[#FAFAFA]">{value}</p>
      </div>
    </div>
  );
}
