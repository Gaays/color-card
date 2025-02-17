<script setup lang="ts">
import { ref, computed } from 'vue';
import { useReady } from '@tarojs/taro'
import Taro from '@tarojs/taro'

type ColorPreset = {
  index: number;
  name: string;
  color: string;
  transparency: number;
  brightness: number;
  removable?: boolean;
}

const presetList = ref<ColorPreset[]>([
  {
    index: 1,
    name: '纯白',
    color: 'hsla(0, 0%, 100%, 1)',
    transparency: 100,
    brightness: 100,
    removable: false
  },
  {
    index: 2,
    name: '中性灰',
    color: 'hsla(0, 0%, 50%, 1)',
    transparency: 100,
    brightness: 50,
    removable: false
  },
  {
    index: 3,
    name: '鲜艳红',
    color: 'hsla(0, 100%, 50%, 1)',
    transparency: 100,
    brightness: 50,
    removable: true
  }
]);

const newPresetName = ref('');
const activePreset = ref('')
const activeData = ref<ColorPreset>({
  index: 2,
  name: '中性灰',
  color: 'hsla(0, 0%, 50%, 1)',
  transparency: 100,
  brightness: 50,
  removable: false
})
const backgroundColor = ref('hsla(0, 100%, 50%, 1)');
const hueValue = ref(0);
const transparency = ref(100);
const brightness = ref(50);
const hidden = ref(false);

// 修改后的HEX计算逻辑
const hexColor = computed(() => {
  const hsla = backgroundColor.value.match(/(\d+(\.\d+)?)/g)?.map(Number) || [0, 100, 50, 1];
  return hslToHex(hsla[0], hsla[1], hsla[2]);
});

const loadPresets = () => {
  const saved = Taro.getStorageSync('colorPresets');
  if (saved) {
    try {
      presetList.value = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load presets:', e);
    }
    selectPreset(presetList.value[0])
  } else {
    selectPreset(presetList.value[1])
  }
};

const savePresets = () => {
  Taro.setStorageSync('colorPresets', JSON.stringify(presetList.value));
};

const hslToHex = (h: number, s: number, l: number) => {
  // 处理灰度色（饱和度0%的情况）
  if (s === 0) {
    const value = Math.round((l / 100) * 255);
    const hex = value.toString(16).padStart(2, '0');
    return `#${hex}${hex}${hex}`.toUpperCase();
  }

  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

const updateBackgroundColor = (event?: Event, type?: string) => {
  if (event) {
    activePreset.value = '';
    newPresetName.value = '';
    if (type === 'color') {
      hueValue.value = event.detail.value
    } else if (type === 'transparency') {
      transparency.value = event.detail.value
    }
  }
  // 当亮度低于5%或高于95%时自动设为灰度
  const saturation = brightness.value > 5 && brightness.value < 95 ? 100 : 0;
  backgroundColor.value = `hsla(${hueValue.value}, ${saturation}%, ${brightness.value}%, ${transparency.value / 100})`;
};

// 修改屏幕亮度
const updateScreenBrightness = (event: Event) => {
  brightness.value = event.detail.value;
  Taro.setScreenBrightness({ value: brightness.value / 100 });
};

const selectPreset = (preset: ColorPreset) => {
  activeData.value = preset;
  const hsla = preset.color.match(/(\d+(\.\d+)?)/g)?.map(Number) || [0, 0, 0, 1];

  if (preset.removable === false) {
    hueValue.value = 0; // 重置色相
    transparency.value = hsla[3] * 100;
    brightness.value = preset.brightness; // 使用亮度值直接对应灰度
    backgroundColor.value = `hsla(0, 0%, ${brightness.value}%, ${hsla[3]})`;
  } else {
    hueValue.value = hsla[0];
    transparency.value = preset.transparency;
    brightness.value = preset.brightness;
    updateBackgroundColor();
  }
  Taro.setScreenBrightness({ value: brightness.value / 100 });

  activePreset.value = preset.color;
  newPresetName.value = preset.name;
};

const addPreset = () => {
  if (presetList.value.some(p => p.color === backgroundColor.value)) return;

  const newPreset: ColorPreset = {
    index: presetList.value.length,
    name: newPresetName.value || `预设${presetList.value.length + 1}`,
    color: backgroundColor.value,
    transparency: transparency.value,
    brightness: brightness.value,
    removable: true,
  };

  presetList.value.push(newPreset);
  newPresetName.value = '';
  activePreset.value = '';
  savePresets();
};

const deletePreset = (index: number) => {
  presetList.value.splice(index, 1);
  savePresets();
};

useReady(async () => {
  const systemBrightness = await Taro.getScreenBrightness();
  brightness.value = systemBrightness.value;

  loadPresets();
});
</script>

<template>
  <view :class="['color-card', { hidden: hidden }]" :style="{ 'background-color': backgroundColor }">
    <view :class="['options-box']">
      <view class="color-header">
        <view class="color-input-group">
          <input type="text" class="hex-input" readonly :value="hexColor">
          <input type="text" class="name-input" v-model="newPresetName" placeholder="预设名称">
          <button class="add-button" @tap="addPreset" title="添加当前颜色到预设">+</button>
        </view>
      </view>

      <view class="preset-container">
        <view class="preset-box">
          <view v-for="(item, index) in presetList" :key="index" class="preset-item" @tap="selectPreset(item)"
            :class="{ 'selected': item.color === activePreset }">
            <view class="preset-item-color" :style="{
              backgroundColor: item.color.split(', ').slice(0, 3).join(', ') + ')',
              opacity: item.color.split(', ')[3]?.replace(')', '') || 1
            }"></view>
            <view class="preset-item-name">{{ item.name }}</view>
            <view v-if="item.removable" class="delete-button" @tap.stop="deletePreset(index)">x</view>
          </view>
        </view>
      </view>

      <view class="control-group">
        <template v-if="activeData.removable">
          <view class="color-scroll-box">
            <view class="color-bar"></view>
            <slider min="0" max="360" step="1" :block-size="28" :value="hueValue" trackSize="20"
              activeColor="transparent" backgroundColor="transparent" class="color-slider"
              @changing="e => updateBackgroundColor(e, 'color')" @change="e => updateBackgroundColor(e, 'color')" />
          </view>

          <view class="transparency-scroll-box">
            <text class="section__title">透明度</text>
            <slider min="0" max="100" step="1" :show-value="true" :value="transparency"
              @changing="e => updateBackgroundColor(e, 'transparency')"
              @change="e => updateBackgroundColor(e, 'transparency')" />
          </view>
        </template>

        <view class="brightness-scroll-box">
          <text class="section__title">亮度</text>
          <slider min="0" max="100" step="1" :show-value="true" :value="brightness" @changing="updateScreenBrightness"
            @change="updateScreenBrightness" />
        </view>
      </view>


    </view>
    <view class="btn-group">
      <button class="add-button" @tap="() => hidden = !hidden">{{ hidden ? '显示' : '隐藏' }}</button>
    </view>
  </view>
</template>

<style lang="scss">
.color-card {
  height: 100vh;
  width: 100vw;
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

    @media (max-width: 768px) {
      width: 45px;
      font-size: 20px;
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
        gap: 8px;
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
          background: linear-gradient(to right, #ff0000,
              #ffa500,
              #00ff00,
              #0000ff, #ff0000) // background-color: #fff;
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
      width: 120px;
      height: 80px;
      font-size: 40px;
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