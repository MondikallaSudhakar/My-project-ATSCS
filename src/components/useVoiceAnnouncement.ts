import { useEffect, useRef, useState } from "react";

export const useVoiceAnnouncement = () => {
  const [enabled, setEnabled] = useState(false);
  const lastSpokenRef = useRef<number>(-1);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  const announce = (text: string) => {
    if (!enabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    synthRef.current.speak(utterance);
  };

  const announceCountdown = (ambulanceLabel: string, seconds: number, signalName: string) => {
    if (!enabled || !synthRef.current) return;
    // Only announce every 10 seconds, at 5, 3, 2, 1
    const shouldSpeak =
      seconds % 10 === 0 || seconds === 5 || seconds <= 3;
    if (!shouldSpeak) return;
    if (lastSpokenRef.current === seconds) return;
    lastSpokenRef.current = seconds;

    synthRef.current.cancel();
    const msg =
      seconds <= 0
        ? `${ambulanceLabel} has arrived at ${signalName}`
        : `${ambulanceLabel} arriving at ${signalName} in ${seconds} seconds`;
    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.rate = 1.15;
    utterance.pitch = 1;
    utterance.volume = 0.85;
    synthRef.current.speak(utterance);
  };

  return { enabled, setEnabled, announce, announceCountdown };
};
