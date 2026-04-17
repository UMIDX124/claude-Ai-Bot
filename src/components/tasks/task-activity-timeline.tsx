"use client";

import { formatDistanceToNow } from "date-fns";
import type { TaskActivityKind } from "@prisma/client";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";

export type TaskActivityItem = {
  id: string;
  taskId: string;
  kind: TaskActivityKind;
  fromValue: string | null;
  toValue: string | null;
  metadata: unknown;
  createdAt: string;
  actor: { id: string; fullName: string | null; email: string; avatarUrl: string | null };
};

const KIND_LABELS: Record<TaskActivityKind, string> = {
  CREATED: "created this task",
  STATUS_CHANGED: "changed status",
  ASSIGNED: "assigned",
  UNASSIGNED: "unassigned",
  COMMENTED: "commented",
  PRIORITY_CHANGED: "changed priority",
  DUE_DATE_CHANGED: "changed due date",
  COMPLETED: "completed",
  REOPENED: "reopened",
  ATTACHMENT_ADDED: "attached a file",
  SUBTASK_ADDED: "added subtask",
  SUBTASK_COMPLETED: "completed subtask",
  LABEL_ADDED: "added label",
  LABEL_REMOVED: "removed label",
  DEPENDENCY_ADDED: "added dependency",
  DEPENDENCY_REMOVED: "removed dependency",
  MOVED: "moved",
  DELETED: "deleted",
  RESTORED: "restored",
  ESTIMATE_CHANGED: "updated estimate",
};

export function TaskActivityTimeline({ items }: { items: TaskActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[#71717A]">No activity yet.</p>;
  }
  return (
    <ol className="space-y-2">
      {items.map((a) => {
        const name = a.actor.fullName ?? a.actor.email;
        return (
          <li key={a.id} className="flex items-start gap-3">
            <EmployeeAvatar name={name} url={a.actor.avatarUrl} size="sm" />
            <div className="flex-1 text-[11px] text-[#A1A1AA] border-l border-[#1F1F1F] pl-3 pb-2">
              <span>
                <span className="text-[#FAFAFA] font-medium">{name}</span>{" "}
                {KIND_LABELS[a.kind] ?? a.kind.toLowerCase()}
                {a.fromValue && a.toValue ? (
                  <>
                    {" "}
                    <span className="text-[#71717A]">{a.fromValue}</span> →{" "}
                    <span className="text-[#F59E0B]">{a.toValue}</span>
                  </>
                ) : null}
              </span>
              <span className="ml-2 text-[#71717A]">
                {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
