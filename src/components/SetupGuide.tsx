import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildGo2rtcYaml, buildRtspUrl, type CameraConfig } from "@/lib/camera-config";

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-foreground">
        {code}
      </pre>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="absolute right-2 top-2"
        onClick={() => {
          void navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}

export function SetupGuide({ config }: { config: CameraConfig }) {
  const rtsp = buildRtspUrl(config);

  return (
    <div className="panel p-5">
      <h2 className="text-2xl">Como ligar sua ES-A28</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        O app da Yoosee usa um P2P fechado (CloudLinks/GWell) que não pode ser reimplementado. O
        caminho que funciona é falar RTSP/ONVIF direto com a câmera na sua rede, e um servidor local
        converte isso para o navegador.
      </p>

      <Accordion type="single" collapsible className="mt-4" defaultValue="step1">
        <AccordionItem value="step1">
          <AccordionTrigger>1. Descobrir o IP e testar o RTSP no VLC</AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              No roteador, procure o dispositivo da câmera na lista de clientes Wi-Fi e fixe o IP
              (DHCP reservation). Depois, no VLC: <em>Mídia → Abrir transmissão de rede</em> e cole:
            </p>
            <CodeBlock code={rtsp} />
            <p>
              Se pedir usuário/senha, use as mesmas do app Yoosee (padrão comum: usuário{" "}
              <code className="font-mono">admin</code>). Se falhar, troque o caminho no formulário
              (<code className="font-mono">/onvif1</code>, <code className="font-mono">/onvif2</code>,{" "}
              <code className="font-mono">/live/ch0</code>, <code className="font-mono">/11</code>) e
              teste de novo. Alguns firmwares Yoosee só liberam RTSP depois de ativar a opção ONVIF
              nas configurações avançadas do app.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step2">
          <AccordionTrigger>2. Rodar o go2rtc no PC ou Raspberry Pi</AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Baixe o binário do go2rtc (Windows, Linux, macOS ou Raspberry) e coloque este{" "}
              <code className="font-mono">go2rtc.yaml</code> na mesma pasta:
            </p>
            <CodeBlock code={buildGo2rtcYaml(config)} />
            <p>Rode o binário e confirme no navegador do próprio PC:</p>
            <CodeBlock code={`http://localhost:1984/`} />
            <p>
              Com Docker, o equivalente é:
            </p>
            <CodeBlock
              code={`docker run -d --name go2rtc --network host \\
  -v $PWD/go2rtc.yaml:/config/go2rtc.yaml \\
  alexxit/go2rtc`}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step3">
          <AccordionTrigger>3. Apontar este app para o servidor</AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              No painel de configuração, preencha <strong>Servidor go2rtc</strong> com o IP da máquina
              onde ele roda (ex.: <code className="font-mono">192.168.0.10:1984</code>) e o nome da
              stream (<code className="font-mono">{config.streamName}</code>). Clique em salvar: o
              vídeo aparece ao lado.
            </p>
            <p>
              O H.265 da ES-A28 passa direto no WebRTC em navegadores recentes; se der tela preta,
              troque para HLS ou defina a câmera para H.264 no app Yoosee (Configurações → Vídeo).
              Para gastar menos banda, use o caminho secundário{" "}
              <code className="font-mono">/onvif2</code>.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step4">
          <AccordionTrigger>Ver de fora de casa</AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Nunca abra a porta da câmera na internet. Use uma VPN na sua rede (Tailscale ou
              WireGuard no roteador): conectado à VPN, o mesmo endereço{" "}
              <code className="font-mono">{config.serverHost}</code> funciona do celular em qualquer
              lugar.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step5">
          <AccordionTrigger>Ficha técnica da sua câmera</AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground">
            <ul className="grid gap-1 sm:grid-cols-2">
              <li>Modelo: Estary Shop ES-A28 (Dome PTZ)</li>
              <li>Sensor: 1/2.9" CMOS progressivo, 3MP Full HD</li>
              <li>Lente: 3,6 mm · zoom digital 4x · até 20 fps</li>
              <li>Compressão: H.265X (com fallback H.264)</li>
              <li>Rede: Wi-Fi 2.4 GHz ou cabo · IP66 · 3 W</li>
              <li>Visão noturna colorida até 30 m</li>
              <li>Áudio bidirecional, sensor de movimento, alarme</li>
              <li>Cartão SD até 128 GB · Anatel 101792214414</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
