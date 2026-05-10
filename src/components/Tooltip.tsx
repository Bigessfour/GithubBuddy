import {
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";

const INTERACTIVE_SELECTOR =
  'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Description-style tooltip for interactive triggers only (buttons, links).
 * Interaction expectations align with GitHub Primer Tooltip accessibility:
 * https://primer.style/product/components/tooltip/accessibility
 *
 * - Shows on hover and keyboard focus; closes on Escape, blur, or pointer leave.
 * - Supplementary text only; do not hide essential instructions in the tooltip.
 */
type TooltipProps = {
  text: string;
  /** When true, render children only (Primer: do not attach tooltips to disabled controls). */
  disabled?: boolean;
  children: ReactElement;
};

export function Tooltip({ text, children, disabled }: TooltipProps) {
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const interactiveRef = useRef<HTMLElement | null>(null);
  const originalDescribedByRef = useRef<string | null | undefined>(undefined);

  const clearHoverTimer = useCallback(() => {
    if (hoverCloseTimer.current) {
      clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearHoverTimer();
    setOpen(true);
  }, [clearHoverTimer]);

  const hideSoon = useCallback(() => {
    clearHoverTimer();
    hoverCloseTimer.current = window.setTimeout(() => setOpen(false), 120);
  }, [clearHoverTimer]);

  const hideNow = useCallback(() => {
    clearHoverTimer();
    setOpen(false);
  }, [clearHoverTimer]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        hideNow();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, hideNow]);

  useEffect(() => () => clearHoverTimer(), [clearHoverTimer]);

  useLayoutEffect(() => {
    if (disabled) return undefined;
    const root = anchorRef.current;
    if (!root) return undefined;
    const el = root.querySelector<HTMLElement>(INTERACTIVE_SELECTOR);
    if (!el) return undefined;
    interactiveRef.current = el;
    if (originalDescribedByRef.current === undefined) {
      originalDescribedByRef.current = el.getAttribute("aria-describedby");
    }

    const onFocus = () => show();
    const onBlur = () => hideSoon();
    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);

    return () => {
      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onBlur);
      const orig = originalDescribedByRef.current;
      if (orig === null || orig === undefined) {
        el.removeAttribute("aria-describedby");
      } else {
        el.setAttribute("aria-describedby", orig);
      }
      interactiveRef.current = null;
      originalDescribedByRef.current = undefined;
    };
  }, [disabled, show, hideSoon]);

  useLayoutEffect(() => {
    if (disabled) return;
    const el = interactiveRef.current;
    if (!el) return;
    const base = originalDescribedByRef.current ?? null;
    const merged =
      [base, open ? tipId : null].filter(Boolean).join(" ") || null;
    if (merged) {
      el.setAttribute("aria-describedby", merged);
    } else {
      el.removeAttribute("aria-describedby");
    }
  }, [disabled, open, tipId]);

  if (!isValidElement(children)) {
    throw new Error("Tooltip requires a single React element child");
  }

  if (disabled) {
    return children;
  }

  return (
    <span
      ref={anchorRef}
      className="tooltip-anchor"
      onMouseEnter={show}
      onMouseLeave={hideSoon}
    >
      {children}
      {open && (
        <span
          id={tipId}
          role="tooltip"
          className="tooltip-popup"
          onMouseEnter={show}
          onMouseLeave={hideSoon}
        >
          {text}
        </span>
      )}
    </span>
  );
}
