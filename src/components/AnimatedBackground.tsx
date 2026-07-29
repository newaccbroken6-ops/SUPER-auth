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

    // Wave class
    class Wave {
      amplitude: number;
      frequency: number;
      speed: number;
      yOffset: number;
      color: string;
      thickness: number;

      constructor(amplitude: number, frequency: number, speed: number, yOffset: number, color: string, thickness: number) {
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.speed = speed;
        this.yOffset = yOffset;
        this.color = color;
        this.thickness = thickness;
      }

      draw(ctx: CanvasRenderingContext2D, time: number) {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const points: { x: number; y: number }[] = [];
        
        for (let x = 0; x <= canvas.width; x += 5) {
          const y = 
            canvas.height / 2 + 
            this.yOffset +
            Math.sin((x * this.frequency + time * this.speed) * 0.01) * this.amplitude +
            Math.cos((x * this.frequency * 0.5 + time * this.speed * 1.2) * 0.01) * (this.amplitude * 0.5);
          
          points.push({ x, y });
        }

        // Draw smooth curve through points
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length - 2; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        // Last segment
        const lastIdx = points.length - 1;
        ctx.quadraticCurveTo(
          points[lastIdx - 1].x, 
          points[lastIdx - 1].y, 
          points[lastIdx].x, 
          points[lastIdx].y
        );
        
        ctx.stroke();
      }
    }

    // Create waves with different properties
    const waves = [
      new Wave(80, 0.5, 2, -150, 'rgba(255, 255, 255, 0.9)', 35),      // White thick
      new Wave(60, 0.7, -1.5, -50, 'rgba(200, 200, 200, 0.7)', 30),    // Light gray
      new Wave(100, 0.4, 1.8, 50, 'rgba(120, 120, 120, 0.5)', 40),     // Medium gray
      new Wave(70, 0.6, -2.2, 150, 'rgba(255, 255, 255, 0.3)', 25),    // White thin
      new Wave(90, 0.55, 1.3, -100, 'rgba(160, 160, 160, 0.4)', 28),   // Gray
      new Wave(85, 0.45, -1.7, 100, 'rgba(80, 80, 80, 0.6)', 32),      // Dark gray
      new Wave(75, 0.65, 2.5, 0, 'rgba(255, 255, 255, 0.15)', 20),     // White subtle
    ];

    // Animation loop
    const animate = () => {
      time += 1;
      
      // Clear with black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw all waves
      waves.forEach(wave => {
        wave.draw(ctx, time);
      });

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
