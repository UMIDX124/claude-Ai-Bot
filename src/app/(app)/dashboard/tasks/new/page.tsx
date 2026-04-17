"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog";
import type {
  ProjectRow,
  TaskLabelLite,
} from "@/components/tasks/types";
import type { EmployeeRow } from "@/components/employees/types";

export default function NewTaskPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [labels, setLabels] = useState<TaskLabelLite[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);

  useEffect(() => {
    async function load() {
      const [p, l, e] = await Promise.all([
        fetch("/api/projects").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/tasks/labels").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/employees?pageSize=200").then((r) =>
          r.ok ? r.json().then((j) => j.items) : [],
        ),
      ]);
      setProjects(p);
      setLabels(l);
      setEmployees(e);
    }
    void load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/tasks">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to board
        </Link>
      </Button>
      <TaskCreateDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) router.push("/dashboard/tasks");
        }}
        projects={projects}
        employees={employees}
        labels={labels}
        onCreated={() => router.push("/dashboard/tasks")}
      />
      {!open && (
        <p className="text-sm text-[#71717A]">
          Dialog closed — heading back to the board…
        </p>
      )}
    </div>
  );
}
