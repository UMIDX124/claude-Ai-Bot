import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  Users,
  Briefcase,
  CheckSquare,
  TicketPercent,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Card = {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
};

async function loadKpis() {
  const [clientCount, taskCount, ticketCount, dealCount] = await Promise.all([
    db.client.count({ where: { deletedAt: null } }).catch(() => 0),
    db.task
      .count({
        where: { deletedAt: null, status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] } },
      })
      .catch(() => 0),
    db.ticket
      .count({ where: { deletedAt: null, status: { notIn: ["CLOSED", "RESOLVED"] } } })
      .catch(() => 0),
    db.deal
      .count({ where: { deletedAt: null, status: "OPEN" } })
      .catch(() => 0),
  ]);
  return { clientCount, taskCount, ticketCount, dealCount };
}

export default async function DashboardPage() {
  const user = await requireUser();
  const kpis = await loadKpis();

  const cards: Card[] = [
    {
      label: "Active clients",
      value: String(kpis.clientCount),
      sub: "status != CHURNED",
      icon: Briefcase,
    },
    {
      label: "Open tasks",
      value: String(kpis.taskCount),
      sub: "TODO / IN_PROGRESS / REVIEW",
      icon: CheckSquare,
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

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl bg-[#111111] border border-[#1F1F1F] p-5 hover:border-[#F59E0B]/40 transition-colors"
          >
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
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-6">
        <h3 className="text-sm font-medium text-[#FAFAFA]">What's next</h3>
        <p className="mt-2 text-sm text-[#A1A1AA]">
          Modules coming online as each slice lands: task board, pipeline kanban, ticket
          inbox, client 360, invoice console, cold-email campaigns. Dashboard tiles above
          are wired to Prisma and will move as soon as the Neon baseline is resolved.
        </p>
      </section>
    </div>
  );
}
