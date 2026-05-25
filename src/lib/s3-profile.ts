/**
 * S3 Profile Photo Upload Utilities
 *
 * The presign endpoint returns { uploadUrl, objectKey, cdnUrl }.
 * The confirm endpoint expects { objectKey } in the request body.
 *
 * IMPORTANT: The field name is `objectKey` (not `key`).
 * See TEAM-63 for the bug that was caused by this mismatch.
 */

export interface PresignedUploadResponse {
  uploadUrl: string;
  objectKey: string;
  cdnUrl: string;
}

export interface ConfirmUploadRequest {
  objectKey: string;
}

export interface ConfirmUploadResponse {
  success: boolean;
  objectKey: string;
}

export async function generatePresignedUploadUrl(): Promise<PresignedUploadResponse> {
  const res = await fetch("/api/profile/photo/presign", { method: "POST" });

  if (!res.ok) {
    throw new Error(`Presign request failed: ${res.status}`);
  }

  const data: PresignedUploadResponse = await res.json();
  return data;
}

export async function confirmPhotoUpload(
  objectKey: string
): Promise<ConfirmUploadResponse> {
  const res = await fetch("/api/profile/photo/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objectKey } satisfies ConfirmUploadRequest),
  });

  if (!res.ok) {
    throw new Error(`Confirm request failed: ${res.status}`);
  }

  return res.json();
}
