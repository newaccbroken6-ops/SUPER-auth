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

    // Noise points for organic shapes
    const noisePoints: { x: number; y: number; vx: number; vy: number }[] = [];
    const numPoints = 8;
    
    for (let i = 0; i < numPoints; i++) {
      noisePoints.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    // Calculate noise value at point
    const getNoiseValue = (x: number, y: number, t: number): number => {
      let value = 0;
      
      noisePoints.forEach((point, i) => {
        const dx = x - point.x;
        const dy = y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.sin(distance * 0.01 + t * 0.5 + i) * 100;
        value += influence / (distance * 0.05 + 1);
      });
      
      return value;
    };

    const animate = () => {
      time += 0.02;
      
      // Clear with black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update noise points
      noisePoints.forEach(point => {
        point.x += point.vx;
        point.y += point.vy;

        // Bounce off edges
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1;
      });

      // Draw contour lines
      const numLevels = 30;
      const spacing = 15;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let level = 0; level < numLevels; level++) {
        const threshold = level * spacing;
        
        ctx.beginPath();
        let started = false;

        // Sample grid
        const resolution = 8;
        for (let y = 0; y < canvas.height; y += resolution) {
          for (let x = 0; x < canvas.width; x += resolution) {
            const value = getNoiseValue(x, y, time);
            
            // Check if this point crosses the threshold
            const valueNext = getNoiseValue(x + resolution, y, time);
            const valueDown = getNoiseValue(x, y + resolution, time);
            
            if ((value < threshold && valueNext >= threshold) || 
                (value >= threshold && valueNext < threshold)) {
              // Horizontal crossing
              const t = (threshold - value) / (valueNext - value);
              const px = x + t * resolution;
              const py = y;
              
              if (!started) {
                ctx.moveTo(px, py);
                started = true;
              } else {
                ctx.lineTo(px, py);
              }
            }
            
            if ((value < threshold && valueDown >= threshold) || 
                (value >= threshold && valueDown < threshold)) {
              // Vertical crossing
              const t = (threshold - value) / (valueDown - value);
              const px = x;
              const py = y + t * resolution;
              
              if (!started) {
                ctx.moveTo(px, py);
                started = true;
              } else {
                ctx.lineTo(px, py);
              }
            }
          }
        }
        
        // Vary opacity based on level
        const opacity = 0.3 + (level % 3) * 0.15;
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.stroke();
      }

      // Add subtle cyan accent lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 2;
      
      for (let level = 5; level < numLevels; level += 10) {
        const threshold = level * spacing;
        
        ctx.beginPath();
        let started = false;

        const resolution = 8;
        for (let y = 0; y < canvas.height; y += resolution) {
          for (let x = 0; x < canvas.width; x += resolution) {
            const value = getNoiseValue(x, y, time);
            const valueNext = getNoiseValue(x + resolution, y, time);
            
            if ((value < threshold && valueNext >= threshold) || 
                (value >= threshold && valueNext < threshold)) {
              const t = (threshold - value) / (valueNext - value);
              const px = x + t * resolution;
              const py = y;
              
              if (!started) {
                ctx.moveTo(px, py);
                started = true;
              } else {
                ctx.lineTo(px, py);
              }
            }
          }
        }
        
        ctx.stroke();
      }

      // Add glow effect
      ctx.shadowColor = 'rgba(6, 182, 212, 0.3)';
      ctx.shadowBlur = 10;
      
      // Draw some highlighted contours
      for (let level = 10; level < numLevels; level += 15) {
        const threshold = level * spacing;
        
        ctx.beginPath();
        let started = false;

        const resolution = 8;
        for (let y = 0; y < canvas.height; y += resolution) {
          for (let x = 0; x < canvas.width; x += resolution) {
            const value = getNoiseValue(x, y, time);
            const valueNext = getNoiseValue(x + resolution, y, time);
            
            if ((value < threshold && valueNext >= threshold) || 
                (value >= threshold && valueNext < threshold)) {
              const t = (threshold - value) / (valueNext - value);
              const px = x + t * resolution;
              const py = y;
              
              if (!started) {
                ctx.moveTo(px, py);
                started = true;
              } else {
                ctx.lineTo(px, py);
              }
            }
          }
        }
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      
      ctx.shadowBlur = 0;

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
