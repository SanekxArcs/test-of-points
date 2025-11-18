import React, { useState, useEffect, useRef } from "react";
import points from "../data/points";
import connections from "../data/connections";
import { INTERACTIVE_POINTS_CONFIG as CONFIG } from "../config/interactivePointsConfig";

export interface Point {
  id: number;
  x: number;
  y: number;
  isBlack: boolean;
  label: string;
  size?: string | number;
  link?: string;
  textAngle?: number | { xs: number; sm: number; md: number; lg: number; xl: number; '2xl': number };
  textDistance?: number | { xs: number; sm: number; md: number; lg: number; xl: number; '2xl': number };
  scaleOnHover?: boolean;
  magnifyOnHover?: boolean;
}

interface PointPosition {
  circle: { x: number; y: number; size: number };
  text: { x: number; y: number; scale: number; angle: number; distance: number; fontWeight: number };
}

// Breakpoint widths matching tailwind config
const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1440,
  '2xl': 1920,
};

type BreakpointKey = keyof typeof BREAKPOINTS;

// Helper function to get current breakpoint based on window width
const getCurrentBreakpoint = (): BreakpointKey => {
  const width = window.innerWidth;
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

// Helper function to get responsive value based on current breakpoint
const getResponsiveValue = (
  value: number | { xs: number; sm: number; md: number; lg: number; xl: number; '2xl': number } | undefined
): number => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  
  const breakpoint = getCurrentBreakpoint();
  return value[breakpoint] ?? 0;
};

// Helper function to parse size value (can be string like "clamp(...)" or number)
const parseSizeValue = (size: string | number | undefined): number => {
  if (!size) return 50;
  if (typeof size === 'number') return size;
  
  // For clamp values, extract the first px value as fallback
  // clamp(25px, 3.021vw, 58px) -> extract 25
  const pxMatch = size.match(/(\d+(?:\.\d+)?)px/);
  if (pxMatch) {
    return parseFloat(pxMatch[1]);
  }
  
  return 50;
};

function InteractivePoints() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pointPositions, setPointPositions] = useState<
    Map<number, PointPosition>
  >(new Map());
  const [animationProgress, setAnimationProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const targetPositionsRef = useRef<Map<number, PointPosition>>(new Map());
  const animationFrameRef = useRef<number>();

  const updateTargetPositions = React.useCallback(
    (cursorX: number, cursorY: number) => {
      const newTargets = new Map<number, PointPosition>();

      points.forEach((point) => {
        const containerWidth = containerRef.current?.clientWidth || 1;
        const containerHeight = containerRef.current?.clientHeight || 1;

        const baseX = (point.x / CONFIG.PERCENTAGE_DIVISOR) * containerWidth;
        const baseY = (point.y / CONFIG.PERCENTAGE_DIVISOR) * containerHeight;
        const size = parseSizeValue(point.size);
        const triggerDistance = size * CONFIG.TRIGGER_DISTANCE_MULTIPLIER;

        const distX = baseX - cursorX;
        const distY = baseY - cursorY;
        const hypotenuse = Math.sqrt(distX * distX + distY * distY);

        // Apply initial animation interpolation
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        const initialX = centerX + (baseX - centerX) * animationProgress;
        const initialY = centerY + (baseY - centerY) * animationProgress;

        if (hypotenuse < triggerDistance && animationProgress === 1 && point.magnifyOnHover !== false) {
          const angle = Math.atan2(distX, distY);
          const pull =
            (1 - hypotenuse / triggerDistance) / CONFIG.PULL_FORCE_DIVISOR;
          const hoverIntensity = 1 - hypotenuse / triggerDistance;
          const textScale = point.isBlack && point.scaleOnHover !== false
            ? 1 + hoverIntensity * CONFIG.TEXT_SCALE_INTENSITY
            : 1;

          newTargets.set(point.id, {
            circle: {
              x: baseX - Math.sin(angle) * hypotenuse * pull,
              y: baseY - Math.cos(angle) * hypotenuse * pull,
              size:
                size *
                (1 +
                  (1 - hypotenuse / triggerDistance) *
                    CONFIG.CIRCLE_SIZE_MULTIPLIER),
            },
            text: {
              x: -Math.sin(angle) * hypotenuse * pull,
              y: -Math.cos(angle) * hypotenuse * pull,
              scale: textScale,
              angle: getResponsiveValue(point.textAngle),
              distance: getResponsiveValue(point.textDistance),
              fontWeight: point.isBlack ? 500 : 400,
            },
          });
        } else {
          newTargets.set(point.id, {
            circle: {
              x: initialX,
              y: initialY,
              size: size * animationProgress,
            },
            text: {
              x: 0,
              y: 0,
              scale: 1,
              angle: getResponsiveValue(point.textAngle),
              distance: getResponsiveValue(point.textDistance),
              fontWeight: point.isBlack ? 500 : 400,
            },
          });
        }
      });

      targetPositionsRef.current = newTargets;
    },
    [animationProgress]
  );

  // Smooth interpolation function
  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  // Animate positions smoothly towards targets
  const animateToTargets = React.useCallback(() => {
    const lerpFactor = CONFIG.LERP_FACTOR;
    const currentPositions = new Map<number, PointPosition>();
    let hasChanges = false;

    targetPositionsRef.current.forEach((target, pointId) => {
      const current = pointPositions.get(pointId);

      if (!current) {
        currentPositions.set(pointId, target);
        hasChanges = true;
      } else {
        const newPos: PointPosition = {
          circle: {
            x: lerp(current.circle.x, target.circle.x, lerpFactor),
            y: lerp(current.circle.y, target.circle.y, lerpFactor),
            size: lerp(current.circle.size, target.circle.size, lerpFactor),
          },
          text: {
            x: lerp(current.text.x, target.text.x, lerpFactor),
            y: lerp(current.text.y, target.text.y, lerpFactor),
            scale: lerp(current.text.scale, target.text.scale, lerpFactor),
            angle: lerp(current.text.angle, target.text.angle, lerpFactor),
            distance: lerp(current.text.distance, target.text.distance, lerpFactor),
            fontWeight: target.text.fontWeight,
          },
        };

        // Check if position is significantly different
        if (
          Math.abs(newPos.circle.x - target.circle.x) >
            CONFIG.POSITION_THRESHOLD ||
          Math.abs(newPos.circle.y - target.circle.y) >
            CONFIG.POSITION_THRESHOLD ||
          Math.abs(newPos.circle.size - target.circle.size) >
            CONFIG.SIZE_THRESHOLD ||
          Math.abs(newPos.text.scale - target.text.scale) >
            CONFIG.SCALE_THRESHOLD ||
          Math.abs(newPos.text.angle - target.text.angle) >
            CONFIG.POSITION_THRESHOLD ||
          Math.abs(newPos.text.distance - target.text.distance) >
            CONFIG.POSITION_THRESHOLD
        ) {
          hasChanges = true;
        }

        currentPositions.set(pointId, newPos);
      }
    });

    setPointPositions(currentPositions);

    if (hasChanges) {
      animationFrameRef.current = requestAnimationFrame(animateToTargets);
    }
  }, [pointPositions]);

  // Initial animation effect
  useEffect(() => {
    const duration = CONFIG.ANIMATION_DURATION;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      setAnimationProgress(easeOutCubic(progress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, []);

  // Initialize positions on mount and when animation progresses
  useEffect(() => {
    updateTargetPositions(mousePos.x, mousePos.y);
  }, [animationProgress, updateTargetPositions, mousePos.x, mousePos.y]);

  // Start smooth animation loop
  useEffect(() => {
    animateToTargets();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animateToTargets]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setMousePos({ x, y });
        updateTargetPositions(x, y);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      return () => container.removeEventListener("mousemove", handleMouseMove);
    }
  }, [updateTargetPositions]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: CONFIG.SVG_Z_INDEX }}
        preserveAspectRatio="none"
      >
        {connections.map((conn, idx) => {
          const fromPos = pointPositions.get(conn.from);
          const toPos = pointPositions.get(conn.to);
          if (!fromPos || !toPos) return null;

          const containerWidth = containerRef.current?.clientWidth || 1;
          const containerHeight = containerRef.current?.clientHeight || 1;

          const fromX =
            (fromPos.circle.x / containerWidth) * CONFIG.PERCENTAGE_DIVISOR;
          const fromY =
            (fromPos.circle.y / containerHeight) * CONFIG.PERCENTAGE_DIVISOR;
          const toX =
            (toPos.circle.x / containerWidth) * CONFIG.PERCENTAGE_DIVISOR;
          const toY =
            (toPos.circle.y / containerHeight) * CONFIG.PERCENTAGE_DIVISOR;

          return (
            <line
              key={idx}
              x1={`${fromX}%`}
              y1={`${fromY}%`}
              x2={`${toX}%`}
              y2={`${toY}%`}
              stroke={conn.isBlack ? CONFIG.BLACK_COLOR : CONFIG.WHITE_COLOR}
              strokeWidth={CONFIG.LINE_STROKE_WIDTH}
              opacity={CONFIG.LINE_OPACITY * animationProgress}
              style={{
                transition: CONFIG.LINE_OPACITY_TRANSITION,
              }}
            />
          );
        })}
      </svg>
      {points.map((point) => {
        const pos = pointPositions.get(point.id);
        if (!pos) return null;

        const containerWidth = containerRef.current?.clientWidth || 1;
        const containerHeight = containerRef.current?.clientHeight || 1;

        const content = (
          <>
            <div
              className={`absolute rounded-full group ${
                point.isBlack ? "bg-black" : "bg-white"
              }`}
              style={{
                width: `${pos.circle.size}px`,
                height: `${pos.circle.size}px`,
                transform: "translate(-50%, -50%)",
                boxShadow: point.isBlack
                  ? CONFIG.BLACK_POINT_BOX_SHADOW
                  : CONFIG.WHITE_POINT_BOX_SHADOW,
                opacity: animationProgress,
                transition: CONFIG.BOX_SHADOW_TRANSITION,
              }}
            />
            <span
              className={`absolute whitespace-nowrap text-black ${
                point.isBlack ? "group-hover:font-bold" : ""
              }`}
              style={{
                left: "50%",
                top: "50%",
                transform: (() => {
                  const angle = pos.text.angle;
                  const distance = pos.text.distance + pos.circle.size / 2;
                  const rad = (angle * Math.PI) / 180;
                  const offsetX = Math.cos(rad) * distance;
                  const offsetY = Math.sin(rad) * distance;
                  return `translate(calc(-50% + ${offsetX + pos.text.x}px), calc(-50% + ${offsetY + pos.text.y}px)) scale(${pos.text.scale})`;
                })(),
                fontSize: point.isBlack
                  ? CONFIG.BLACK_POINT_FONT_SIZE
                  : CONFIG.WHITE_POINT_FONT_SIZE,
                opacity: animationProgress,
                transformOrigin: "center",
                willChange: "transform",
                fontWeight: pos.text.fontWeight,
              }}
              dangerouslySetInnerHTML={{ __html: point.label }}
            />
          </>
        );

        return (
          <div
            key={point.id}
            className="absolute"
            style={{
              left: `${
                (pos.circle.x / containerWidth) * CONFIG.PERCENTAGE_DIVISOR
              }%`,
              top: `${
                (pos.circle.y / containerHeight) * CONFIG.PERCENTAGE_DIVISOR
              }%`,
              transform: "translate(-50%, -50%)",
              zIndex: CONFIG.POINT_Z_INDEX,
              willChange: "left, top",
            }}
          >
            {point.isBlack && point.link ? (
              <a
                href={point.link}
                className="block cursor-pointer"
                style={{ cursor: "pointer" }}
              >
                {content}
              </a>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}

export default InteractivePoints;
