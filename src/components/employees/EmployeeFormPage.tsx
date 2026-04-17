"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "./EmployeeForm";
import type { DepartmentOption, EmployeeRow, RoleOption } from "./types";

export function EmployeeFormPage({
  mode,
  initial,
  departments,
  roles,
  managers,
  canEditSalary,
}: {
  mode: "create" | "edit";
  initial?: EmployeeRow | null;
  departments: DepartmentOption[];
  roles: RoleOption[];
  managers: EmployeeRow[];
  canEditSalary: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      const isEdit = mode === "edit" && initial;
      const url = isEdit ? `/api/employees/${initial.id}` : "/api/employees";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Save failed" }));
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }
      const json = await res.json();
      router.push(`/dashboard/employees/${json.id ?? initial?.id ?? ""}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <header className="flex items-start justify-between gap-3 flex-wrap border-b border-[#1F1F1F] pb-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/dashboard/employees">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to list
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            {mode === "create" ? "New employee" : "Edit employee"}
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {mode === "create"
              ? "Create a placeholder record; they can link their account on first Clerk sign-in."
              : "All changes are audited."}
          </p>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <EmployeeForm
        mode={mode}
        initial={initial ?? null}
        departments={departments}
        roles={roles}
        managers={managers}
        canEditSalary={canEditSalary}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/dashboard/employees")}
        submitting={submitting}
      />
    </div>
  );
}
