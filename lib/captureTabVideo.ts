"use client"

export async function captureTabVideo(): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error("getDisplayMedia not supported in this browser")
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 30 },
    audio: false,
  })

  const videoTracks = stream.getVideoTracks()
  if (!videoTracks || videoTracks.length === 0) {
    throw new Error("No video track in captured stream. Select a tab/window with video.")
  }

  return stream
}
