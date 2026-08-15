import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Maximize2, RefreshCw, Volume2, VolumeX, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildSnapshotUrl, buildStreamUrl, type CameraConfig } from "@/lib/camera-config";

type Status = "idle" | "connecting" | "live" | "error";

export function CameraPlayer({ config }: { config: CameraConfig }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<() => void>(() => {});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [muted, setMuted] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const url = buildStreamUrl(config);

  const start = useCallback(async () => {
    cleanupRef.current();
    const video = videoRef.current;
    if (!video || config.mode === "mjpeg") return;

    setStatus("connecting");
    setMessage("");

    if (config.mode === "webrtc") {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      cleanupRef.current = () => pc.close();
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });
      pc.ontrack = (event) => {
        video.srcObject = event.streams[0] ?? null;
        void video.play().catch(() => {});
        setStatus("live");
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          setStatus("error");
          setMessage("Conexão WebRTC caiu. Verifique se o go2rtc está acessível na sua rede.");
        }
      };
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: offer.type, sdp: offer.sdp }),
        });
        if (!response.ok) throw new Error(`Servidor respondeu ${response.status}`);
        const answer = (await response.json()) as RTCSessionDescriptionInit;
        await pc.setRemoteDescription(answer);
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? `${error.message} — confira o endereço do servidor e o nome da stream.`
            : "Falha ao negociar o stream.",
        );
      }
      return;
    }

    // HLS
    try {
      const { default: Hls } = await import("hls.js");
      if (Hls.isSupported()) {
        const hls = new Hls({ lowLatencyMode: true, liveSyncDurationCount: 1 });
        cleanupRef.current = () => hls.destroy();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          void video.play().catch(() => {});
          setStatus("live");
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            setStatus("error");
            setMessage("Não foi possível carregar o HLS. O servidor local está rodando?");
          }
        });
      } else {
        video.src = url;
        video.oncanplay = () => setStatus("live");
        video.onerror = () => {
          setStatus("error");
          setMessage("Este navegador não conseguiu abrir o stream HLS.");
        };
        void video.play().catch(() => {});
      }
    } catch {
      setStatus("error");
      setMessage("Falha ao inicializar o player.");
    }
  }, [config.mode, url]);

  useEffect(() => {
    void start();
    return () => cleanupRef.current();
  }, [start, attempt]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const snapshot = () => {
    window.open(buildSnapshotUrl(config), "_blank", "noopener");
  };

  const fullscreen = () => {
    void wrapperRef.current?.requestFullscreen?.();
  };

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className={
              status === "live"
                ? "live-dot h-2.5 w-2.5 rounded-full bg-live"
                : status === "error"
                  ? "h-2.5 w-2.5 rounded-full bg-destructive"
                  : "h-2.5 w-2.5 rounded-full bg-muted-foreground"
            }
          />
          <div>
            <p className="text-sm font-semibold leading-none">{config.name}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {status === "live"
                ? `ao vivo · ${config.mode}`
                : status === "connecting"
                  ? "conectando…"
                  : status === "error"
                    ? "sem sinal"
                    : "aguardando"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMuted((m) => !m)}>
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
          <Button variant="secondary" size="sm" onClick={snapshot}>
            <Camera className="size-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={fullscreen}>
            <Maximize2 className="size-4" />
          </Button>
          <Button size="sm" onClick={() => setAttempt((a) => a + 1)}>
            <RefreshCw className="size-4" />
            Reconectar
          </Button>
        </div>
      </div>

      <div ref={wrapperRef} className="relative aspect-video w-full bg-background">
        {config.mode === "mjpeg" ? (
          <img
            key={attempt}
            src={url}
            alt={`Transmissão ao vivo da ${config.name}`}
            className="h-full w-full object-contain"
            onLoad={() => setStatus("live")}
            onError={() => {
              setStatus("error");
              setMessage("O servidor não entregou o stream MJPEG.");
            }}
          />
        ) : (
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            playsInline
            autoPlay
            muted={muted}
            controls={false}
          />
        )}

        <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />

        {status === "connecting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Negociando stream com o servidor local…</p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/85 px-6 text-center">
            <p className="font-display text-2xl">Sem sinal</p>
            <p className="max-w-md text-sm text-muted-foreground">{message}</p>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{url}</p>
          </div>
        )}
      </div>
    </div>
  );
}
