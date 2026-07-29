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

    const animate = () => {
      time += 0.01;
      
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (imageLoaded && imgRef.current) {
        // Calculate movement (slow pan)
        const moveX = Math.sin(time * 0.3) * 100;
        const moveY = Math.cos(time * 0.2) * 80;

        // Calculate scale (subtle zoom in/out)
        const scale = 1 + Math.sin(time * 0.15) * 0.1;

        // Calculate position to center and fill screen
        const imgAspect = imgRef.current.width / imgRef.current.height;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth, drawHeight, drawX, drawY;

        if (canvasAspect > imgAspect) {
          // Canvas is wider than image
          drawWidth = canvas.width * scale;
          drawHeight = drawWidth / imgAspect;
        } else {
          // Canvas is taller than image
          drawHeight = canvas.height * scale;
          drawWidth = drawHeight * imgAspect;
        }

        drawX = (canvas.width - drawWidth) / 2 + moveX;
        drawY = (canvas.height - drawHeight) / 2 + moveY;

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Apply slight rotation
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.sin(time * 0.1) * 0.02); // Subtle rotation
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        
        ctx.drawImage(imgRef.current, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();

        // Add animated overlay gradient
        const gradient = ctx.createRadialGradient(
          canvas.width / 2 + Math.cos(time * 0.5) * 200,
          canvas.height / 2 + Math.sin(time * 0.5) * 200,
          0,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.8
        );
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.1)');
        gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add pulsating vignette
        const vignette = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.2,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.8
        );
        const vignetteOpacity = 0.3 + Math.sin(time * 0.8) * 0.1;
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, `rgba(0, 0, 0, ${vignetteOpacity})`);
        
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Loading state - show gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, 'rgb(3, 7, 18)');
        gradient.addColorStop(0.5, 'rgb(15, 23, 42)');
        gradient.addColorStop(1, 'rgb(3, 7, 18)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

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
