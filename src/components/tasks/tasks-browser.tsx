"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import {
  KanbanSquare,
  List,
  Plus,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import type { TaskStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KanbanBoard } from "./kanban-board";
import { TaskListView } from "./task-list-view";
import { TaskFiltersSidebar } from "./task-filters";
import { TaskDetailSheet } from "./task-detail-sheet";
import { TaskCreateDialog } from "./task-create-dialog";
import { TaskSearchPalette } from "./task-search";
import { ProjectSelector } from "./project-selector";
import { filtersToSearchParams } from "./filters-url";
import { STATUS_META } from "./task-status-badge";
import type {
  Permissions,
  ProjectRow,
  TaskFilters,
  TaskLabelLite,
  TaskListResponse,
  TaskRow,
  ViewerContext,
} from "./types";
import type { EmployeeRow } from "@/components/employees/types";

type Props = {
  initial: TaskListResponse;
  initialFilters: TaskFilters;
  projects: ProjectRow[];
  labels: TaskLabelLite[];
  employees: EmployeeRow[];
  permissions: Permissions;
  viewer: ViewerContext;
  view?: "kanban" | "list";
  basePath?: string;
  projectContextId?: string | null;
};

export function TasksBrowser({
  initial,
  initialFilters,
  projects,
  labels,
  employees,
  permissions,
  viewer,
  view: initialView = "kanban",
  basePath = "/dashboard/tasks",
  projectContextId = null,
}: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskRow[]>(initial.items);
  const [view, setView] = useState<"kanban" | "list">(initialView);
  const [filters, setFilters] = useState<TaskFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailTask, setDetailTask] = useState<TaskRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TaskStatus>("TODO");
  const [searchOpen, setSearchOpen] = useState(false);

  const fetchList = useCallback(
    async (next: TaskFilters) => {
      setLoading(true);
      setError(null);
      try {
        const sp = filtersToSearchParams(next);
        if (projectContextId) {
          if (!sp.getAll("projectId").includes(projectContextId)) {
            sp.append("projectId", projectContextId);
          }
        }
        const res = await fetch(`/api/tasks?${sp.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        const json = (await res.json()) as TaskListResponse;
        setTasks(json.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Load failed");
      } finally {
        setLoading(false);
      }
    },
    [projectContextId],
  );

  const syncUrl = useCallback(
    (next: TaskFilters) => {
      const sp = filtersToSearchParams(next);
      if (view !== "kanban") sp.set("view", view);
      const url = sp.toString() ? `${basePath}?${sp.toString()}` : basePath;
      router.replace(url, { scroll: false });
    },
    [basePath, router, view],
  );

  const updateFilters = useCallback(
    (next: TaskFilters) => {
      setFilters(next);
      setSelected(new Set());
      syncUrl(next);
      void fetchList(next);
    },
    [fetchList, syncUrl],
  );

  const resetFilters = useCallback(() => {
    const base: TaskFilters = { page: 1, pageSize: 100 };
    setFilters(base);
    setSelected(new Set());
    syncUrl(base);
    void fetchList(base);
  }, [fetchList, syncUrl]);

  const refresh = useCallback(async () => {
    await fetchList(filters);
  }, [filters, fetchList]);

  const openDetail = useCallback((t: TaskRow) => {
    setDetailTask(t);
    setDetailOpen(true);
  }, []);

  const onMove = useCallback(
    async (args: {
      taskId: string;
      status: TaskStatus;
      prevId: string | null;
      nextId: string | null;
      expectedUpdatedAt: string;
    }) => {
      // Optimistic: shift local state
      setTasks((prev) => {
        const updated = [...prev];
        const i = updated.findIndex((t) => t.id === args.taskId);
        if (i !== -1) {
          updated[i] = { ...updated[i], status: args.status };
        }
        return updated;
      });
      const res = await fetch(`/api/tasks/${args.taskId}/move`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: args.status,
          prevId: args.prevId,
          nextId: args.nextId,
          expectedUpdatedAt: args.expectedUpdatedAt,
        }),
      });
      if (res.status === 409) {
        alert("Position conflict — refreshing…");
        await refresh();
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Move failed" }));
        setError(body.error ?? "Move failed");
        await refresh();
        return;
      }
      await refresh();
    },
    [refresh],
  );

  const onBulk = useCallback(
    async (
      action:
        | { action: "delete" }
        | { action: "assign"; assigneeEmployeeId: string | null }
        | { action: "updateStatus"; status: TaskStatus },
    ) => {
      const ids = Array.from(selected);
      if (ids.length === 0) return;
      const res = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...action, ids }),
      });
      if (!res.ok) {
        alert("Bulk action failed");
        return;
      }
      setSelected(new Set());
      await refresh();
    },
    [selected, refresh],
  );

  useHotkeys("c", (e) => {
    e.preventDefault();
    setCreateDefaultStatus(filters.status?.[0] ?? "TODO");
    setCreateOpen(true);
  }, { enableOnFormTags: false });

  useHotkeys("/", (e) => {
    e.preventDefault();
    setSearchOpen(true);
  }, { enableOnFormTags: false });

  useHotkeys("escape", () => {
    setSelected(new Set());
    setDetailOpen(false);
    setCreateOpen(false);
    setSearchOpen(false);
  }, { enableOnFormTags: true });

  const hasSelection = selected.size > 0;

  const filteredLabels = useMemo(() => {
    if (filters.projectId?.length) {
      return labels.filter(
        (l) => l && (l as unknown as { projectId?: string }).projectId && filters.projectId?.includes((l as unknown as { projectId: string }).projectId),
      ) as TaskLabelLite[];
    }
    return labels;
  }, [labels, filters.projectId]);

  return (
    <div className="flex gap-6">
      <TaskFiltersSidebar
        filters={filters}
        projects={projects}
        labels={filteredLabels}
        onChange={updateFilters}
        onReset={resetFilters}
      />

      <div className="flex-1 min-w-0 space-y-4">
        <Toolbar
          view={view}
          onViewChange={setView}
          searchValue={filters.q ?? ""}
          onSearch={(q) => updateFilters({ ...filters, q })}
          onOpenSearch={() => setSearchOpen(true)}
          projectFilter={filters.projectId?.[0] ?? null}
          projects={projects}
          onProjectChange={(id) =>
            updateFilters({
              ...filters,
              projectId: id ? [id] : undefined,
            })
          }
          onCreate={() => {
            setCreateDefaultStatus(filters.status?.[0] ?? "TODO");
            setCreateOpen(true);
          }}
          canCreate={permissions.create}
        />

        {hasSelection && permissions.bulk && (
          <BulkBar
            count={selected.size}
            onClear={() => setSelected(new Set())}
            onBulk={onBulk}
            employees={employees}
            canDelete={permissions.delete}
          />
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && tasks.length === 0 ? (
          <SkeletonBoard />
        ) : view === "kanban" ? (
          <KanbanBoard
            tasks={tasks}
            onTaskClick={openDetail}
            onMove={onMove}
            onAdd={permissions.create ? (status) => {
              setCreateDefaultStatus(status);
              setCreateOpen(true);
            } : undefined}
          />
        ) : (
          <TaskListView
            tasks={tasks}
            selected={selected}
            onSelect={(id, v) => {
              setSelected((prev) => {
                const next = new Set(prev);
                if (v) next.add(id);
                else next.delete(id);
                return next;
              });
            }}
            onSelectAll={(v) =>
              setSelected(v ? new Set(tasks.map((t) => t.id)) : new Set())
            }
          />
        )}
      </div>

      <TaskDetailSheet
        open={detailOpen}
        task={detailTask}
        onOpenChange={setDetailOpen}
        employees={employees}
        projects={projects}
        labels={labels}
        viewerId={viewer.userId}
        allTasks={tasks}
        onRefresh={refresh}
        canEdit={permissions.update || permissions.updateAny}
        canDelete={permissions.delete || permissions.deleteAny}
        canComment={permissions.comment}
      />

      <TaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projects={projects}
        employees={employees}
        labels={labels}
        defaultStatus={createDefaultStatus}
        defaultProjectId={
          projectContextId ?? filters.projectId?.[0] ?? projects[0]?.id ?? null
        }
        onCreated={() => void refresh()}
      />

      <TaskSearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

function Toolbar({
  view,
  onViewChange,
  searchValue,
  onSearch,
  onOpenSearch,
  projectFilter,
  projects,
  onProjectChange,
  onCreate,
  canCreate,
}: {
  view: "kanban" | "list";
  onViewChange: (v: "kanban" | "list") => void;
  searchValue: string;
  onSearch: (q: string) => void;
  onOpenSearch: () => void;
  projectFilter: string | null;
  projects: ProjectRow[];
  onProjectChange: (id: string | null) => void;
  onCreate: () => void;
  canCreate: boolean;
}) {
  return (
    <header className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] p-0.5">
        <button
          type="button"
          className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 ${
            view === "kanban"
              ? "bg-[#F59E0B] text-[#0D0D0D]"
              : "text-[#A1A1AA] hover:text-[#FAFAFA]"
          }`}
          onClick={() => onViewChange("kanban")}
        >
          <KanbanSquare className="h-3.5 w-3.5" />
          Kanban
        </button>
        <button
          type="button"
          className={`h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 ${
            view === "list"
              ? "bg-[#F59E0B] text-[#0D0D0D]"
              : "text-[#A1A1AA] hover:text-[#FAFAFA]"
          }`}
          onClick={() => onViewChange("list")}
        >
          <List className="h-3.5 w-3.5" />
          List
        </button>
      </div>

      <ProjectSelector
        value={projectFilter}
        onChange={onProjectChange}
        projects={projects}
      />

      <div className="flex-1 max-w-sm relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717A] pointer-events-none" />
        <Input
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search title/description…"
          className="pl-9"
        />
      </div>

      <Button variant="secondary" size="sm" onClick={onOpenSearch}>
        <Search className="h-3 w-3 mr-1" />
        Quick jump
        <kbd className="ml-2 text-[10px] border border-[#1F1F1F] rounded px-1.5 py-0.5">
          /
        </kbd>
      </Button>

      {canCreate && (
        <Button size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4 mr-1" />
          New task
          <kbd className="ml-2 text-[10px] border border-[#0D0D0D]/40 rounded px-1 py-0 text-[#0D0D0D]/60">
            C
          </kbd>
        </Button>
      )}
    </header>
  );
}

function BulkBar({
  count,
  onClear,
  onBulk,
  employees,
  canDelete,
}: {
  count: number;
  onClear: () => void;
  onBulk: (
    action:
      | { action: "delete" }
      | { action: "assign"; assigneeEmployeeId: string | null }
      | { action: "updateStatus"; status: TaskStatus },
  ) => Promise<void>;
  employees: EmployeeRow[];
  canDelete: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/5 px-4 py-2 flex items-center gap-3">
      <span className="text-sm font-medium text-[#F59E0B]">
        {count} selected
      </span>
      <span className="h-4 w-px bg-[#1F1F1F]" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <UserCheck className="h-4 w-4 mr-1.5" />
            Change status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Set status for {count} task(s)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"] as TaskStatus[]).map(
            (s) => (
              <DropdownMenuItem
                key={s}
                onSelect={() => onBulk({ action: "updateStatus", status: s })}
              >
                {STATUS_META[s].label}
              </DropdownMenuItem>
            ),
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            Assign
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
          <DropdownMenuItem
            onSelect={() =>
              onBulk({ action: "assign", assigneeEmployeeId: null })
            }
          >
            Unassigned
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {employees.slice(0, 30).map((e) => {
            const name =
              e.user.fullName ??
              `${e.user.firstName ?? ""} ${e.user.lastName ?? ""}`.trim();
            return (
              <DropdownMenuItem
                key={e.id}
                onSelect={() =>
                  onBulk({ action: "assign", assigneeEmployeeId: e.id })
                }
              >
                {name}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {canDelete && (
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm(`Soft-delete ${count} tasks?`)) {
              void onBulk({ action: "delete" });
            }
          }}
          className="bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete
        </Button>
      )}
      <button
        type="button"
        onClick={onClear}
        className="ml-auto text-[#71717A] hover:text-[#FAFAFA] text-xs"
      >
        Clear
      </button>
    </div>
  );
}

function SkeletonBoard() {
  return (
    <div className="flex gap-3 overflow-x-auto">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="w-72 shrink-0 rounded-xl border border-[#1F1F1F] bg-[#0F0F0F] p-3 space-y-2"
        >
          <Skeleton className="h-4 w-24 mb-2" />
          {Array.from({ length: 3 }).map((__, j) => (
            <Skeleton key={j} className="h-24 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Silences unused prop warnings when browser renders without useEffect
export function __useSideEffect(cb: () => void) {
  useEffect(cb, [cb]);
}
