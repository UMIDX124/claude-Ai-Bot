"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Send, Lock, Users, Target, Star } from "lucide-react";
import type { TicketStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import {
  TicketChannelIcon,
  TicketPriorityBadge,
  TicketStatusBadge,
} from "./ticket-badges";
import { SlaTimerBadge } from "./sla-timer-badge";
import type {
  TicketActivityRow,
  TicketMessageRow,
  TicketPermissions,
  TicketRow,
} from "./types";

const STATUSES: TicketStatus[] = [
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];

export function TicketDetailView({
  ticket: initialTicket,
  viewerId,
  permissions,
}: {
  ticket: TicketRow;
  viewerId: string;
  permissions: TicketPermissions;
}) {
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketRow>(initialTicket);
  const [messages, setMessages] = useState<TicketMessageRow[]>([]);
  const [activity, setActivity] = useState<TicketActivityRow[]>([]);
  const [draft, setDraft] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [mRes, aRes, tRes] = await Promise.all([
      fetch(`/api/tickets/${initialTicket.id}/messages`, { cache: "no-store" }),
      fetch(`/api/tickets/${initialTicket.id}/activity`, { cache: "no-store" }),
      fetch(`/api/tickets/${initialTicket.id}`, { cache: "no-store" }),
    ]);
    if (mRes.ok) setMessages(await mRes.json());
    if (aRes.ok) setActivity(await aRes.json());
    if (tRes.ok) setTicket(await tRes.json());
  }, [initialTicket.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submitReply() {
    const content = draft.trim();
    if (!content) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, isInternal: internal }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({ error: "Send failed" }));
        alert(b.error ?? "Send failed");
        return;
      }
      setDraft("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: TicketStatus) {
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      alert("Status change failed");
      return;
    }
    await refresh();
    router.refresh();
  }

  const assigneeName =
    ticket.assigneeEmployee?.user.fullName ??
    `${ticket.assigneeEmployee?.user.firstName ?? ""} ${ticket.assigneeEmployee?.user.lastName ?? ""}`.trim();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="border-b border-[#1F1F1F] pb-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <span className="text-[11px] text-[#F59E0B] font-mono">#{ticket.number}</span>
            <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
              {ticket.subject}
            </h1>
            <p className="text-sm text-[#A1A1AA] mt-1 flex items-center gap-2 flex-wrap">
              {ticket.client ? (
                <Link
                  href={`/dashboard/clients/${ticket.client.id}`}
                  className="hover:text-[#F59E0B]"
                >
                  {ticket.client.name}
                </Link>
              ) : (
                <span>No client</span>
              )}
              <span>·</span>
              <TicketChannelIcon channel={ticket.channel} />
              {ticket.category && (
                <>
                  <span>·</span>
                  <span>{ticket.category}</span>
                </>
              )}
            </p>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              <SlaTimerBadge
                label="Response"
                state={{
                  dueAt: ticket.responseDueAt,
                  metAt: ticket.firstResponseAt,
                  breachedAt: ticket.responseBreachedAt,
                }}
              />
              <SlaTimerBadge
                label="Resolution"
                state={{
                  dueAt: ticket.resolutionDueAt,
                  metAt: ticket.resolvedAt,
                  breachedAt: ticket.resolutionBreachedAt,
                }}
              />
              {ticket.satisfactionScore && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-[11px] px-2 py-0.5">
                  <Star className="h-3 w-3" /> {ticket.satisfactionScore}/5
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {ticket.assigneeEmployee ? (
              <div className="flex items-center gap-2">
                <EmployeeAvatar
                  name={assigneeName}
                  url={ticket.assigneeEmployee.user.avatarUrl}
                  size="md"
                />
                <div className="text-right">
                  <p className="text-xs text-[#FAFAFA] font-medium">{assigneeName}</p>
                  <p className="text-[10px] text-[#71717A]">assignee</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#71717A]">Unassigned</p>
            )}
            {(permissions.update || permissions.updateAny) && (
              <Select
                value={ticket.status}
                onValueChange={(v) => changeStatus(v as TicketStatus)}
              >
                <SelectTrigger className="w-44 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ").toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </header>

      <Tabs defaultValue="conversation">
        <TabsList>
          <TabsTrigger value="conversation">Conversation · {messages.length}</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity · {activity.length}</TabsTrigger>
        </TabsList>

        <TabsContent value="conversation">
          <section className="space-y-4">
            <article className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] px-4 py-3">
              <header className="text-[11px] text-[#71717A] mb-2">
                <span className="text-[#FAFAFA] font-medium">
                  {ticket.reporter.fullName ?? ticket.reporter.email}
                </span>
                <span className="ml-2">
                  opened {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </span>
              </header>
              <p className="text-sm text-[#FAFAFA] whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </article>

            <ul className="space-y-3">
              {messages.map((m) => {
                const own = m.author.id === viewerId;
                return (
                  <li
                    key={m.id}
                    className={`rounded-lg px-4 py-3 border ${
                      m.isInternal
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : own
                          ? "border-[#F59E0B]/30 bg-[#F59E0B]/5"
                          : "border-[#1F1F1F] bg-[#0F0F0F]"
                    }`}
                  >
                    <header className="flex items-center justify-between text-[11px] text-[#71717A]">
                      <span>
                        <span className="text-[#FAFAFA] font-medium">
                          {m.author.fullName ?? m.author.email}
                        </span>
                        <span className="ml-2">
                          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                        </span>
                      </span>
                      {m.isInternal && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-yellow-500">
                          <Lock className="h-3 w-3" /> internal
                        </span>
                      )}
                    </header>
                    <p className="mt-1 text-sm text-[#FAFAFA] whitespace-pre-wrap leading-relaxed">
                      {m.content}
                    </p>
                  </li>
                );
              })}
            </ul>

            {permissions.reply && (
              <div className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] p-3 space-y-2">
                <Textarea
                  rows={3}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={internal ? "Internal note…" : "Reply to customer…"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void submitReply();
                    }
                  }}
                />
                <footer className="flex items-center justify-between text-[11px]">
                  {permissions.replyInternal ? (
                    <label className="flex items-center gap-2 cursor-pointer text-[#A1A1AA]">
                      <Checkbox
                        checked={internal}
                        onCheckedChange={(v) => setInternal(Boolean(v))}
                      />
                      <Lock className="h-3 w-3" />
                      Internal note (not shown to customer)
                    </label>
                  ) : (
                    <span />
                  )}
                  <Button size="sm" onClick={submitReply} disabled={busy || !draft.trim()}>
                    <Send className="h-3 w-3 mr-1" />
                    {internal ? "Post note" : "Send reply"}
                  </Button>
                </footer>
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="SLA">
              {ticket.sla ? (
                <>
                  <Row label="Policy" value={ticket.sla.name} />
                  <Row
                    label="Response target"
                    value={`${ticket.sla.responseMinutes} minutes`}
                  />
                  <Row
                    label="Resolution target"
                    value={`${ticket.sla.resolutionMinutes} minutes`}
                  />
                  {ticket.responseDueAt && (
                    <Row
                      icon={<Target className="h-3 w-3" />}
                      label="Response due"
                      value={format(new Date(ticket.responseDueAt), "MMM d, HH:mm")}
                    />
                  )}
                  {ticket.resolutionDueAt && (
                    <Row
                      icon={<Target className="h-3 w-3" />}
                      label="Resolution due"
                      value={format(new Date(ticket.resolutionDueAt), "MMM d, HH:mm")}
                    />
                  )}
                </>
              ) : (
                <p className="text-sm text-[#71717A]">No SLA attached.</p>
              )}
            </InfoCard>
            <InfoCard title="Timeline">
              <Row label="Opened" value={format(new Date(ticket.createdAt), "MMM d, HH:mm")} />
              {ticket.acknowledgedAt && (
                <Row
                  label="Acknowledged"
                  value={format(new Date(ticket.acknowledgedAt), "MMM d, HH:mm")}
                />
              )}
              {ticket.firstResponseAt && (
                <Row
                  label="First response"
                  value={format(new Date(ticket.firstResponseAt), "MMM d, HH:mm")}
                />
              )}
              {ticket.resolvedAt && (
                <Row
                  label="Resolved"
                  value={format(new Date(ticket.resolvedAt), "MMM d, HH:mm")}
                />
              )}
              {ticket.closedAt && (
                <Row
                  label="Closed"
                  value={format(new Date(ticket.closedAt), "MMM d, HH:mm")}
                />
              )}
            </InfoCard>
            <InfoCard title="Watchers">
              {ticket.watchers.length === 0 ? (
                <p className="text-sm text-[#71717A]">No watchers.</p>
              ) : (
                <ul className="space-y-1">
                  {ticket.watchers.map((w) => (
                    <li
                      key={w.id}
                      className="flex items-center gap-2 text-sm text-[#A1A1AA]"
                    >
                      <Users className="h-3 w-3" />
                      {w.user.fullName ?? w.user.email}
                    </li>
                  ))}
                </ul>
              )}
            </InfoCard>
            {ticket.tags.length > 0 && (
              <InfoCard title="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {ticket.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex text-[10px] px-1.5 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </InfoCard>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <ol className="space-y-2">
            {activity.length === 0 ? (
              <li className="text-sm text-[#71717A]">No activity yet.</li>
            ) : (
              activity.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] px-3 py-2 text-[11px] text-[#A1A1AA]"
                >
                  <span className="inline-flex px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] uppercase tracking-wider mr-2">
                    {a.kind}
                  </span>
                  {a.fromValue && a.toValue ? (
                    <>
                      <span className="text-[#71717A]">{a.fromValue}</span> →{" "}
                      <span className="text-[#F59E0B]">{a.toValue}</span>
                    </>
                  ) : a.toValue ? (
                    <span className="text-[#F59E0B]">{a.toValue}</span>
                  ) : null}
                  <span className="ml-auto float-right text-[10px] text-[#71717A]">
                    {format(new Date(a.createdAt), "MMM d · HH:mm")}
                  </span>
                </li>
              ))
            )}
          </ol>
        </TabsContent>
      </Tabs>
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
