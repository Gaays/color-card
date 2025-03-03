// 云函数入口文件
const cloud = require('wx-server-sdk')
const cloudId = 'cloud1-3grval4ke5e8b6cf'

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

// 颜色分析保存 暂时保留，不启用
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const db = cloud.database({
    env: cloudId,
    throwOnNotFound: false
  })
  const colorDB = db.collection('Color')
  const ColorData = {
    colorList: event.preset
  }
  insertData(colorDB, ColorData)

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}