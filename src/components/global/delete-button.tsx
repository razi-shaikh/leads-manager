"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// SOT:delete-button
// WHAT: Delete with confirmation — names the lead, removes it + notes + history.
// WHY:  Destructive action must always confirm (FR-C5 + design §5).
// HOW:  AlertDialog → onDelete → toast; server revalidates the lists.
// WHERE: LeadCard action row.

export function DeleteButton({
  leadId,
  leadTitle,
  onDelete,
  onDeleted,
}: {
  leadId: string;
  leadTitle: string;
  onDelete: (leadId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onDeleted?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    if (deleting) return;
    setDeleting(true);
    try {
      const result = await onDelete(leadId);
      if (!result.ok) {
        toast.error("Could not delete lead", { description: result.error });
        return;
      }
      toast.success("Lead deleted");
      onDeleted?.();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
        <Trash2 data-icon="inline-start" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
          <AlertDialogDescription>
            {leadTitle} and all of its notes and history will be permanently removed.
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
