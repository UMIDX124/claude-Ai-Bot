# Slice 2 — Status Log

## 2026-04-18 11:00 UTC — H+1

### Shipped so far
- **Phase 1** ✅ Schema: `Project`, `TaskLabel`, `TaskLabelAssignment`, `TaskDependency`. Task model got `projectId`, `reporterEmployeeId`, `assigneeEmployeeId`, `startDate`, `estimatedHours` (renamed), `position` → `Decimal(19,10)`. `TaskStatus` enum now has `IN_REVIEW` + `BLOCKED` (renamed `REVIEW`). 9 new `TaskActivityKind` values. Migration `20260418100000_slice_2_task_kanban` applied to Neon.
- **Phase 3** ✅ `src/lib/fractional-index.ts` — Decimal midpoint with rebalance guard. `src/lib/dag.ts` — cycle detection + topo sort + CycleError.
- **Phase 5** ✅ `src/lib/validations/task.ts` — create/update/move/assign/list/bulk/comment/subtask/dependency/label/project schemas.
- **Phase 4** ✅ `src/lib/services/project.service.ts` + `src/lib/services/task.service.ts`. Task service: listTasks/getTask/createTask/updateTask/moveTask (optimistic 409)/assignTask/softDeleteTask/restoreTask/bulkAction/addComment/updateComment/deleteComment/listComments/addSubtask/toggleSubtask/listSubtasks/addDependency (DAG-validated)/removeDependency/listDependencies/listActivity. Every mutation writes TaskActivity + AuditLog. RBAC extended with 9 task/project permissions and ownership-aware `assertCanEditTask` / `assertCanDeleteTask`.
- **Phase 2** ✅ Seed — 5 projects (DPL-CRM, DPL-WEB, DPL-SALES-Q2, VCS-OPS-Q2, BSL-PLAT), 14 labels, 39 top-level tasks spanning all 7 status columns, 14 subtasks, 4 comments, 5 dependencies (including Slice 1 → Slice 2 → Slice 3 chain for the meta CRM project).

### Typecheck status
- `pnpm tsc --noEmit` → 0 errors after every phase.

### Next up
- Phase 6: API routes (tasks, projects, comments, subtasks, dependencies, activity, bulk).
- Phase 7: @dnd-kit + react-hotkeys-hook + cmdk install.
- Phase 8-10: UI primitives, kanban, detail sheet.
- Phase 11: Pages.
- Phase 12: Sidebar + dashboard stats.
- Phase 13: Build + deploy + completion report.

### Notes
- Seed is idempotent — every task/label/subtask/comment/dependency uses find-first + upsert or dedupe-on-content. Re-runs are safe.
- Baselined both older migrations against Neon (`_prisma_migrations` rows were wiped between slices) before applying Slice 2.
