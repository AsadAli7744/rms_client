"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/api/client";

/**
 * Play a synthesized dual-tone chime without external audio files.
 */
function playOrderChime() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.15); // A5
    gain2.gain.setValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch {
    // Audio autoplay restrictions may silence until user interaction
  }
}

/**
 * Trigger thermal receipt printing via hidden printable iframe.
 */
export function printThermalReceipt(order: any) {
  const printWindow = window.open("", "_blank", "width=380,height=600");
  if (!printWindow) return;

  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
      <div style="display:flex; justify-content:space-between; margin: 4px 0; font-size: 14px;">
        <span><strong>${item.quantity}x</strong> ${item.item_name} ${item.variant_name ? `(${item.variant_name})` : ""}</span>
      </div>
      ${item.notes ? `<div style="font-size: 11px; font-style: italic; color: #555; margin-left: 18px;">>> ${item.notes}</div>` : ""}
    `,
    )
    .join("");

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Kitchen Ticket - #${order.order_number}</title>
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 72mm;
            margin: 0 auto;
            color: #000;
            padding: 4px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .dbl-divider { border-top: 2px solid #000; margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 16px;">*** KITCHEN ORDER TICKET ***</div>
        <div class="dbl-divider"></div>
        <div style="font-size: 14px;">
          <div><strong>Order #:</strong> ${order.order_number}</div>
          <div><strong>Table:</strong> ${order.table ? order.table.code : "Takeaway / QR"}</div>
          <div><strong>Time:</strong> ${new Date(order.created_at || Date.now()).toLocaleTimeString()}</div>
          ${order.waiter_name ? `<div><strong>Server:</strong> ${order.waiter_name}</div>` : ""}
        </div>
        <div class="divider"></div>
        <div class="bold" style="font-size: 13px;">ITEMS:</div>
        <div class="divider"></div>
        ${itemsHtml}
        ${
          order.notes
            ? `
          <div class="divider"></div>
          <div style="font-size: 12px;"><strong>SPECIAL NOTES:</strong><br/>${order.notes}</div>
        `
            : ""
        }
        <div class="dbl-divider"></div>
        <div class="center" style="font-size: 10px;">AUTO-PRINTED THERMAL TICKET</div>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 350);
}

export function useLiveOrders({
  branchId,
  role,
  autoPrintKitchen = false,
  onOrderCreated,
}: {
  branchId: number;
  role: "kitchen" | "cashier" | "manager" | "all";
  autoPrintKitchen?: boolean;
  onOrderCreated?: (order: any) => void;
}) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const autoPrintRef = useRef(autoPrintKitchen);
  autoPrintRef.current = autoPrintKitchen;

  useEffect(() => {
    // Request browser notification permission once
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const apiUrl = getApiBaseUrl();
    const token = typeof window !== "undefined" ? localStorage.getItem("rms_auth_token") : null;
    const sseUrl = `${apiUrl}/live-events/stream?branchId=${branchId}&role=${role}${
      token ? `&token=${encodeURIComponent(token)}` : ""
    }`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.addEventListener("connected", () => {
        setConnected(true);
      });

      eventSource.addEventListener("order_created", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const order = payload.data || payload;

          playOrderChime();

          const message = `New Order #${order.order_number} for ${order.table ? `Table ${order.table.code}` : "Takeaway"}`;
          setLastNotification(message);

          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("New Order Received!", {
              body: message,
              icon: "/favicon.ico",
            });
          }

          // Trigger Kitchen Thermal Auto-Print if enabled
          if (role === "kitchen" && autoPrintRef.current) {
            printThermalReceipt(order);
          }

          queryClient.invalidateQueries({ queryKey: ["kitchen-tickets", branchId] });
          queryClient.invalidateQueries({ queryKey: ["orders", branchId] });
          queryClient.invalidateQueries({ queryKey: ["reports", branchId] });

          if (onOrderCreated) {
            onOrderCreated(order);
          }
        } catch (err) {
          console.error("Failed to parse SSE order_created event", err);
        }
      });

      eventSource.addEventListener("order_status_changed", () => {
        queryClient.invalidateQueries({ queryKey: ["kitchen-tickets", branchId] });
        queryClient.invalidateQueries({ queryKey: ["orders", branchId] });
        queryClient.invalidateQueries({ queryKey: ["reports", branchId] });
      });

      eventSource.addEventListener("order_updated", () => {
        queryClient.invalidateQueries({ queryKey: ["orders", branchId] });
        queryClient.invalidateQueries({ queryKey: ["reports", branchId] });
      });

      eventSource.onerror = () => {
        setConnected(false);
      };
    } catch (err) {
      console.warn("Could not establish SSE connection", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [branchId, role, queryClient, onOrderCreated]);

  return { connected, lastNotification };
}
