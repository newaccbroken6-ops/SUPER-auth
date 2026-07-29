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

    // Gradient blob class
    class Blob {
      x: number;
      y: number;
      radius: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 300 + 200;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        
        const colors = [
          'rgba(6, 182, 212, 0.15)',    // cyan-500
          'rgba(59, 130, 246, 0.15)',   // blue-500
          'rgba(139, 92, 246, 0.15)',   // violet-500
          'rgba(168, 85, 247, 0.12)',   // purple-500
          'rgba(14, 165, 233, 0.12)',   // sky-500
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < -this.radius) this.x = canvas.width + this.radius;
        if (this.x > canvas.width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = canvas.height + this.radius;
        if (this.y > canvas.height + this.radius) this.y = -this.radius;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    // Create blobs
    const blobs: Blob[] = [];
    for (let i = 0; i < 5; i++) {
      blobs.push(new Blob());
    }

    // Animation loop
    const animate = () => {
      time += 0.01;
      
      // Clear with dark background
      ctx.fillStyle = 'rgb(3, 7, 18)'; // gray-950
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply blur for smooth effect
      ctx.filter = 'blur(80px)';

      // Update and draw blobs
      blobs.forEach(blob => {
        blob.update();
        blob.draw(ctx);
      });

      ctx.filter = 'none';

      // Add subtle wave overlay
      ctx.globalCompositeOperation = 'screen';
      const waveGradient = ctx.createLinearGradient(
        0, 
        Math.sin(time) * 100, 
        canvas.width, 
        canvas.height + Math.cos(time * 0.8) * 100
      );
      waveGradient.addColorStop(0, 'rgba(6, 182, 212, 0.03)');
      waveGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.02)');
      waveGradient.addColorStop(1, 'rgba(139, 92, 246, 0.03)');
      ctx.fillStyle = waveGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalCompositeOperation = 'source-over';

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
      style={{ 
        background: 'linear-gradient(135deg, rgb(3, 7, 18) 0%, rgb(15, 23, 42) 50%, rgb(3, 7, 18) 100%)'
      }}
    />
  );
}
