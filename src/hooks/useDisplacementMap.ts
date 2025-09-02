import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type DisplacementMapParams = {
    width: number;
    height: number;
    radius: number;
    depth: number;
};

function generateDisplacementMap({ width, height, radius, depth }: DisplacementMapParams): string {
    const yStart = Math.ceil((radius / height) * 15);
    const yEnd = Math.floor(100 - (radius / height) * 15);
    const xStart = Math.ceil((radius / width) * 15);
    const xEnd = Math.floor(100 - (radius / width) * 15);

    const svg = `<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
        .mix { mix-blend-mode: screen; }
    </style>
    <defs>
        <linearGradient 
          id="Y" 
          x1="0" 
          x2="0" 
          y1="${yStart}%" 
          y2="${yEnd}%">
            <stop offset="0%" stop-color="#0F0" />
            <stop offset="100%" stop-color="#000" />
        </linearGradient>
        <linearGradient 
          id="X" 
          x1="${xStart}%" 
          x2="${xEnd}%"
          y1="0" 
          y2="0">
            <stop offset="0%" stop-color="#F00" />
            <stop offset="100%" stop-color="#000" />
        </linearGradient>
    </defs>

    <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
    <g filter="blur(2px)">
      <rect x="0" y="0" height="${height}" width="${width}" fill="#000080" />
      <rect
          x="0"
          y="0"
          height="${height}"
          width="${width}"
          fill="url(#Y)"
          class="mix"
      />
      <rect
          x="0"
          y="0"
          height="${height}"
          width="${width}"
          fill="url(#X)"
          class="mix"
      />
      <rect
          x="${depth}"
          y="${depth}"
          height="${height - 2 * depth}"
          width="${width - 2 * depth}"
          fill="#808080"
          rx="${radius}"
          ry="${radius}"
          filter="blur(${depth}px)"
      />
    </g>
</svg>`;

    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function readComputedBorderRadiusPx(element: Element | null): number {
    if (!element) return 0;
    const style = getComputedStyle(element as HTMLElement);
    const radiusStr = style.borderRadius || "0";
    // Take the first radius value if multiple
    const match = radiusStr.match(/[0-9.]+/);
    const px = match ? parseFloat(match[0]) : 0;
    return Number.isFinite(px) ? px : 0;
}

export type UseDisplacementOptions = {
    /** Maximum pixels of displacement; maps to feDisplacementMap scale. */
    strength?: number;
    /** Edge falloff depth in pixels; also used as blur radius for softening. */
    depth?: number;
    /** Additional backdrop blur used alongside the displacement filter. */
    blur?: number;
    /** Extra per-channel offset for chromatic aberration (0 disables the effect). */
    chromaticAberration?: number;
};

function generateDisplacementFilterUrl(params: {
    width: number;
    height: number;
    radius: number;
    depth: number;
    strength: number;
    chromaticAberration: number;
}): string {
    const { width, height, radius, depth, strength, chromaticAberration } = params;
    const mapHref = generateDisplacementMap({ width, height, radius, depth });
    const svg = `
<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="displace" color-interpolation-filters="sRGB">
      <feImage x="0" y="0" height="${height}" width="${width}" href="${mapHref}" result="displacementMap" />
      <!-- Red channel -->
      <feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${strength + chromaticAberration * 2}" xChannelSelector="R" yChannelSelector="G" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="displacedR" />
      <!-- Green channel -->
      <feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${strength + chromaticAberration}" xChannelSelector="R" yChannelSelector="G" />
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="displacedG" />
      <!-- Blue channel -->
      <feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${strength}" xChannelSelector="R" yChannelSelector="G" />
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="displacedB" />
      <feBlend in="displacedR" in2="displacedG" mode="screen" />
      <feBlend in2="displacedB" mode="screen" />
    </filter>
  </defs>
</svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg) + "#displace";
}

export function useDisplacementMap(targetRef: React.RefObject<HTMLElement>, options?: UseDisplacementOptions) {
    const strength = options?.strength ?? 20;
    const defaultDepth = options?.depth ?? 8;
    const blur = options?.blur ?? 2;
    const chromaticAberration = options?.chromaticAberration ?? 0;
    const [filterStyle, setFilterStyle] = useState<CSSProperties>({});

    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    const updateFilter = useCallback((el: HTMLElement) => {
        const rect = el.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        const radius = readComputedBorderRadiusPx(el);
        const depth = Math.min(Math.floor(Math.min(width, height) / 4), defaultDepth);

        const filterUrl = generateDisplacementFilterUrl({ width, height, radius, depth, strength, chromaticAberration });

        // Apply via backdrop-filter (only Safari currently supports url() here).
        const s: any = {};
        s.backdropFilter = `blur(${blur / 2}px) url('${filterUrl}') blur(${blur}px) saturate(1.1) brightness(1.1)`;
        s.WebkitBackdropFilter = s.backdropFilter;
        setFilterStyle(s as CSSProperties);
    }, [defaultDepth, strength, blur, chromaticAberration]);

    useEffect(() => {
        const el = targetRef.current as HTMLElement | null;
        if (!el) return;

        updateFilter(el);

        if (!resizeObserverRef.current) {
            resizeObserverRef.current = new ResizeObserver(() => {
                updateFilter(el);
            });
        }

        resizeObserverRef.current.observe(el);

        return () => {
            try {
                resizeObserverRef.current?.disconnect();
            } catch {}
        };
    }, [targetRef, updateFilter]);

    return {
        filterStyle,
    } as const;
}


