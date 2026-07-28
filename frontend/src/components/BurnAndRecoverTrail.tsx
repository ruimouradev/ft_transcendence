import React, { useEffect, useRef } from 'react';

const BurnAndRecoverTrail = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let flameParticles = []; // 阶段 1：升腾火焰粒子
    let scorchSpots = [];     // 阶段 2 & 3：灼烧黑痕及其还原过程

    let prevMouse = { x: 0, y: 0, time: Date.now() };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ==========================================
    // 1. 阶段 1：火焰燃烧粒子类 (Fire Particle)
    // ==========================================
    class FireParticle {
      constructor(x, y, moveAngle, speed) {
        this.x = x;
        this.y = y;

        // 向运动反方向喷射 + 向上升腾的火焰物理学
        const spread = (Math.random() - 0.5) * 0.6;
        const baseAngle = moveAngle + Math.PI + spread;
        const pSpeed = Math.random() * speed * 0.6 + 2;

        this.vx = Math.cos(baseAngle) * pSpeed;
        this.vy = Math.sin(baseAngle) * pSpeed - Math.random() * 2; // 加上向上的浮力

        this.size = Math.random() * 8 + 4;
        this.alpha = 1;
        this.decay = Math.random() * 0.05 + 0.03; // 快速燃烧完毕

        // 色彩梯度：白核 -> 亮黄 -> 燃橙 -> 暗红
        const r = Math.random();
        if (r > 0.7) this.color = '#ffffff';
        else if (r > 0.4) this.color = '#ffcc00';
        else if (r > 0.1) this.color = '#ff5500';
        else this.color = '#cc0000';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.size *= 0.92; // 火焰向上缩细
        this.alpha -= this.decay;
      }

      draw(context) {
        if (this.alpha <= 0) return;
        context.save();
        context.globalCompositeOperation = 'lighter'; // 发光高亮模式
        context.globalAlpha = Math.max(this.alpha, 0);
        context.beginPath();
        context.arc(this.x, this.y, Math.max(this.size, 0.1), 0, Math.PI * 2);
        context.fillStyle = this.color;
        context.shadowBlur = 12;
        context.shadowColor = this.color;
        context.fill();
        context.restore();
      }
    }

    // ==========================================
    // 2. 阶段 2 & 3：灼烧黑痕类 (Scorch Spot)
    // ==========================================
    class ScorchSpot {
      constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;

        // 阶段计时：
        // 0.0 ~ 0.2: 火焰烧灼延时 (Delay)
        // 0.2 ~ 0.5: 变黑沉淀 (Charring)
        // 0.5 ~ 1.0: 渐变还原 (Recovery)
        this.progress = 0;
        this.speed = 0.008; // 整体演变周期速度
      }

      update() {
        this.progress += this.speed;
      }

      draw(context) {
        if (this.progress < 0.1 || this.progress >= 1) return;

        let currentAlpha = 0;

        // 计算当前阶段的黑度 Alpha
        if (this.progress >= 0.1 && this.progress < 0.3) {
          // 阶段 2：火焰熄灭，迅速变黑
          currentAlpha = ((this.progress - 0.1) / 0.2) * 0.85;
        } else if (this.progress >= 0.3) {
          // 阶段 3：黑印慢慢褪去，渐变还原背景
          currentAlpha = (1 - (this.progress - 0.3) / 0.7) * 0.85;
        }

        context.save();
        context.globalAlpha = Math.max(currentAlpha, 0);

        // 径向熏黑渐变
        const gradient = context.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');   // 中心焦黑
        gradient.addColorStop(0.5, 'rgba(15, 10, 10, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');     // 边缘羽化

        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = gradient;
        context.fill();
        context.restore();
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
        const moveSpeed = Math.min((distance / dt) * 5, 15);

        // 1. 触发火焰粒子
        const count = Math.floor(moveSpeed * 1.5) + 3;
        for (let i = 0; i < count; i++) {
          flameParticles.push(new FireParticle(e.clientX, e.clientY, moveAngle, moveSpeed));
        }

        // 2. 触发黑痕演变记录点
        const radius = Math.min(distance * 0.7 + 18, 50);
        scorchSpots.push(new ScorchSpot(e.clientX, e.clientY, radius));
      }

      prevMouse = { x: e.clientX, y: e.clientY, time: now };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 主渲染循环
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 先画底层的黑印（演变 + 还原）
      for (let i = scorchSpots.length - 1; i >= 0; i--) {
        const spot = scorchSpots[i];
        spot.update();
        spot.draw(ctx);
        if (spot.progress >= 1) {
          scorchSpots.splice(i, 1);
        }
      }

      // 再覆盖上层的亮光火焰
      for (let i = flameParticles.length - 1; i >= 0; i--) {
        const p = flameParticles[i];
        p.update();
        p.draw(ctx);
        if (p.alpha <= 0 || p.size <= 0.1) {
          flameParticles.splice(i, 1);
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
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

export default BurnAndRecoverTrail;