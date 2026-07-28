import React, { useEffect, useRef } from 'react';

const CursorFireworks = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let particles = [];

    // 设置 Canvas 大小为全屏
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 焰火粒子类
    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        // 随机角度与爆炸速度
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.size = Math.random() * 3 + 1; // 粒子大小
        this.alpha = 1; // 透明度
        this.decay = Math.random() * 0.02 + 0.015; // 消失速度

        // 五彩焰火颜色配置
        const colors = ['#ff0055', '#ffdd00', '#00ffcc', '#0099ff', '#ff00ff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // 重力效果
        this.alpha -= this.decay; // 逐渐透明
      }

      draw(context) {
        context.save();
        context.globalAlpha = Math.max(this.alpha, 0);
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.shadowBlur = 8;
        context.shadowColor = this.color; // 发光效果
        context.fill();
        context.restore();
      }
    }

    // 监听鼠标移动，生成粒子
    const handleMouseMove = (e) => {
      // 每次移动生成 3~5 个小火花粒子
      const particleCount = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(e.clientX, e.clientY));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 动画循环渲染
    const render = () => {
      // 使用半透明黑色清屏，打造拖尾余晖效果
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);

        // 移除不透明度归零的粒子
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // 清理事件和动画
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none', // 确保鼠标能穿透 Canvas 点击下方元素
        zIndex: 9999, // 浮于所有背景和 UI 之上
      }}
    />
  );
};

export default CursorFireworks;