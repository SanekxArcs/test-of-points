import { useState, useEffect, useRef } from 'react';

interface Point {
  id: number;
  x: number;
  y: number;
  initialX?: number;
  initialY?: number;
  isBlack: boolean;
  label: string;
  color?: string;
  initialScale?: number;
  hoverScale?: number;
  magneticRadius?: number;
  size?: number;
  link?: string;
}

const points: Point[] = [
  { id: 1, x: 66, y: 10, initialX: 50, initialY: 50, isBlack: false, label: 'Strategieberatung', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 2, x: 31, y: 26, initialX: 50, initialY: 50, isBlack: false, label: 'Netzwerkzugang', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 3, x: 57, y: 29, initialX: 50, initialY: 50, isBlack: false, label: 'Technologietransfer', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 4, x: 90.5, y: 38.5, initialX: 50, initialY: 50, isBlack: true, label: 'Lizenzpartner', initialScale: 0, hoverScale: 4, magneticRadius: 50, size: 64 },
  { id: 5, x: 20.8, y: 47.5, initialX: 50, initialY: 50, isBlack: true, label: 'Montage-partner', initialScale: 0, hoverScale: 4, magneticRadius: 50, size: 146 },
  { id: 6, x: 47, y: 53, initialX: 50, initialY: 50, isBlack: false, label: 'Lager & Logistik', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 7, x: 88, y: 69, initialX: 50, initialY: 50, isBlack: false, label: 'After sales', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 8, x: 91, y: 91, initialX: 50, initialY: 50, isBlack: false, label: 'Exklusivvertrieb', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 9, x: 55, y: 93, initialX: 50, initialY: 50, isBlack: true, label: 'Distributionspartner', initialScale: 0, hoverScale: 4, magneticRadius: 50, size: 64 },
  { id: 10, x: 20, y: 80, initialX: 50, initialY: 50, isBlack: false, label: 'Fortbildungsprogramme', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 11, x: 107, y: 17, initialX: 50, initialY: 50, isBlack: false, label: '1', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 12, x: 103, y: 58, initialX: 50, initialY: 50, isBlack: false, label: '2', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 1 },
  { id: 13, x: 103, y: 73, initialX: 50, initialY: 50, isBlack: false, label: '3', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 1 },
  { id: 14, x: 111, y: 84, initialX: 50, initialY: 50, isBlack: false, label: '4', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 1 },
];

const connections = [
  { from: 1, to: 2, isBlack: false },
  { from: 1, to: 3, isBlack: false },
  { from: 1, to: 4, isBlack: false },
  { from: 2, to: 5, isBlack: false },
  { from: 2, to: 3, isBlack: false },
  { from: 3, to: 4, isBlack: false },
  { from: 3, to: 6, isBlack: false },
  { from: 4, to: 5, isBlack: true },
  { from: 4, to: 9, isBlack: true },
  { from: 5, to: 6, isBlack: false },
  { from: 5, to: 9, isBlack: true },
  { from: 5, to: 10, isBlack: false },
  { from: 6, to: 7, isBlack: false },
  { from: 6, to: 8, isBlack: false },
  { from: 6, to: 9, isBlack: false },
  { from: 7, to: 8, isBlack: false },
  { from: 8, to: 9, isBlack: false },
  { from: 9, to: 10, isBlack: true },
  { from: 10, to: 2, isBlack: false },
  { from: 11, to: 1, isBlack: false },
  { from: 11, to: 3, isBlack: false },
  { from: 12, to: 4, isBlack: false },
  { from: 12, to: 7, isBlack: false },
  { from: 13, to: 7, isBlack: false },
  { from: 13, to: 9, isBlack: false },
  { from: 14, to: 9, isBlack: false },
];

function InteractivePoints() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsAnimated(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const calculateMagnification = (pointX: number, pointY: number, magneticRadius: number = 100) => {
    const distance = Math.sqrt(
      Math.pow(mousePos.x - pointX, 2) + Math.pow(mousePos.y - pointY, 2)
    );
    if (distance < magneticRadius) {
      return 1 + (1 - distance / magneticRadius) * 0.5;
    }
    return 1;
  };

  const calculateMagneticPull = (pointX: number, pointY: number, magneticRadius: number = 100) => {
    const distance = Math.sqrt(
      Math.pow(mousePos.x - pointX, 2) + Math.pow(mousePos.y - pointY, 2)
    );
    if (distance < magneticRadius && distance > 0) {
      const angle = Math.atan2(mousePos.y - pointY, mousePos.x - pointX);
      const pull = (1 - distance / magneticRadius) * 15;
      return {
        offsetX: Math.cos(angle) * pull,
        offsetY: Math.sin(angle) * pull,
      };
    }
    return { offsetX: 0, offsetY: 0 };
  };

  const handlePointClick = (link?: string) => {
    if (link) {
      console.log(`Navigating to: ${link}`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        {connections.map((conn, idx) => {
          const fromPoint = points.find(p => p.id === conn.from);
          const toPoint = points.find(p => p.id === conn.to);
          if (!fromPoint || !toPoint) return null;

          const fromX = isAnimated ? fromPoint.x : (fromPoint.initialX ?? fromPoint.x);
          const fromY = isAnimated ? fromPoint.y : (fromPoint.initialY ?? fromPoint.y);
          const toX = isAnimated ? toPoint.x : (toPoint.initialX ?? toPoint.x);
          const toY = isAnimated ? toPoint.y : (toPoint.initialY ?? toPoint.y);

          return (
            <line
              key={idx}
              x1={`${fromX}%`}
              y1={`${fromY}%`}
              x2={`${toX}%`}
              y2={`${toY}%`}
              stroke={conn.isBlack ? '#000000' : '#FFFFFF'}
              strokeWidth="2"
              opacity="0.6"
              style={{
                transition: isAnimated ? 'x1 0.6s ease-out, y1 0.6s ease-out, x2 0.6s ease-out, y2 0.6s ease-out' : 'none',
              }}
            />
          );
        })}
      </svg>

      {points.map((point) => {
        const containerWidth = containerRef.current?.clientWidth || 1;
        const containerHeight = containerRef.current?.clientHeight || 1;
        const pointX = (point.x / 100) * containerWidth;
        const pointY = (point.y / 100) * containerHeight;
        const magneticRadius = point.magneticRadius ?? 100;
        const magnification = calculateMagnification(pointX, pointY, magneticRadius);
        const magneticPull = calculateMagneticPull(pointX, pointY, magneticRadius);
        const isHovered = hoveredPoint === point.id;

        const initialScale = point.initialScale ?? 1;
        const hoverScale = point.hoverScale ?? 2;
        const baseScale = isHovered ? hoverScale : magnification;
        const animationScale = isAnimated ? 1 : initialScale;
        const finalScale = baseScale * animationScale;

        const currentX = isAnimated ? point.x : (point.initialX ?? point.x);
        const currentY = isAnimated ? point.y : (point.initialY ?? point.y);
        const size = point.size ?? 20;

        return (
          <div
            key={point.id}
            className="absolute"
            style={{
              left: `${currentX}%`,
              top: `${currentY}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              transition: isAnimated ? 'left 0.6s ease-out, top 0.6s ease-out' : 'none',
            }}
          >
            <button
              className={`absolute rounded-full transition-all duration-300 ${
                point.isBlack
                  ? 'bg-black hover:bg-gray-800'
                  : 'bg-white hover:bg-gray-100'
              } ${point.link ? 'cursor-pointer' : 'cursor-default'}`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${magneticPull.offsetX}px`,
                top: `${magneticPull.offsetY}px`,
                transform: `translate(-50%, -50%) scale(${finalScale})`,
                transition: 'transform 0.3s ease-out, left 0.1s ease-out, top 0.1s ease-out',
              }}
              onMouseEnter={() => setHoveredPoint(point.id)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={() => handlePointClick(point.link)}
              disabled={!point.link}
            />
            <span
              className={`absolute font-semibold whitespace-nowrap ${
                point.isBlack ? 'text-black' : 'text-gray-700'
              }`}
              style={{
                right: `${size + 15}px`,
                top: '50%',
                transform: `translateY(-50%) scale(${magnification})`,
                transition: 'transform 0.2s ease-out',
                fontSize: point.isBlack ? '14px' : '13px',
              }}
            >
              {point.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default InteractivePoints;
