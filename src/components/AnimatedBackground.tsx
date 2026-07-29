import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let imageLoaded = false;

    // Load background image
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => {
      imageLoaded = true;
      imgRef.current = img;
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Wave configuration
    class Wave {
      amplitude: number;
      frequency: number;
      speed: number;
      yOffset: number;
      colors: string[];
      blur: number;

      constructor(amplitude: number, frequency: number, speed: number, yOffset: number, colors: string[], blur: number) {
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.speed = speed;
        this.yOffset = yOffset;
        this.colors = colors;
        this.blur = blur;
      }

      draw(ctx: CanvasRenderingContext2D, time: number) {
        ctx.save();
        ctx.filter = `blur(${this.blur}px)`;
        
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        this.colors.forEach((color, i) => {
          gradient.addColorStop(i / (this.colors.length - 1), color);
        });

        ctx.beginPath();
        ctx.moveTo(0, canvas.height);

        // Create wave path
        for (let x = 0; x <= canvas.width; x += 5) {
          const y = 
            canvas.height / 2 + 
            this.yOffset +
            Math.sin((x * this.frequency + time * this.speed) * 0.01) * this.amplitude +
            Math.cos((x * this.frequency * 0.7 + time * this.speed * 0.8) * 0.008) * (this.amplitude * 0.6);
          
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
      }
    }

    // Create multiple wave layers
    const waves = [
      new Wave(
        120, 0.4, 1.5, 200,
        ['rgba(6, 182, 212, 0.3)', 'rgba(14, 165, 233, 0.2)', 'rgba(6, 182, 212, 0.3)'],
        40
      ),
      new Wave(
        100, 0.5, -1.2, 100,
        ['rgba(59, 130, 246, 0.25)', 'rgba(37, 99, 235, 0.15)', 'rgba(59, 130, 246, 0.25)'],
        35
      ),
      new Wave(
        140, 0.35, 1.8, 0,
        ['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.15)', 'rgba(139, 92, 246, 0.2)'],
        45
      ),
      new Wave(
        90, 0.6, -2, -100,
        ['rgba(6, 182, 212, 0.15)', 'rgba(8, 145, 178, 0.1)', 'rgba(6, 182, 212, 0.15)'],
        30
      ),
    ];

    const animate = () => {
      time += 1;
      
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (imageLoaded && imgRef.current) {
        // Calculate movement (slow pan)
        const moveX = Math.sin(time * 0.003) * 50;
        const moveY = Math.cos(time * 0.002) * 40;

        // Calculate scale (subtle zoom in/out)
        const scale = 1 + Math.sin(time * 0.0015) * 0.05;

        // Calculate position to center and fill screen
        const imgAspect = imgRef.current.width / imgRef.current.height;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth, drawHeight, drawX, drawY;

        if (canvasAspect > imgAspect) {
          drawWidth = canvas.width * scale;
          drawHeight = drawWidth / imgAspect;
        } else {
          drawHeight = canvas.height * scale;
          drawWidth = drawHeight * imgAspect;
        }

        drawX = (canvas.width - drawWidth) / 2 + moveX;
        drawY = (canvas.height - drawHeight) / 2 + moveY;

        // Draw image with smooth scaling and dimming
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.globalAlpha = 0.6; // Dim the background image
        
        ctx.drawImage(imgRef.current, drawX, drawY, drawWidth, drawHeight);
        ctx.globalAlpha = 1;

        // Add dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Loading state
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgb(3, 7, 18)');
        gradient.addColorStop(0.5, 'rgb(15, 23, 42)');
        gradient.addColorStop(1, 'rgb(3, 7, 18)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw waves
      waves.forEach(wave => {
        wave.draw(ctx, time);
      });

      // Add animated particles/dots
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      for (let i = 0; i < 30; i++) {
        const x = (Math.sin(time * 0.01 + i) * canvas.width / 2) + canvas.width / 2;
        const y = (Math.cos(time * 0.008 + i * 0.5) * canvas.height / 2) + canvas.height / 2;
        const size = Math.sin(time * 0.05 + i) * 2 + 2;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add glow effect at center
      const centerGlow = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.5
      );
      centerGlow.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      centerGlow.addColorStop(0.5, 'rgba(59, 130, 246, 0.04)');
      centerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = centerGlow;
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
