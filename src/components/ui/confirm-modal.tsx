"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

interface LeadItem {
  name: string;
  email?: string;
}

interface ConfirmOptions {
  title: string;
  description: string;
  /** Pass structured lead objects for the rich preview list */
  leadItems?: LeadItem[];
  /** Fallback plain-text items (used for non-lead confirmations) */
  items?: string[];
  actionButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => Promise<void>;
  successToast?: string;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx.confirm;
}

// ─── Focus Trap Hook ──────────────────────────────────────────────────────────

function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const el = containerRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focus the last button (Cancel) by default
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (focusable.length === 0) { e.preventDefault(); return; }
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return containerRef;
}

// ─── Modal Component ──────────────────────────────────────────────────────────

interface ConfirmModalProps {
  isOpen: boolean;
  options: ConfirmOptions | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ isOpen, options, isDeleting, onClose, onConfirm }: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const containerRef = useFocusTrap(isOpen && visible);

  // Mount portal after hydration
  useEffect(() => { setMounted(true); }, []);

  // Animate in / out
  useEffect(() => {
    if (isOpen) {
      // Tiny delay so CSS transition fires after element appears
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, isDeleting, onClose]);

  // Enter to confirm
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isDeleting) {
        e.preventDefault();
        onConfirm();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, isDeleting, onConfirm]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const leadItems = options?.leadItems ?? [];
  const plainItems = options?.items ?? [];
  const hasLeadItems = leadItems.length > 0;
  const hasPlainItems = plainItems.length > 0;
  const PREVIEW_MAX = 5;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      style={{ isolation: "isolate" }}
    >
      {/* ── Backdrop ─────────────────────────────────────────── */}
      <div
        onClick={isDeleting ? undefined : onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backgroundColor: "rgba(0, 0, 0, 0.52)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          transition: "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: visible ? 1 : 0,
          pointerEvents: isDeleting ? "none" : "auto",
        }}
      />

      {/* ── Panel ────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          zIndex: 9999,
          top: "50%",
          left: "50%",
          width: "100%",
          maxWidth: "440px",
          padding: "0 16px",
          transform: visible
            ? "translate(-50%, -50%) scale(1)"
            : "translate(-50%, -50%) scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: "transform 210ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform, opacity",
        }}
      >
        <div
          style={{
            borderRadius: "22px",
            backgroundColor: "oklch(0.175 0 0)",
            border: "1px solid oklch(0.26 0 0)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.04) inset",
            overflow: "hidden",
          }}
        >
          {/* ── Body ─────────────────────────────────────────── */}
          <div style={{ padding: "32px 28px 24px" }}>

            {/* Icon */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Trash2
                  style={{ width: "22px", height: "22px", color: "rgb(220, 80, 80)", strokeWidth: 1.75 }}
                />
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <h2
                id="confirm-modal-title"
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  lineHeight: "1.3",
                  color: "oklch(0.97 0 0)",
                }}
              >
                {options?.title ?? "Are you sure?"}
              </h2>
            </div>

            {/* Description */}
            <p
              id="confirm-modal-desc"
              style={{
                margin: "0 0 0",
                fontSize: "13.5px",
                lineHeight: "1.6",
                color: "oklch(0.6 0 0)",
                textAlign: "center",
                maxWidth: "320px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {options?.description ?? "This action cannot be undone."}
            </p>

            {/* ── Lead items preview ───────────────────────── */}
            {hasLeadItems && (
              <div
                style={{
                  marginTop: "20px",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                {leadItems.slice(0, PREVIEW_MAX).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 12px",
                      backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                      borderBottom: i < Math.min(leadItems.length, PREVIEW_MAX) - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                    }}
                  >
                    {/* Avatar circle */}
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(239,68,68,0.12)",
                        border: "1px solid rgba(239,68,68,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "rgb(200,80,80)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {(item.name || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "oklch(0.88 0 0)",
                          lineHeight: "1.2",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.name || "Unknown"}
                      </div>
                      {item.email && (
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "oklch(0.55 0 0)",
                            marginTop: "1px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.email}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {leadItems.length > PREVIEW_MAX && (
                  <div
                    style={{
                      padding: "8px 12px",
                      fontSize: "12px",
                      color: "oklch(0.5 0 0)",
                      fontWeight: 500,
                      letterSpacing: "0.01em",
                    }}
                  >
                    +{leadItems.length - PREVIEW_MAX} more
                  </div>
                )}
              </div>
            )}

            {/* ── Plain items fallback ─────────────────────── */}
            {!hasLeadItems && hasPlainItems && (
              <div
                style={{
                  marginTop: "20px",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                {plainItems.slice(0, PREVIEW_MAX).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 12px",
                      fontSize: "13px",
                      color: "oklch(0.72 0 0)",
                      backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                      borderBottom: i < Math.min(plainItems.length, PREVIEW_MAX) - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item}
                  </div>
                ))}
                {plainItems.length > PREVIEW_MAX && (
                  <div
                    style={{
                      padding: "8px 12px",
                      fontSize: "12px",
                      color: "oklch(0.5 0 0)",
                      fontWeight: 500,
                    }}
                  >
                    +{plainItems.length - PREVIEW_MAX} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ───────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "16px 28px 24px",
              justifyContent: "flex-end",
            }}
          >
            {/* Cancel */}
            <button
              onClick={onClose}
              disabled={isDeleting}
              style={{
                height: "38px",
                padding: "0 18px",
                borderRadius: "12px",
                border: "1px solid oklch(0.28 0 0)",
                backgroundColor: "transparent",
                color: "oklch(0.65 0 0)",
                fontSize: "13.5px",
                fontWeight: 500,
                cursor: isDeleting ? "not-allowed" : "pointer",
                transition: "color 150ms ease, border-color 150ms ease, background-color 150ms ease",
                outline: "none",
                fontFamily: "inherit",
                letterSpacing: "-0.005em",
              }}
              onMouseEnter={e => {
                if (!isDeleting) {
                  (e.target as HTMLButtonElement).style.color = "oklch(0.9 0 0)";
                  (e.target as HTMLButtonElement).style.borderColor = "oklch(0.36 0 0)";
                  (e.target as HTMLButtonElement).style.backgroundColor = "oklch(0.22 0 0)";
                }
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.color = "oklch(0.65 0 0)";
                (e.target as HTMLButtonElement).style.borderColor = "oklch(0.28 0 0)";
                (e.target as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
              onFocus={e => {
                (e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px oklch(0.4 0 0)";
              }}
              onBlur={e => {
                (e.target as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {options?.cancelButtonText ?? "Cancel"}
            </button>

            {/* Delete */}
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              style={{
                height: "38px",
                padding: "0 18px",
                borderRadius: "12px",
                border: "1px solid rgba(220, 70, 70, 0.25)",
                backgroundColor: "rgba(185, 50, 50, 0.18)",
                color: "rgb(225, 100, 100)",
                fontSize: "13.5px",
                fontWeight: 500,
                cursor: isDeleting ? "not-allowed" : "pointer",
                transition: "background-color 150ms ease, border-color 150ms ease, color 150ms ease",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                outline: "none",
                fontFamily: "inherit",
                letterSpacing: "-0.005em",
                opacity: isDeleting ? 0.7 : 1,
              }}
              onMouseEnter={e => {
                if (!isDeleting) {
                  const btn = e.currentTarget as HTMLButtonElement;
                  btn.style.backgroundColor = "rgba(200, 55, 55, 0.28)";
                  btn.style.borderColor = "rgba(220, 70, 70, 0.45)";
                  btn.style.color = "rgb(240, 115, 115)";
                }
              }}
              onMouseLeave={e => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.backgroundColor = "rgba(185, 50, 50, 0.18)";
                btn.style.borderColor = "rgba(220, 70, 70, 0.25)";
                btn.style.color = "rgb(225, 100, 100)";
              }}
              onFocus={e => {
                (e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px rgba(200, 60, 60, 0.4)";
              }}
              onBlur={e => {
                (e.target as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {isDeleting ? (
                <>
                  <Loader2 style={{ width: "13px", height: "13px", animation: "spin 1s linear infinite", flexShrink: 0 }} />
                  Deleting...
                </>
              ) : (
                options?.actionButtonText ?? "Delete"
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>,
    document.body
  );
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (isDeleting) return;
    setIsOpen(false);
    setTimeout(() => setOptions(null), 250);
  }, [isDeleting]);

  const handleConfirm = useCallback(async () => {
    if (!options) return;
    setIsDeleting(true);
    try {
      await options.onConfirm();
      setIsOpen(false);
      if (options.successToast) toast.success(options.successToast);
      setTimeout(() => setOptions(null), 250);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [options]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={isOpen}
        options={options}
        isDeleting={isDeleting}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </ConfirmContext.Provider>
  );
}
