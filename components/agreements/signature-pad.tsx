"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export interface SignaturePadHandle {
  clear: () => void;
}

interface SignaturePadProps {
  onChange: (value: string | null) => void;
  disabled?: boolean;
  height?: number;
}

function getPointerPosition(
  canvas: HTMLCanvasElement,
  event: React.PointerEvent<HTMLCanvasElement>
) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ onChange, disabled = false, height = 180 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onChange(null);
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const ratio = window.devicePixelRatio || 1;
      const width = canvas.parentElement?.clientWidth ?? 600;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#0f172a";
      contextRef.current = ctx;
    }, [height]);

    const handlePointerDown = (
      event: React.PointerEvent<HTMLCanvasElement>
    ) => {
      if (disabled) return;
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;
      drawing.current = true;
      ctx.beginPath();
      const { x, y } = getPointerPosition(canvas, event);
      ctx.moveTo(x, y);
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (
      event: React.PointerEvent<HTMLCanvasElement>
    ) => {
      if (!drawing.current || disabled) return;
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;
      const { x, y } = getPointerPosition(canvas, event);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const handlePointerUp = (
      event: React.PointerEvent<HTMLCanvasElement>
    ) => {
      if (!drawing.current) return;
      drawing.current = false;
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;
      ctx.closePath();
      canvas.releasePointerCapture(event.pointerId);
      onChange(canvas.toDataURL("image/png"));
    };

    return (
      <canvas
        ref={canvasRef}
        className={`w-full rounded-lg border border-dashed border-gray-300 bg-white shadow-sm ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        aria-label="Signature pad"
      />
    );
  }
);
