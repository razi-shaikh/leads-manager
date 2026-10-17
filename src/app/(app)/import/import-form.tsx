"use client";

import { useActionState } from "react";
import { CircleAlert, CircleCheck, Upload } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importAction, type ImportState } from "./actions";

// SOT:import-form
// WHAT: CSV file picker + upload + import report.
// WHY:  Daily import UI (FR-I1–I4): counts on success, reasons on failure.
// HOW:  useActionState(importAction); report renders from returned state.
// WHERE: /import page.

const INITIAL_STATE: ImportState = { status: "idle" };

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importAction, INITIAL_STATE);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="file">CSV file</Label>
          <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
        </div>
        <div>
          <Button type="submit" disabled={pending}>
            <Upload data-icon="inline-start" />
            {pending ? "Importing…" : "Import leads"}
          </Button>
        </div>
      </form>

      {state.status === "success" ? (
        <Alert>
          <CircleCheck />
          <AlertTitle>Import complete</AlertTitle>
          <AlertDescription>
            Created {state.created} lead{state.created === 1 ? "" : "s"}
            {state.duplicates > 0
              ? `, ${state.duplicates} tagged as duplicate${state.duplicates === 1 ? "" : "s"}.`
              : "."}
          </AlertDescription>
        </Alert>
      ) : null}

      {state.status === "error" ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Import failed</AlertTitle>
          <AlertDescription>
            <p>{state.fileError}</p>
            {state.rowErrors.length > 0 ? (
              <ul className="mt-2 list-disc pl-5">
                {state.rowErrors.slice(0, 10).map((e) => (
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
