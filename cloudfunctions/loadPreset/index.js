// 云函数入口文件
const cloud = require('wx-server-sdk')
const cloudId = 'cloud1-3grval4ke5e8b6cf'

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 读取用户预设数据
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const db = cloud.database({
    env: cloudId,
    throwOnNotFound: false
  })
  const userPresetDB = db.collection('UserPreset')

  let preset = []
  try {
    const data = await userPresetDB.where({
      userId: wxContext.OPENID
    }).get()

    if (data.data.length) {
      preset = data.data[0].preset
    }
  } catch (e) {
    console.log(e)
  }



  return {
    preset
  }
}