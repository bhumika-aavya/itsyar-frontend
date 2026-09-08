/**
 * Reads video duration locally using HTML5 Video decoder in milliseconds.
 * Returns formatted "MM:SS" (e.g., "05:32"). Zero server/network overhead.
 */
export function getVideoDuration(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const totalSeconds = Math.round(video.duration);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      resolve(formatted);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(""); // Graceful fallback
    };

    video.src = URL.createObjectURL(file);
  });
}
