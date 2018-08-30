/**
 * 讯飞的语音合成模块
 * @module xf-tts
 */
const crypto = require('crypto')
const rqn = require('request-promise')
const TEXT_MAX_LENGTH = 1000
const fs = require('fs')
const path = require('path')

const PRAMAS = {
  auf: 'audio/L16;rate=16000', // 必须：是， 音频采样率，可选值：audio/L16;rate=8000，audio/L16;rate=16000
  aue: 'lame', // 必须：是 音频编码，可选值：raw（未压缩的pcm或wav格式），lame（mp3格式）
  voice_name: 'xiaoyan' // 必须：是 发音人，可选值：详见发音人列表
  // speed: '50', // 必须：否 语速，可选值：[0-100]，默认为50
  // volume: '50', // 必须：否 音量，可选值：[0-100]，默认为50
  // pitch: '50', // 必须：否 音高，可选值：[0-100]，默认为50
  // engine_type: 'intp65', // 必须：否 引擎类型，可选值：aisound（普通效果），intp65（中文），intp65_en（英文），mtts（小语种，需配合小语种发音人使用），x（优化效果），默认为inpt65
  // text_type: 'text' // 必须：否 文本类型，可选值：text（普通格式文本），默认为text
}

const EXT = {
  lame: 'mp3',
  raw: 'wav'
}

function md5(str) {
  return crypto
    .createHash('md5')
    .update(str)
    .digest('hex')
}

/**
 * 产生一个随机的32位的字符串
 * @function randomPath
 * @return {Promise<String>} 返回一个随机的字符串
 */
function randomPath(ext = null) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, function(err, buffer) {
      if (err) {
        reject(err)
      } else {
        resolve(buffer.toString('hex') + '.' + ext)
      }
    })
  })
}

/**
 * 将data写入文件
 * @function writeToFile
 * @param  {string} filePath 输入路径
 * @param  {Buffer} data 数据
 * @return {Promise<void>}
 */
function writeToFile(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, err => (err && reject(err)) || resolve(filePath))
  })
}

function generateHeaders(appId, appKey, params) {
  const paramsBase64 = Buffer.from(JSON.stringify(params)).toString('base64')
  const curTime = Math.round(new Date().getTime() / 1000)
  return {
    'X-Appid': appId,
    'X-CurTime': curTime,
    'X-Param': paramsBase64,
    'X-CheckSum': md5(appKey + curTime + paramsBase64)
  }
}


class TTS {
  constructor(appId, appKey, params) {
    this.appId = appId
    this.appKey = appKey
    this.params = Object.assign({}, PRAMAS)
    if (params) {
      Object.assign(this.params, params)
    }
    this._options = null
  }

  start({ text }) {
    if (Buffer.byteLength(text) > TEXT_MAX_LENGTH) {
      throw new Error('Text exceed max length: ' + TEXT_MAX_LENGTH)
    }
    this._options = {
      method: 'POST',
      uri: 'http://api.xfyun.cn/v1/service/v1/tts',
      headers: generateHeaders(this.appId, this.appKey, this.params),
      encoding: null,
      form: {
        text
      },
      resolveWithFullResponse: true
    }
    return this
  }

  /**
   * 返回Buffer格式的结果
   * @return {Promise<Buffer | string>}
   */
  buffer() {
    return rqn(this._options)
      .then(data => {
        if ('sid' in data.headers && Buffer.isBuffer(data.body)) {
          return Promise.resolve(data.body)
        } else {
          console.error(data.headers)
          return Promise.reject(data.body.toString())
        }
      })
  }

  /**
   * 存储到文件
   * @return {Promise<string>}
   */
  file(outputPath = null) {
    outputPath = outputPath && path.resolve(outputPath) || randomPath(EXT[this.params.aue])
    return Promise.all([
      outputPath, this.buffer()
    ]).then(([filePath, data]) => writeToFile(filePath, data))
  }
}

module.exports = TTS