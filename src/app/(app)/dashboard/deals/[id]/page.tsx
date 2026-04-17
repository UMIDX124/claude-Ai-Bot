import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, Clock, Building2, Tag, Target } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDeal, listDealActivity } from "@/lib/services/deal.service";
import { serializeDeal } from "@/lib/services/deal.serialize";
import { can } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { DealDetailClient } from "./deal-detail-client";
import type { DealRow, StageRow } from "@/components/deals/types";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  if (!can(user, "deals.read")) notFound();

  const raw = await getDeal(user, id);
  if (!raw) notFound();
  const deal = serializeDeal(raw) as unknown as DealRow;

  const [stages, activity] = await Promise.all([
    db.stage.findMany({
      where: { pipelineId: deal.pipelineId, deletedAt: null },
      orderBy: { position: "asc" },
    }),
    listDealActivity(user, id),
  ]);

  const stagesSer: StageRow[] = stages.map((s) => ({
    ...s,
    position: s.position.toString(),
  }));

  const ownerName =
    deal.ownerEmployee?.user.fullName ??
    `${deal.ownerEmployee?.user.firstName ?? ""} ${deal.ownerEmployee?.user.lastName ?? ""}`.trim() ??
    null;

  const canEdit =
    can(user, "deals.update.any") ||
    (can(user, "deals.update") &&
      (deal.ownerEmployee?.user.id === user.id ||
        deal.createdBy.id === user.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4 border-b border-[#1F1F1F] pb-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href={`/dashboard/deals?pipelineId=${deal.pipelineId}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to board
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            {deal.title}
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1 flex items-center gap-2 flex-wrap">
            <span
              className="h-2 w-2 rounded-full inline-block"
              style={{ backgroundColor: deal.stage.color ?? "#F59E0B" }}
            />
            <span className="font-medium text-[#FAFAFA]">{deal.stage.name}</span>
            <span>·</span>
            <span className="font-mono text-[#FAFAFA]">
              {deal.currency} {Number.parseFloat(deal.value).toLocaleString()}
            </span>
            <span>·</span>
            <span className="text-[#F59E0B]">{deal.probability}% probability</span>
          </p>
          {deal.client && (
            <p className="mt-2">
              <Link
                href={`/dashboard/clients/${deal.client.id}`}
                className="inline-flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-[#F59E0B]"
              >
                <Building2 className="h-3 w-3" /> {deal.client.name}
              </Link>
            </p>
          )}
        </div>
        {deal.ownerEmployee && (
          <div className="flex flex-col items-end gap-1">
            <EmployeeAvatar
              name={ownerName}
              url={deal.ownerEmployee.user.avatarUrl}
              size="lg"
            />
            <p className="text-xs text-[#A1A1AA]">{ownerName}</p>
          </div>
        )}
      </header>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity · {activity.length}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Deal">
              <Row label="Title" value={deal.title} />
              <Row label="Currency" value={deal.currency} />
              <Row
                label="Value"
                value={`${deal.currency} ${Number.parseFloat(deal.value).toLocaleString()}`}
              />
              <Row label="Probability" value={`${deal.probability}%`} />
              <Row label="Status" value={deal.status} />
              <Row label="Source" value={deal.source ?? "—"} />
            </InfoCard>
            <InfoCard title="Timeline">
              <Row
                icon={<Clock className="h-4 w-4" />}
                label="Created"
                value={format(new Date(deal.createdAt), "MMM d, yyyy")}
              />
              <Row
                icon={<Clock className="h-4 w-4" />}
                label="Updated"
                value={formatDistanceToNow(new Date(deal.updatedAt), { addSuffix: true })}
              />
              <Row
                icon={<Target className="h-4 w-4" />}
                label="Expected close"
                value={deal.expectedClose ? format(new Date(deal.expectedClose), "MMM d, yyyy") : "—"}
              />
              {deal.closedAt && (
                <Row
                  icon={<Clock className="h-4 w-4" />}
                  label="Closed"
                  value={format(new Date(deal.closedAt), "MMM d, yyyy")}
                />
              )}
              {deal.nextStep && (
                <Row label="Next step" value={deal.nextStep} />
              )}
              {deal.nextStepAt && (
                <Row
                  label="Next step at"
                  value={format(new Date(deal.nextStepAt), "MMM d, yyyy")}
                />
              )}
            </InfoCard>
            {deal.status === "LOST" && (
              <InfoCard title="Loss reason">
                <Row label="Category" value={deal.lostReasonCategory ?? "—"} />
                <Row label="Competitor" value={deal.lostCompetitor ?? "—"} />
                {deal.lostReason && (
                  <p className="text-sm text-[#A1A1AA] whitespace-pre-wrap">
                    {deal.lostReason}
                  </p>
                )}
              </InfoCard>
            )}
            {deal.tags.length > 0 && (
              <InfoCard title="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {deal.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]"
                    >
                      <Tag className="h-3 w-3" /> {t}
                    </span>
                  ))}
                </div>
              </InfoCard>
            )}
          </div>

          {deal.description && (
            <div className="rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-5 mt-4">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#71717A] mb-2">
                Description
              </h3>
              <p className="text-sm text-[#FAFAFA] whitespace-pre-wrap leading-relaxed">
                {deal.description}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <ol className="space-y-2">
            {activity.length === 0 && (
              <li className="text-sm text-[#71717A]">No activity yet.</li>
            )}
            {activity.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] px-3 py-2 text-[11px] text-[#A1A1AA]"
              >
                <span className="inline-flex px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] uppercase tracking-wider mr-2">
                  {a.kind}
                </span>
                {a.fromValue && a.toValue ? (
                  <span>
                    <span className="text-[#71717A]">{a.fromValue}</span> →{" "}
                    <span className="text-[#F59E0B]">{a.toValue}</span>
                  </span>
                ) : a.toValue ? (
                  <span className="text-[#F59E0B]">{a.toValue}</span>
                ) : null}
                <span className="ml-auto float-right text-[10px] text-[#71717A]">
                  {format(new Date(a.createdAt), "MMM d · HH:mm")}
                </span>
              </li>
            ))}
          </ol>
        </TabsContent>
      </Tabs>

      {canEdit && (
        <DealDetailClient
          dealId={deal.id}
          stages={stagesSer}
          currentStageId={deal.stageId}
        />
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
