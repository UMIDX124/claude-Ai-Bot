"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { CompanyType, TicketChannel, TicketPriority } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Values = {
  companyType: CompanyType;
  subject: string;
  description: string;
  priority: TicketPriority;
  channel: TicketChannel;
  category: string;
  clientId: string;
};

type ClientOption = { id: string; name: string; companyId: string; company: { type: CompanyType } };

export default function NewTicketPage() {
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    companyType: "DPL",
    subject: "",
    description: "",
    priority: "NORMAL",
    channel: "WEB",
    category: "",
    clientId: "",
  });
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/clients?pageSize=200", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      setClients(json.items as ClientOption[]);
    }
    void load();
  }, []);

  const filtered = clients.filter((c) => c.company.type === values.companyType);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyType: values.companyType,
          subject: values.subject,
          description: values.description,
          priority: values.priority,
          channel: values.channel,
          category: values.category || null,
          clientId: values.clientId || null,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({ error: "Create failed" }));
        throw new Error(b.error ?? `Create failed (${res.status})`);
      }
      const t = await res.json();
      router.push(`/dashboard/tickets/${t.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/tickets">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to inbox
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">New ticket</h1>

      <form onSubmit={submit} className="space-y-6">
        <Section title="Identity">
          <Grid2>
            <Field label="Company">
              <Select
                value={values.companyType}
                onValueChange={(v) => setValues((s) => ({ ...s, companyType: v as CompanyType, clientId: "" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DPL">DPL</SelectItem>
                  <SelectItem value="VCS">VCS</SelectItem>
                  <SelectItem value="BSL">BSL</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Client (optional)">
              <Select
                value={values.clientId || "__none"}
                onValueChange={(v) =>
                  setValues((s) => ({ ...s, clientId: v === "__none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="— unknown —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No client linked</SelectItem>
                  {filtered.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Grid2>
        </Section>

        <Section title="Issue">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input
              required
              value={values.subject}
              onChange={(e) => setValues((s) => ({ ...s, subject: e.target.value }))}
              placeholder="Short description of the issue"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              required
              rows={6}
              value={values.description}
              onChange={(e) => setValues((s) => ({ ...s, description: e.target.value }))}
              placeholder="What's happening? Steps to reproduce, error messages, context…"
            />
          </div>
          <Grid2>
            <Field label="Priority">
              <Select
                value={values.priority}
                onValueChange={(v) => setValues((s) => ({ ...s, priority: v as TicketPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Channel">
              <Select
                value={values.channel}
                onValueChange={(v) => setValues((s) => ({ ...s, channel: v as TicketChannel }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="WEB">Web</SelectItem>
                  <SelectItem value="CHAT">Chat</SelectItem>
                  <SelectItem value="PHONE">Phone</SelectItem>
                  <SelectItem value="INTERNAL">Internal</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category">
              <Input
                value={values.category}
                onChange={(e) => setValues((s) => ({ ...s, category: e.target.value }))}
                placeholder="authentication, billing, integration…"
              />
            </Field>
          </Grid2>
        </Section>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <footer className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !values.subject.trim() || !values.description.trim()}>
            {busy ? "Creating…" : "Create ticket"}
          </Button>
        </footer>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-5 space-y-4">
      <h3 className="text-sm font-medium text-[#FAFAFA]">{title}</h3>
      {children}
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
