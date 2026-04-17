"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
};

type CsvRow = Record<string, string>;

const REQUIRED = ["email", "firstName", "lastName", "companyType"];

export function ImportDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (rows: CsvRow[]) => Promise<ImportSummary>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [uploading, setUploading] = useState(false);

  function onPick(file: File) {
    setError(null);
    setSummary(null);
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors.length > 0) {
          setError(res.errors[0].message);
          return;
        }
        const data = res.data.filter((r) => r.email);
        const missing = REQUIRED.filter(
          (k) => !data[0] || !(k in data[0]) || !data[0][k],
        );
        if (data.length === 0) {
          setError("CSV has no rows.");
          return;
        }
        if (missing.length > 0) {
          setError(`Missing required columns: ${missing.join(", ")}`);
          return;
        }
        setRows(data);
        setPreview(data.slice(0, 5));
      },
      error: (err) => setError(err.message),
    });
  }

  async function handleImport() {
    setUploading(true);
    setError(null);
    try {
      const result = await onSubmit(rows);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setRows([]);
    setPreview([]);
    setError(null);
    setSummary(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import employees from CSV</DialogTitle>
          <DialogDescription>
            Required columns: email, firstName, lastName, companyType. Optional:
            departmentCode, roleName, position, employmentType, workLocation,
            hireDate (YYYY-MM-DD), salary.
          </DialogDescription>
        </DialogHeader>

        {!summary ? (
          <div className="space-y-4">
            <label
              className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#1F1F1F] bg-[#0F0F0F] py-10 cursor-pointer hover:border-[#F59E0B]/60 transition"
              htmlFor="csv-upload"
            >
              <Upload className="h-6 w-6 text-[#F59E0B] mb-2" />
              <span className="text-sm text-[#A1A1AA]">
                {rows.length > 0
                  ? `${rows.length} rows loaded`
                  : "Drop a CSV or click to upload"}
              </span>
              <input
                ref={inputRef}
                id="csv-upload"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onPick(file);
                }}
              />
            </label>
            {preview.length > 0 ? (
              <div className="rounded-lg border border-[#1F1F1F] overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#0F0F0F]">
                    <tr>
                      {Object.keys(preview[0]).slice(0, 5).map((k) => (
                        <th
                          key={k}
                          className="text-left px-3 py-2 uppercase tracking-wider text-[#71717A]"
                        >
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-[#1F1F1F]">
                        {Object.keys(preview[0]).slice(0, 5).map((k) => (
                          <td key={k} className="px-3 py-2 text-[#A1A1AA]">
                            {row[k]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-[#1F1F1F] bg-[#0F0F0F] p-4">
            <h4 className="text-sm font-medium text-[#FAFAFA]">Import summary</h4>
            <dl className="text-sm space-y-1">
              <Row label="Created" value={summary.created} />
              <Row label="Updated" value={summary.updated} />
              <Row label="Skipped" value={summary.skipped} />
            </dl>
            {summary.errors.length ? (
              <div className="max-h-32 overflow-y-auto text-xs text-red-400 space-y-1">
                {summary.errors.slice(0, 10).map((e) => (
                  <p key={`${e.row}-${e.message}`}>
                    Row {e.row}: {e.message}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            {summary ? "Close" : "Cancel"}
          </Button>
          {!summary ? (
            <Button disabled={rows.length === 0 || uploading} onClick={handleImport}>
              {uploading ? "Importing…" : `Import ${rows.length} rows`}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[#71717A]">{label}</dt>
      <dd className="font-mono text-[#FAFAFA]">{value}</dd>
    </div>
  );
}
