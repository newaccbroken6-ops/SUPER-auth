import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Pattern configuration
    const patternSpacing = 150;
    const patternOffsetX = 75;
    const patternOffsetY = 75;

    // Draw LV-style monogram pattern
    const drawMonogram = (x: number, y: number, scale: number, opacity: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;

      // Draw "SN" letters (Super Nova) in LV style
      ctx.strokeStyle = '#06b6d4'; // cyan
      ctx.lineWidth = 2.5 * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Letter "S"
      ctx.beginPath();
      ctx.arc(-15 * scale, -5 * scale, 12 * scale, Math.PI * 0.7, Math.PI * 2.3, false);
      ctx.arc(-15 * scale, 5 * scale, 12 * scale, Math.PI * 0.3, Math.PI * 1.7, true);
      ctx.stroke();

      // Letter "N"
      ctx.beginPath();
      ctx.moveTo(5 * scale, -15 * scale);
      ctx.lineTo(5 * scale, 15 * scale);
      ctx.moveTo(5 * scale, -15 * scale);
      ctx.lineTo(20 * scale, 15 * scale);
      ctx.moveTo(20 * scale, -15 * scale);
      ctx.lineTo(20 * scale, 15 * scale);
      ctx.stroke();

      // Decorative circle around (like LV flower)
      ctx.strokeStyle = '#3b82f6'; // blue
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 30 * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Small decorative stars
      const drawStar = (sx: number, sy: number, size: number) => {
        ctx.fillStyle = '#8b5cf6'; // purple
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI / 2) * i;
          const x1 = sx + Math.cos(angle) * size;
          const y1 = sy + Math.sin(angle) * size;
          ctx.lineTo(x1, y1);
          const angle2 = (Math.PI / 2) * i + Math.PI / 4;
          const x2 = sx + Math.cos(angle2) * size * 0.4;
          const y2 = sy + Math.sin(angle2) * size * 0.4;
          ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fill();
      };

      drawStar(-35 * scale, -35 * scale, 5 * scale);
      drawStar(35 * scale, -35 * scale, 5 * scale);
      drawStar(-35 * scale, 35 * scale, 5 * scale);
      drawStar(35 * scale, 35 * scale, 5 * scale);

      ctx.restore();
    };

    // Animation loop
    const animate = () => {
      time += 0.02;
      
      // Clear with dark background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(3, 7, 18, 0.8)');
      gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.6)');
      gradient.addColorStop(1, 'rgba(3, 7, 18, 0.8)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate number of rows and columns
      const cols = Math.ceil(canvas.width / patternSpacing) + 2;
      const rows = Math.ceil(canvas.height / patternSpacing) + 2;

      // Draw repeating pattern
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Offset alternating rows (diamond pattern like LV)
          const offsetX = (row % 2) * patternOffsetX;
          const x = col * patternSpacing + offsetX - patternSpacing;
          const y = row * patternSpacing - patternSpacing;

          // Animate opacity based on distance from a moving point
          const centerX = canvas.width / 2 + Math.cos(time * 0.5) * canvas.width * 0.3;
          const centerY = canvas.height / 2 + Math.sin(time * 0.7) * canvas.height * 0.3;
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const maxDistance = Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2;
          const normalizedDistance = distance / maxDistance;

          // Pulsating opacity
          const baseOpacity = 0.15 + Math.sin(time * 2 + normalizedDistance * 5) * 0.1;
          const opacity = Math.max(0.05, Math.min(0.3, baseOpacity));

          // Gentle rotation animation
          const rotation = Math.sin(time + col * 0.3 + row * 0.3) * 0.1;

          // Scale animation
          const scale = 0.9 + Math.sin(time * 1.5 + normalizedDistance * 4) * 0.15;

          drawMonogram(x, y, scale, opacity, rotation);
        }
      }

      // Add moving highlight effect
      const highlightGradient = ctx.createRadialGradient(
        canvas.width / 2 + Math.cos(time * 0.8) * canvas.width * 0.4,
        canvas.height / 2 + Math.sin(time * 0.8) * canvas.height * 0.4,
        0,
        canvas.width / 2 + Math.cos(time * 0.8) * canvas.width * 0.4,
        canvas.height / 2 + Math.sin(time * 0.8) * canvas.height * 0.4,
        canvas.width * 0.4
      );
      highlightGradient.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
      highlightGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      
      ctx.fillStyle = highlightGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ background: '#000000' }}
    />
  );
}
