// 云函数入口文件
const cloud = require('wx-server-sdk')
const { cloudId } = require('../../config/cloud.config')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const addData = async (db, data) => {
  try {
    db.add({ data })
  } catch (e) {
    console.log(e)
  }
}

// 用户行为保存
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database({
    env: cloudId,
    throwOnNotFound: false
  })

  const useInfoDB = db.collection('UseInfo')
  const useInfoData = {
    userId: wxContext.OPENID,
    cameraCount: event.cameraCount,
    lockCount: event.lockCount,
    hideCount: event.hideCount,
    time: event.time,
    currentColor: event.currentColor,
  }
  addData(useInfoDB, useInfoData)

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}