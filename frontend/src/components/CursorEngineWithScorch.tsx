import React, { useEffect, useRef } from 'react';

const CursorEngineWithScorch = () => {
  const plumeCanvasRef = useRef(null);  // 上层：喷射尾焰 Canvas
  const scorchCanvasRef = useRef(null); // 下层：灼烧变黑 Canvas

  useEffect(() => {
    const plumeCanvas = plumeCanvasRef.current;
    const scorchCanvas = scorchCanvasRef.current;
    if (!plumeCanvas || !scorchCanvas) return;

    const plumeCtx = plumeCanvas.getContext('2d');
    const scorchCtx = scorchCanvas.getContext('2d');

    let animationFrameId;
    let particles = [];
    let scorchMarks = []; // 存放变黑痕迹的数组

    let prevMouse = { x: 0, y: 0, time: Date.now() };

    // 适应屏幕尺寸
    const resizeCanvas = () => {
      plumeCanvas.width = scorchCanvas.width = window.innerWidth;
      plumeCanvas.height = scorchCanvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 1. 尾焰粒子类
    class FlameParticle {
      constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        const spread = (Math.random() - 0.5) * 0.4;
        const plumeAngle = angle + Math.PI + spread;
        const plumeSpeed = Math.random() * speed * 0.8 + 2;

        this.vx = Math.cos(plumeAngle) * plumeSpeed;
        this.vy = Math.sin(plumeAngle) * plumeSpeed;
        this.size = Math.random() * 5 + 3;
        this.alpha = 1;
        this.decay = Math.random() * 0.04 + 0.03;

        const rand = Math.random();
        if (rand > 0.7) this.color = '#ffffff';      // 白色火焰核
        else if (rand > 0.4) this.color = '#00f0ff'; // 青蓝色
        else if (rand > 0.15) this.color = '#ff9900';// 橙色
        else this.color = '#ff0055';                 // 红色
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.size *= 0.94;
        this.alpha -= this.decay;
      }

      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(this.alpha, 0);
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(this.size, 0.1), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. 灼烧变黑痕迹类
    class ScorchMark {
      constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.alpha = 0.65; // 变黑的最高浓度（0.65 为半透明黑，不至于完全遮死背景）
        this.decay = 0.008; // 恢复速度：数值越小，黑印消失越慢
      }

      update() {
        this.alpha -= this.decay;
      }

      draw(ctx) {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;

        // 使用径向渐变，制造边缘羽化的熏黑效果
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');     // 中心纯黑
        gradient.addColorStop(0.6, 'rgba(10, 10, 10, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');     // 边缘自然过渡到透明

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
      }
    }

    // 监听鼠标移动
    const handleMouseMove = (e) => {
      const now = Date.now();
      const dt = Math.max(now - prevMouse.time, 1);
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 2) {
        const moveAngle = Math.atan2(dy, dx);
        const moveSpeed = Math.min((distance / dt) * 5, 12);

        // 生成喷射尾焰粒子
        const particleCount = Math.floor(moveSpeed * 1.5) + 2;
        for (let i = 0; i < particleCount; i++) {
          particles.push(new FlameParticle(e.clientX, e.clientY, moveAngle, moveSpeed));
        }

        // 生成痕迹：在尾焰经过的路径上留下黑色灼烧印记
        const scorchRadius = Math.min(distance * 0.8 + 15, 45); // 速度越快，熏黑范围稍大
        scorchMarks.push(new ScorchMark(e.clientX, e.clientY, scorchRadius));
      }

      prevMouse = { x: e.clientX, y: e.clientY, time: now };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 渲染主循环
    const render = () => {
      // --- 清空并绘制灼烧变黑层 ---
      scorchCtx.clearRect(0, 0, scorchCanvas.width, scorchCanvas.height);
      for (let i = scorchMarks.length - 1; i >= 0; i--) {
        const mark = scorchMarks[i];
        mark.update();
        mark.draw(scorchCtx);
        if (mark.alpha <= 0) {
          scorchMarks.splice(i, 1);
        }
      }

      // --- 清空并绘制尾焰喷射层 ---
      plumeCtx.globalCompositeOperation = 'destination-out';
      plumeCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      plumeCtx.fillRect(0, 0, plumeCanvas.width, plumeCanvas.height);
      plumeCtx.globalCompositeOperation = 'lighter'; // 发光模式

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(plumeCtx);
        if (p.alpha <= 0 || p.size <= 0.1) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* 下层 Canvas：用于渲染尾焰划过留下的黑色灼烧痕迹 */}
      <canvas
        ref={scorchCanvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9998,
        }}
      />
      {/* 上层 Canvas：用于渲染明亮的喷射尾焰粒子 */}
      <canvas
        ref={plumeCanvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
    </>
  );
};

export default CursorEngineWithScorch;