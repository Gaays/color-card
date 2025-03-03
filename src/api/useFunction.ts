import Taro from "@tarojs/taro";

export const useFunction = () => {
  const init = () => {
    Taro.cloud.init()
  }

  const uploadUseInfo = async (context) => {
    Taro.cloud.callFunction({
      name: 'uploadUseInfo',
      data: context
    }).then(res => {
      console.log('success', res)
    }).catch(err => {
      console.log('err', err)
    })
  }

  return {
    init,
    uploadUseInfo
  }
}