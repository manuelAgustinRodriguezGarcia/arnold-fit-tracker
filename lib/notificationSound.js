let notificationAudio = null;

function getNotificationAudio() {
  if (typeof window === "undefined") {
    return null;
  }
  if (!notificationAudio) {
    notificationAudio = new Audio("/audio/notification.mp3");
    notificationAudio.preload = "auto";
  }
  return notificationAudio;
}

export function playNotificationSound() {
  const audio = getNotificationAudio();
  if (!audio) {
    return;
  }

  try {
    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
    void 0;
  }
}
