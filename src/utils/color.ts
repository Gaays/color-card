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
 * 根据背景色计算文字颜色
 */
export const getTextColor = (h: number, s: number, l: number): string => {
  // 根据背景色的亮度决定文字颜色
  if (l < 50) {
    // 深色背景使用柔和的浅色文字
    return `hsla(${h}, 15%, 90%, 1)`;
  } else {
    // 浅色背景使用柔和的深色文字
    return `hsla(${h}, 15%, 20%, 1)`;
  }
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