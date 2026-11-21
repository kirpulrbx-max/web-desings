import { Check, Copy, Download, ExternalLink, QrCode, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Button, Card } from './ui';

const renderQrPng = (svgElement: SVGSVGElement, title: string) =>
  new Promise<Blob>((resolve, reject) => {
    // Tarjeta imprimible: QR vectorial a 1024 px + nombre de la tienda debajo.
    const qrSize = 1024;
    const padding = 96;
    const footer = 180;
    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(qrSize));
    clone.setAttribute('height', String(qrSize));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = qrSize + padding * 2;
      canvas.height = qrSize + padding * 2 + footer;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(url);
        return reject(new Error('canvas'));
      }
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = false;
      context.drawImage(image, padding, padding, qrSize, qrSize);
      URL.revokeObjectURL(url);
      context.fillStyle = '#121c19';
      context.textAlign = 'center';
      context.font = '700 64px "Plus Jakarta Sans", system-ui, sans-serif';
      context.fillText(title.slice(0, 32), canvas.width / 2, qrSize + padding + 110);
      context.fillStyle = '#66736f';
      context.font = '500 40px "Plus Jakarta Sans", system-ui, sans-serif';
      context.fillText('Escanea para ver el catálogo y pedir por WhatsApp', canvas.width / 2, qrSize + padding + 175);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('png'))), 'image/png');
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('svg'));
    };
    image.src = url;
  });

export function QrCard({ url, storeName, slug, onError }: { url: string; storeName: string; slug: string; onError: (message: string) => void }) {
  const [svg, setSvg] = useState<SVGSVGElement | null>(null);
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const download = async () => {
    if (!svg) return;
    try {
      const blob = await renderQrPng(svg, storeName);
      const link = document.createElement('a');
      link.download = `qr-${slug || 'catalogo'}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    } catch {
      onError('No se pudo generar la imagen del QR. Inténtalo de nuevo.');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      onError('No se pudo copiar el enlace. Mantén presionado el enlace para copiarlo.');
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: storeName, text: `Mira el catálogo de ${storeName}`, url });
    } catch {
      // El usuario canceló el diálogo de compartir.
    }
  };

  return (
    <Card id="business-qr" className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Comparte tu tienda</p>
          <h3 className="font-bold text-ink-900">Código QR y enlace</h3>
        </div>
      </div>

      <div className="mt-4 flex justify-center rounded-2xl bg-ink-50 p-5">
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <QRCodeSVG ref={setSvg} value={url} size={196} level="H" marginSize={2} bgColor="#ffffff" fgColor="#121c19" title={`Catálogo de ${storeName}`} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-ink-200 bg-white py-1 pl-3 pr-1">
        <a className="min-w-0 flex-1 truncate text-xs text-ink-700 hover:underline" href={url} target="_blank" rel="noreferrer">
          {url.replace(/^https?:\/\//, '')}
        </a>
        <Button variant="ghost" size="sm" onClick={() => void copy()} aria-label="Copiar enlace">
          {copied ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="dark" onClick={() => void download()}>
          <Download className="h-4 w-4" /> Descargar
        </Button>
        {canShare ? (
          <Button variant="secondary" onClick={() => void share()}>
            <Share2 className="h-4 w-4" /> Compartir
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
            <ExternalLink className="h-4 w-4" /> Ver tienda
          </Button>
        )}
      </div>
    </Card>
  );
}
