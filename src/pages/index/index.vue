<script setup lang="ts">
import { ref, computed } from "vue";
import { useReady, useDidShow, useDidHide } from "@tarojs/taro";
import Taro from "@tarojs/taro";
import {
  hslToHex,
  getTextColor,
  getButtonStyle,
  getPanelTextColor,
  getPanelBorderColor,
  hexToHsl,
} from "../../utils/color";
import { throttle, useTimeCount, useBtnCount } from "../../utils/index";
import { useFunction } from "../../api/useFunction";
import { useColorPreset } from "../../composables/useColorPreset";
import { useWindowResize } from "../../composables/useWindowResize";
import type { ColorPreset } from "../../types/color";

const { uploadUseInfo, uploadPreset, saveCurrentColor, getCurrentColor } =
  useFunction();

const {
  presetList,
  loadPresets,
  addPreset: addPresetToList,
  deletePreset,
  reorderPreset,
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
const panelVisible = ref(true);
const lock = ref(false);

// 滑块双击重置
const lastTapTimes: Record<string, number> = { saturation: 0, lightness: 0, brightness: 0 };

const handleSliderLabelTap = (type: 'saturation' | 'lightness' | 'brightness') => {
  if (lock.value) {
    showLockMessage();
    return;
  }
  const now = Date.now();
  if (now - lastTapTimes[type] < 400) {
    if (type === 'saturation') saturationValue.value = 100;
    else if (type === 'lightness') lightness.value = 50;
    else if (type === 'brightness') {
      brightness.value = 100;
      Taro.setScreenBrightness({ value: 1 });
    }
    updateBackgroundColor();
    Taro.vibrateShort({ type: 'light' });
  }
  lastTapTimes[type] = now;
};

// 拖拽排序状态
const isDragging = ref(false);
const draggingOrigIdx = ref<number | null>(null);
const dragOverIdx = ref<number | null>(null);
const dragStartX = ref(0);
const ITEM_SLOT_WIDTH = 92; // 76px circle + 16px gap

const displayPresets = computed(() => {
  const list = presetList.value.map((item, i) => ({ item, origIdx: i }));
  if (
    !isDragging.value ||
    draggingOrigIdx.value === null ||
    dragOverIdx.value === null ||
    draggingOrigIdx.value === dragOverIdx.value
  ) {
    return list;
  }
  const result = [...list];
  const [dragged] = result.splice(draggingOrigIdx.value, 1);
  result.splice(dragOverIdx.value, 0, dragged);
  return result;
});

const startDrag = (origIdx: number, event: any) => {
  if (lock.value) {
    showLockMessage();
    return;
  }
  Taro.vibrateShort({ type: "heavy" });
  isDragging.value = true;
  draggingOrigIdx.value = origIdx;
  dragOverIdx.value = origIdx;
  dragStartX.value = event.touches[0].clientX;
};

const onListTouchMove = (event: any) => {
  if (!isDragging.value || draggingOrigIdx.value === null) return;
  const delta = event.touches[0].clientX - dragStartX.value;
  const deltaSlots = Math.round(delta / ITEM_SLOT_WIDTH);
  dragOverIdx.value = Math.max(
    0,
    Math.min(presetList.value.length - 1, draggingOrigIdx.value + deltaSlots)
  );
};

const endDrag = () => {
  if (
    isDragging.value &&
    draggingOrigIdx.value !== null &&
    dragOverIdx.value !== null &&
    draggingOrigIdx.value !== dragOverIdx.value
  ) {
    reorderPreset(draggingOrigIdx.value, dragOverIdx.value);
  }
  isDragging.value = false;
  draggingOrigIdx.value = null;
  dragOverIdx.value = null;
  dragStartX.value = 0;
};

const handlePresetTap = (item: ColorPreset) => {
  if (isDragging.value) return;
  selectPreset(item);
};

const handlePresetDelete = (origIdx: number) => {
  if (isDragging.value) return;
  if (lock.value) {
    showLockMessage();
    return;
  }
  deletePreset(origIdx);
};

const handleScreenTap = () => {
  if (panelVisible.value) {
    panelVisible.value = false;
    hideCount.addCount();
  } else {
    panelVisible.value = true;
    hideCount.addCount();
    if (lock.value) {
      showLockMessage();
    }
  }
};

const handleHexInput = () => {
  newPresetName.value = "";
};

const showLockMessage = () => {
  Taro.showToast({
    title: "已锁定，请长按解锁",
    icon: "none",
    duration: 2000,
  });
  Taro.vibrateShort({ type: "medium" });
};

const handleHexInputConfirm = (event: Event) => {
  if (lock.value) {
    showLockMessage();
    return;
  }
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

const handleLock = () => {
  lock.value = !lock.value;
  Taro.vibrateShort({ type: "heavy" });
  if (lock.value) {
    lockCount.addCount();
    Taro.showToast({ title: "已锁定", icon: "none", duration: 2000 });
  } else {
    Taro.showToast({ title: "已解锁", icon: "none", duration: 2000 });
  }
};

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

// 面板内专用：文字颜色（已计算遮罩层混合亮度）
const panelTextColor = computed(() => {
  const [h, s, l] = parsedHSL.value;
  return getPanelTextColor(h, s, l);
});

// 面板内专用：输入框/按钮样式
const panelButtonStyle = computed(() => {
  const [h, s, l] = parsedHSL.value;
  return {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: panelTextColor.value,
    border: `1px solid ${getPanelBorderColor(h, s, l)}`,
  };
});

// 激活预设的圆圈边框样式（高对比度双环）
const activePresetRingStyle = computed(() => {
  const [h, s, l] = parsedHSL.value;
  const ringColor = getPanelTextColor(h, s, l);
  return {
    boxShadow: `0 0 0 2.5px ${ringColor}, 0 0 0 4.5px rgba(128,128,128,0.25)`,
  };
});

const updateBackgroundColor = throttle((event?: Event, type?: string) => {
  if (event && lock.value) {
    showLockMessage();
    return;
  }
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

const updateScreenBrightness = throttle((event: Event) => {
  if (lock.value) {
    showLockMessage();
    return;
  }
  const selectValue = event.detail.value;
  const value = selectValue < 0 ? 0 : selectValue > 100 ? 100 : selectValue;
  brightness.value = value;
  Taro.setScreenBrightness({ value: value / 100 });
}, 16);

const selectPreset = (preset: ColorPreset, silent = false) => {
  if (lock.value && !silent) {
    showLockMessage();
    return;
  }
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
  if (lock.value) {
    showLockMessage();
    return;
  }
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
  if (lock.value) {
    showLockMessage();
    return;
  }
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

  const currentColor = getCurrentColor();
  selectPreset(currentColor, true);
});

useDidHide(() => {
  saveCurrentColor(activeData.value);
  const userUseTime = getTime();
  const uploadData = {
    useTime: userUseTime,
    preset: presetList.value,
    cameraCount: cameraCount.count.value,
    lockCount: lockCount.count.value,
    hideCount: hideCount.count.value,
    currentColor: activePreset.value,
  };

  const isPresetChanged =
    JSON.stringify(presetList.value) !==
    JSON.stringify(initialPresetList.value);
  if (isPresetChanged) {
    uploadPreset(uploadData);
  }

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
    :class="['color-picker', screenOrientation]"
    :style="[{ 'background-color': backgroundColor }, gradientStyle]"
    @tap="handleScreenTap"
  >
    <!-- 摄像头按钮 - 右上角 -->
    <button
      title="摄像头"
      :style="buttonStyle"
      class="color-picker__camera-btn"
      :class="{ 'color-picker__camera-btn--flipped': cameraFlag }"
      @tap.stop="handleCamera"
      :disabled="lock"
    >
      <view class="color-picker__camera-front">
        <image
          :style="{ width: '32px', height: '32px', fill: textColor, color: textColor }"
          src="/src/assets/svg/camera.svg"
          class="color-picker__camera-icon"
        />
      </view>
    </button>
    <view
      class="color-picker__camera-back"
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

    <!-- 底部指示条 -->
    <view
      class="color-picker__indicator"
      :class="{ 'color-picker__indicator--hidden': panelVisible }"
    ></view>

    <!-- 控制面板 - 底部抽屉 -->
    <view
      class="color-picker__panel"
      :class="{ 'color-picker__panel--visible': panelVisible }"
      @tap.stop
    >
      <!-- 拖拽把手 -->
      <view class="color-picker__handle"></view>

      <!-- 预设色圆列表 -->
      <view
        class="color-picker__presets"
        :class="{ 'color-picker__presets--dragging': isDragging }"
        @touchmove="onListTouchMove"
        @touchend="endDrag"
      >
        <view class="color-picker__preset-list">
          <view
            v-for="({ item, origIdx }) in displayPresets"
            :key="origIdx"
            class="color-picker__preset-item"
            :class="{
              'color-picker__preset-item--active':
                item.color === activePreset &&
                item.brightness === activeData.brightness,
              'color-picker__preset-item--dragging':
                isDragging && origIdx === draggingOrigIdx,
            }"
            @tap.stop="handlePresetTap(item)"
            @longpress.stop="startDrag(origIdx, $event)"
          >
            <view
              class="color-picker__preset-circle"
              :style="{
                backgroundColor: item.color,
                ...(item.color === activePreset && item.brightness === activeData.brightness
                  ? activePresetRingStyle
                  : {}),
              }"
            ></view>
            <view
              class="color-picker__preset-name"
              :style="{ color: panelTextColor }"
            >{{ item.name }}</view>
            <!-- 激活指示条 -->
            <view
              v-if="item.color === activePreset && item.brightness === activeData.brightness"
              class="color-picker__preset-indicator"
              :style="{ backgroundColor: panelTextColor }"
            ></view>
            <view
              class="color-picker__preset-delete"
              @tap.stop="handlePresetDelete(origIdx)"
            >×</view>
          </view>
        </view>
      </view>

      <!-- 滑块控制区 -->
      <view class="color-picker__controls">
        <view class="color-picker__slider-container color-picker__slider-container--color">
          <slider
            :min="-15"
            :max="365"
            :step="1"
            :block-size="26"
            :value="hueValue"
            trackSize="18"
            activeColor="transparent"
            class="color-picker__slider color-picker__slider--color"
            @changing="(e) => updateBackgroundColor(e, 'color')"
            @change="(e) => updateBackgroundColor(e, 'color')"
            :disabled="lock"
          />
        </view>

        <view class="color-picker__slider-container" @tap="handleSliderLabelTap('saturation')">
          <view class="color-picker__slider-label" :style="{ color: panelTextColor }">饱</view>
          <view class="color-picker__slider-wrap" @tap.stop>
            <slider
              :min="-5"
              :max="105"
              :step="1"
              :block-size="26"
              :value="saturationValue"
              trackSize="18"
              activeColor="transparent"
              class="color-picker__slider color-picker__slider--saturation"
              @changing="(e) => updateBackgroundColor(e, 'saturation')"
              @change="(e) => updateBackgroundColor(e, 'saturation')"
              :disabled="lock"
            />
            <text class="color-picker__slider-value">{{ saturationValue }}%</text>
          </view>
        </view>

        <view class="color-picker__slider-container" @tap="handleSliderLabelTap('lightness')">
          <view class="color-picker__slider-label" :style="{ color: panelTextColor }">明</view>
          <view class="color-picker__slider-wrap" @tap.stop>
            <slider
              :min="-5"
              :max="105"
              :step="1"
              :block-size="26"
              activeColor="transparent"
              :value="lightness"
              trackSize="18"
              class="color-picker__slider color-picker__slider--lightness"
              @changing="(e) => updateBackgroundColor(e, 'lightness')"
              @change="(e) => updateBackgroundColor(e, 'lightness')"
              :disabled="lock"
            />
            <text class="color-picker__slider-value">{{ lightness }}%</text>
          </view>
        </view>

        <view class="color-picker__slider-container" @tap="handleSliderLabelTap('brightness')">
          <view class="color-picker__slider-label" :style="{ color: panelTextColor }">亮</view>
          <view class="color-picker__slider-wrap" @tap.stop>
            <slider
              :min="-5"
              :max="105"
              :step="1"
              :block-size="26"
              activeColor="transparent"
              :value="brightness"
              trackSize="18"
              class="color-picker__slider color-picker__slider--brightness"
              @changing="updateScreenBrightness"
              @change="updateScreenBrightness"
              :disabled="lock"
            />
            <text class="color-picker__slider-value">{{ Math.round(brightness) }}%</text>
          </view>
        </view>
      </view>

      <!-- 底栏：HEX输入 + 预设名称 + 锁定 -->
      <view class="color-picker__footer">
        <view class="color-picker__hex-input-container" :style="panelButtonStyle">
          <text class="color-picker__hex-prefix" :style="{ color: panelTextColor }">#</text>
          <input
            type="text"
            class="color-picker__hex-input"
            :value="hexColor.slice(1)"
            :style="{ color: panelTextColor }"
            confirm-type="done"
            placeholder="颜色值"
            :placeholder-style="`color:${panelTextColor};opacity:0.5`"
            @input="handleHexInput"
            @confirm="handleHexInputConfirm"
            @blur="handleHexInputConfirm"
            :disabled="lock"
          />
        </view>
        <input
          type="text"
          class="color-picker__preset-input-name"
          v-model="newPresetName"
          placeholder="预设名称"
          :placeholder-style="`color:${panelTextColor};opacity:0.5`"
          :style="panelButtonStyle"
          :disabled="lock"
        />
        <button
          class="color-picker__add-preset-btn"
          :style="panelButtonStyle"
          @tap.stop="addPreset"
          :disabled="lock"
        >+</button>
        <button
          class="color-picker__lock-btn"
          :style="panelButtonStyle"
          @tap.stop
          @longpress.stop="handleLock"
        >
          <image
            :style="{ fill: panelTextColor, color: panelTextColor, width: '28px', height: '28px', opacity: lock ? 1 : 0.45 }"
            src="/src/assets/svg/lock.svg"
          />
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss">
@import url("./index.scss");
</style>
