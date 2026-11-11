"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  QrCode,
  Download,
  ExternalLink,
  Copy,
  Check,
  Printer,
  Smartphone,
  Laptop,
  CheckCircle2,
  Sparkles,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import type { DiningTableRow } from "@/features/branch/api";

interface TableQrDialogProps {
  table: DiningTableRow | null;
  branchId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TableQrDialog({
  table,
  branchId,
  open,
  onOpenChange,
}: TableQrDialogProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  // Address mode: 'network' (for mobile phones on Wi-Fi), 'localhost' (for desktop), or 'custom'
  const [targetHost, setTargetHost] = useState<string>("");
  const [mode, setMode] = useState<"network" | "localhost" | "custom">("network");

  // Detect local environment host
  useEffect(() => {
    if (typeof window !== "undefined") {
      const port = window.location.port ? `:${window.location.port}` : "";
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (isLocal) {
        // Default to Wi-Fi IP so Google Lens / mobile phones can access it
        setTargetHost(`192.168.100.10${port}`);
        setMode("network");
      } else {
        setTargetHost(`${window.location.hostname}${port}`);
        setMode("custom");
      }
    }
  }, [open]);

  // Construct the active ordering URL
  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  const port = typeof window !== "undefined" && window.location.port ? `:${window.location.port}` : ":3002";

  const resolvedHost =
    mode === "network"
      ? `192.168.100.10${port}`
      : mode === "localhost"
      ? `localhost${port}`
      : targetHost;

  const orderUrl = table
    ? `${protocol}//${resolvedHost}/order?branchId=${branchId}&tableId=${table.id}`
    : "";

  // Generate real, high-resolution QR code
  useEffect(() => {
    if (!orderUrl || !open) return;

    let isMounted = true;
    setGenerating(true);

    QRCode.toDataURL(orderUrl, {
      width: 480,
      margin: 3,
      errorCorrectionLevel: "H", // High error correction for reliable scanning
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setGenerating(false);
        }
      })
      .catch((err) => {
        console.error("QR Code generation error:", err);
        if (isMounted) setGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderUrl, open]);

  const copyUrl = () => {
    if (!orderUrl) return;
    navigator.clipboard.writeText(orderUrl);
    setCopiedLink(true);
    toast.success("Table QR URL copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    if (!qrDataUrl || !table) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print table QR code");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table QR Stand — ${table.name || `Table ${table.code}`}</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              margin: 0;
              color: #111;
            }
            .card {
              border: 2px dashed #ff5722;
              border-radius: 20px;
              padding: 36px 48px;
              text-align: center;
              max-width: 420px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            }
            .badge {
              background: #ff5722;
              color: white;
              padding: 6px 14px;
              border-radius: 9999px;
              font-size: 13px;
              font-weight: bold;
              letter-spacing: 1px;
              text-transform: uppercase;
              display: inline-block;
            }
            h1 {
              font-size: 32px;
              margin: 12px 0 4px 0;
              letter-spacing: -0.5px;
            }
            .sub {
              font-size: 14px;
              color: #666;
              margin-bottom: 24px;
            }
            .qr-frame {
              background: #fff;
              padding: 12px;
              border-radius: 16px;
              border: 1px solid #e5e5e5;
              display: inline-block;
            }
            .qr-img {
              width: 260px;
              height: 260px;
              display: block;
            }
            .instruction {
              margin-top: 24px;
              font-size: 16px;
              font-weight: 600;
              color: #111;
            }
            .url {
              font-family: monospace;
              font-size: 11px;
              color: #888;
              margin-top: 8px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Dine-In Self Ordering</div>
            <h1>${table.name || `Table ${table.code}`}</h1>
            <div class="sub">Seating: ${table.seating_capacity} Guests • Scan with Phone Camera</div>
            <div class="qr-frame">
              <img src="${qrDataUrl}" class="qr-img" />
            </div>
            <div class="instruction">Scan with Google Lens or Camera to Order</div>
            <div class="url">${orderUrl}</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-neutral-900 dark:text-white">
            <QrCode className="size-5 text-orange-500" />
            <span>Table QR Code — {table.name || `Table ${table.code}`}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Real Scannable QR Code Canvas / Image */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-center">
            <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 relative">
              {generating || !qrDataUrl ? (
                <div className="size-60 flex items-center justify-center text-xs text-neutral-400">
                  Generating verified QR code…
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt={`QR code for Table ${table.code}`}
                  className="size-60 block rounded-lg select-none"
                />
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-neutral-900 dark:text-white">
                {table.code}
              </span>
              <span className="text-xs text-neutral-400">•</span>
              <span className="text-xs text-neutral-500">
                {table.seating_capacity} Seats
              </span>
              <span className="text-xs text-neutral-400">•</span>
              <Badge variant="outline" className="text-[10px] uppercase font-mono capitalize">
                {table.status}
              </Badge>
            </div>

            {/* Google Lens & Mobile Scanner Verified Badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <CheckCircle2 className="size-3.5" />
              <span>Google Lens & Mobile Camera Ready</span>
            </div>
          </div>

          {/* Scanner Target Host Selector */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-950 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="flex items-center gap-1.5">
                <Wifi className="size-3.5 text-blue-500" />
                <span>QR Network Target:</span>
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMode("network")}
                  className={`px-2 py-0.5 rounded transition ${
                    mode === "network"
                      ? "bg-blue-600 text-white font-bold"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  Wi-Fi Phone
                </button>
                <button
                  type="button"
                  onClick={() => setMode("localhost")}
                  className={`px-2 py-0.5 rounded transition ${
                    mode === "localhost"
                      ? "bg-neutral-800 text-white font-bold"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  Localhost
                </button>
              </div>
            </div>

            {mode === "network" && (
              <p className="text-[11px] text-blue-600 dark:text-blue-400 leading-snug">
                Uses your Wi-Fi LAN IP (<strong>192.168.100.10:3002</strong>) so phones on the same Wi-Fi network can scan and open it immediately.
              </p>
            )}

            {mode === "localhost" && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug">
                ⚠️ Notice: <code>localhost</code> is only accessible on this PC. For phones scanning with Google Lens, switch to <strong>Wi-Fi Phone</strong>.
              </p>
            )}

            {/* Direct URL Box */}
            <div className="pt-1.5 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                Encoded URL
              </span>
              <p className="font-mono text-xs text-neutral-800 dark:text-neutral-200 break-all select-all bg-neutral-50 dark:bg-neutral-900 p-2 rounded border border-neutral-200/60 dark:border-neutral-800">
                {orderUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={copyUrl}
              className="gap-1.5 text-xs flex-1 sm:flex-initial"
            >
              {copiedLink ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              <span>{copiedLink ? "Copied!" : "Copy URL"}</span>
            </Button>

            {qrDataUrl && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-1.5 text-xs flex-1 sm:flex-initial"
              >
                <a
                  href={qrDataUrl}
                  download={`table-${table.code}-qr.png`}
                  title="Download high-resolution QR image"
                >
                  <Download className="size-3.5" />
                  <span>PNG</span>
                </a>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs flex-1 sm:flex-initial"
            >
              <Printer className="size-3.5" />
              <span>Print</span>
            </Button>
          </div>

          <Button
            size="sm"
            asChild
            className="bg-orange-600 hover:bg-orange-500 text-white gap-1.5 text-xs"
          >
            <Link href={orderUrl} target="_blank">
              <ExternalLink className="size-3.5" />
              <span>Launch View</span>
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
