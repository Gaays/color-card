<script setup lang="ts">
import { ref, computed } from "vue";
import { useReady, useDidShow, useDidHide } from "@tarojs/taro";
import Taro from "@tarojs/taro";
import {
  hslToHex,
  getTextColor,
  getButtonStyle,
  hexToHsl,
} from "../../utils/color";
import { throttle, useTimeCount, useBtnCount } from "../../utils/index";
import { useFunction } from "../../api/useFunction";
import { useColorPreset } from "../../composables/useColorPreset";
import { useWindowResize } from "../../composables/useWindowResize";
import type { ColorPreset } from "../../types/color";

const { uploadUseInfo, uploadPreset } = useFunction();

const {
  presetList,
  loadPresets,
  addPreset: addPresetToList,
  deletePreset,
} = useColorPreset();

const { initTime, getTime } = useTimeCount();
let cameraCount = useBtnCount();
let lockCount = useBtnCount();
let hideCount = useBtnCount();

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

const handleHexInput = () => {
  newPresetName.value = "";
};

const handleHexInputConfirm = (event: Event) => {
  const input = (event.target as HTMLInputElement).value;
  if (!input) return;

  const hslColor = hexToHsl(input);
  if (hslColor) {
    hueValue.value = hslColor.h;
    saturationValue.value = hslColor.s;
    lightness.value = hslColor.l;
    updateBackgroundColor();
  } else {
    Taro.showToast({
      title: "颜色格式有误",
      icon: "none",
      duration: 2000,
    });
  }
};

const handleOptionBoxVisible = () => {
  if (!lock.value) {
    hideCount.addCount();
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
    lockCount.addCount();
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
  if (presetList.value.length >= 15) {
    Taro.showToast({
      title: "预设最多为15个",
      icon: "none",
      duration: 2000,
    });
    return;
  }
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
    cameraCount.addCount();
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
      console.log('🚀 ~ cameraError ~ res:', res);
      if (!res.authSetting["scope.camera"]) {
        Taro.authorize({
          scope: "scope.camera",
          success: function () {
            Taro.createCameraContext();
          },
          fail: function () {
            Taro.showToast({
              title: "未授权摄像头权限，请前往小程序设置授权。",
              icon: "none",
              duration: 2000,
            });
          },
        });
      }
    },
  });
};

const { init: initWindowResize, screenOrientation } = useWindowResize();

const initialPresetList = ref<ColorPreset[]>([]);

const initCount = () => {
  cameraCount.initCount();
  lockCount.initCount();
  hideCount.initCount();
};

useReady(async () => {});

useDidShow(async () => {
  initWindowResize();
  initTime();
  initCount();
  const systemBrightness = await Taro.getScreenBrightness();
  brightness.value = systemBrightness.value;
  loadPresets();
  initialPresetList.value = JSON.parse(JSON.stringify(presetList.value));
  selectPreset(presetList.value[0], true);
});

useDidHide(() => {
  const userUseTime = getTime();
  const uploadData = {
    useTime: userUseTime,
    preset: presetList.value,
    cameraCount: cameraCount.count.value,
    lockCount: lockCount.count.value,
    hideCount: hideCount.count.value,
    currentColor: activePreset.value,
  };

  // 检查presetList是否发生变化
  const isPresetChanged =
    JSON.stringify(presetList.value) !==
    JSON.stringify(initialPresetList.value);
  if (isPresetChanged) {
    uploadPreset(uploadData);
  }

  // 超过1分钟或超过6次按钮点击算有效使用
  const validTime = 1 * 60 * 1000;
  if (userUseTime >= validTime) {
    uploadUseInfo(uploadData);
  } else {
    const useCount = 6;
    if (
      uploadData.cameraCount >= useCount ||
      uploadData.lockCount >= useCount ||
      uploadData.hideCount >= useCount
    ) {
      uploadUseInfo(uploadData);
    }
  }
});
</script>

<template>
  <view
    :class="[
      'color-picker',
      { 'color-picker--hidden': hidden },
      screenOrientation,
    ]"
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
          :style="[
            {
              width: '30px',
              height: '30px',
              fill: textColor,
              color: textColor,
            },
          ]"
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
          <view class="color-picker__hex-input-container" :style="buttonStyle">
            <text class="color-picker__hex-prefix" :style="textColor">#</text>
            <input
              type="text"
              class="color-picker__hex-input"
              :value="hexColor.slice(1)"
              :style="textColor"
              confirm-type="done"
              placeholder="颜色值"
              :placeholder-style="`color:${textColor}`"
              @input="handleHexInput"
              @confirm="handleHexInputConfirm"
              @blur="handleHexInputConfirm"
            />
          </view>
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
              >x
            </view>
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
              fill: textColor,
              color: textColor,
              width: '30px',
              height: '30px',
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
@import url("./index.scss");
</style>
