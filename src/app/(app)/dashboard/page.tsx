import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  Users,
  Briefcase,
  CheckSquare,
  TicketPercent,
  TrendingUp,
  UserCog,
  ArrowRight,
  AlertCircle,
  Calendar,
  Trophy,
  HeartCrack,
  DollarSign,
  Target,
  Zap,
  Timer,
} from "lucide-react";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { ticketRollups } from "@/lib/services/ticket.service";

export const dynamic = "force-dynamic";

type Card = {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
};

async function loadKpis(viewerUserId: string) {
  const viewerEmployee = await db.employee.findUnique({
    where: { userId: viewerUserId },
    select: { id: true },
  });
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    clientCount,
    taskCount,
    ticketCount,
    dealCount,
    employeeCount,
    onLeaveCount,
    myOpenTasks,
    overdueTasks,
    dueThisWeekTasks,
    completedThisWeekTasks,
    openDeals,
    atRiskClients,
    newClientsThisWeek,
    wonThisMonth,
  ] = await Promise.all([
    db.client.count({ where: { deletedAt: null } }).catch(() => 0),
    db.task
      .count({
        where: {
          deletedAt: null,
          parentId: null,
          status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW"] },
        },
      })
      .catch(() => 0),
    db.ticket
      .count({ where: { deletedAt: null, status: { notIn: ["CLOSED", "RESOLVED"] } } })
      .catch(() => 0),
    db.deal
      .count({ where: { deletedAt: null, status: "OPEN" } })
      .catch(() => 0),
    db.employee.count({ where: { deletedAt: null } }).catch(() => 0),
    db.employee
      .count({ where: { deletedAt: null, status: "ON_LEAVE" } })
      .catch(() => 0),
    viewerEmployee
      ? db.task.count({
          where: {
            deletedAt: null,
            parentId: null,
            assigneeEmployeeId: viewerEmployee.id,
            status: { notIn: ["DONE", "CANCELLED"] },
          },
        })
      : Promise.resolve(0),
    viewerEmployee
      ? db.task.count({
          where: {
            deletedAt: null,
            parentId: null,
            assigneeEmployeeId: viewerEmployee.id,
            dueDate: { lt: now },
            status: { notIn: ["DONE", "CANCELLED"] },
          },
        })
      : Promise.resolve(0),
    viewerEmployee
      ? db.task.count({
          where: {
            deletedAt: null,
            parentId: null,
            assigneeEmployeeId: viewerEmployee.id,
            dueDate: { gte: weekStart, lte: weekEnd },
            status: { notIn: ["DONE", "CANCELLED"] },
          },
        })
      : Promise.resolve(0),
    viewerEmployee
      ? db.task.count({
          where: {
            deletedAt: null,
            parentId: null,
            assigneeEmployeeId: viewerEmployee.id,
            status: "DONE",
            completedAt: { gte: weekStart, lte: weekEnd },
          },
        })
      : Promise.resolve(0),
    db.deal.findMany({
      where: { deletedAt: null, status: "OPEN" },
      select: { value: true, probability: true, currency: true },
    }),
    db.client.count({
      where: {
        deletedAt: null,
        health: { in: ["AT_RISK", "CHURNING"] },
        status: { not: "CHURNED" },
      },
    }),
    db.client.count({
      where: { deletedAt: null, createdAt: { gte: weekStart, lte: weekEnd } },
    }),
    db.deal.aggregate({
      where: {
        deletedAt: null,
        status: "WON",
        closedAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { value: true },
      _count: { _all: true },
    }),
  ]);

  // Compute USD-normalized open pipeline value. Real FX would query Upstash-
  // cached rates; seed fallback uses baseline conversions.
  const USD_RATES: Record<string, number> = {
    USD: 1,
    EUR: 1.08,
    GBP: 1.26,
    PKR: 0.0036,
    AED: 0.27,
    CAD: 0.73,
    AUD: 0.66,
  };
  let openPipelineUsd = 0;
  let expectedPipelineUsd = 0;
  for (const d of openDeals) {
    const rate = USD_RATES[d.currency] ?? 1;
    const value = Number.parseFloat(d.value.toString()) * rate;
    openPipelineUsd += value;
    expectedPipelineUsd += (value * d.probability) / 100;
  }

  const wonValueUsd = wonThisMonth._sum.value
    ? Number.parseFloat(wonThisMonth._sum.value.toString())
    : 0;

  return {
    clientCount,
    taskCount,
    ticketCount,
    dealCount,
    employeeCount,
    onLeaveCount,
    myOpenTasks,
    overdueTasks,
    dueThisWeekTasks,
    completedThisWeekTasks,
    openPipelineUsd,
    expectedPipelineUsd,
    atRiskClients,
    newClientsThisWeek,
    wonThisMonthCount: wonThisMonth._count._all,
    wonThisMonthValue: wonValueUsd,
  };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [kpis, tickets] = await Promise.all([
    loadKpis(user.id),
    ticketRollups(),
  ]);

  const myCards: Card[] = [
    {
      label: "My open tasks",
      value: String(kpis.myOpenTasks),
      sub: "Assigned to me · not done",
      icon: CheckSquare,
      href: "/dashboard/my-tasks",
    },
    {
      label: "Overdue",
      value: String(kpis.overdueTasks),
      sub: "Past due date, still open",
      icon: AlertCircle,
      href: "/dashboard/my-tasks",
    },
    {
      label: "Due this week",
      value: String(kpis.dueThisWeekTasks),
      sub: "Mon–Sun assigned to me",
      icon: Calendar,
      href: "/dashboard/my-tasks",
    },
    {
      label: "Completed this week",
      value: String(kpis.completedThisWeekTasks),
      sub: "Wins tracked in audit log",
      icon: Trophy,
    },
  ];

  const revenueCards: Card[] = [
    {
      label: "Open pipeline",
      value: `$${formatCompact(kpis.openPipelineUsd)}`,
      sub: `${kpis.dealCount} open deals · USD-normalized`,
      icon: DollarSign,
      href: "/dashboard/deals",
    },
    {
      label: "Expected revenue",
      value: `$${formatCompact(kpis.expectedPipelineUsd)}`,
      sub: "value × stage probability",
      icon: Target,
      href: "/dashboard/deals",
    },
    {
      label: "Won this month",
      value: `$${formatCompact(kpis.wonThisMonthValue)}`,
      sub: `${kpis.wonThisMonthCount} deals closed won`,
      icon: Trophy,
    },
    {
      label: "At-risk clients",
      value: String(kpis.atRiskClients),
      sub: `${kpis.newClientsThisWeek} new this week`,
      icon: HeartCrack,
      href: "/dashboard/clients?health=AT_RISK&health=CHURNING",
    },
  ];

  const cards: Card[] = [
    {
      label: "Employees",
      value: String(kpis.employeeCount),
      sub: `${kpis.onLeaveCount} on leave · DPL · VCS · BSL`,
      icon: UserCog,
      href: "/dashboard/employees",
    },
    {
      label: "Active clients",
      value: String(kpis.clientCount),
      sub: "all companies",
      icon: Briefcase,
      href: "/dashboard/clients",
    },
    {
      label: "Open tasks",
      value: String(kpis.taskCount),
      sub: "TODO / IN_PROGRESS / IN_REVIEW",
      icon: CheckSquare,
      href: "/dashboard/tasks",
    },
    {
      label: "Live tickets",
      value: String(kpis.ticketCount),
      sub: "not closed or resolved",
      icon: TicketPercent,
    },
    {
      label: "Open deals",
      value: String(kpis.dealCount),
      sub: "pipeline status OPEN",
      icon: TrendingUp,
      href: "/dashboard/deals",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            Welcome, {user.firstName ?? user.fullName ?? user.email}
          </h2>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Live metrics across DPL · VCS · BSL.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#71717A]">
          <Users className="w-3.5 h-3.5" />
          <span>Signed in as {user.role}</span>
        </div>
      </header>

      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
          Your week
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {myCards.map(({ label, value, sub, icon: Icon, href }) => {
            const body = (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#71717A]">
                    {label}
                  </span>
                  <span className="w-8 h-8 rounded-md bg-[#F59E0B]/10 grid place-items-center text-[#F59E0B]">
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-[#FAFAFA]">{value}</p>
                <p className="mt-1 text-[11px] text-[#71717A]">{sub}</p>
                {href ? (
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#F59E0B] group-hover:translate-x-1 transition-transform">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                ) : null}
              </>
            );
            const base =
              "rounded-xl bg-[#111111] border border-[#1F1F1F] p-5 hover:border-[#F59E0B]/40 transition-colors";
            return href ? (
              <Link key={label} href={href} className={`${base} group block`}>
                {body}
              </Link>
            ) : (
              <div key={label} className={base}>
                {body}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
          Support
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SupportCard
            label="Live tickets"
            value={String(tickets.open)}
            sub="Open, ack, in progress, waiting"
            icon={TicketPercent}
            href="/dashboard/tickets?includeClosed=false"
          />
          <SupportCard
            label="SLA breaching"
            value={String(tickets.breaching)}
            sub="Past response or resolution SLA"
            icon={Zap}
            href="/dashboard/tickets?slaBreaching=true"
            accent={tickets.breaching > 0 ? "danger" : undefined}
          />
          <SupportCard
            label="Avg first response"
            value={
              tickets.avgResponseMinutes != null
                ? formatMinutes(tickets.avgResponseMinutes)
                : "—"
            }
            sub="Rolling 30d response median"
            icon={Timer}
          />
          <SupportCard
            label="Closed this week"
            value={String(tickets.closedThisWeek)}
            sub="Resolved + closed"
            icon={Trophy}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#71717A]">
          Revenue · Pipeline · Risk
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {revenueCards.map(({ label, value, sub, icon: Icon, href }) => {
            const body = (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#71717A]">
                    {label}
                  </span>
                  <span className="w-8 h-8 rounded-md bg-[#F59E0B]/10 grid place-items-center text-[#F59E0B]">
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-[#FAFAFA]">{value}</p>
                <p className="mt-1 text-[11px] text-[#71717A]">{sub}</p>
                {href ? (
                  <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#F59E0B] group-hover:translate-x-1 transition-transform">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                ) : null}
              </>
            );
            const base =
              "rounded-xl bg-[#111111] border border-[#1F1F1F] p-5 hover:border-[#F59E0B]/40 transition-colors";
            return href ? (
              <Link key={label} href={href} className={`${base} group block`}>
                {body}
              </Link>
            ) : (
              <div key={label} className={base}>
                {body}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map(({ label, value, sub, icon: Icon, href }) => {
          const body = (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#71717A]">
                  {label}
                </span>
                <span className="w-8 h-8 rounded-md bg-[#F59E0B]/10 grid place-items-center text-[#F59E0B]">
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold text-[#FAFAFA]">{value}</p>
              <p className="mt-1 text-[11px] text-[#71717A]">{sub}</p>
              {href ? (
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#F59E0B] group-hover:translate-x-1 transition-transform">
                  Open <ArrowRight className="w-3 h-3" />
                </span>
              ) : null}
            </>
          );
          const base = "rounded-xl bg-[#111111] border border-[#1F1F1F] p-5 hover:border-[#F59E0B]/40 transition-colors";
          return href ? (
            <Link key={label} href={href} className={`${base} group block`}>
              {body}
            </Link>
          ) : (
            <div key={label} className={base}>
              {body}
            </div>
          );
        })}
      </section>

      <section className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-6">
        <h3 className="text-sm font-medium text-[#FAFAFA]">What&apos;s live</h3>
        <p className="mt-2 text-sm text-[#A1A1AA]">
          Slices 0–4 shipped: employees, task board with kanban, client 360, deal pipeline
          with stage-move + probability rollups, ticket inbox with SLA timers. AI/Chat and Billing ship next.
        </p>
      </section>
    </div>
  );
}

function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (hours < 48) return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function SupportCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  accent?: "danger";
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-[#71717A]">
          {label}
        </span>
        <span
          className={`w-8 h-8 rounded-md grid place-items-center ${
            accent === "danger"
              ? "bg-red-500/10 text-red-400"
              : "bg-[#F59E0B]/10 text-[#F59E0B]"
          }`}
        >
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold text-[#FAFAFA]">{value}</p>
      <p className="mt-1 text-[11px] text-[#71717A]">{sub}</p>
      {href ? (
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#F59E0B] group-hover:translate-x-1 transition-transform">
          Open <ArrowRight className="w-3 h-3" />
        </span>
      ) : null}
    </>
  );
  const base = `rounded-xl bg-[#111111] border p-5 hover:border-[#F59E0B]/40 transition-colors ${
    accent === "danger" ? "border-red-500/30" : "border-[#1F1F1F]"
  }`;
  return href ? (
    <Link href={href} className={`${base} group block`}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}
