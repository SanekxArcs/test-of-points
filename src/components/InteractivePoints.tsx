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
  link?: string;
}

const points: Point[] = [
  { id: 1, x: 25, y: 15, initialX: 50, initialY: 50, isBlack: true, label: '01', initialScale: 0, hoverScale: 2, magneticRadius: 80, link: '/button1' },
  { id: 2, x: 45, y: 35, initialX: 50, initialY: 50, isBlack: true, label: '02', initialScale: 0, hoverScale: 2, magneticRadius: 80, link: '/button2' },
  { id: 3, x: 35, y: 60, initialX: 50, initialY: 50, isBlack: true, label: '03', initialScale: 0, hoverScale: 2, magneticRadius: 80, link: '/button3' },
  { id: 4, x: 60, y: 20, initialX: 50, initialY: 50, isBlack: false, label: '04', initialScale: 0, hoverScale: 1.5, magneticRadius: 100 },
  { id: 5, x: 70, y: 45, initialX: 50, initialY: 50, isBlack: false, label: '05', initialScale: 0, hoverScale: 1.5, magneticRadius: 100 },
  { id: 6, x: 50, y: 75, initialX: 50, initialY: 50, isBlack: false, label: '06', initialScale: 0, hoverScale: 1.5, magneticRadius: 100 },
  { id: 7, x: 80, y: 30, initialX: 50, initialY: 50, isBlack: false, label: '07', initialScale: 0, hoverScale: 1.5, magneticRadius: 100 },
  { id: 8, x: 30, y: 85, initialX: 50, initialY: 50, isBlack: false, label: '08', initialScale: 0, hoverScale: 1.5, magneticRadius: 100 },
  { id: 9, x: 65, y: 65, initialX: 50, initialY: 50, isBlack: false, label: '09', initialScale: 0, hoverScale: 1.5, magneticRadius: 100 },
  { id: 10, x: 20, y: 40, initialX: 50, initialY: 50, isBlack: false, label: '10', initialScale: 0, hoverScale: 1.5, magneticRadius: 100 },
];

const connections = [
  { from: 1, to: 2, isBlack: true },
  { from: 2, to: 3, isBlack: true },
  { from: 3, to: 1, isBlack: true },
  { from: 4, to: 5, isBlack: false },
  { from: 5, to: 9, isBlack: false },
  { from: 9, to: 6, isBlack: false },
  { from: 6, to: 8, isBlack: false },
  { from: 8, to: 10, isBlack: false },
  { from: 10, to: 4, isBlack: false },
  { from: 7, to: 4, isBlack: false },
  { from: 1, to: 10, isBlack: false },
  { from: 2, to: 5, isBlack: false },
  { from: 3, to: 6, isBlack: false },
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
                width: '20px',
                height: '20px',
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
              className={`absolute text-sm font-semibold whitespace-nowrap ${
                point.isBlack ? 'text-black' : 'text-white'
              }`}
              style={{
                right: '30px',
                top: '50%',
                transform: `translateY(-50%) scale(${magnification})`,
                transition: 'transform 0.2s ease-out',
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
