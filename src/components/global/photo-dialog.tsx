"use client";

/* eslint-disable @next/next/no-img-element -- previews are local object URLs; plain img avoids optimizer config. */
import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
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
// WHAT: Photo upload dialog — file picker with image previews before saving.
// WHY:  User must see what will upload to Frappe before committing (FR-M2).
// HOW:  Files kept as an array (not FileList) so picks can be removed;
//       previews are object URLs created on select and revoked on remove,
//       close, or unmount.
// WHERE: LeadDrawer photo section.

export type UploadResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

type Preview = { file: File; url: string };

const MAX_FILES = 10;

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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [uploading, setUploading] = useState(false);
  const previewsRef = useRef<Preview[]>([]);

  useEffect(() => {
    previewsRef.current = previews;
  });

  useEffect(() => {
    return () => {
      for (const preview of previewsRef.current) URL.revokeObjectURL(preview.url);
    };
  }, []);

  function clearAll() {
    for (const preview of previews) URL.revokeObjectURL(preview.url);
    setFiles([]);
    setPreviews([]);
  }

  function handleSelect(list: FileList | null) {
    const picked = [...(list ?? [])]
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, MAX_FILES);
    for (const preview of previews) URL.revokeObjectURL(preview.url);
    setFiles(picked);
    setPreviews(picked.map((file) => ({ file, url: URL.createObjectURL(file) })));
  }

  function handleRemove(index: number) {
    const target = previews[index];
    if (target) URL.revokeObjectURL(target.url);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      clearAll();
      setUploading(false);
    }
  }

  async function handleUpload() {
    if (files.length === 0 || uploading) return;
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
      clearAll();
      setOpen(false);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <ImagePlus data-icon="inline-start" />
        Photos
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
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
            onChange={(e) => handleSelect(e.target.files)}
          />
          {previews.length > 0 ? (
            <ul className="grid grid-cols-3 gap-2" aria-label="Selected photo previews">
              {previews.map((preview, index) => (
                <li key={`${preview.file.name}-${index}`} className="relative">
                  <img
                    src={preview.url}
                    alt={`Preview ${index + 1}: ${preview.file.name}`}
                    className="aspect-square w-full rounded-md border object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    onClick={() => handleRemove(index)}
                    aria-label={`Remove ${preview.file.name}`}
                    className="absolute top-1 right-1 rounded-full shadow"
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No photos selected yet — previews appear here before you upload.
            </p>
          )}
          <div>
            <Button size="sm" onClick={handleUpload} disabled={uploading || files.length === 0}>
              {uploading ? "Uploading…" : `Upload${files.length > 0 ? ` (${files.length})` : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
