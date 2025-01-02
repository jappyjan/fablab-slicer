"use client";

import React, { useCallback, useRef } from "react";
import { Upload } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.name.endsWith(".stl")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    const input = document.createElement("input") as HTMLInputElement;
    input.type = "file";
    input.accept = ".stl";
    input.style.display = "none";
    input.hidden = true;
    input.addEventListener("change", (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      onFileSelect(file);
      input.remove();
    });
    document.body.appendChild(input);
    input.click();
  }, [onFileSelect]);

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
    >
      <Upload className="mx-auto h-12 w-12 text-gray-400" />

      <p className="mt-2 text-gray-600">
        Ziehen Sie Ihre .STL Datei hierhin, oder klicken Sie irgendwohin, um sie
        hochzuladen
      </p>

      <p className="mt-2 text-gray-600">
        Drag and drop your .STL file here, or click anywhere to upload
      </p>
    </div>
  );
}
