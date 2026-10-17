import "server-only";

import { z } from "zod";

import { env } from "@/lib/env";
import { addLeadPhotos } from "./lead.service";

// SOT:photo-service
// WHAT: Bike photo uploads — validates files, stores via Frappe, attaches URLs.
// WHY:  FR-M2/FR-M3: browser never sees the Frappe token; files validated first.
// HOW:  Called by uploadPhotosAction only (which enforces auth).
// WHERE: PhotoDialog on every LeadCard.

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MAX_PHOTOS_PER_UPLOAD = 10;

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const frappeResponseSchema = z.object({
  message: z
    .object({ file_url: z.string().min(1) })
    .passthrough(),
});

function toAbsoluteUrl(fileUrl: string): string {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  const origin = new URL(env.FRAPPE_UPLOAD_URL).origin;
  return `${origin}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

export async function uploadLeadPhotos(leadId: string, files: File[]): Promise<string[]> {
  if (files.length === 0) throw new Error("No files to upload.");
  if (files.length > MAX_PHOTOS_PER_UPLOAD) {
    throw new Error(`At most ${MAX_PHOTOS_PER_UPLOAD} photos at a time.`);
  }
  for (const file of files) {
    if (!ALLOWED_MIME.includes(file.type)) {
      throw new Error(`"${file.name}" is not a supported image (JPEG, PNG, WebP, GIF).`);
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new Error(`"${file.name}" exceeds the 8 MB limit.`);
    }
  }

  const urls: string[] = [];
  for (const file of files) {
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("folder", "Home/LeadManager");
    const res = await fetch(env.FRAPPE_UPLOAD_URL, {
      method: "POST",
      headers: {
        Authorization: `token ${env.FRAPPE_API_KEY}:${env.FRAPPE_API_SECRET}`,
      },
      body: form,
    });
    if (!res.ok) {
      throw new Error(`Upload failed for "${file.name}" (HTTP ${res.status}).`);
    }
    const parsed = frappeResponseSchema.safeParse(await res.json());
    if (!parsed.success) {
      throw new Error(`Unexpected upload response for "${file.name}".`);
    }
    urls.push(toAbsoluteUrl(parsed.data.message.file_url));
  }

  await addLeadPhotos(leadId, urls);
  return urls;
}
