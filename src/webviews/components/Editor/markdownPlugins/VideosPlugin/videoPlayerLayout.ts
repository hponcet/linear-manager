export function scaleVideoDimensions(
  videoWidth: number,
  videoHeight: number,
  maxWidth: number,
): { width: number; height: number } {
  if (videoWidth <= maxWidth) {
    return { width: videoWidth, height: videoHeight }
  }

  const scale = maxWidth / videoWidth
  return {
    width: Math.round(videoWidth * scale),
    height: Math.round(videoHeight * scale),
  }
}
