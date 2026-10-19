import { requireSession } from "@/lib/auth";
import { BBO_HEADERS, CSV_HEADERS } from "@/lib/csv";
import { ImportForm } from "./import-form";

// SOT:import-page
// WHAT: /import — standard + BikeBecho CSV uploads with preview, then import.
// WHY:  Daily entry point for new leads (journey J1).
// HOW:  Server page (auth) + one ImportForm per format (standard, bbo).
// WHERE: /import.

export const instant = false;

export default async function ImportPage() {
  await requireSession();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Import Leads</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Upload a CSV file. Every row becomes a New Lead; rows whose phone and
          registration number already exist are tagged as duplicates but still created.
        </p>
      </div>
      <ImportForm kind="standard" />
      <div className="text-base">
        <h2 className="font-medium">Recognized columns (all optional, any order)</h2>
        <p className="mt-1 text-muted-foreground">
          Include whichever columns you have — missing ones are left blank, and
          unknown columns are ignored. Recognized names: {CSV_HEADERS.join(" · ")}
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t pt-6">
        <h2 className="text-xl font-semibold">Import BikeBecho Leads</h2>
        <p className="text-base text-muted-foreground">
          Upload a BikeBecho sell-requests CSV. Submitted At becomes the date,
          Owner Name the customer, Mobile Number the phone, City + PIN Code the
          location, Brand + Model + Variant the bike, Ownership the owner count,
          and the bike condition is kept with the registration number.
          Source is set to BikeBecho.
        </p>
      </div>
      <ImportForm kind="bbo" />
      <div className="text-base">
        <h2 className="font-medium">Recognized BikeBecho columns (all optional, any order)</h2>
        <p className="mt-1 text-muted-foreground">
          Recognized names: {BBO_HEADERS.join(" · ")}
        </p>
      </div>
    </div>
  );
}
