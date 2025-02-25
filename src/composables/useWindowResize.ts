import { ref } from "vue";
import Taro from "@tarojs/taro";

export function useWindowResize() {
  const windowWidth = ref(0);
  const windowHeight = ref(0);
  // 屏幕方向
  const screenOrientation = ref("portrait");

  const init = () => {
    let height = 0
    let width = 0
    const windowInfo = Taro.getWindowInfo()
    height = windowInfo.windowHeight;
    width = windowInfo.windowWidth;
    setWindowInfo(height, width)

    Taro.onWindowResize((result) => {
      height = result.size.windowHeight;
      width = result.size.windowWidth;
      setWindowInfo(height, width)
    })
  }

  const setWindowInfo = (height, width) => {
    windowHeight.value = height;
    windowWidth.value = width;
    if (windowWidth.value > windowHeight.value) {
      screenOrientation.value = "landscape";
    } else {
      screenOrientation.value = "portrait";
    }
  }

  return {
    init,
    screenOrientation
  }
}