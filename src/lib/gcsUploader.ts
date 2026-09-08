/**
 * Streams a binary file directly to Google Cloud Storage with real-time progress callbacks.
 */
export function uploadBinaryToGCS(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);

    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.setRequestHeader("Content-Range", `bytes 0-${file.size - 1}/${file.size}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve();
      } else {
        reject(new Error(`GCS upload failed (HTTP ${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () =>
      reject(
        new Error(
          "Network connection or CORS error during GCS upload. Ensure bucket CORS configuration is applied."
        )
      );
    xhr.send(file);
  });
}
