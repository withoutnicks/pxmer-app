import { useCallback, useRef } from "react";

/**
 * Crea una instancia de Audio una sola vez. El navegador cachea el archivo
 * por URL, así que reutilizar el objeto evita redecodificar el WAV en cada
 * click.
 */
function createAudio(url: string): HTMLAudioElement {
  const audio = new Audio(url);
  audio.preload = "auto";
  return audio;
}

function useCachedSound(url: string): () => void {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (audioRef.current === null) {
    audioRef.current = createAudio(url);
  }

  return useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.warn("Bloqueado por el navegador o error de ruta:", error);
    });
  }, [url]);
}

/** Feedback de clic genérico: botones y atajos de teclado. */
export function useTapSound(): () => void {
  return useCachedSound("sounds/tap_01.wav");
}

/** Reservado al cambio de tema. */
export function useToggleSound(): () => void {
  return useCachedSound("sounds/toggle_on.wav");
}
