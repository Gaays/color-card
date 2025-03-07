import { ref } from "vue";
import Taro from "@tarojs/taro";
import type { ColorPreset } from "../types/color";
import { useFunction } from "../api/useFunction";
const { getUserPreset } = useFunction();

export function useColorPreset() {
  const presetList = ref<ColorPreset[]>([
    {
      name: "晨曦粉",
      color: "hsl(350, 70%, 85%)",
      hue: 350,
      saturation: 70,
      lightness: 85,
      brightness: 50,
    },
    {
      name: "幻夜紫",
      color: "hsl(271, 75%, 53%)",
      hue: 271,
      saturation: 75,
      lightness: 53,
      brightness: 50,
    },
    {
      name: "霓虹魅",
      color: "hsl(264, 89%, 52%)",
      hue: 264,
      saturation: 52,
      lightness: 85,
      brightness: 50,
    },
    {
      name: "晴空蓝",
      color: "hsl(219, 84%, 62%)",
      hue: 219,
      saturation: 84,
      lightness: 62,
      brightness: 50,
    },
    {
      name: "冰雾蓝",
      color: "hsl(187, 89%, 82%)",
      hue: 187,
      saturation: 89,
      lightness: 82,
      brightness: 50,
    },
    {
      name: "透肌白",
      color: "hsl(0, 0%, 100%)",
      hue: 0,
      saturation: 0,
      lightness: 100,
      brightness: 50,
    },
    {
      name: "金芒光",
      color: "hsl(54, 98%, 66%)",
      hue: 54,
      saturation: 98,
      lightness: 66,
      brightness: 50,
    },
    {
      name: "橘焰光",
      color: "hsl(17, 82%, 54%)",
      hue: 17,
      saturation: 82,
      lightness: 54,
      brightness: 50,
    },
    {
      name: "玫樱粉",
      color: "hsl(316, 100%, 50%)",
      hue: 316,
      saturation: 100,
      lightness: 50,
      brightness: 50,
    },
  ]);

  const loadPresets = async () => {
    const saved = await getUserPreset()
    if (saved.length) {
      try {
        presetList.value = saved;
      } catch (e) {
        console.error("Failed to load presets:", e);
      }
    }
  };

  const addPreset = (newPreset: ColorPreset) => {
    // 仅能存颜色、屏幕亮度不同的预设
    if (
      presetList.value.find(
        (preset) =>
          preset.color === newPreset.color &&
          preset.brightness === newPreset.brightness
      )
    ) {
      Taro.showToast({
        title: "颜色已存在",
        icon: "none",
        duration: 2000,
      });
      return false;
    }

    presetList.value.push(newPreset);
    Taro.vibrateShort({ type: "light" });
    return true;
  };

  // 删除预设，至少保留一个预设
  const deletePreset = (index: number) => {
    if (presetList.value.length === 1) {
      Taro.showToast({
        title: "预设列表不能为空",
        icon: "none",
        duration: 2000,
      });
      return
    };
    presetList.value.splice(index, 1);
  };

  return {
    presetList,
    loadPresets,
    addPreset,
    deletePreset,
  };
}