import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Matrix rain characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`¥£€¢';
    const matrix = chars.split('');

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = [];

    // Initialize drops
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    // Glitch effect variables
    let glitchTime = 0;
    let nextGlitch = Math.random() * 200 + 100;

    // Binary rain in background
    const binaryColumns = Math.floor(columns / 3);
    const binaryDrops: number[] = [];
    for (let i = 0; i < binaryColumns; i++) {
      binaryDrops[i] = Math.random() * -50;
    }

    const animate = () => {
      // Semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add scanline effect
      ctx.fillStyle = 'rgba(0, 255, 0, 0.02)';
      ctx.fillRect(0, (Date.now() / 10) % canvas.height, canvas.width, 2);

      // Draw binary background
      ctx.fillStyle = 'rgba(0, 255, 100, 0.15)';
      ctx.font = `${fontSize - 4}px monospace`;
      for (let i = 0; i < binaryColumns; i++) {
        const binary = Math.random() > 0.5 ? '1' : '0';
        const x = i * fontSize * 3;
        const y = binaryDrops[i] * fontSize;
        ctx.fillText(binary, x, y);

        if (y > canvas.height && Math.random() > 0.98) {
          binaryDrops[i] = 0;
        }
        binaryDrops[i]++;
      }

      // Glitch effect
      glitchTime++;
      if (glitchTime > nextGlitch) {
        const glitchHeight = 3;
        const glitchY = Math.random() * canvas.height;
        
        // RGB split glitch
        const imageData = ctx.getImageData(0, glitchY, canvas.width, glitchHeight);
        ctx.putImageData(imageData, Math.random() * 10 - 5, glitchY);
        
        glitchTime = 0;
        nextGlitch = Math.random() * 200 + 100;
      }

      // Draw main matrix rain
      ctx.font = `bold ${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        // Random character
        const text = matrix[Math.floor(Math.random() * matrix.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Create gradient for each character (bright green to dark)
        const gradient = ctx.createLinearGradient(x, y - fontSize * 10, x, y);
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 255, 0, 0.8)');
        gradient.addColorStop(0.85, 'rgba(0, 255, 100, 1)');
        gradient.addColorStop(1, 'rgba(200, 255, 200, 1)'); // Bright head
        
        ctx.fillStyle = gradient;

        // Draw shadow for glow effect
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 8;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;

        // Add extra bright leading character
        if (Math.random() > 0.98) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 15;
          ctx.fillText(text, x, y);
          ctx.shadowBlur = 0;
        }

        // Reset drop to top randomly
        if (y > canvas.height && Math.random() > 0.95) {
          drops[i] = 0;
        }

        drops[i]++;
      }

      // Add random highlights
      if (Math.random() > 0.97) {
        const highlightX = Math.random() * canvas.width;
        const highlightY = Math.random() * canvas.height;
        ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
        ctx.fillRect(highlightX, highlightY, 2, 2);
      }

      // Add hacker text overlay (subtle)
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.font = 'bold 12px monospace';
      const hackerText = '> SUPER_NOVA_AUTH_SYSTEM';
      ctx.fillText(hackerText, 20, 30);

      // Add corner code snippets
      ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
      ctx.font = '10px monospace';
      const codeSnippets = [
        '$ auth --validate',
        '> License: OK',
        'HWID: LOCKED',
        'Status: ACTIVE'
      ];
      codeSnippets.forEach((line, i) => {
        ctx.fillText(line, canvas.width - 150, 20 + i * 15);
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
