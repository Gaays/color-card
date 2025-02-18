<script setup lang="ts">
import { ref, computed } from "vue";
import { nextTick, useReady } from "@tarojs/taro";
import Taro from "@tarojs/taro";

type ColorPreset = {
  index: number;
  name: string;
  color: string;
  hue: number;
  saturation: number;
  lightness: number;
  brightness: number;
  removable?: boolean;
};

const presetList = ref<ColorPreset[]>([
  {
    index: 1,
    name: "纯白",
    color: "hsla(0, 0%, 100%, 1)",
    hue: 0,
    saturation: 0,
    lightness: 100,
    brightness: 50,
    removable: false,
  },
  {
    index: 2,
    name: "中性灰",
    color: "hsla(0, 0%, 50%, 1)",
    hue: 0,
    saturation: 0,
    lightness: 50,
    brightness: 50,
    removable: false,
  },
  {
    index: 3,
    name: "鲜艳红",
    color: "hsla(0, 100%, 50%, 1)",
    hue: 0,
    saturation: 100,
    lightness: 50,
    brightness: 50,
    removable: true,
  },
]);

const newPresetName = ref("");
const activePreset = ref("");
const activeData = ref<ColorPreset>({
  index: 2,
  name: "中性灰",
  color: "hsla(0, 0%, 50%, 1)",
  hue: 0,
  saturation: 0,
  lightness: 100,
  brightness: 50,
  removable: false,
});
const backgroundColor = ref("hsla(0, 100%, 50%, 1)");
const hueValue = ref(0);
const saturationValue = ref(100);
const lightness = ref(100);
const brightness = ref(50);
const hidden = ref(false);
const lock = ref(false);

const handleOptionBoxVisible = () => {
  console.log(lock.value);
  if (!lock.value) {
    hidden.value = !hidden.value;
    Taro.vibrateShort({ type: "light" });
  } else {
    Taro.showToast({
      title: "已锁定，请长按解锁",
      icon: "none",
      duration: 2000,
    });
    Taro.vibrateShort({ type: "medium" });
  }
};

const handleLock = () => {
  lock.value = !lock.value;
  Taro.vibrateShort({ type: "heavy" });
  if (lock.value) {
    Taro.showToast({
      title: "已锁定",
      icon: "none",
      duration: 2000,
    });
  } else {
    Taro.showToast({
      title: "已解锁",
      icon: "none",
      duration: 2000,
    });
  }
};

// 修改后的HEX计算逻辑
const hexColor = computed(() => {
  const hsla = backgroundColor.value.match(/(\d+(\.\d+)?)/g)?.map(Number) || [
    0, 100, 50, 1,
  ];
  return hslToHex(hsla[0], hsla[1], hsla[2]);
});

const loadPresets = () => {
  const saved = Taro.getStorageSync("colorPresets");
  if (saved) {
    try {
      presetList.value = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load presets:", e);
    }
    selectPreset(presetList.value[0]);
  } else {
    selectPreset(presetList.value[1]);
  }
};

const savePresets = () => {
  Taro.setStorageSync("colorPresets", JSON.stringify(presetList.value));
};

const hslToHex = (h: number, s: number, l: number) => {
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

const updateBackgroundColor = (event?: Event, type?: string) => {
  if (event) {
    activePreset.value = "";
    newPresetName.value = "";
    const selectValue = event.detail.value;
    const value = selectValue < 0 ? 0 : selectValue > 100 ? 100 : selectValue;
    if (type === "color") {
      if (selectValue <= 0) {
        hueValue.value = 0;
      } else if (selectValue <= 360) {
        hueValue.value = selectValue;
      } else {
        hueValue.value = 360;
      }
    } else if (type === "lightness") {
      lightness.value = value;
    } else if (type === "saturation") {
      saturationValue.value = value;
    }
  }

  backgroundColor.value = `hsl(${hueValue.value}, ${saturationValue.value}%, ${lightness.value}%)`;
  Taro.setNavigationBarColor({
    frontColor: "#000000",
    backgroundColor: hexColor.value,
    animation: {
      duration: 200,
      timingFunc: "easeInOut",
    },
  });
};

// 修改屏幕亮度
const updateScreenBrightness = (event: Event) => {
  const selectValue = event.detail.value;
  const value = selectValue < 0 ? 0 : selectValue > 100 ? 100 : selectValue;
  brightness.value = value;
  Taro.setScreenBrightness({ value: value / 100 });
};

const selectPreset = (preset: ColorPreset) => {
  activeData.value = preset;
  hueValue.value = preset.hue;
  lightness.value = preset.lightness;
  saturationValue.value = preset.saturation;
  brightness.value = preset.brightness;
  updateBackgroundColor();

  Taro.setScreenBrightness({ value: brightness.value / 100 });

  activePreset.value = preset.color;
  newPresetName.value = preset.name;
  Taro.vibrateShort({ type: "light" });
};

const addPreset = () => {
  const newPreset: ColorPreset = {
    index: presetList.value.length,
    name: newPresetName.value || `预设${presetList.value.length + 1}`,
    color: backgroundColor.value,
    hue: hueValue.value,
    saturation: saturationValue.value,
    lightness: lightness.value,
    brightness: brightness.value,
    removable: true,
  };

  presetList.value.push(newPreset);
  newPresetName.value = "";
  activePreset.value = "";
  savePresets();
  Taro.vibrateShort({ type: "light" });
};

const deletePreset = (index: number) => {
  presetList.value.splice(index, 1);
  savePresets();
};

const textColor = computed(() => {
  const hsla = backgroundColor.value.match(/(d+(.d+)?)/g)?.map(Number) || [
    0, 100, 50, 1,
  ];
  const [h, s, l] = hsla;

  // 根据背景色的亮度决定文字颜色
  if (l < 50) {
    // 深色背景使用柔和的浅色文字
    return `hsla(${h}, 15%, 90%, 1)`;
  } else {
    // 浅色背景使用柔和的深色文字
    return `hsla(${h}, 15%, 20%, 1)`;
  }
});

const buttonStyle = computed(() => {
  const hsla = backgroundColor.value.match(/(d+(.d+)?)/g)?.map(Number) || [
    0, 100, 50, 1,
  ];
  const [h, s, l] = hsla;

  // 根据背景色计算按钮样式
  const bgOpacity = l < 50 ? 0.2 : 0.15;
  const bgColor =
    l < 50
      ? `hsla(${h}, 15%, 90%, ${bgOpacity})`
      : `hsla(${h}, 15%, 20%, ${bgOpacity})`;

  return {
    backgroundColor: bgColor,
    color: textColor.value,
  };
});

const gradientStyle = computed(() => ({
  "--hue": String(hueValue.value),
  "--saturation": `${saturationValue.value}%`,
  "--lightness": `${lightness.value}%`,
}));

const cameraFlag = ref(false);
const cameraVisible = ref(false);
const handleCamera = () => {
  cameraFlag.value = !cameraFlag.value;
  Taro.vibrateShort({ type: "light" });

  if (!cameraFlag.value) {
    setTimeout(() => {
      cameraVisible.value = false;
    }, 600);
  } else {
    setTimeout(() => {
      cameraVisible.value = true;
    }, 500);
  }
};

const cameraError = () => {
  Taro.showToast({
    title: "无摄像头权限",
    icon: "none",
    duration: 2000,
  });

  Taro.getSetting({
    success: function (res) {
      if (!res.authSetting["scope.camera"]) {
        Taro.authorize({
          scope: "scope.camera",
          success: function () {
            Taro.createCameraContext();
          },
        });
      }
    },
  });
};

useReady(async () => {
  const systemBrightness = await Taro.getScreenBrightness();
  brightness.value = systemBrightness.value;
  Taro.setNavigationBarTitle({
    title: "",
  });
  loadPresets();
});
</script>

<template>
  <view
    :class="['color-card', { hidden: hidden }]"
    :style="[{ 'background-color': backgroundColor }, gradientStyle]"
  >
    <button
      title="摄像头"
      :style="buttonStyle"
      class="add-button camera"
      :class="{ flipped: cameraFlag }"
      @tap="handleCamera"
    >
      <view class="camera-front">
        <image
          :style="[{ width: '30px', height: '30px' }]"
          src="/src/assets/svg/camera.svg"
          class="camera-icon"
        />
      </view>
    </button>
    <view
      class="add-button camera-back"
      :style="buttonStyle"
      :class="{ flipped: cameraFlag }"
      @tap.stop="handleCamera"
    >
      <camera
        v-if="cameraVisible"
        devicePosition="front"
        class="camera-vision"
        @Error="cameraError"
      />
    </view>

    <view :class="['options-box']" :style="buttonStyle">
      <view class="color-header">
        <view class="color-input-group">
          <input
            type="text"
            class="hex-input"
            readonly
            :value="hexColor"
            :style="{ color: textColor }"
          />
          <input
            type="text"
            class="name-input"
            v-model="newPresetName"
            placeholder="预设名称"
            :placeholder-style="`color:${textColor}`"
            :style="{ color: textColor }"
          />
          <button
            class="add-button"
            @tap="addPreset"
            title="添加当前颜色到预设"
            :style="buttonStyle"
          >
            添加到预设
          </button>
        </view>
      </view>

      <view class="preset-container">
        <view class="preset-box">
          <view
            v-for="(item, index) in presetList"
            :key="index"
            class="preset-item"
            :class="{ selected: item.color === activePreset }"
            @tap="selectPreset(item)"
          >
            <view
              class="preset-item-color"
              :style="{ backgroundColor: item.color }"
            ></view>
            <view class="preset-item-name" :style="{ color: textColor }">{{
              item.name
            }}</view>
            <view
              class="delete-button"
              :style="{ color: textColor }"
              @tap.stop="deletePreset(index)"
              >x</view
            >
          </view>
        </view>
      </view>

      <view class="control-group">
        <view class="color-scroll-box">
          <slider
            :min="-15"
            :max="365"
            :step="1"
            :block-size="28"
            :value="hueValue"
            trackSize="20"
            activeColor="transparent"
            class="color-slider slider"
            @changing="(e) => updateBackgroundColor(e, 'color')"
            @change="(e) => updateBackgroundColor(e, 'color')"
          />
        </view>

        <view class="saturation-scroll-box">
          <text class="section__title" :style="{ color: textColor }"
            >饱和度</text
          >
          <slider
            :min="-5"
            :max="105"
            :step="1"
            :block-size="28"
            :value="saturationValue"
            trackSize="20"
            activeColor="transparent"
            class="saturation-slider slider"
            @changing="(e) => updateBackgroundColor(e, 'saturation')"
            @change="(e) => updateBackgroundColor(e, 'saturation')"
          />
        </view>

        <view class="lightness-scroll-box">
          <text class="section__title" :style="{ color: textColor }">明度</text>
          <slider
            :min="-5"
            :max="105"
            :step="1"
            activeColor="transparent"
            :value="lightness"
            class="lightness-slider slider"
            @changing="(e) => updateBackgroundColor(e, 'lightness')"
            @change="(e) => updateBackgroundColor(e, 'lightness')"
          />
        </view>

        <view class="brightness-scroll-box">
          <text class="section__title" :style="{ color: textColor }"
            >显示亮度</text
          >
          <slider
            :min="-5"
            :max="105"
            :step="1"
            activeColor="transparent"
            :value="brightness"
            class="brightness-slider slider"
            @changing="updateScreenBrightness"
            @change="updateScreenBrightness"
          />
        </view>
      </view>
    </view>
    <view class="btn-group">
      <button
        class="add-button hide-btn"
        :style="buttonStyle"
        @tap="handleOptionBoxVisible"
        @longpress="handleLock"
      >
        <image
          v-if="lock"
          :style="[
            {
              width: '20px',
              height: '20px',
              fill: textColor,
              color: textColor,
            },
          ]"
          src="/src/assets/svg/lock.svg"
          class="camera-icon"
        />{{ hidden ? "显示" : "隐藏" }}
      </button>
    </view>
  </view>
</template>

<style lang="scss">
.color-card {
  height: 100vh;
  width: 100vw;
  position: fixed;
  background-size: cover;
  /*设置了背景图铺满整个容器*/
  background-repeat: no-repeat;
  /*设置不重复平铺*/
  background-position: center center;
  /*设置了背景图在容器中的位置为居中*/
  background-attachment: fixed;
  /* 将背景图固定不动 */
  z-index: -1;
  transition: background-color 0.3s;
  overflow: hidden;

  .add-button {
    width: 50px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    border-radius: 10px;
    cursor: pointer;
    font-size: 24px;
    transition: all 0.2s;
    flex-shrink: 0;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .camera {
    position: fixed;
    left: 20px;
    top: 100px;
    width: 150px;
    height: 200px;
    padding: 0;
    transform-origin: center center;
    transform-style: preserve-3d;
    perspective: 1000px;
    transition: all 0.6s;
    opacity: 1;
    &.flipped {
      transform: translateX(-50%) rotateY(180deg);
      left: 50%;
      opacity: 0;
    }

    .camera-front {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .camera-back {
    position: fixed;
    left: 20px;
    top: 100px;
    width: 150px;
    height: 200px;
    border-radius: 10px;
    overflow: hidden;
    background-color: #fff;
    transform-origin: center center;
    transition: all 0.6s;
    backface-visibility: hidden;
    transform: perspective(1000px) rotateY(-180deg);
    opacity: 0;
    &.flipped {
      transform: translateX(-50%) rotateY(0deg);
      opacity: 1;
      top: 50px;
      left: 50%;
      width: 300px;
      height: 300px;
    }
    .camera-vision {
      width: 100%;
      height: 100%;
    }
  }

  .options-box {
    position: absolute;
    bottom: 200px;
    left: 50%;
    transform: translateX(-50%);
    // width: 800px;
    // height: 450px;
    // padding: 20px;
    width: 90%; // 改为百分比宽度
    max-width: 800px; // 保留最大宽度
    height: auto; // 改为自动高度
    min-height: 300px; // 添加最小高度
    padding: 30px;

    border-radius: 18px;
    backdrop-filter: blur(8px);
    background-color: rgba(0, 0, 0, 0.37);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
    overflow: hidden;

    .grayscale-indicator {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      pointer-events: none;
    }

    .preset-item-color {
      // 增加对比度边框
      border: 2px solid rgba(255, 255, 255, 0.3);
      // 深色背景下的可见性优化
      box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.2);
    }

    .color-header {
      width: 100%;

      .color-input-group {
        display: flex;
        width: 100%;
        gap: 20px;
        overflow: hidden;

        .hex-input {
          width: 120px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 15px;
          border-radius: 10px;
          font-family: monospace;
          font-size: 24px;
          letter-spacing: 1px;
          transition: all 0.2s;
          text-transform: uppercase;
          flex-shrink: 0;
          flex-grow: 0;

          &:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.5);
          }
        }

        .name-input {
          flex: 1;
          min-width: 0;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 15px;
          border-radius: 10px;
          font-size: 24px;
          transition: all 0.2s;

          &::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }

          &:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.5);
          }
        }

        .add-button {
          width: 150px;
          font-size: 25px;
        }
      }
    }

    .preset-container {
      overflow-x: auto;
      margin-top: 20px;
      margin-bottom: 30px;
      padding-bottom: 10px;

      &::-webkit-scrollbar {
        height: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
      }

      .preset-box {
        margin-top: 25px;
        display: flex;
        gap: 20px;
        min-width: min-content;
        padding: 0 10px 0 3px;

        .preset-item {
          position: relative;
          cursor: pointer;
          transition: transform 0.2s;
          flex-shrink: 0;

          &-color {
            width: 100px;
            height: 100px;
            border-radius: 10px;
            border: 2px solid rgba(255, 255, 255, 0.5);
            transition: all 0.2s;
          }

          &-name {
            width: 100px;
            color: white;
            text-align: center;
            font-size: 25px;
            margin-top: 8px;
            // 溢出省略号
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: color 0.2s;
          }

          .delete-button {
            display: none;
            position: absolute;
            top: -12px;
            right: -12px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            color: white;
            font-size: 40px;
            text-align: center;
            line-height: 30px;
            pointer-events: none;
          }

          &.selected {
            transform: scale(1.05);

            .preset-item-color {
              border-color: #00ff88;
              box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
            }

            .preset-item-name {
              color: #00ff88;
              font-weight: bold;
            }

            .delete-button {
              display: block;
              background: #ff0000;
              pointer-events: all;
            }
          }
        }
      }
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 15px;

      wx-slider {
        margin: 0;
        flex: 1;
        .wx-slider-handle-wrapper {
          height: 60px;
          border-radius: 230px;

          .wx-slider-track {
            border-radius: 30px;
          }
        }

        &.color-slider {
          .wx-slider-handle-wrapper {
            background: linear-gradient(
              to right,
              hsl(0, 100%, 50%) 0%,
              hsl(30, 100%, 50%) 12%,
              hsl(120, 100%, 50%) 33%,
              hsl(240, 100%, 50%) 66%,
              hsl(360, 100%, 50%) 100%
            ) !important;
          }
        }

        &.saturation-slider {
          .wx-slider-handle-wrapper {
            background: linear-gradient(
              to right,
              hsl(var(--hue), 0%, 50%),
              hsl(var(--hue), 100%, 50%)
            );
          }
        }

        &.lightness-slider {
          .wx-slider-handle-wrapper {
            background: linear-gradient(
              to right,
              hsl(var(--hue), 100%, 0%),
              hsl(var(--hue), 100%, 100%)
            );
          }
        }

        &.brightness-slider {
          .wx-slider-handle-wrapper {
            background: linear-gradient(to right, #000000 0%, #ffffff 100%);
          }
        }
      }

      .color-scroll-box {
        position: relative;

        .color-slider {
          z-index: 11;
          position: relative;
        }

        .color-bar {
          overflow: hidden;
          border-radius: 40px;
          position: absolute;
          top: 0px;
          left: 0;
          width: 100%;
          height: 80px;
          pointer-events: none;
          z-index: 1;
          background: linear-gradient(
            to right,
            #ff0000,
            #ffa500,
            #00ff00,
            #0000ff,
            #ff0000
          ); // background-color: #fff;
        }
      }
      [class$="-scroll-box"] {
        display: flex;
        align-items: center;
        gap: 20px;
        .section__title {
          width: 140px;
        }
      }
    }
  }

  .btn-group {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 25px;
    display: flex;
    justify-content: center;

    .add-button {
      width: unset;
      height: unset;
      padding: 20px 20px;
      font-size: 40px;
      line-height: 40px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
}

.color-card.hidden {
  .options-box {
    min-height: 0;
    height: 0;
    opacity: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;

    // .color-header,
    // .preset-container,
    // .control-group {
    //   display: none;
    // }
  }

  .add-button {
    background: rgba(0, 0, 0, 0.4);
  }
}
</style>
