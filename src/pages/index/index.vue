<script setup lang="ts">
import { ref, computed } from "vue";
import { useReady } from "@tarojs/taro";
import Taro from "@tarojs/taro";
import { hslToHex, getTextColor, getButtonStyle } from "../../utils/color";
import { useColorPreset } from "../../composables/useColorPreset";
import type { ColorPreset } from "../../types/color";

// 节流函数
function throttle(fn: Function, delay: number) {
  let lastTime = 0;
  return function (...args: any[]) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}

const {
  presetList,
  loadPresets,
  addPreset: addPresetToList,
  deletePreset,
} = useColorPreset();

const newPresetName = ref("");
const activePreset = ref("");
const activeData = ref<ColorPreset>({
  name: "晨曦粉",
  color: "hsl(350, 70%, 85%)",
  hue: 350,
  saturation: 70,
  lightness: 85,
  brightness: 50,
});
const backgroundColor = ref("hsl(350, 70%, 85%)");
const hueValue = ref(0);
const saturationValue = ref(100);
const lightness = ref(100);
const brightness = ref(50);
const hidden = ref(false);
const lock = ref(false);

const handleOptionBoxVisible = () => {
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
const parsedHSL = computed(() => {
  const matches = backgroundColor.value.match(
    /hsl\((\d+),\s*(\d+)%,\s*(\d+)%/i
  );
  return matches
    ? [Number(matches[1]), Number(matches[2]), Number(matches[3])]
    : [0, 100, 50];
});

const hexColor = computed(() => {
  const [h, s, l] = parsedHSL.value;
  return hslToHex(h, s, l);
});

const textColor = computed(() => {
  const [h, s, l] = parsedHSL.value;
  return getTextColor(h, s, l);
});

const buttonStyle = computed(() => {
  const [h, s, l] = parsedHSL.value;
  return getButtonStyle(h, s, l, textColor.value);
});

const updateBackgroundColor = throttle((event?: Event, type?: string) => {
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
}, 16);

// 修改屏幕亮度
const updateScreenBrightness = throttle((event: Event) => {
  const selectValue = event.detail.value;
  const value = selectValue < 0 ? 0 : selectValue > 100 ? 100 : selectValue;
  brightness.value = value;
  Taro.setScreenBrightness({ value: value / 100 });
}, 16);

const selectPreset = (preset: ColorPreset, silent = false) => {
  activeData.value = preset;
  hueValue.value = preset.hue;
  lightness.value = preset.lightness;
  saturationValue.value = preset.saturation;
  brightness.value = preset.brightness;
  updateBackgroundColor();

  Taro.setScreenBrightness({ value: brightness.value / 100 });

  activePreset.value = preset.color;
  newPresetName.value = preset.name;
  if (!silent) {
    Taro.vibrateShort({ type: "light" });
  }
};

const addPreset = () => {
  const newPreset: ColorPreset = {
    name: newPresetName.value || `预设${presetList.value.length + 1}`,
    color: backgroundColor.value,
    hue: hueValue.value,
    saturation: saturationValue.value,
    lightness: lightness.value,
    brightness: brightness.value,
  };

  if (addPresetToList(newPreset)) {
    newPresetName.value = "";
    activePreset.value = "";
  }
};

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
  loadPresets();
  selectPreset(presetList.value[0], true);
});
</script>

<template>
  <view
    :class="['color-picker', { 'color-picker--hidden': hidden }]"
    :style="[{ 'background-color': backgroundColor }, gradientStyle]"
  >
    <button
      title="摄像头"
      :style="buttonStyle"
      class="color-picker__camera-btn"
      :class="{ 'color-picker__camera-btn--flipped': cameraFlag }"
      @tap="handleCamera"
    >
      <view class="color-picker__camera-front">
        <image
          :style="[{ width: '30px', height: '30px' }]"
          src="/src/assets/svg/camera.svg"
          class="color-picker__camera-icon"
        />
      </view>
    </button>
    <view
      class="color-picker__camera-back"
      :style="buttonStyle"
      :class="{ 'color-picker__camera-back--flipped': cameraFlag }"
      @tap.stop="handleCamera"
    >
      <camera
        v-if="cameraVisible"
        devicePosition="front"
        class="color-picker__camera-view"
        @Error="cameraError"
      />
    </view>

    <view class="color-picker__panel" :style="buttonStyle">
      <view class="color-picker__header">
        <view class="color-picker__input-group">
          <input
            type="text"
            class="color-picker__hex-input"
            readonly
            :value="hexColor"
            :style="buttonStyle"
          />
          <input
            type="text"
            class="color-picker__preset-input-name"
            v-model="newPresetName"
            placeholder="预设名称"
            :placeholder-style="`color:${textColor}`"
            :style="buttonStyle"
          />
          <button
            class="color-picker__add-preset-btn"
            title="添加当前颜色到预设"
            :style="buttonStyle"
            @tap="addPreset"
          >
            添加到预设
          </button>
        </view>
      </view>

      <view class="color-picker__presets">
        <view class="color-picker__preset-list">
          <view
            v-for="(item, index) in presetList"
            :key="index"
            class="color-picker__preset-item"
            :class="{
              'color-picker__preset-item--active':
                item.color === activePreset &&
                item.brightness === activeData.brightness,
            }"
            @tap="selectPreset(item)"
          >
            <view
              class="color-picker__preset-color"
              :style="{ backgroundColor: item.color }"
            ></view>
            <view
              class="color-picker__preset-name"
              :style="{ color: textColor }"
              >{{ item.name }}</view
            >
            <view
              class="color-picker__preset-delete"
              :style="{ color: textColor }"
              @tap.stop="deletePreset(index)"
              >x</view
            >
          </view>
        </view>
      </view>

      <view class="color-picker__controls">
        <view
          class="color-picker__slider-container color-picker__slider-container--color"
        >
          <slider
            :min="-15"
            :max="365"
            :step="1"
            :block-size="28"
            :value="hueValue"
            trackSize="20"
            activeColor="transparent"
            class="color-picker__slider color-picker__slider--color"
            @changing="(e) => updateBackgroundColor(e, 'color')"
            @change="(e) => updateBackgroundColor(e, 'color')"
          />
        </view>

        <view class="color-picker__slider-container">
          <text class="color-picker__slider-title" :style="{ color: textColor }"
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
            class="color-picker__slider color-picker__slider--saturation"
            @changing="(e) => updateBackgroundColor(e, 'saturation')"
            @change="(e) => updateBackgroundColor(e, 'saturation')"
          />
        </view>

        <view class="color-picker__slider-container">
          <text class="color-picker__slider-title" :style="{ color: textColor }"
            >明度</text
          >
          <slider
            :min="-5"
            :max="105"
            :step="1"
            activeColor="transparent"
            :value="lightness"
            class="color-picker__slider color-picker__slider--lightness"
            @changing="(e) => updateBackgroundColor(e, 'lightness')"
            @change="(e) => updateBackgroundColor(e, 'lightness')"
          />
        </view>

        <view class="color-picker__slider-container">
          <text class="color-picker__slider-title" :style="{ color: textColor }"
            >显示亮度</text
          >
          <slider
            :min="-5"
            :max="105"
            :step="1"
            activeColor="transparent"
            :value="brightness"
            class="color-picker__slider color-picker__slider--brightness"
            @changing="updateScreenBrightness"
            @change="updateScreenBrightness"
          />
        </view>
      </view>
    </view>
    <view class="color-picker__actions">
      <button
        class="color-picker__toggle-btn"
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
.color-picker {
  height: 100vh;
  width: 100vw;
  position: fixed;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  background-attachment: fixed;
  z-index: -1;
  transition: background-color 0.3s;
  overflow: hidden;

  &__btn {
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

  &__camera-btn {
    @extend .color-picker__btn;
    position: fixed;
    left: 30px;
    top: 250px;
    width: 150px;
    height: 200px;
    padding: 0;
    transform-origin: center center;
    transform-style: preserve-3d;
    perspective: 1000px;
    transition: all 0.6s;
    opacity: 1;

    &--flipped {
      transform: translateX(-50%) rotateY(180deg);
      left: 50%;
      opacity: 0;
    }
  }

  &__camera-front {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__camera-back {
    @extend .color-picker__btn;
    position: fixed;
    left: 30px;
    top: 250px;
    width: 150px;
    height: 200px;
    border-radius: 20px;
    overflow: hidden;
    background-color: #fff;
    transform-origin: center center;
    transition: all 0.6s;
    backface-visibility: hidden;
    transform: perspective(1000px) rotateY(-180deg);
    opacity: 0;

    &--flipped {
      transform: translateX(-50%) rotateY(0deg);
      opacity: 1;
      top: 180px;
      left: 50%;
      width: 300px;
      height: 300px;
    }
  }

  &__camera-view {
    width: 100%;
    height: 100%;
  }

  &__panel {
    position: absolute;
    bottom: 200px;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 120px);
    height: auto;
    min-height: 300px;
    padding: 30px;
    border-radius: 18px;
    backdrop-filter: blur(8px);
    background-color: rgba(0, 0, 0, 0.37);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
    overflow: hidden;
  }

  &__grayscale-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    pointer-events: none;
  }

  &__preset-color {
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.2);
  }

  &__header {
    width: 100%;
  }

  &__input-group {
    display: flex;
    width: 100%;
    gap: 20px;
    overflow: hidden;
  }

  &__hex-input {
    width: 120px;
    background: rgba(255, 255, 255, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.4);
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

  &__preset-input-name {
    flex: 1;
    min-width: 0;
    background: rgba(255, 255, 255, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: white;
    padding: 12px 15px;
    border-radius: 10px;
    font-size: 24px;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.5);
    }
  }

  &__add-preset-btn {
    @extend .color-picker__btn;
    width: 150px;
    font-size: 25px;
    border: none !important;
  }

  &__presets {
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
  }

  &__preset-list {
    margin-top: 25px;
    display: flex;
    gap: 20px;
    min-width: min-content;
    padding: 0 10px 0 10px;
  }

  &__preset-item {
    position: relative;
    cursor: pointer;
    transition: transform 0.2s;
    flex-shrink: 0;

    &--active {
      transform: scale(1.05);

      .color-picker__preset-color {
        border-color: #00ff88;
        box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
      }

      .color-picker__preset-name {
        font-weight: bold;
      }

      .color-picker__preset-delete {
        display: block;
        background: #ff0000;
        pointer-events: all;
      }
    }
  }

  &__preset-color {
    width: 100px;
    height: 100px;
    border-radius: 10px;
    border: 2px solid rgba(255, 255, 255, 0.5);
    transition: all 0.2s;
  }

  &__preset-name {
    width: 100px;
    color: white;
    text-align: center;
    font-size: 25px;
    margin-top: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.2s;
  }

  &__preset-delete {
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

  &__controls {
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
    }
  }

  &__slider {
    &--color {
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

    &--saturation {
      .wx-slider-handle-wrapper {
        background: linear-gradient(
          to right,
          hsl(var(--hue), 0%, 50%),
          hsl(var(--hue), 100%, 50%)
        );
      }
    }

    &--lightness {
      .wx-slider-handle-wrapper {
        background: linear-gradient(
          to right,
          hsl(var(--hue), 100%, 0%),
          hsl(var(--hue), 100%, 100%)
        );
      }
    }

    &--brightness {
      .wx-slider-handle-wrapper {
        background: linear-gradient(to right, #000000 0%, #ffffff 100%);
      }
    }
  }

  &__slider-container {
    display: flex;
    align-items: center;
    gap: 20px;
    position: relative;

    &--color {
      .color-picker__slider {
        z-index: 11;
        position: relative;
      }
    }
  }

  &__slider-title {
    width: 140px;
  }

  &__color-bar {
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
    );
  }

  &__actions {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 25px;
    display: flex;
    justify-content: center;
  }

  &__toggle-btn {
    @extend .color-picker__btn;
    width: unset;
    height: unset;
    padding: 20px 20px;
    font-size: 40px;
    line-height: 40px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &--hidden {
    .color-picker__panel {
      min-height: 0;
      height: 0;
      opacity: 0;
      bottom: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .color-picker__btn {
      background: rgba(0, 0, 0, 0.4);
    }
  }
}
</style>
