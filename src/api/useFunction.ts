import Taro from "@tarojs/taro";

export const useFunction = () => {

  const init = () => {
    Taro.cloud.init()
  }

  const uploadUseInfo = async (data) => {
    Taro.cloud.callFunction({
      name: 'uploadUseInfo',
      data: data
    }).then(res => {
      console.log('success', res)
    }).catch(err => {
      console.log('err', err)
    })
  }

  const getUserPreset = async () => {
    let preset = []

    try {
      const res = await Taro.cloud.callFunction({
        name: 'loadPreset'
      })
      preset = res.result.preset
      return preset
    } catch (err) {
      console.log('err', err)
      return preset
    }
  }

  const uploadPreset = async (data) => {
    Taro.cloud.callFunction({
      name: 'uploadPreset',
      data: data
    }).then(res => {
      console.log('success', res)
    }).catch(err => {
      console.log('err', err)
    })
  }

  return {
    init,
    uploadUseInfo,
    uploadPreset,
    getUserPreset
  }
}