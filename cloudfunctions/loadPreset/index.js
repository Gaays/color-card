// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 读取用户预设数据
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const db = cloud.database({
    throwOnNotFound: false
  })
  const userPresetDB = db.collection('UserPreset')

  let preset = []
  console.log(wxContext.OPENID)
  try {
    const data = await userPresetDB.where({
      userId: wxContext.OPENID
    }).get()

    if (data.data.length) {
      preset = data.data[0].preset
    }
  } catch (error) {
    console.log(error)
  }



  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    preset
  }
}