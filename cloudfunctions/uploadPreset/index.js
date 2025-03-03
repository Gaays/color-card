// 云函数入口文件
const cloud = require('wx-server-sdk')
const { cloudId } = require('../../config/cloud.config')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const insertData = async (db, uniKey, uniValue, data) => {
  try {
    const dbData = await db.where({
      [uniKey]: uniValue
    }).get()
    if (dbData.data.length) {
      // db中有数据，更新
      db.where({
        [uniKey]: uniValue
      }).update({ data })
    } else {
      // db中无数据，直接插入
      db.add({ data })
    }
  } catch (e) {
    console.log(e)
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const db = cloud.database({
    env: cloudId,
    throwOnNotFound: false
  })

  // 用户预设保存
  const userPresetDB = db.collection('UserPreset')
  const userPresetData = {
    userId: wxContext.OPENID, preset: event.preset
  }
  insertData(userPresetDB, 'userId', wxContext.OPENID, userPresetData)

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}