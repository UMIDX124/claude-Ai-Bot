"use client";

import { useState } from "react";
import type { CompanyType, UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DepartmentOption, RoleOption } from "./types";

type InviteForm = {
  email: string;
  firstName: string;
  lastName: string;
  companyType: CompanyType;
  departmentId: string;
  roleId: string;
  userRole: UserRole;
};

export function InviteDialog({
  open,
  onOpenChange,
  departments,
  roles,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  departments: DepartmentOption[];
  roles: RoleOption[];
  onSubmit: (values: InviteForm) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [form, setForm] = useState<InviteForm>({
    email: "",
    firstName: "",
    lastName: "",
    companyType: "DPL",
    departmentId: "",
    roleId: "",
    userRole: "EMPLOYEE",
  });
  const [error, setError] = useState<string | null>(null);

  const filteredDepts = departments.filter((d) => d.company.type === form.companyType);
  const filteredRoles = roles.filter((r) =>
    form.departmentId ? r.department?.id === form.departmentId : true,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.email || !form.firstName || !form.lastName) {
      setError("Email, first name and last name are required.");
      return;
    }
    try {
      await onSubmit(form);
      setForm({
        email: "",
        firstName: "",
        lastName: "",
        companyType: "DPL",
        departmentId: "",
        roleId: "",
        userRole: "EMPLOYEE",
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite employee</DialogTitle>
          <DialogDescription>
            Creates an employee record + placeholder user. Clerk sign-up links the account on
            first login via the email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Work email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Select
                value={form.companyType}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    companyType: v as CompanyType,
                    departmentId: "",
                    roleId: "",
                  }))
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
            </div>
            <div className="space-y-1.5">
              <Label>Login role</Label>
              <Select
                value={form.userRole}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, userRole: v as UserRole }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"] as UserRole[]
                  ).map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={form.departmentId || "__none"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    departmentId: v === "__none" ? "" : v,
                    roleId: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">—</SelectItem>
                  {filteredDepts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.roleId || "__none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, roleId: v === "__none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">—</SelectItem>
                  {filteredRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Inviting…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
