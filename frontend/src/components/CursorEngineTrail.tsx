import React, { useEffect, useRef } from 'react';

const CursorEngineTrail = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let particles = [];
    
    // 记录上一次鼠标位置，用于计算移动速度和角度
    let prevMouse = { x: 0, y: 0, time: Date.now() };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 尾焰粒子类
    class FlameParticle {
      constructor(x, y, angle, speed) {
        this.x = x;
        this.y = y;
        
        // 尾焰向鼠标移动的反方向喷射（带有小范围随机散射角）
        const spread = (Math.random() - 0.5) * 0.4; // 散射角度
        const plumeAngle = angle + Math.PI + spread; // 反方向 (angle + 180deg)
        const plumeSpeed = Math.random() * speed * 0.8 + 2; // 根据鼠标速度动态调整喷射力道

        this.vx = Math.cos(plumeAngle) * plumeSpeed;
        this.vy = Math.sin(plumeAngle) * plumeSpeed;

        this.size = Math.random() * 5 + 3; // 初始粒径
        this.alpha = 1;
        this.decay = Math.random() * 0.04 + 0.03; // 快速衰减，保持尾焰短促有力

        // 模拟尾焰颜色层级： core (白/青蓝) -> hot (黄/橙) -> smoke (红/深灰)
        const rand = Math.random();
        if (rand > 0.7) {
          this.color = '#ffffff'; // 高温核心（白色）
        } else if (rand > 0.4) {
          this.color = '#00f0ff'; // 离子蓝/青色尾焰
        } else if (rand > 0.15) {
          this.color = '#ff9900'; // 橙色火焰
        } else {
          this.color = '#ff0055'; // 尾端红晕
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.size *= 0.94; // 粒子喷出后迅速缩细（喷气收拢）
        this.alpha -= this.decay;
      }

      draw(context) {
        context.save();
        context.globalAlpha = Math.max(this.alpha, 0);
        context.beginPath();
        context.arc(this.x, this.y, Math.max(this.size, 0.1), 0, Math.PI * 2);
        
        // 强烈的加色发光效果（Glow Effect）
        context.fillStyle = this.color;
        context.shadowBlur = 10;
        context.shadowColor = this.color;
        
        context.fill();
        context.restore();
      }
    }

    const handleMouseMove = (e) => {
      const now = Date.now();
      const dt = Math.max(now - prevMouse.time, 1);
      
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      const distance = Math.hypot(dx, dy);

      // 计算鼠标移动的角度和速度
      if (distance > 2) {
        const moveAngle = Math.atan2(dy, dx);
        const moveSpeed = Math.min(distance / dt * 5, 12); // 限制最大喷射速度

        // 移动越快，生成的尾焰粒子越多
        const particleCount = Math.floor(moveSpeed * 1.5) + 2;
        for (let i = 0; i < particleCount; i++) {
          particles.push(new FlameParticle(e.clientX, e.clientY, moveAngle, moveSpeed));
        }
      }

      prevMouse = { x: e.clientX, y: e.clientY, time: now };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      // 开启叠加发光模式 (Lighten / Screen)，让尾焰重叠处产生高亮效果
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // 尾迹余晖渐隐
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter'; // 关键：高亮叠加模式

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);

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

export default CursorEngineTrail;