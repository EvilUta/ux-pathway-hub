import { useEffect, useRef, useState } from "react";
import { Expand, Minimize } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PortfolioPreview({ embedUrl, title }: { embedUrl: string; title: string }) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === previewRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function toggleFullscreen() {
    if (!previewRef.current) return;

    if (document.fullscreenElement === previewRef.current) {
      await document.exitFullscreen();
      return;
    }

    await previewRef.current.requestFullscreen();
  }

  return (
    <div
      ref={previewRef}
      className={`overflow-hidden rounded-xl border bg-muted/20 ${isFullscreen ? "bg-background p-4" : ""}`}
    >
      <div className="flex items-center justify-end border-b bg-background/80 px-3 py-2">
        <Button type="button" variant="outline" size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? (
            <>
              <Minimize className="mr-1 h-4 w-4" />
              Sair do full screen
            </>
          ) : (
            <>
              <Expand className="mr-1 h-4 w-4" />
              Full screen
            </>
          )}
        </Button>
      </div>
      <iframe
        title={`${title}-preview`}
        src={embedUrl}
        className={`w-full bg-background ${isFullscreen ? "h-[calc(100vh-7rem)]" : "h-[520px]"}`}
      />
    </div>
  );
}
