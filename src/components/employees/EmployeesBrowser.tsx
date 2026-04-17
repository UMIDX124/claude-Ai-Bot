"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Send, Upload, UserPlus, Users, FilterX } from "lucide-react";
import type { EmployeeStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeTable } from "./EmployeeTable";
import { FiltersSidebar } from "./FiltersSidebar";
import { SearchBar } from "./SearchBar";
import { BulkActionsBar } from "./BulkActionsBar";
import { DetailSheet } from "./DetailSheet";
import { Pagination } from "./Pagination";
import { EmptyState } from "./EmptyState";
import { InviteDialog } from "./InviteDialog";
import { ImportDialog } from "./ImportDialog";
import { ExportButton } from "./ExportButton";
import { filtersToSearchParams } from "./filters-url";
import type {
  DepartmentOption,
  EmployeeFilters,
  EmployeeListResponse,
  EmployeeRow,
  RoleOption,
} from "./types";

type Permissions = {
  create: boolean;
  update: boolean;
  delete: boolean;
  invite: boolean;
  import: boolean;
  export: boolean;
  bulk: boolean;
  viewSalary: boolean;
};

type Props = {
  initial: EmployeeListResponse;
  initialFilters: EmployeeFilters;
  departments: DepartmentOption[];
  roles: RoleOption[];
  /** Reserved for bulk re-assign manager flow in a later slice. */
  managers?: EmployeeRow[];
  permissions: Permissions;
  mode?: "active" | "trash";
  basePath?: string;
};

const DEFAULT_PAGE_SIZE = 25;

export function EmployeesBrowser({
  initial,
  initialFilters,
  departments,
  roles,
  permissions,
  mode = "active",
  basePath = "/dashboard/employees",
}: Props) {
  const router = useRouter();
  const [data, setData] = useState<EmployeeListResponse>(initial);
  const [filters, setFilters] = useState<EmployeeFilters>({
    ...initialFilters,
    onlyDeleted: mode === "trash" ? true : initialFilters.onlyDeleted,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeRow, setActiveRow] = useState<EmployeeRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = useCallback(
    async (next: EmployeeFilters): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const qs = filtersToSearchParams({ ...next, onlyDeleted: mode === "trash" });
        const res = await fetch(`/api/employees?${qs.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`List failed (${res.status})`);
        const json = (await res.json()) as EmployeeListResponse;
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [mode],
  );

  const syncUrl = useCallback(
    (next: EmployeeFilters) => {
      const qs = filtersToSearchParams(next);
      const url = qs.toString().length ? `${basePath}?${qs.toString()}` : basePath;
      router.replace(url, { scroll: false });
    },
    [basePath, router],
  );

  const updateFilters = useCallback(
    (next: EmployeeFilters) => {
      const merged = { ...next, page: 1 };
      setFilters(merged);
      setSelected(new Set());
      syncUrl(merged);
      void fetchList(merged);
    },
    [fetchList, syncUrl],
  );

  const resetFilters = useCallback(() => {
    const base: EmployeeFilters = {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sort: "-createdAt",
    };
    setFilters(base);
    setSelected(new Set());
    syncUrl(base);
    void fetchList(base);
  }, [fetchList, syncUrl]);

  const onPageChange = useCallback(
    (page: number) => {
      const next = { ...filters, page };
      setFilters(next);
      syncUrl(next);
      void fetchList(next);
    },
    [filters, fetchList, syncUrl],
  );

  const onSelect = useCallback((id: string, value: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const onSelectAll = useCallback(
    (value: boolean) => {
      setSelected(value ? new Set(data.items.map((r) => r.id)) : new Set());
    },
    [data.items],
  );

  const handleOpenDetail = useCallback((row: EmployeeRow) => {
    setActiveRow(row);
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (row: EmployeeRow) => {
      if (!confirm(`Soft-delete ${row.user.fullName ?? row.user.email}?`)) return;
      const res = await fetch(`/api/employees/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        alert(`Delete failed (${res.status})`);
        return;
      }
      await fetchList(filters);
    },
    [filters, fetchList],
  );

  const handleRestore = useCallback(
    async (row: EmployeeRow) => {
      const res = await fetch(`/api/employees/${row.id}/restore`, {
        method: "POST",
      });
      if (!res.ok) {
        alert(`Restore failed (${res.status})`);
        return;
      }
      await fetchList(filters);
    },
    [filters, fetchList],
  );

  const handleBulkStatus = useCallback(
    async (status: EmployeeStatus) => {
      const ids = Array.from(selected);
      if (ids.length === 0) return;
      const res = await fetch("/api/employees/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "update", ids, patch: { status } }),
      });
      if (!res.ok) {
        alert(`Bulk update failed (${res.status})`);
        return;
      }
      setSelected(new Set());
      await fetchList(filters);
    },
    [selected, filters, fetchList],
  );

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Soft-delete ${ids.length} employees?`)) return;
    const res = await fetch("/api/employees/bulk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "delete", ids }),
    });
    if (!res.ok) {
      alert(`Bulk delete failed (${res.status})`);
      return;
    }
    setSelected(new Set());
    await fetchList(filters);
  }, [selected, filters, fetchList]);

  const handleInvite = useCallback(
    async (values: {
      email: string;
      firstName: string;
      lastName: string;
      companyType: string;
      departmentId: string;
      roleId: string;
      userRole: string;
    }) => {
      const res = await fetch("/api/employees/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          departmentId: values.departmentId || null,
          roleId: values.roleId || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Invite failed" }));
        throw new Error(body.error ?? "Invite failed");
      }
      await fetchList(filters);
    },
    [filters, fetchList],
  );

  const handleImport = useCallback(
    async (rows: Array<Record<string, string>>) => {
      const res = await fetch("/api/employees/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Import failed" }));
        throw new Error(body.error ?? "Import failed");
      }
      const summary = await res.json();
      await fetchList(filters);
      return summary;
    },
    [filters, fetchList],
  );

  const rows = data.items;
  const showEmpty = !loading && rows.length === 0;

  const sortValue = filters.sort ?? "-createdAt";

  return (
    <div className="flex gap-6">
      <FiltersSidebar
        filters={filters}
        departments={departments}
        roles={roles}
        onChange={updateFilters}
        onReset={resetFilters}
      />

      <div className="flex-1 min-w-0 space-y-4">
        <Toolbar
          mode={mode}
          searchValue={filters.q ?? ""}
          onSearch={(q) => updateFilters({ ...filters, q })}
          sort={sortValue}
          onSortChange={(v) => updateFilters({ ...filters, sort: v })}
          permissions={permissions}
          filters={filters}
          onInvite={() => setInviteOpen(true)}
          onImport={() => setImportOpen(true)}
        />

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading ? (
          <TableSkeleton />
        ) : showEmpty ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={mode === "trash" ? "No deleted employees" : "No employees match your filters"}
            description={
              hasActiveFilters(filters)
                ? "Clear filters to see everyone."
                : permissions.create
                  ? "Add your first employee to get started."
                  : "Ask an admin to create an employee."
            }
            action={
              hasActiveFilters(filters) ? (
                <Button variant="secondary" onClick={resetFilters}>
                  <FilterX className="h-4 w-4 mr-1.5" />
                  Clear filters
                </Button>
              ) : permissions.create ? (
                <Button asChild>
                  <Link href="/dashboard/employees/new">
                    <Plus className="h-4 w-4 mr-1.5" />
                    New employee
                  </Link>
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <EmployeeTable
              rows={rows}
              selected={selected}
              onSelect={onSelect}
              onSelectAll={onSelectAll}
              onEdit={permissions.update ? handleOpenDetail : undefined}
              onDelete={permissions.delete ? handleDelete : undefined}
              onRestore={permissions.delete ? handleRestore : undefined}
            />

            <Pagination
              page={data.page}
              pageCount={data.pageCount}
              total={data.total}
              pageSize={data.pageSize}
              onPageChange={onPageChange}
            />
          </>
        )}

        <BulkActionsBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          onBulkStatus={handleBulkStatus}
          onBulkDelete={handleBulkDelete}
          canDelete={permissions.delete}
        />
      </div>

      <DetailSheet
        open={sheetOpen}
        row={activeRow}
        onOpenChange={setSheetOpen}
        onEdit={
          permissions.update
            ? (row) => router.push(`/dashboard/employees/${row.id}`)
            : undefined
        }
      />

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        departments={departments}
        roles={roles}
        onSubmit={handleInvite}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSubmit={handleImport}
      />
    </div>
  );
}

function Toolbar({
  mode,
  searchValue,
  onSearch,
  sort,
  onSortChange,
  permissions,
  filters,
  onInvite,
  onImport,
}: {
  mode: "active" | "trash";
  searchValue: string;
  onSearch: (q: string) => void;
  sort: string;
  onSortChange: (v: string) => void;
  permissions: Permissions;
  filters: EmployeeFilters;
  onInvite: () => void;
  onImport: () => void;
}) {
  const sortOptions = useMemo(
    () => [
      { value: "-createdAt", label: "Newest first" },
      { value: "createdAt", label: "Oldest first" },
      { value: "name", label: "Name (A–Z)" },
      { value: "-name", label: "Name (Z–A)" },
      { value: "-hireDate", label: "Recently hired" },
      { value: "hireDate", label: "Earliest hire" },
      { value: "status", label: "Status" },
    ],
    [],
  );

  return (
    <header className="flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-[260px]">
        <SearchBar value={searchValue} onChange={onSearch} />
      </div>
      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-[160px] h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {permissions.export ? <ExportButton filters={filters} /> : null}
      {mode === "active" && permissions.import ? (
        <Button variant="secondary" size="sm" onClick={onImport}>
          <Upload className="h-4 w-4 mr-1.5" />
          Import
        </Button>
      ) : null}
      {mode === "active" && permissions.invite ? (
        <Button variant="secondary" size="sm" onClick={onInvite}>
          <Send className="h-4 w-4 mr-1.5" />
          Invite
        </Button>
      ) : null}
      {mode === "active" && permissions.create ? (
        <Button size="sm" asChild>
          <Link href="/dashboard/employees/new">
            <UserPlus className="h-4 w-4 mr-1.5" />
            New employee
          </Link>
        </Button>
      ) : null}
    </header>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-4 space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 flex-1 max-w-xs" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function hasActiveFilters(f: EmployeeFilters): boolean {
  return Boolean(
    f.q ||
      f.company?.length ||
      f.departmentId?.length ||
      f.roleId?.length ||
      f.status?.length ||
      f.employmentType?.length ||
      f.workLocation?.length ||
      f.managerId ||
      f.includeDeleted,
  );
}

