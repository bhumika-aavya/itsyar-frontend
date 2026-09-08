/**
 * Reads video duration locally using HTML5 Video decoder in milliseconds.
 * Returns formatted "MM:SS" (e.g., "05:32"). Zero server/network overhead.
 */
export function getVideoDuration(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      const totalSeconds = Math.round(video.duration);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      resolve(formatted);
    };

    video.onerror = () => {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      resolve(""); // Graceful fallback
    };

    video.src = objectUrl;
  });
}
