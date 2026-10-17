"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// SOT:photo-dialog
// WHAT: Photo upload dialog — file picker posting to uploadPhotosAction.
// WHY:  Bike photos from the system, stored via Frappe (FR-M2).
// HOW:  Builds FormData from the file input; server validates + uploads.
// WHERE: LeadCard action row.

export type UploadResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

export function PhotoDialog({
  leadId,
  leadTitle,
  onUploadPhotos,
}: {
  leadId: string;
  leadTitle: string;
  onUploadPhotos: (leadId: string, formData: FormData) => Promise<UploadResult>;
}) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    if (!files || files.length === 0 || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of files) formData.append("photos", file);
      const result = await onUploadPhotos(leadId, formData);
      if (!result.ok) {
        toast.error("Upload failed", { description: result.error });
        return;
      }
      toast.success(`Uploaded ${result.count} photo${result.count === 1 ? "" : "s"}`);
      setFiles(null);
      setOpen(false);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setFiles(null);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <ImagePlus data-icon="inline-start" />
        Photos
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload photos</DialogTitle>
          <DialogDescription>
            {leadTitle} — JPEG, PNG, WebP or GIF, up to 8 MB each, max 10 at a time.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            aria-label="Choose photos"
            onChange={(e) => setFiles(e.target.files)}
          />
          <div>
            <Button size="sm" onClick={handleUpload} disabled={uploading || !files || files.length === 0}>
              {uploading ? "Uploading…" : `Upload${files && files.length > 0 ? ` (${files.length})` : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
