"use client";

import { useCallback, useRef } from "react";

type Point = { x: number; y: number };
type Translate = { tx: number; ty: number };
type MeasuredRects = { parentRect: DOMRect; selfRect: DOMRect };

export function useDraggable() {
    const startingPointerRef = useRef<Point | null>(null);
    const startingTranslateRef = useRef<Point | null>(null);
    const currentTranslateRef = useRef<Translate | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const measuredRectsRef = useRef<MeasuredRects | null>(null);
    const isDraggingRef = useRef<boolean>(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const clamp = (value: number, min: number, max: number) => {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    };

    const handleMove = useCallback((e: PointerEvent) => {
        if (!isDraggingRef.current) return;
        if (!startingPointerRef.current || !startingTranslateRef.current || !measuredRectsRef.current) return;

        const dx = e.clientX - startingPointerRef.current.x;
        const dy = e.clientY - startingPointerRef.current.y;

        const nextX = startingTranslateRef.current.x + dx;
        const nextY = startingTranslateRef.current.y + dy;

        const { parentRect, selfRect } = measuredRectsRef.current;
        const maxX = Math.max(0, parentRect.width - selfRect.width);
        const maxY = Math.max(0, parentRect.height - selfRect.height);

        const clampedX = clamp(nextX, 0, maxX);
        const clampedY = clamp(nextY, 0, maxY);

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(() => {
            const el = wrapperRef.current;
            if (!el) return;
            currentTranslateRef.current = { tx: clampedX, ty: clampedY };
            el.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
        });
    }, []);

    const handlePointerUp = useCallback((e: PointerEvent) => {
        const el = wrapperRef.current;
        if (el) {
            try { el.releasePointerCapture(e.pointerId); } catch {}
            el.style.cursor = "grab";
        }
        isDraggingRef.current = false;
        window.removeEventListener("pointermove", handleMove as any);
        window.removeEventListener("pointerup", handlePointerUp as any);
        window.removeEventListener("pointercancel", handlePointerUp as any);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }, [handleMove]);

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        const wrapperEl = wrapperRef.current;
        if (!wrapperEl) return;

        try { wrapperEl.setPointerCapture(e.pointerId); } catch {}
        isDraggingRef.current = true;

        const parentEl = wrapperEl.offsetParent as HTMLElement;
        const parentRect = parentEl.getBoundingClientRect();
        const selfRect = wrapperEl.getBoundingClientRect();
        measuredRectsRef.current = { parentRect, selfRect };

        startingPointerRef.current = { x: e.clientX, y: e.clientY };
        if (!currentTranslateRef.current) currentTranslateRef.current = { tx: 0, ty: 0 } as Translate;
        startingTranslateRef.current = {
            x: currentTranslateRef.current?.tx ?? 0,
            y: currentTranslateRef.current?.ty ?? 0,
        } as Point;

        wrapperEl.style.cursor = "grabbing";

        window.addEventListener("pointermove", handleMove as any);
        window.addEventListener("pointerup", handlePointerUp as any);
        window.addEventListener("pointercancel", handlePointerUp as any);
    }, [handleMove, handlePointerUp]);

    return {
        wrapperRef,
        onPointerDown,
        isDraggingRef,
        positionRef: currentTranslateRef,
    } as const;
}


