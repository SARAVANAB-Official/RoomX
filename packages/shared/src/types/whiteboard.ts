export enum WhiteboardOperation {
  PEN = 'pen',
  ERASER = 'eraser',
  LINE = 'line',
  ARROW = 'arrow',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  TEXT = 'text',
  CLEAR = 'clear'
}

export interface WhiteboardState {
  operation: WhiteboardOperation;
  color: string;
  strokeWidth: number;
  points: Array<{ x: number; y: number }>;
  text?: string;
  fontSize?: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  userId: string;
  timestamp: Date;
  undoStack: WhiteboardState[];
  redoStack: WhiteboardState[];
}