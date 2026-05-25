"use client";

import { useState, useRef, useCallback } from "react";

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cdnUrl: string) => void;
}

type UploadState = "idle" | "cropping" | "uploading" | "confirming" | "error";

export default function PhotoUploadModal({
  isOpen,
  onClose,
  onSuccess,
}: PhotoUploadModalProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setSelectedFile(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setState("cropping");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setState("uploading");
      setError(null);

      // Step 1: Get presigned URL from backend
      const presignRes = await fetch("/api/profile/photo/presign", {
        method: "POST",
      });

      if (!presignRes.ok) {
        throw new Error("Failed to get upload URL");
      }

      // FIX(TEAM-63): Correctly destructure objectKey (not key) from presign response
      // Backend returns { uploadUrl, objectKey, cdnUrl }
      const { uploadUrl, objectKey, cdnUrl } = await presignRes.json();

      // Step 2: Upload file to S3 using presigned URL
      await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });

      // Step 3: Confirm upload with backend
      setState("confirming");

      // FIX(TEAM-63): Send objectKey (not key) to confirm endpoint
      const confirmRes = await fetch("/api/profile/photo/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectKey }),
      });

      if (!confirmRes.ok) {
        throw new Error("Failed to confirm upload");
      }

      onSuccess(cdnUrl);
      handleClose();
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Upload Photo</h2>

        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {state === "idle" && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm"
            />
          </div>
        )}

        {state === "cropping" && selectedFile && (
          <div>
            <p className="mb-2 text-sm text-gray-600">
              Selected: {selectedFile.name}
            </p>
            <button
              onClick={handleUpload}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Upload
            </button>
          </div>
        )}

        {(state === "uploading" || state === "confirming") && (
          <p className="text-sm text-gray-600">
            {state === "uploading" ? "Uploading..." : "Confirming..."}
          </p>
        )}

        {state === "error" && (
          <button
            onClick={reset}
            className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
          >
            Try Again
          </button>
        )}

        <button
          onClick={handleClose}
          className="mt-4 block text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
