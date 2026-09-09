// SCREEN SHARE — the accuracy fallback, and the privacy control that makes it
// acceptable to switch on.
//
// The DOM path is the default because it is cheaper, faster and never leaves the
// page. But some screens have no DOM worth reading: a canvas trading chart, an
// embedded PDF, a cross-origin iframe, a captcha-guarded portal. For those we
// ask permission to look at the pixels.
//
// Pause is not a nicety. The moment this is on, the user will eventually type an
// OTP, a UPI PIN or a password — so Pause has to be one click away, it has to
// stop capture at the TRACK, not just skip an upload, and the panel has to say
// out loud which of the two states it is in.

let gdStream = null;
let gdVideo = null;
let gdShareState = "off"; // "off" | "live" | "paused"

function gdShareGetState() {
  return gdShareState;
}

async function gdShareStart() {
  if (gdStream) return gdShareState;
  // Chrome requires this to be called from a real user gesture — it is, the
  // button click in the ask bar.
  gdStream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 1 }, // we sample stills; a video frame rate is wasted bandwidth
    audio: false
  });

  gdVideo = document.createElement("video");
  gdVideo.srcObject = gdStream;
  gdVideo.muted = true;
  await gdVideo.play();

  // The user can also stop the share from Chrome's own bar. If they do, our UI
  // must agree with reality rather than keep claiming it is sharing.
  gdStream.getVideoTracks().forEach((t) => {
    t.addEventListener("ended", () => gdShareStop());
  });

  gdShareState = "live";
  return gdShareState;
}

// Disabling the track is what actually matters: the browser stops producing
// frames at the source, so there is nothing to capture even by mistake.
function gdShareToggleHold() {
  if (!gdStream) return gdShareState;
  const hold = gdShareState === "live";
  gdStream.getVideoTracks().forEach((t) => { t.enabled = !hold; });
  gdShareState = hold ? "paused" : "live";
  return gdShareState;
}

function gdShareStop() {
  if (gdStream) gdStream.getTracks().forEach((t) => t.stop());
  gdStream = null;
  if (gdVideo) { gdVideo.srcObject = null; gdVideo = null; }
  gdShareState = "off";
  if (typeof gdChatSetShareState === "function") gdChatSetShareState("off");
  if (typeof gdChatPrivacy === "function") gdChatPrivacy("Sharing stopped. Nothing is being captured.");
  return gdShareState;
}

// One still, downscaled, as a JPEG data URL — or null, which every caller must
// treat as "we have no pixels" rather than as an error.
const GD_FRAME_WIDTH = 1024; // enough for a model to read UI labels, small enough to send

async function gdGrabFrame() {
  if (gdShareState !== "live" || !gdVideo || !gdVideo.videoWidth) return null;

  const scale = Math.min(1, GD_FRAME_WIDTH / gdVideo.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(gdVideo.videoWidth * scale);
  canvas.height = Math.round(gdVideo.videoHeight * scale);
  canvas.getContext("2d").drawImage(gdVideo, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}
