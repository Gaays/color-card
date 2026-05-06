/**
 * 将HSL颜色值转换为HEX格式
 */
export const hslToHex = (h: number, s: number, l: number): string => {
  // 处理灰度色（饱和度0%的情况）
  if (s === 0) {
    const value = Math.round((l / 100) * 255);
    const hex = value.toString(16).padStart(2, "0");
    return `#${hex}${hex}${hex}`.toUpperCase();
  }

  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

/**
 * 根据背景色计算文字颜色（用于屏幕区域）
 */
export const getTextColor = (h: number, s: number, l: number): string => {
  if (l < 50) {
    return `hsla(${h}, 15%, 90%, 1)`;
  } else {
    return `hsla(${h}, 15%, 20%, 1)`;
  }
};

/**
 * 根据背景色计算面板内文字颜色
 * 面板自身叠加了 rgba(0,0,0,0.42) 的深色遮罩，实际亮度 = l * 0.58
 * 当混合后亮度 > 45% 时，面板仍偏浅，需用深色文字；否则用浅色文字
 */
export const getPanelTextColor = (h: number, s: number, l: number): string => {
  const blendedL = l * 0.58;
  if (blendedL > 45) {
    return `hsla(${h}, 20%, 12%, 0.9)`;
  }
  return `hsla(${h}, 10%, 93%, 0.95)`;
};

/**
 * 根据背景色计算面板内边框/线框颜色
 */
export const getPanelBorderColor = (h: number, s: number, l: number): string => {
  const blendedL = l * 0.58;
  if (blendedL > 45) {
    return `hsla(${h}, 15%, 10%, 0.3)`;
  }
  return `rgba(255, 255, 255, 0.22)`;
};

/**
 * 根据背景色计算按钮样式
 */
export const getButtonStyle = (h: number, s: number, l: number, textColor: string) => {
  // 根据背景色计算按钮样式
  const bgColor = 'hsla(0, 100%, 100%, 0.1)'

  return {
    backgroundColor: bgColor,
    color: textColor,
    border: `1px solid ${`hsla(${h}, 15%, 20%, 0.7)`}`,
  };
};

/**
 * 验证HEX颜色格式是否正确
 */
export const isValidHexColor = (hex: string): boolean => {
  const hexRegex = /^[0-9A-Fa-f]{6}$/;
  return hexRegex.test(hex);
};

/**
 * 将HEX颜色值转换为HSL格式
 */
export const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
  if (!isValidHexColor(hex)) return null;

  // 将HEX转换为RGB
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};