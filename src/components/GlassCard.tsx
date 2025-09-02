import { Card } from "@once-ui-system/core";
import { useDraggable } from "@/hooks/useDraggable";

interface GlassCardProps {
    children: React.ReactNode;
}

export function GlassCard({ children }: GlassCardProps) {
    const { wrapperRef, onPointerDown } = useDraggable();

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
            }}
        >
            <Card background="neutral-alpha-strong" border="neutral-alpha-medium" radius="xs-8" padding="xl">
                {children}
            </Card>
        </div>
    );
}