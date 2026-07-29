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

    // Floating orbs configuration (Windows 11 style)
    class FloatingOrb {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      radius: number;
      color: string;
      speed: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.targetX = this.x;
        this.targetY = this.y;
        this.radius = Math.random() * 200 + 150;
        
        const colors = [
          { r: 6, g: 182, b: 212, a: 0.15 },   // cyan
          { r: 59, g: 130, b: 246, a: 0.12 },  // blue
          { r: 139, g: 92, b: 246, a: 0.12 },  // violet
          { r: 168, g: 85, b: 247, a: 0.1 },   // purple
        ];
        const c = colors[Math.floor(Math.random() * colors.length)];
        this.color = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
        this.speed = 0.2 + Math.random() * 0.3;
        
        this.setNewTarget();
      }

      setNewTarget() {
        this.targetX = Math.random() * canvas.width;
        this.targetY = Math.random() * canvas.height;
      }

      update() {
        // Smooth movement towards target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 50) {
          this.setNewTarget();
        }

        this.x += dx * this.speed * 0.01;
        this.y += dy * this.speed * 0.01;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(
          this.x - this.radius,
          this.y - this.radius,
          this.radius * 2,
          this.radius * 2
        );
      }
    }

    // Create orbs
    const orbs: FloatingOrb[] = [];
    for (let i = 0; i < 6; i++) {
      orbs.push(new FloatingOrb());
    }

    const animate = () => {
      time += 0.01;
      
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (imageLoaded && imgRef.current) {
        // Calculate position to center and fill screen
        const imgAspect = imgRef.current.width / imgRef.current.height;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth, drawHeight, drawX, drawY;

        if (canvasAspect > imgAspect) {
          drawWidth = canvas.width;
          drawHeight = drawWidth / imgAspect;
        } else {
          drawHeight = canvas.height;
          drawWidth = drawHeight * imgAspect;
        }

        drawX = (canvas.width - drawWidth) / 2;
        drawY = (canvas.height - drawHeight) / 2;

        // Draw image (static, no movement)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.globalAlpha = 0.5; // Dim the background
        
        ctx.drawImage(imgRef.current, drawX, drawY, drawWidth, drawHeight);
        ctx.globalAlpha = 1;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
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

      // Apply blur for acrylic effect
      ctx.filter = 'blur(100px)';

      // Update and draw orbs
      orbs.forEach(orb => {
        orb.update();
        orb.draw(ctx);
      });

      ctx.filter = 'none';

      // Add noise texture overlay (Windows 11 acrylic effect)
      ctx.globalAlpha = 0.03;
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const brightness = Math.random() * 255;
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;

      // Add subtle animated light sweep (Windows 11 style)
      const sweepGradient = ctx.createLinearGradient(
        Math.cos(time * 0.3) * canvas.width,
        Math.sin(time * 0.3) * canvas.height,
        canvas.width + Math.cos(time * 0.3) * canvas.width,
        canvas.height + Math.sin(time * 0.3) * canvas.height
      );
      sweepGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sweepGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
      sweepGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = sweepGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Vignette effect
      const vignette = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.2,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.7
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      
      ctx.fillStyle = vignette;
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
