import { useState, useEffect } from 'react';

export function useDeviceDetect() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      // 1. 触摸点检测（最可靠）
      const hasTouch =
        'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0;

      // 2. UA 检测
      const ua = navigator.userAgent || '';
      const isMobileUA =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          ua
        );

      // 3. 兜底：小屏设备 + CSS pointer 能力
      const isCoarse =
        'matchMedia' in window &&
        window.matchMedia('(pointer: coarse)').matches;

      setIsMobile(hasTouch || isMobileUA || isCoarse);
    };

    check();

    // iPad / 平板可能旋转，监听 resize 兜底
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return { isMobile };
}
