"use client";

import Link from "next/link";
import {
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Clock,
  Briefcase,
  UserCircle,
  Github,
  Linkedin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "./StatusBadge";
import { EmployeeAvatar } from "./EmployeeAvatar";
import type { EmployeeRow } from "./types";

export function DetailSheet({
  open,
  row,
  onOpenChange,
  onEdit,
}: {
  open: boolean;
  row: EmployeeRow | null;
  onOpenChange: (v: boolean) => void;
  onEdit?: (row: EmployeeRow) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        {row ? <SheetBody row={row} onEdit={onEdit} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({
  row,
  onEdit,
}: {
  row: EmployeeRow;
  onEdit?: (row: EmployeeRow) => void;
}) {
  const name =
    row.user.fullName ??
    [row.user.firstName, row.user.lastName].filter(Boolean).join(" ") ??
    row.user.email;

  return (
    <div className="space-y-6">
      <SheetHeader className="flex flex-row items-center gap-4">
        <EmployeeAvatar name={name} url={row.user.avatarUrl} size="lg" />
        <div className="flex-1">
          <SheetTitle className="text-xl">{name}</SheetTitle>
          <SheetDescription>
            {row.position ?? row.role?.name ?? "Team member"} ·{" "}
            <span className="text-[#F59E0B]">{row.company.type}</span>
          </SheetDescription>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <StatusBadge status={row.status} />
            {row.employmentType ? (
              <Badge variant="outline">{row.employmentType.replace("_", " ").toLowerCase()}</Badge>
            ) : null}
            {row.workLocation ? (
              <Badge variant="outline">{row.workLocation.toLowerCase()}</Badge>
            ) : null}
            {row.employeeCode ? (
              <span className="text-xs font-mono text-[#F59E0B]">
                {row.employeeCode}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {onEdit ? (
            <Button size="sm" onClick={() => onEdit(row)}>
              Edit
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" asChild>
            <Link href={`/dashboard/employees/${row.id}`}>
              <ExternalLink className="h-3 w-3 mr-1" />
              Full page
            </Link>
          </Button>
        </div>
      </SheetHeader>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="work">Work</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-4">
            <Row icon={<Mail className="h-4 w-4" />} label="Email" value={row.user.email} />
            <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={row.user.phone ?? "—"} />
            <Row
              icon={<MapPin className="h-4 w-4" />}
              label="Address"
              value={formatAddress(row.address)}
            />
            <Row
              icon={<Clock className="h-4 w-4" />}
              label="Timezone"
              value={row.timezone ?? "—"}
            />
            {row.bio ? (
              <div className="pt-2 border-t border-[#1F1F1F]">
                <p className="text-xs uppercase tracking-wider text-[#71717A] mb-2">Bio</p>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">{row.bio}</p>
              </div>
            ) : null}
            {row.skills.length ? (
              <div className="pt-2 border-t border-[#1F1F1F]">
                <p className="text-xs uppercase tracking-wider text-[#71717A] mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {row.skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-xs px-2 py-0.5"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {(row.linkedinUrl || row.githubUrl) ? (
              <div className="pt-2 border-t border-[#1F1F1F] flex gap-2">
                {row.linkedinUrl ? (
                  <Button size="sm" variant="secondary" asChild>
                    <a href={row.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-3 w-3 mr-1" />
                      LinkedIn
                    </a>
                  </Button>
                ) : null}
                {row.githubUrl ? (
                  <Button size="sm" variant="secondary" asChild>
                    <a href={row.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="h-3 w-3 mr-1" />
                      GitHub
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="work">
          <div className="space-y-4">
            <Row
              icon={<Briefcase className="h-4 w-4" />}
              label="Department"
              value={row.department?.name ?? "—"}
            />
            <Row
              icon={<Briefcase className="h-4 w-4" />}
              label="Role"
              value={row.role?.name ?? row.position ?? "—"}
            />
            <Row
              icon={<UserCircle className="h-4 w-4" />}
              label="Manager"
              value={
                row.manager
                  ? row.manager.user.fullName ?? row.manager.user.email
                  : "—"
              }
            />
            <Row
              icon={<Clock className="h-4 w-4" />}
              label="Hired"
              value={
                row.hireDate
                  ? new Date(row.hireDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"
              }
            />
            {row.probationEndDate ? (
              <Row
                icon={<Clock className="h-4 w-4" />}
                label="Probation ends"
                value={new Date(row.probationEndDate).toLocaleDateString("en-US")}
              />
            ) : null}
            {row.salaryVisible ? (
              <>
                <Separator />
                <Row
                  icon={<Briefcase className="h-4 w-4" />}
                  label="Salary"
                  value={
                    row.salary
                      ? `${row.salaryCurrency} ${Number.parseFloat(row.salary).toLocaleString()}`
                      : "—"
                  }
                />
              </>
            ) : null}
            {row.terminationDate ? (
              <div className="pt-2 border-t border-[#1F1F1F] space-y-1">
                <Row
                  icon={<Clock className="h-4 w-4" />}
                  label="Terminated"
                  value={new Date(row.terminationDate).toLocaleDateString()}
                />
                {row.terminationReason ? (
                  <p className="text-xs text-[#71717A] pl-6">Reason: {row.terminationReason}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="emergency">
          {row.emergencyContact ? (
            <div className="space-y-3">
              <Row label="Name" value={row.emergencyContact.name ?? "—"} />
              <Row label="Relation" value={row.emergencyContact.relation ?? "—"} />
              <Row label="Phone" value={row.emergencyContact.phone ?? "—"} />
              <Row label="Email" value={row.emergencyContact.email ?? "—"} />
            </div>
          ) : (
            <p className="text-sm text-[#71717A]">No emergency contact on file.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
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
      {icon ? (
        <span className="mt-0.5 text-[#F59E0B]">{icon}</span>
      ) : (
        <span className="w-4" />
      )}
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-wider text-[#71717A]">{label}</p>
        <p className="text-sm text-[#FAFAFA]">{value}</p>
      </div>
    </div>
  );
}

function formatAddress(
  addr:
    | { line1?: string; city?: string; country?: string; state?: string }
    | null
    | undefined,
): string {
  if (!addr) return "—";
  const parts = [addr.line1, addr.city, addr.state, addr.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}
