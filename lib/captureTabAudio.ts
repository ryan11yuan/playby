"use client"

export async function captureTabAudio(): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error("getDisplayMedia not supported in this browser")
  }

  // Some Chromium browsers require video with audio; keep video minimal
  const stream = await navigator.mediaDevices.getDisplayMedia({
    // Newer Chromium supports extended audio constraints; keep compatible
    audio: { systemAudio: "include" } as any,
    video: {
      frameRate: 1,
      width: 1,
      height: 1,
      displaySurface: "browser" as any,
    },
  })

  const audioTracks = stream.getAudioTracks()
  if (!audioTracks || audioTracks.length === 0) {
    // Let caller decide whether to stop tracks
    throw new Error("No audio track in captured stream. Select a tab/window with audio.")
  }

  return stream
}
