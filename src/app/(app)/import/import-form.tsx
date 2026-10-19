"use client";

import { useRef, useState, useTransition } from "react";
import { CircleAlert, CircleCheck, Eye, Upload, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  importAction,
  importBboAction,
  previewBboCsvAction,
  previewCsvAction,
  type ImportState,
  type PreviewState,
} from "./actions";

// SOT:import-form
// WHAT: CSV file picker → data preview → confirmed import + report.
// WHY:  User reviews parsed rows and duplicate tags before creating leads.
// HOW:  Preview parses server-side (no DB writes); Confirm re-uploads the same
//       File through the matching import action. `kind` picks the standard or
//       BikeBecho column mapping.
// WHERE: /import page (one form per format).

const INITIAL_PREVIEW: PreviewState = { status: "idle" };
const INITIAL_REPORT: ImportState = { status: "idle" };

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function price(value: number | null): string {
  return value == null ? "—" : `₹${inr.format(value)}`;
}

export function ImportForm({ kind }: { kind: "standard" | "bbo" }) {
  const previewFn = kind === "bbo" ? previewBboCsvAction : previewCsvAction;
  const importFn = kind === "bbo" ? importBboAction : importAction;
  const fileId = kind === "bbo" ? "bbo-file" : "file";
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewState>(INITIAL_PREVIEW);
  const [report, setReport] = useState<ImportState>(INITIAL_REPORT);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setPreview(INITIAL_PREVIEW);
    setReport(INITIAL_REPORT);
    if (inputRef.current) inputRef.current.value = "";
  }

  function clearForNext() {
    setFile(null);
    setPreview(INITIAL_PREVIEW);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handlePreview() {
    if (!file || pending) return;
    setReport(INITIAL_REPORT);
    const current = file;
    startTransition(async () => {
      let text: string;
      try {
        text = await current.text();
      } catch {
        setPreview({ status: "error", fileError: "Could not read the file." });
        return;
      }
      setPreview(await previewFn(text, current.name));
    });
  }

  function handleConfirm() {
    if (!file || preview.status !== "ready" || pending) return;
    const formData = new FormData();
    formData.append("file", file, file.name);
    startTransition(async () => {
      const result = await importFn(INITIAL_REPORT, formData);
      setReport(result);
      if (result.status === "success") clearForNext();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={fileId} className="text-[15px]">
          CSV file
        </Label>
        <Input
          id={fileId}
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(INITIAL_PREVIEW);
            setReport(INITIAL_REPORT);
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={handlePreview} disabled={!file || pending}>
          <Eye data-icon="inline-start" />
          {pending ? "Reading…" : "Preview"}
        </Button>
        {preview.status !== "idle" || file ? (
          <Button variant="outline" onClick={reset} disabled={pending}>
            <X data-icon="inline-start" />
            Clear
          </Button>
        ) : null}
      </div>

      {preview.status === "error" ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Preview failed</AlertTitle>
          <AlertDescription>{preview.fileError}</AlertDescription>
        </Alert>
      ) : null}

      {preview.status === "ready" ? (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex flex-col gap-1">
            <p className="text-base font-semibold">{preview.fileName}</p>
            <p className="text-[15px] text-muted-foreground">
              {preview.total} row{preview.total === 1 ? "" : "s"} will become New Lead
              {preview.total === 1 ? "" : "s"}
              {preview.duplicates > 0
                ? `, ${preview.duplicates} tagged as duplicate${preview.duplicates === 1 ? "" : "s"}.`
                : "."}
            </p>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
              <thead>
                <tr className="border-b bg-muted/60">
                  <th scope="col" className="px-3 py-2 font-medium">#</th>
                  <th scope="col" className="px-3 py-2 font-medium">Customer</th>
                  <th scope="col" className="px-3 py-2 font-medium">Phone</th>
                  <th scope="col" className="px-3 py-2 font-medium">Bike</th>
                  <th scope="col" className="px-3 py-2 font-medium">Expected</th>
                  <th scope="col" className="px-3 py-2 font-medium">Our price</th>
                  <th scope="col" className="px-3 py-2 font-medium">Source</th>
                  <th scope="col" className="px-3 py-2 font-medium">Tag</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{index + 1}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.phone}</td>
                    <td className="px-3 py-2">{row.bike}</td>
                    <td className="px-3 py-2 tabular-nums">{price(row.expectedPrice)}</td>
                    <td className="px-3 py-2 tabular-nums">{price(row.ourPrice)}</td>
                    <td className="px-3 py-2">{row.source}</td>
                    <td className="px-3 py-2">
                      {row.duplicate ? <Badge variant="outline">Duplicate</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.total > preview.shown ? (
            <p className="text-[15px] text-muted-foreground">
              Showing first {preview.shown} of {preview.total} rows.
            </p>
          ) : null}
          <div>
            <Button onClick={handleConfirm} disabled={pending}>
              <Upload data-icon="inline-start" />
              {pending ? "Importing…" : `Import ${preview.total} lead${preview.total === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      ) : null}

      {report.status === "success" ? (
        <Alert>
          <CircleCheck />
          <AlertTitle>Import complete</AlertTitle>
          <AlertDescription>
            Created {report.created} lead{report.created === 1 ? "" : "s"}
            {report.duplicates > 0
              ? `, ${report.duplicates} tagged as duplicate${report.duplicates === 1 ? "" : "s"}.`
              : "."}
          </AlertDescription>
        </Alert>
      ) : null}

      {report.status === "error" ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Import failed</AlertTitle>
          <AlertDescription>
            <p>{report.fileError}</p>
            {report.rowErrors.length > 0 ? (
              <ul className="mt-2 list-disc pl-5">
                {report.rowErrors.slice(0, 10).map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
