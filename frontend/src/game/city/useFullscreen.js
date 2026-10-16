import { useCallback, useEffect, useState } from "react";

export function useFullscreen(targetRef) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(Boolean(document.fullscreenEnabled && document.exitFullscreen));
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    sync();
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [targetRef]);

  const toggleFullscreen = useCallback(async () => {
    const target = targetRef.current;
    if (!target) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (target.requestFullscreen) await target.requestFullscreen();
      setIsFullscreen(Boolean(document.fullscreenElement));
    } catch {
      // The game stays viewport-filling when fullscreen is unavailable or denied.
    }
  }, [targetRef]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() !== "f" || event.altKey || event.ctrlKey || event.metaKey) return;
      const tag = event.target?.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(tag) || event.target?.isContentEditable) return;
      event.preventDefault();
      toggleFullscreen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen]);

  return { isFullscreen, supported, toggleFullscreen };
}
