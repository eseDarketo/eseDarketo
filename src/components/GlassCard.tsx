import { Card } from "@once-ui-system/core";
import { useDraggable } from "@/hooks/useDraggable";
import { useDisplacementMap } from "@/hooks/useDisplacementMap";

interface GlassCardProps {
    children: React.ReactNode;
}

export function GlassCard({ children }: GlassCardProps) {
    const { wrapperRef, onPointerDown } = useDraggable();
    const { filterStyle } = useDisplacementMap(wrapperRef as unknown as React.RefObject<HTMLElement>, {
        strength: 35,
        depth: 10,
        blur: 2,
        chromaticAberration: 6,
    });

    return (
        <div
            ref={wrapperRef}
            onPointerDown={onPointerDown}
            style={{
                position: "absolute",
                top: 0, left: 0,
                willChange: "transform",
                touchAction: "none",
                cursor: "grab",
                borderRadius: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                aspectRatio: "1/1",
                width: "20rem",
                border: "1px solid var(--neutral-alpha-medium)",
                ...(filterStyle as React.CSSProperties),
            }}
        >
            {children}
        </div>
    );
}