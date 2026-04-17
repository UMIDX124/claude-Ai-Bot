"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ClientStatus, ClientHealth, CompanyType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Values = {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  city: string;
  country: string;
  companyType: CompanyType;
  status: ClientStatus;
  health: ClientHealth;
  healthScore: string;
  accountTier: string;
  mrr: string;
  arr: string;
};

export default function NewClientPage() {
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    name: "",
    legalName: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    city: "",
    country: "",
    companyType: "DPL",
    status: "PROSPECT",
    health: "UNKNOWN",
    healthScore: "",
    accountTier: "",
    mrr: "",
    arr: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          mrr: values.mrr ? Number.parseFloat(values.mrr) : null,
          arr: values.arr ? Number.parseFloat(values.arr) : null,
          healthScore: values.healthScore
            ? Number.parseInt(values.healthScore, 10)
            : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Create failed" }));
        throw new Error(body.error ?? `Create failed (${res.status})`);
      }
      const client = await res.json();
      router.push(`/dashboard/clients/${client.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/clients">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to clients
        </Link>
      </Button>
      <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
        New client
      </h1>

      <form onSubmit={submit} className="space-y-6">
        <Section title="Identity">
          <Grid2>
            <Field label="Name">
              <Input
                required
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              />
            </Field>
            <Field label="Legal name">
              <Input
                value={values.legalName}
                onChange={(e) =>
                  setValues((v) => ({ ...v, legalName: e.target.value }))
                }
              />
            </Field>
            <Field label="Company">
              <Select
                value={values.companyType}
                onValueChange={(v) =>
                  setValues((s) => ({ ...s, companyType: v as CompanyType }))
                }
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
            <Field label="Account tier">
              <Input
                value={values.accountTier}
                onChange={(e) =>
                  setValues((v) => ({ ...v, accountTier: e.target.value }))
                }
                placeholder="Enterprise, Growth…"
              />
            </Field>
          </Grid2>
        </Section>

        <Section title="Contact">
          <Grid2>
            <Field label="Email">
              <Input
                type="email"
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={values.phone}
                onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
              />
            </Field>
            <Field label="Website">
              <Input
                value={values.website}
                onChange={(e) =>
                  setValues((v) => ({ ...v, website: e.target.value }))
                }
              />
            </Field>
            <Field label="Industry">
              <Input
                value={values.industry}
                onChange={(e) =>
                  setValues((v) => ({ ...v, industry: e.target.value }))
                }
              />
            </Field>
            <Field label="City">
              <Input
                value={values.city}
                onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
              />
            </Field>
            <Field label="Country">
              <Input
                value={values.country}
                onChange={(e) =>
                  setValues((v) => ({ ...v, country: e.target.value }))
                }
              />
            </Field>
          </Grid2>
        </Section>

        <Section title="Status & revenue">
          <Grid2>
            <Field label="Status">
              <Select
                value={values.status}
                onValueChange={(v) =>
                  setValues((s) => ({ ...s, status: v as ClientStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PROSPECT">Prospect</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="CHURNED">Churned</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Health">
              <Select
                value={values.health}
                onValueChange={(v) =>
                  setValues((s) => ({ ...s, health: v as ClientHealth }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEALTHY">Healthy</SelectItem>
                  <SelectItem value="AT_RISK">At risk</SelectItem>
                  <SelectItem value="CHURNING">Churning</SelectItem>
                  <SelectItem value="UNKNOWN">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Health score (0–100)">
              <Input
                type="number"
                min="0"
                max="100"
                value={values.healthScore}
                onChange={(e) =>
                  setValues((v) => ({ ...v, healthScore: e.target.value }))
                }
              />
            </Field>
            <Field label="MRR (USD)">
              <Input
                type="number"
                step="100"
                value={values.mrr}
                onChange={(e) => setValues((v) => ({ ...v, mrr: e.target.value }))}
              />
            </Field>
            <Field label="ARR (USD)">
              <Input
                type="number"
                step="1000"
                value={values.arr}
                onChange={(e) => setValues((v) => ({ ...v, arr: e.target.value }))}
              />
            </Field>
          </Grid2>
        </Section>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <footer className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !values.name.trim()}>
            {busy ? "Creating…" : "Create client"}
          </Button>
        </footer>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-5 space-y-4">
      <h3 className="text-sm font-medium text-[#FAFAFA]">{title}</h3>
      {children}
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
