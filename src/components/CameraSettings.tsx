import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RTSP_PATH_CANDIDATES,
  buildRtspUrl,
  type CameraConfig,
  type StreamMode,
} from "@/lib/camera-config";

export function CameraSettings({
  config,
  onChange,
}: {
  config: CameraConfig;
  onChange: (config: CameraConfig) => void;
}) {
  const [draft, setDraft] = useState<CameraConfig>(config);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof CameraConfig>(key: K, value: CameraConfig[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onChange(draft);
    setSaved(true);
  };

  return (
    <form onSubmit={submit} className="panel space-y-5 p-5">
      <div>
        <h2 className="text-2xl">Configuração</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fica salvo apenas neste navegador. Nenhuma senha sai da sua rede.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome da câmera</Label>
        <Input id="name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="host">IP da câmera</Label>
          <Input
            id="host"
            value={draft.cameraHost}
            onChange={(e) => set("cameraHost", e.target.value)}
            placeholder="192.168.0.108"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="port">Porta RTSP</Label>
          <Input
            id="port"
            type="number"
            value={draft.rtspPort}
            onChange={(e) => set("rtspPort", Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="user">Usuário</Label>
          <Input id="user" value={draft.rtspUser} onChange={(e) => set("rtspUser", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pass">Senha</Label>
          <Input
            id="pass"
            type="password"
            value={draft.rtspPassword}
            onChange={(e) => set("rtspPassword", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Caminho RTSP</Label>
        <Select value={draft.rtspPath} onValueChange={(v) => set("rtspPath", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RTSP_PATH_CANDIDATES.map((candidate) => (
              <SelectItem key={candidate.path} value={candidate.path}>
                {candidate.path} — {candidate.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="break-all font-mono text-[11px] text-muted-foreground">
          {buildRtspUrl({ ...draft, rtspPassword: draft.rtspPassword ? "•••" : "" })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="server">Servidor go2rtc (host:porta)</Label>
          <Input
            id="server"
            value={draft.serverHost}
            onChange={(e) => set("serverHost", e.target.value)}
            placeholder="192.168.0.10:1984"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stream">Nome da stream</Label>
          <Input
            id="stream"
            value={draft.streamName}
            onChange={(e) => set("streamName", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Modo de transmissão</Label>
        <Select value={draft.mode} onValueChange={(v) => set("mode", v as StreamMode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="webrtc">WebRTC — latência mais baixa (recomendado)</SelectItem>
            <SelectItem value="hls">HLS — mais compatível, ~2s de atraso</SelectItem>
            <SelectItem value="mjpeg">MJPEG — último recurso, sem áudio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        {saved ? <Check className="size-4" /> : null}
        {saved ? "Salvo" : "Salvar e conectar"}
      </Button>
    </form>
  );
}
