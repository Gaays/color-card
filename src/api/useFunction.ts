import Taro from "@tarojs/taro";

export const useFunction = () => {
  const PRESET_STORAGE_KEY = 'color_preset';
  const USER_INFO_STORAGE_KEY = 'user_info';

  const init = () => {
    Taro.cloud.init()
  }

  const uploadUseInfo = async (data) => {
    try {
      await Taro.cloud.callFunction({
        name: 'uploadUseInfo',
        data: data
      })
    } catch (e) {
      console.log('Upload user info failed, fallback to localStorage', e)
      Taro.setStorageSync(USER_INFO_STORAGE_KEY, data)
    }
  }

  const getUserPreset = async () => {
    let preset = []

    try {
      const res = await Taro.cloud.callFunction({
        name: 'loadPreset'
      })
      preset = res?.result?.preset || []
      return preset
    } catch (e) {
      console.log('Load preset failed, fallback to localStorage', e)
      try {
        preset = Taro.getStorageSync(PRESET_STORAGE_KEY) || []
      } catch (storageErr) {
        console.log('Failed to read from localStorage', storageErr)
      }
      return preset
    }
  }

  const uploadPreset = async (data) => {
    try {
      await Taro.cloud.callFunction({
        name: 'uploadPreset',
        data: data
      })
      // 同步更新本地存储
      Taro.setStorageSync(PRESET_STORAGE_KEY, data)
    } catch (e) {
      console.log('Upload preset failed, fallback to localStorage', e)
      Taro.setStorageSync(PRESET_STORAGE_KEY, data)
    }
  }

  return {
    init,
    uploadUseInfo,
    uploadPreset,
    getUserPreset
  }
}