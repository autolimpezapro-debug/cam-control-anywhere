/**
 * Configuração da câmera + servidor de streaming local.
 * Nada é enviado para a nuvem: tudo fica no localStorage do navegador.
 */

export type StreamMode = "webrtc" | "hls" | "mjpeg";

export type CameraConfig = {
  name: string;
  /** IP da câmera na rede local, ex: 192.168.0.108 */
  cameraHost: string;
  rtspPort: number;
  rtspUser: string;
  rtspPassword: string;
  /** Caminho RTSP, ex: /onvif1 */
  rtspPath: string;
  /** Host:porta do go2rtc / MediaMTX rodando na sua rede, ex: 192.168.0.10:1984 */
  serverHost: string;
  /** Nome da stream configurada no servidor */
  streamName: string;
  mode: StreamMode;
};

export const DEFAULT_CONFIG: CameraConfig = {
  name: "Câmera Dome ES-A28",
  cameraHost: "192.168.0.108",
  rtspPort: 554,
  rtspUser: "admin",
  rtspPassword: "",
  rtspPath: "/onvif1",
  serverHost: "192.168.0.10:1984",
  streamName: "camera",
  mode: "webrtc",
};

/** Caminhos RTSP mais comuns em câmeras Yoosee / GWell (chipset XM / V380 style). */
export const RTSP_PATH_CANDIDATES = [
  { path: "/onvif1", label: "Principal (Full HD / 3MP) — mais comum" },
  { path: "/onvif2", label: "Secundário (baixa resolução)" },
  { path: "/live/ch0", label: "Alternativo ch0" },
  { path: "/live/ch1", label: "Alternativo ch1" },
  { path: "/11", label: "Firmware XM — principal" },
  { path: "/12", label: "Firmware XM — secundário" },
  { path: "/cam/realmonitor?channel=1&subtype=0", label: "Estilo Dahua" },
];

const STORAGE_KEY = "camera-viewer-config-v1";

export function loadConfig(): CameraConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<CameraConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: CameraConfig) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function buildRtspUrl(c: CameraConfig) {
  const auth = c.rtspUser
    ? `${encodeURIComponent(c.rtspUser)}:${encodeURIComponent(c.rtspPassword)}@`
    : "";
  const path = c.rtspPath.startsWith("/") ? c.rtspPath : `/${c.rtspPath}`;
  return `rtsp://${auth}${c.cameraHost}:${c.rtspPort}${path}`;
}

function serverBase(c: CameraConfig) {
  const host = c.serverHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const scheme = typeof window !== "undefined" && window.location.protocol === "https:" ? "https" : "http";
  return `${scheme}://${host}`;
}

export function buildStreamUrl(c: CameraConfig) {
  const base = serverBase(c);
  const src = encodeURIComponent(c.streamName);
  if (c.mode === "hls") return `${base}/api/stream.m3u8?src=${src}&mp4=flac`;
  if (c.mode === "mjpeg") return `${base}/api/stream.mjpeg?src=${src}`;
  return `${base}/api/webrtc?src=${src}`;
}

export function buildSnapshotUrl(c: CameraConfig) {
  return `${serverBase(c)}/api/frame.jpeg?src=${encodeURIComponent(c.streamName)}&t=${Date.now()}`;
}

/** go2rtc.yaml pronto para copiar. */
export function buildGo2rtcYaml(c: CameraConfig) {
  return `streams:
  ${c.streamName}: ${buildRtspUrl(c)}

api:
  listen: ":1984"

webrtc:
  candidates:
    - ${c.serverHost.split(":")[0]}:8555
`;
}
