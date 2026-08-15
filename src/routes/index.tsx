import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import { CameraPlayer } from "@/components/CameraPlayer";
import { CameraSettings } from "@/components/CameraSettings";
import { SetupGuide } from "@/components/SetupGuide";
import { DEFAULT_CONFIG, loadConfig, saveConfig, type CameraConfig } from "@/lib/camera-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Monitor Local — sua câmera IP sem o app Yoosee" },
      {
        name: "description",
        content:
          "Visualize sua câmera IP Yoosee (ES-A28) ao vivo no navegador via RTSP/ONVIF e go2rtc, sem depender do app do fabricante.",
      },
      { property: "og:title", content: "Monitor Local — câmera IP sem o app Yoosee" },
      {
        property: "og:description",
        content:
          "Player ao vivo em WebRTC/HLS para câmeras IP RTSP, rodando na sua própria rede local.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [config, setConfig] = useState<CameraConfig>(DEFAULT_CONFIG);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConfig(loadConfig());
    setHydrated(true);
  }, []);

  const update = (next: CameraConfig) => {
    setConfig(next);
    saveConfig(next);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Video className="size-5" />
          </span>
          <div>
            <h1 className="text-4xl leading-none">Monitor Local</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sua câmera IP no navegador — direto na rede, sem app do fabricante.
            </p>
          </div>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          RTSP · ONVIF · WebRTC
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {hydrated ? <CameraPlayer config={config} /> : <div className="panel aspect-video" />}
          <SetupGuide config={config} />
        </div>
        {hydrated ? (
          <CameraSettings key={config.serverHost + config.streamName} config={config} onChange={update} />
        ) : (
          <div className="panel h-96" />
        )}
      </div>
    </main>
  );
}
