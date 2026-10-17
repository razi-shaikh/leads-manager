import { requireSession } from "@/lib/auth";
import { CSV_HEADERS } from "@/lib/csv";
import { ImportForm } from "./import-form";

// SOT:import-page
// WHAT: /import — CSV upload form + expected column reference.
// WHY:  Daily entry point for new leads (journey J1).
// HOW:  Server page (auth) + client ImportForm posting to importAction.
// WHERE: /import.

export default async function ImportPage() {
  await requireSession();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Import Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV file. Every row becomes a New Lead; rows whose phone and
          registration number already exist are tagged as duplicates but still created.
        </p>
      </div>
      <ImportForm />
      <div className="text-sm">
        <h2 className="font-medium">Recognized columns (all optional, any order)</h2>
        <p className="mt-1 text-muted-foreground">
          Include whichever columns you have — missing ones are left blank, and
          unknown columns are ignored. Recognized names: {CSV_HEADERS.join(" · ")}
        </p>
      </div>
    </div>
  );
}
