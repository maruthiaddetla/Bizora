"use client";

import { useEffect, useState, type RefObject } from "react";

export type FixedDropdownPlacement = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "bottom" | "top";
};

const VIEWPORT_MARGIN = 8;
const MIN_PANEL_HEIGHT = 120;
const MAX_PANEL_RATIO = 0.55;
const MAX_PANEL_HEIGHT = 384;

export function useFixedDropdownPosition(
  triggerRef: RefObject<HTMLElement | null>,
  open: boolean,
): FixedDropdownPlacement | null {
  const [placement, setPlacement] = useState<FixedDropdownPlacement | null>(
    null,
  );

  useEffect(() => {
    if (!open || !triggerRef.current) {
      setPlacement(null);
      return;
    }

    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_MARGIN;
      const spaceAbove = rect.top - VIEWPORT_MARGIN;
      const openBelow = spaceBelow >= 160 || spaceBelow >= spaceAbove;
      const available = openBelow ? spaceBelow : spaceAbove;
      const maxHeight = Math.max(
        MIN_PANEL_HEIGHT,
        Math.min(
          available,
          Math.floor(viewportHeight * MAX_PANEL_RATIO),
          MAX_PANEL_HEIGHT,
        ),
      );

      let width = Math.min(rect.width, viewportWidth - VIEWPORT_MARGIN * 2);
      let left = rect.left;
      if (left + width > viewportWidth - VIEWPORT_MARGIN) {
        left = viewportWidth - width - VIEWPORT_MARGIN;
      }
      if (left < VIEWPORT_MARGIN) {
        left = VIEWPORT_MARGIN;
        width = Math.min(width, viewportWidth - VIEWPORT_MARGIN * 2);
      }

      setPlacement({
        top: openBelow
          ? rect.bottom + VIEWPORT_MARGIN
          : rect.top - VIEWPORT_MARGIN - maxHeight,
        left,
        width,
        maxHeight,
        placement: openBelow ? "bottom" : "top",
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, triggerRef]);

  return placement;
}
