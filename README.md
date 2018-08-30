# xf-tts
NodeJS版的讯飞TTS

## 安装
``` javascript
npm i -S xf-tts
```

## 使用
``` javascript
const CONFIG = {
  appid: 'xxxxx',
  appkey: 'xxxxxxxxxxxx'
}

const TTS = require('xf-tts')
let tts = new TTS(CONFIG.appid, CONFIG.appkey)

async function main() {
  try {
    let data = await tts.start({
      text:
        '共产主义是一种政治观点和思想体系，现今的共产主义奉马克思、恩格斯思想为基本思想。 共产主义主张消灭生产资料私有制，并建立一个没有阶级制度、没有剥削、没有压迫，实现人类自我解放的社会，也是社会化集体大生产的社会，面对恶势力也会团结一致。'
    })
    let file = await data.file('./test.mp3') // 传入一个输出的路径
    let buffer = await data.buffer() // 也可以获得buffer
    console.log('文件输出至：', file)
  } catch (error) {
    console.error(error)
  }
}

main()
```
