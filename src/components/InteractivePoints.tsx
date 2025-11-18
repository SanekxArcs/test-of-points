import React, { useState, useEffect, useRef } from "react";
import points from "../data/points";
import connections from "../data/connections";
import { INTERACTIVE_POINTS_CONFIG as CONFIG } from "../config/interactivePointsConfig";

interface IdleAnimationOptions {
  enabled?: boolean;
  distance?: number;
  duration?: number;
  delay?: number;
}

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
  textAlign?: 'left' | 'right';
  idleAnimation?: IdleAnimationOptions;
}

interface PointPosition {
  circle: { x: number; y: number; size: number };
  text: { x: number; y: number; scale: number; angle: number; distance: number; fontWeight: number };
}

type IdleStatus = 'disabled' | 'hovering' | 'transitioning' | 'idle';

const IDLE_DEFAULTS = {
  distance: 8,
  duration: 3000,
  delay: 0,
};

const IDLE_ACTIVATE_LERP = 0.02;
const IDLE_DEACTIVATE_LERP = 0.35;

const IDLE_STATUS_THRESHOLDS = {
  idle: 0.85,
  transitioning: 0.05,
};

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
const DEFAULT_VIEWPORT_WIDTH = BREAKPOINTS.xl;

const parseSizeValue = (
  size: string | number | undefined,
  viewportWidth: number
): number => {
  if (!size) return 50;
  if (typeof size === 'number') return size;

  const clampMatch = size.match(/clamp\(([^,]+),([^,]+),([^)]+)\)/);

  if (!clampMatch) {
    const pxMatches = size.match(/(\d+(?:\.\d+)?)px/g);
    if (pxMatches && pxMatches.length > 0) {
      const lastMatch = pxMatches[pxMatches.length - 1];
      return parseFloat(lastMatch);
    }
    return 50;
  }

  const [, minToken, midToken, maxToken] = clampMatch.map((token) => token.trim());

  const parsePx = (token: string) => {
    const match = token.match(/(-?\d+(?:\.\d+)?)px/);
    return match ? parseFloat(match[1]) : null;
  };

  const parseVw = (token: string) => {
    const match = token.match(/(-?\d+(?:\.\d+)?)vw/);
    return match ? parseFloat(match[1]) : null;
  };

  const minPx = parsePx(minToken) ?? 0;
  const midVw = parseVw(midToken);
  const maxPx = parsePx(maxToken) ?? minPx;

  if (midVw === null) {
    return Math.min(Math.max(minPx, maxPx), maxPx);
  }

  const midPx = (midVw / 100) * viewportWidth;
  return Math.min(Math.max(midPx, minPx), maxPx);
};

function InteractivePoints() {
  const [pointPositions, setPointPositions] = useState<
    Map<number, PointPosition>
  >(new Map());
  const [animationProgress, setAnimationProgress] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : DEFAULT_VIEWPORT_WIDTH
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const targetPositionsRef = useRef<Map<number, PointPosition>>(new Map());
  const animationFrameRef = useRef<number>();
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const idleActivationRef = useRef(0);
  const idleActivationFrameRef = useRef<number>();
  const targetUpdateFrameRef = useRef<number>();
  const [isHovering, setIsHovering] = useState(false);
  const hasIdleConfigured = React.useMemo(
    () => points.some((point) => point.idleAnimation && point.idleAnimation.enabled !== false),
    []
  );
  const [idleActivation, setIdleActivation] = useState(0);
  const [idleStatus, setIdleStatus] = useState<IdleStatus>(
    hasIdleConfigured ? 'transitioning' : 'disabled'
  );

  const updateTargetPositions = React.useCallback(
    (cursor: { x: number; y: number } | null, idleStrength: number, time: number) => {
      const newTargets = new Map<number, PointPosition>();

      points.forEach((point) => {
        const containerWidth = containerRef.current?.clientWidth || 1;
        const containerHeight = containerRef.current?.clientHeight || 1;

        const baseX = (point.x / CONFIG.PERCENTAGE_DIVISOR) * containerWidth;
        const baseY = (point.y / CONFIG.PERCENTAGE_DIVISOR) * containerHeight;
        const size = parseSizeValue(point.size, viewportWidth);
        const triggerDistance = size * CONFIG.TRIGGER_DISTANCE_MULTIPLIER;

        let idleOffsetX = 0;
        let idleOffsetY = 0;

        if (
          point.idleAnimation &&
          point.idleAnimation.enabled !== false &&
          idleStrength > IDLE_STATUS_THRESHOLDS.transitioning &&
          animationProgress === 1
        ) {
          const distance = point.idleAnimation.distance ?? IDLE_DEFAULTS.distance;
          const duration = point.idleAnimation.duration ?? IDLE_DEFAULTS.duration;
          const delay = point.idleAnimation.delay ?? IDLE_DEFAULTS.delay;
          const adjustedTime = Math.max(time - delay, 0);
          const loopProgress = duration > 0 ? (adjustedTime % duration) / duration : 0;
          const angle = loopProgress * Math.PI * 2;
          const easedStrength = idleStrength;
          idleOffsetX = Math.cos(angle) * distance * easedStrength;
          idleOffsetY = Math.sin(angle) * distance * easedStrength;
        }

        const idleX = baseX + idleOffsetX;
        const idleY = baseY + idleOffsetY;

        const pointerActive =
          !!cursor &&
          animationProgress === 1 &&
          (point as Point).magnifyOnHover !== false;

        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        const initialX = centerX + (idleX - centerX) * animationProgress;
        const initialY = centerY + (idleY - centerY) * animationProgress;

        if (pointerActive) {
          const distX = idleX - cursor!.x;
          const distY = idleY - cursor!.y;
          const hypotenuse = Math.sqrt(distX * distX + distY * distY);

          if (hypotenuse < triggerDistance) {
            const angle = Math.atan2(distX, distY);
            const pull =
              (1 - hypotenuse / triggerDistance) / CONFIG.PULL_FORCE_DIVISOR;
            const hoverIntensity = 1 - hypotenuse / triggerDistance;
            const textScale = point.isBlack && (point as Point).scaleOnHover !== false
              ? 1 + hoverIntensity * CONFIG.TEXT_SCALE_INTENSITY
              : 1;
            const circleScale = point.isBlack && (point as Point).scaleOnHover !== false
              ? 1 + (1 - hypotenuse / triggerDistance) * CONFIG.CIRCLE_SIZE_MULTIPLIER
              : 1;

            newTargets.set(point.id, {
              circle: {
                x: idleX - Math.sin(angle) * hypotenuse * pull,
                y: idleY - Math.cos(angle) * hypotenuse * pull,
                size: size * circleScale,
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
            return;
          }
        }

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
      });

      targetPositionsRef.current = newTargets;
    },
    [animationProgress, viewportWidth]
  );

  const updatePointerFromEvent = React.useCallback((event: { clientX: number; clientY: number }) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    pointerRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const handleMouseEnter = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    updatePointerFromEvent(event);
    setIsHovering(true);
  }, [updatePointerFromEvent]);

  const handleMouseMove = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    updatePointerFromEvent(event);
  }, [updatePointerFromEvent]);

  const handleMouseLeave = React.useCallback(() => {
    setIsHovering(false);
    pointerRef.current = null;
  }, []);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Continuously update target positions to account for idle animation and pointer changes
  useEffect(() => {
    const tick = () => {
      updateTargetPositions(pointerRef.current, idleActivationRef.current, performance.now());
      targetUpdateFrameRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (targetUpdateFrameRef.current) {
        cancelAnimationFrame(targetUpdateFrameRef.current);
      }
    };
  }, [updateTargetPositions]);

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
    if (!hasIdleConfigured) {
      idleActivationRef.current = 0;
      setIdleActivation(0);
      setIdleStatus('disabled');
      return;
    }

    const animateIdleActivation = () => {
      const target = isHovering ? 0 : 1;
      const lerpFactor = isHovering ? IDLE_DEACTIVATE_LERP : IDLE_ACTIVATE_LERP;
      let next = lerp(idleActivationRef.current, target, lerpFactor);

      if (Math.abs(next - target) < 0.001) {
        next = target;
      }

      if (next !== idleActivationRef.current) {
        idleActivationRef.current = next;
        setIdleActivation(next);
      }

      const resolvedStatus: IdleStatus = (() => {
        if (!hasIdleConfigured) return 'disabled';
        if (isHovering && next < IDLE_STATUS_THRESHOLDS.transitioning) {
          return 'hovering';
        }
        if (next > IDLE_STATUS_THRESHOLDS.idle) {
          return 'idle';
        }
        return 'transitioning';
      })();

      setIdleStatus((prev) => (prev === resolvedStatus ? prev : resolvedStatus));

      idleActivationFrameRef.current = requestAnimationFrame(animateIdleActivation);
    };

    idleActivationFrameRef.current = requestAnimationFrame(animateIdleActivation);

    return () => {
      if (idleActivationFrameRef.current) {
        cancelAnimationFrame(idleActivationFrameRef.current);
      }
    };
  }, [hasIdleConfigured, isHovering]);

  const hideStatus = false;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {hasIdleConfigured && hideStatus && (
        <div
          className="pointer-events-none absolute left-4 top-4 select-none rounded-md bg-black/60 px-3 py-1 text-xs font-medium text-white"
          style={{ zIndex: CONFIG.POINT_Z_INDEX + 1 }}
        >
          Idle status: {idleStatus}
          <span className="ml-2 opacity-70">{idleActivation.toFixed(2)}</span>
        </div>
      )}
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
              className={`absolute whitespace-nowrap text-black leading-none ${
                point.isBlack ? "group-hover:font-bold" : "cursor-default"
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
                textAlign: ((point as Point).textAlign || 'center') as React.CSSProperties['textAlign'],
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
