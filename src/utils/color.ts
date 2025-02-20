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