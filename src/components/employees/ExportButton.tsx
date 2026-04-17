"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmployeeFilters } from "./types";
import { filtersToSearchParams } from "./filters-url";

export function ExportButton({ filters }: { filters: EmployeeFilters }) {
  const qs = filtersToSearchParams(filters);
  const href = `/api/employees/export?${qs.toString()}`;
  return (
    <Button variant="secondary" size="sm" asChild>
      <a href={href} download>
        <Download className="h-4 w-4 mr-1.5" />
        Export CSV
      </a>
    </Button>
  );
}
