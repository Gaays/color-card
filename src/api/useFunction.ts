import Taro from "@tarojs/taro";

export const useFunction = () => {

  const init = () => {
    Taro.cloud.init()
  }

  const uploadUseInfo = async (data) => {
    Taro.cloud.callFunction({
      name: 'uploadUseInfo',
      data: data
    })
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
      console.log('err', e)
      return preset
    }
  }

  const uploadPreset = async (data) => {
    Taro.cloud.callFunction({
      name: 'uploadPreset',
      data: data
    })
  }

  return {
    init,
    uploadUseInfo,
    uploadPreset,
    getUserPreset
  }
}