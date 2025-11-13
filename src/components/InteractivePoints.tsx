import { useState, useEffect, useRef } from 'react';

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
  { id: 1, x: 66, y: 10, initialX: 50, initialY: 50, isBlack: false, label: 'Strategieberatung', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 2, x: 31, y: 26, initialX: 50, initialY: 50, isBlack: false, label: 'Netzwerkzugang', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 3, x: 57, y: 29, initialX: 50, initialY: 50, isBlack: false, label: 'Technologietransfer', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 4, x: 90.5, y: 38.5, initialX: 50, initialY: 50, isBlack: true, label: 'Lizenzpartner', initialScale: 0, hoverScale: 2, magneticRadius: 50, size: 64 },
  { id: 5, x: 20.8, y: 47.5, initialX: 50, initialY: 50, isBlack: true, label: 'Montage-partner', initialScale: 0, hoverScale: 2, magneticRadius: 50, size: 64 },
  { id: 6, x: 47, y: 53, initialX: 50, initialY: 50, isBlack: false, label: 'Lager & Logistik', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 7, x: 88, y: 69, initialX: 50, initialY: 50, isBlack: false, label: 'After sales', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 8, x: 91, y: 91, initialX: 50, initialY: 50, isBlack: false, label: 'Exklusivvertrieb', initialScale: 0, hoverScale: 1, magneticRadius: 20, size: 40 },
  { id: 9, x: 55, y: 93, initialX: 50, initialY: 50, isBlack: true, label: 'Distributionspartner', initialScale: 0, hoverScale: 2, magneticRadius: 50, size: 64 },
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
  { from: 3, to: 7, isBlack: false },
  { from: 4, to: 5, isBlack: true },
  { from: 4, to: 9, isBlack: true },
  { from: 5, to: 6, isBlack: false },
  { from: 5, to: 9, isBlack: true },
  { from: 5, to: 10, isBlack: false },
  { from: 6, to: 7, isBlack: false },
  { from: 6, to: 8, isBlack: false },
  { from: 6, to: 9, isBlack: false },
  { from: 7, to: 8, isBlack: false },
  { from: 7, to: 10, isBlack: false },
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

interface PointPosition {
  circle: { x: number; y: number; size: number };
  text: { x: number; y: number };
}

function InteractivePoints() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pointPositions, setPointPositions] = useState<Map<number, PointPosition>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setMousePos({ x, y });
        updatePointPositions(x, y);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const updatePointPositions = (cursorX: number, cursorY: number) => {
    const newPositions = new Map<number, PointPosition>();

    points.forEach(point => {
      const containerWidth = containerRef.current?.clientWidth || 1;
      const containerHeight = containerRef.current?.clientHeight || 1;

      const baseX = (point.x / 100) * containerWidth;
      const baseY = (point.y / 100) * containerHeight;
      const size = point.size ?? 20;
      const triggerDistance = size * 1.5;

      const distX = baseX - cursorX;
      const distY = baseY - cursorY;
      const hypotenuse = Math.sqrt(distX * distX + distY * distY);

      if (hypotenuse < triggerDistance) {
        const angle = Math.atan2(distX, distY);
        const pull = (1 - hypotenuse / triggerDistance) / 2;

        newPositions.set(point.id, {
          circle: {
            x: baseX - Math.sin(angle) * hypotenuse * pull,
            y: baseY - Math.cos(angle) * hypotenuse * pull,
            size: size * (1 + (1 - hypotenuse / triggerDistance) * 0.8),
          },
          text: {
            x: -Math.sin(angle) * hypotenuse * pull,
            y: -Math.cos(angle) * hypotenuse * pull,
          },
        });
      } else {
        newPositions.set(point.id, {
          circle: { x: baseX, y: baseY, size },
          text: { x: 0, y: 0 },
        });
      }
    });

    setPointPositions(newPositions);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} preserveAspectRatio="none">
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
              stroke={conn.isBlack ? '#000000' : '#FFFFFF'}
              strokeWidth="2"
              opacity="0.6"
            />
          );
        })}
      </svg>

      {points.map((point) => {
        const pos = pointPositions.get(point.id);
        if (!pos) return null;

        const containerWidth = containerRef.current?.clientWidth || 1;
        const containerHeight = containerRef.current?.clientHeight || 1;

        return (
          <div
            key={point.id}
            className="absolute"
            style={{
              left: `${(pos.circle.x / containerWidth) * 100}%`,
              top: `${(pos.circle.y / containerHeight) * 100}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
          >
            <div
              className={`absolute rounded-full transition-all ${
                point.isBlack ? 'bg-black' : 'bg-white'
              }`}
              style={{
                width: `${pos.circle.size}px`,
                height: `${pos.circle.size}px`,
                transform: 'translate(-50%, -50%)',
                boxShadow: point.isBlack ? 'none' : '0 0 20px rgba(255,255,255,0.3)',
              }}
            />
            <span
              className={`absolute font-semibold whitespace-nowrap ${
                point.isBlack ? 'text-black' : 'text-gray-700'
              }`}
              style={{
                right: `${pos.circle.size / 2 + 5}px`,
                top: '50%',
                transform: `translateY(-50%) translate(${pos.text.x}px, ${pos.text.y}px)`,
                transition: 'all 0.2s ease-out',
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
