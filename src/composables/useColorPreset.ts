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
      name: "暖阳黄",
      color: "hsl(40, 65%, 80%)",
      hue: 40,
      saturation: 65,
      lightness: 80,
      brightness: 50,
    },
    {
      name: "薄雾紫",
      color: "hsl(280, 60%, 85%)",
      hue: 280,
      saturation: 60,
      lightness: 85,
      brightness: 50,
    },
    {
      name: "碧空蓝",
      color: "hsl(200, 65%, 80%)",
      hue: 200,
      saturation: 65,
      lightness: 80,
      brightness: 50,
    },
    {
      name: "新芽绿",
      color: "hsl(120, 60%, 85%)",
      hue: 120,
      saturation: 60,
      lightness: 85,
      brightness: 50,
    },
  ]);

  const loadPresets = async () => {
    const saved = await getUserPreset()
    if (saved) {
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