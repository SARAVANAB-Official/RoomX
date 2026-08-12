import {
  Pencil,
  Eraser,
  Minus,
  ArrowRight,
  Square,
  Circle,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Download,
} from 'lucide-react';
import { WhiteboardOperation } from '@roomx/shared';

interface WhiteboardToolbarProps {
  activeTool: WhiteboardOperation;
  color: string;
  strokeWidth: number;
  onToolChange: (tool: WhiteboardOperation) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const TOOLS: { tool: WhiteboardOperation; icon: typeof Pencil; label: string }[] = [
  { tool: WhiteboardOperation.PEN, icon: Pencil, label: 'Pen' },
  { tool: WhiteboardOperation.ERASER, icon: Eraser, label: 'Eraser' },
  { tool: WhiteboardOperation.LINE, icon: Minus, label: 'Line' },
  { tool: WhiteboardOperation.ARROW, icon: ArrowRight, label: 'Arrow' },
  { tool: WhiteboardOperation.RECTANGLE, icon: Square, label: 'Rectangle' },
  { tool: WhiteboardOperation.CIRCLE, icon: Circle, label: 'Circle' },
  { tool: WhiteboardOperation.TEXT, icon: Type, label: 'Text' },
];

const COLORS = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function WhiteboardToolbar({
  activeTool,
  color,
  strokeWidth,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onClear,
  onExport,
  canUndo,
  canRedo,
}: WhiteboardToolbarProps) {
  return (
    <div className="glass-card !rounded-xl px-3 py-2 flex items-center gap-3 flex-wrap">
      {/* Tools */}
      <div className="flex items-center gap-1">
        {TOOLS.map(({ tool, icon: Icon, label }) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            title={label}
            className={`p-2 rounded-lg transition-colors ${
              activeTool === tool
                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                : 'text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Colors */}
      <div className="flex items-center gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-0 p-0"
          title="Custom color"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Stroke size */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={1}
          max={20}
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
          className="w-20 h-1 accent-indigo-500"
          title={`Stroke: ${strokeWidth}px`}
        />
        <span className="text-[10px] text-gray-500 w-6 text-center">{strokeWidth}</span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onClear}
          title="Clear canvas"
          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={onExport}
          title="Export as PNG"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
