# video-green-screen-processing
将视频扣绿成透明背景



```javascript
const videoProcessing = new ProcessingVideo()
  /**
   * 开始扣绿
   * @param {string} inputVideoId 输入视频video标签 id
   * @param {string} outputVideoId 输出视频dom id
   * @param {string} color 要过滤的颜色 如0x00ff05
   */
videoProcessing.initVideoScene(inputVideoId, outputVideoId, color)

 //停止扣绿
videoProcessing.destory()
```

