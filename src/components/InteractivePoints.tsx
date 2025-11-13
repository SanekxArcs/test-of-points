import React, { useState, useEffect, useRef } from "react";

interface Point {
  id: number;
  x: number;
  y: number;
  isBlack: boolean;
  label: string;
  size?: number;
  link?: string;
}

const points: Point[] = [
  { id: 1, x: 65, y: 10, isBlack: false, label: "Strategieberatung", size: 58 },
  { id: 2, x: 30, y: 25.7, isBlack: false, label: "Netzwerkzugang", size: 58 },
  {
    id: 3,
    x: 56,
    y: 28.5,
    isBlack: false,
    label: "Technologietransfer",
    size: 58,
  },
  {
    id: 4,
    x: 88.2,
    y: 38.6,
    isBlack: true,
    label: "Lizenzpartner",
    size: 64,
    link: "/lizenzpartner",
  },
  {
    id: 5,
    x: 12.4,
    y: 47,
    isBlack: true,
    label: "Montage-partner",
    size: 64,
    link: "/montage-partner",
  },
  {
    id: 6,
    x: 45.5,
    y: 53.2,
    isBlack: false,
    label: "Lager & Logistik",
    size: 58,
  },
  { id: 7, x: 85.5, y: 69.3, isBlack: false, label: "After sales", size: 58 },
  {
    id: 8,
    x: 88.6,
    y: 91,
    isBlack: false,
    label: "Exklusivvertrieb",
    size: 58,
  },
  {
    id: 9,
    x: 53.5,
    y: 93.5,
    isBlack: true,
    label: "Distributionspartner",
    size: 64,
    link: "/distributionspartner",
  },
  {
    id: 10,
    x: 20,
    y: 79.5,
    isBlack: false,
    label: "Fortbildungsprogramme",
    size: 58,
  },
  { id: 11, x: 107, y: 17, isBlack: false, label: "", size: 58 },
  { id: 12, x: 103, y: 58, isBlack: false, label: "", size: 1 },
  { id: 13, x: 103, y: 73, isBlack: false, label: "", size: 1 },
  { id: 14, x: 111, y: 84, isBlack: false, label: "", size: 1 },
];

const connections = [
  { from: 1, to: 2, isBlack: false },
  { from: 1, to: 3, isBlack: false },
  { from: 1, to: 4, isBlack: false },
  { from: 2, to: 5, isBlack: false },
  { from: 2, to: 3, isBlack: false },
  { from: 3, to: 4, isBlack: false },
  { from: 3, to: 7, isBlack: false },
  { from: 5, to: 6, isBlack: false },
  { from: 5, to: 10, isBlack: false },
  { from: 6, to: 7, isBlack: false },
  { from: 6, to: 8, isBlack: false },
  { from: 6, to: 9, isBlack: false },
  { from: 7, to: 8, isBlack: false },
  { from: 7, to: 10, isBlack: false },
  { from: 8, to: 9, isBlack: false },
  { from: 10, to: 2, isBlack: false },
  { from: 11, to: 1, isBlack: false },
  { from: 11, to: 3, isBlack: false },
  { from: 12, to: 4, isBlack: false },
  { from: 12, to: 7, isBlack: false },
  { from: 13, to: 7, isBlack: false },
  { from: 13, to: 9, isBlack: false },
  { from: 14, to: 9, isBlack: false },
  { from: 9, to: 4, isBlack: true },
  { from: 5, to: 4, isBlack: true },
  { from: 9, to: 5, isBlack: true },
  { from: 9, to: 10, isBlack: false },
];

interface PointPosition {
  circle: { x: number; y: number; size: number };
  text: { x: number; y: number; scale: number };
}

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

        const baseX = (point.x / 100) * containerWidth;
        const baseY = (point.y / 100) * containerHeight;
        const size = point.size ?? 20;
        const triggerDistance = size * 1.5;

        const distX = baseX - cursorX;
        const distY = baseY - cursorY;
        const hypotenuse = Math.sqrt(distX * distX + distY * distY);

        // Apply initial animation interpolation
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        const initialX = centerX + (baseX - centerX) * animationProgress;
        const initialY = centerY + (baseY - centerY) * animationProgress;

        if (hypotenuse < triggerDistance && animationProgress === 1) {
          const angle = Math.atan2(distX, distY);
          const pull = (1 - hypotenuse / triggerDistance) / 2;
          const hoverIntensity = 1 - hypotenuse / triggerDistance;
          const textScale = point.isBlack ? 1 + hoverIntensity * 0.3 : 1;

          newTargets.set(point.id, {
            circle: {
              x: baseX - Math.sin(angle) * hypotenuse * pull,
              y: baseY - Math.cos(angle) * hypotenuse * pull,
              size: size * (1 + (1 - hypotenuse / triggerDistance) * 0.8),
            },
            text: {
              x: -Math.sin(angle) * hypotenuse * pull,
              y: -Math.cos(angle) * hypotenuse * pull,
              scale: textScale,
            },
          });
        } else {
          newTargets.set(point.id, {
            circle: {
              x: initialX,
              y: initialY,
              size: size * animationProgress,
            },
            text: { x: 0, y: 0, scale: 1 },
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
    const lerpFactor = 0.15; // Smoothness factor (lower = smoother but slower)
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
          },
        };

        // Check if position is significantly different
        const threshold = 0.5;
        if (
          Math.abs(newPos.circle.x - target.circle.x) > threshold ||
          Math.abs(newPos.circle.y - target.circle.y) > threshold ||
          Math.abs(newPos.circle.size - target.circle.size) > 0.1 ||
          Math.abs(newPos.text.scale - target.text.scale) > 0.01
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
    const duration = 1000; // 1.5 seconds
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
        style={{ zIndex: 1 }}
        preserveAspectRatio="none"
      >
        {connections.map((conn, idx) => {
          const fromPos = pointPositions.get(conn.from);
          const toPos = pointPositions.get(conn.to);
          if (!fromPos || !toPos) return null;

          const containerWidth = containerRef.current?.clientWidth || 1;
          const containerHeight = containerRef.current?.clientHeight || 1;

          const fromX = (fromPos.circle.x / containerWidth) * 100;
          const fromY = (fromPos.circle.y / containerHeight) * 100;
          const toX = (toPos.circle.x / containerWidth) * 100;
          const toY = (toPos.circle.y / containerHeight) * 100;

          return (
            <line
              key={idx}
              x1={`${fromX}%`}
              y1={`${fromY}%`}
              x2={`${toX}%`}
              y2={`${toY}%`}
              stroke={conn.isBlack ? "#000000" : "#FFFFFF"}
              strokeWidth="2"
              opacity={0.6 * animationProgress}
              style={{
                transition: "opacity 0.3s ease-out",
              }}
            />
          );
        })}
      </svg>
      ;
      {points.map((point) => {
        const pos = pointPositions.get(point.id);
        if (!pos) return null;

        const containerWidth = containerRef.current?.clientWidth || 1;
        const containerHeight = containerRef.current?.clientHeight || 1;

        const content = (
          <>
            <div
              className={`absolute rounded-full ${
                point.isBlack ? "bg-black" : "bg-white"
              }`}
              style={{
                width: `${pos.circle.size}px`,
                height: `${pos.circle.size}px`,
                transform: "translate(-50%, -50%)",
                boxShadow: point.isBlack
                  ? "none"
                  : "0 0 20px rgba(255,255,255,0.3)",
                opacity: animationProgress,
                transition: "box-shadow 0.3s ease-out",
              }}
            />
            <span
              className={`absolute whitespace-nowrap ${
                point.isBlack ? "text-black font-bold" : "text-black"
              }`}
              style={{
                right: `${pos.circle.size / 2 + 16}px`,
                top: "50%",
                transform: `translateY(-50%) translate(${pos.text.x}px, ${pos.text.y}px) scale(${pos.text.scale})`,
                fontSize: point.isBlack ? "22px" : "16px",
                opacity: animationProgress,
                transformOrigin: "right center",
                willChange: "transform",
              }}
            >
              {point.label}
            </span>
          </>
        );

        return (
          <div
            key={point.id}
            className="absolute"
            style={{
              left: `${(pos.circle.x / containerWidth) * 100}%`,
              top: `${(pos.circle.y / containerHeight) * 100}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
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
