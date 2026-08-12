import { useRef, useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { WhiteboardOperation } from '@roomx/shared';
import { useAuthStore } from '@/stores/useAuthStore';
import WhiteboardToolbar from './WhiteboardToolbar';

interface WhiteboardProps {
  socket: Socket | null;
}

type DrawingState = 'idle' | 'drawing' | 'dragging';

interface DrawOp {
  operation: WhiteboardOperation;
  color: string;
  strokeWidth: number;
  points: Array<{ x: number; y: number }>;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  text?: string;
}

export default function Whiteboard({ socket }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);

  const [activeTool, setActiveTool] = useState<WhiteboardOperation>(WhiteboardOperation.PEN);
  const [color, setColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [drawingState, setDrawingState] = useState<DrawingState>('idle');
  const [operations, setOperations] = useState<DrawOp[]>([]);
  const [undoStack, setUndoStack] = useState<DrawOp[]>([]);
  const [redoStack, setRedoStack] = useState<DrawOp[]>([]);
  const [currentOp, setCurrentOp] = useState<DrawOp | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const getCanvasPoint = (e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const drawOp = (ctx: CanvasRenderingContext2D, op: DrawOp) => {
    ctx.strokeStyle = op.operation === WhiteboardOperation.ERASER ? '#1a1a2e' : op.color;
    ctx.lineWidth = op.operation === WhiteboardOperation.ERASER ? op.strokeWidth * 3 : op.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (op.operation) {
      case 'pen':
      case 'eraser': {
        if (op.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(op.points[0].x, op.points[0].y);
        for (let i = 1; i < op.points.length; i++) {
          ctx.lineTo(op.points[i].x, op.points[i].y);
        }
        ctx.stroke();
        break;
      }
      case 'line': {
        ctx.beginPath();
        ctx.moveTo(op.startX, op.startY);
        ctx.lineTo(op.endX, op.endY);
        ctx.stroke();
        break;
      }
      case 'arrow': {
        const angle = Math.atan2(op.endY - op.startY, op.endX - op.startX);
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(op.startX, op.startY);
        ctx.lineTo(op.endX, op.endY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(op.endX, op.endY);
        ctx.lineTo(
          op.endX - headLen * Math.cos(angle - Math.PI / 6),
          op.endY - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(op.endX, op.endY);
        ctx.lineTo(
          op.endX - headLen * Math.cos(angle + Math.PI / 6),
          op.endY - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        break;
      }
      case 'rectangle': {
        ctx.beginPath();
        ctx.strokeRect(op.startX, op.startY, op.endX - op.startX, op.endY - op.startY);
        break;
      }
      case 'circle': {
        const rx = Math.abs(op.endX - op.startX) / 2;
        const ry = Math.abs(op.endY - op.startY) / 2;
        const cx = op.startX + (op.endX - op.startX) / 2;
        const cy = op.startY + (op.endY - op.startY) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'text': {
        if (!op.text) break;
        ctx.font = `${op.strokeWidth * 5 + 12}px sans-serif`;
        ctx.fillStyle = op.color;
        ctx.fillText(op.text, op.startX, op.startY);
        break;
      }
    }
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const op of operations) {
      drawOp(ctx, op);
    }

    if (currentOp) {
      drawOp(ctx, currentOp);
    }
  }, [operations, currentOp]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleRemoteOp = (op: DrawOp) => {
      setOperations((prev) => [...prev, op]);
    };

    const handleRemoteClear = () => {
      setOperations([]);
      setUndoStack([]);
      setRedoStack([]);
    };

    socket.on('whiteboard:operation', handleRemoteOp);
    socket.on('whiteboard:clear', handleRemoteClear);

    return () => {
      socket.off('whiteboard:operation', handleRemoteOp);
      socket.off('whiteboard:clear', handleRemoteClear);
    };
  }, [socket]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);

    if (activeTool === WhiteboardOperation.TEXT) {
      const text = prompt('Enter text:');
      if (text) {
        const op: DrawOp = {
          operation: WhiteboardOperation.TEXT,
          color,
          strokeWidth,
          points: [],
          startX: point.x,
          startY: point.y,
          endX: point.x,
          endY: point.y,
          text,
        };
        setOperations((prev) => [...prev, op]);
        setUndoStack((prev) => [...prev, op]);
        setRedoStack([]);
        socket?.emit('whiteboard:operation', op);
      }
      return;
    }

    setDrawingState('drawing');
    const op: DrawOp = {
      operation: activeTool,
      color,
      strokeWidth,
      points: [point],
      startX: point.x,
      startY: point.y,
      endX: point.x,
      endY: point.y,
    };
    setCurrentOp(op);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (drawingState !== 'drawing' || !currentOp) return;
    const point = getCanvasPoint(e);

    if (currentOp.operation === WhiteboardOperation.PEN || currentOp.operation === WhiteboardOperation.ERASER) {
      setCurrentOp((prev) =>
        prev
          ? { ...prev, points: [...prev.points, point] }
          : null
      );
    } else {
      setCurrentOp((prev) =>
        prev ? { ...prev, endX: point.x, endY: point.y } : null
      );
    }
  };

  const handleMouseUp = () => {
    if (drawingState !== 'drawing' || !currentOp) return;

    setOperations((prev) => [...prev, currentOp]);
    setUndoStack((prev) => [...prev, currentOp]);
    setRedoStack([]);
    socket?.emit('whiteboard:operation', currentOp);
    setCurrentOp(null);
    setDrawingState('idle');
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
    setOperations((prev) => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, last]);
    setOperations((prev) => [...prev, last]);
  };

  const handleClear = () => {
    setOperations([]);
    setUndoStack([]);
    setRedoStack([]);
    socket?.emit('whiteboard:clear');
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (activeTool === WhiteboardOperation.ERASER) {
      setActiveTool(WhiteboardOperation.PEN);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar */}
      <WhiteboardToolbar
        activeTool={activeTool}
        color={color}
        strokeWidth={strokeWidth}
        onToolChange={setActiveTool}
        onColorChange={handleColorChange}
        onStrokeWidthChange={setStrokeWidth}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
      />

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 rounded-xl overflow-hidden border border-white/10 cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="block w-full h-full"
        />
      </div>
    </div>
  );
}
