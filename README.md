# video-green-screen-processing

将视频扣绿成透明背景
基于 three@0.118.3 实现，高于 0.118.3 版本视频扣绿无感知切换视频源会失效

```javascript
const videoProcessing = new ProcessingVideo();
/**
 * 开始扣绿
 * @param {string} inputVideoId 输入视频video标签 id
 * @param {string} outputVideoId 输出视频dom id
 * @param {number | string} color 要过滤的颜色 如0x00ff05, #0000ff
 * @param {number} pixelRatio 扣绿画板和视频的分辨率比例，默认1
 */
videoProcessing.initVideoScene(inputVideoId, outputVideoId, color);

//更改扣绿视频源
videoProcessing.setVideoSource(inputVideoId, color);

//停止扣绿
videoProcessing.destroy();
```
