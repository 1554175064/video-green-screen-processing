import {
  WebGLRenderer, Scene, OrthographicCamera, Color, VideoTexture, LinearFilter, RGBAFormat,
  ShaderMaterial, PlaneGeometry, DoubleSide, Mesh
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import vertexShader from "./shader/vertexShader.js";
import fragmentShader from "./shader/fragmentShader.js";

/**
 * 用 Canvas 2D 实现视频抠色、透明处理
 */
class CanvasVideoProcessing {
  video!: HTMLVideoElement;                  // 输入视频元素
  canvas!: HTMLCanvasElement;                // 输出渲染用 canvas
  ctx!: CanvasRenderingContext2D;            // Canvas2d context
  playingDom!: HTMLElement;                  // 挂载 canvas 的输出 DOM
  keyColor: [number, number, number] = [0, 255, 0]; // 抠色主色（RGB）
  threshold: number = 60;           // 抠色阈值，容差范围
  pixelRatio: number = 1;           // 像素比，用于清晰度
  rafId?: number;                   // requestAnimationFrame ID
  isActive: boolean = false;        // 控制渲染是否激活

  constructor() { }

  /**
   * 初始化并绑定事件
   * @param videoId      输入视频DOM节点id
   * @param domId        输出（容器）DOM节点id
   * @param keyColor     抠色目标颜色 RGB数组
   * @param threshold    容忍抠色距离
   * @param pixelRatio   渲染像素比
   */
  init(videoId: string, domId: string, keyColor: [number, number, number] = [0, 255, 0], threshold = 60, pixelRatio = 1) {
    this.stop(); // 先停止当前渲染
    this.isActive = true;
    this.video = document.getElementById(videoId) as HTMLVideoElement;
    this.playingDom = document.getElementById(domId)!;
    this.keyColor = keyColor;
    this.threshold = threshold;
    this.pixelRatio = pixelRatio;
    // 创建canvas和context
    if (!this.canvas || !this.ctx) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', {
        willReadFrequently: true
      })!;
    }
    // 清空并挂载canvas到输出节点
    this.playingDom.innerHTML = '';
    this.playingDom.appendChild(this.canvas);
    this.resize();
    window.addEventListener('resize', this._resizeHandler);   // 响应尺寸变化
    this.video.addEventListener('play', this.loop);           // 视频播放自动进入渲染循环
    this.video.addEventListener('pause', this.stop);          // 视频暂停/结束停止渲染
    this.video.addEventListener('ended', this.stop);
  }

  /** window变化时自动刷新canvas尺寸 */
  _resizeHandler = () => this.resize();

  /** 根据容器尺寸调整canvas尺寸与样式 */
  resize() {
    const width = this.playingDom.clientWidth;
    const height = this.playingDom.clientHeight;
    this.canvas.width = width * this.pixelRatio;
    this.canvas.height = height * this.pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  /**
   * 主渲染循环，逐帧抠色合成
   */
  loop = () => {
    if (!this.isActive || this.video.paused || this.video.ended) return;
    // 绘制视频帧到canvas
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    // 获取帧像素
    const frame = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = frame.data;
    // 遍历所有像素，进行抠色透明处理
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const dr = Math.abs(r - this.keyColor[0]);
      const dg = Math.abs(g - this.keyColor[1]);
      const db = Math.abs(b - this.keyColor[2]);
      if (dr + dg + db < this.threshold) {
        data[i + 3] = 0; // 设置为透明
      }
    }
    this.ctx.putImageData(frame, 0, 0); // 更新渲染帧
    this.rafId = window.requestAnimationFrame(this.loop);     // 下一帧
  }

  /** 停止渲染循环 */
  stop = () => {
    this.isActive = false;
    if (this.rafId) window.cancelAnimationFrame(this.rafId);
  }

  /**
   * 切换新视频源/抠色色彩
   * @param newVideoId 新视频id
   * @param newKeyColor 新抠色数组
   */
  setVideoSource(newVideoId: string, newKeyColor?: [number, number, number]) {
    this.stop();
    if (this.video) {
      this.video.removeEventListener('play', this.loop);
      this.video.removeEventListener('pause', this.stop);
      this.video.removeEventListener('ended', this.stop);
    }
    this.video = document.getElementById(newVideoId) as HTMLVideoElement;
    if (!this.video) throw new Error('Video not found');
    if (newKeyColor) this.keyColor = newKeyColor;
    this.video.addEventListener('play', this.loop);     // 重新绑定事件
    this.video.addEventListener('pause', this.stop);
    this.video.addEventListener('ended', this.stop);
    this.isActive = true;
    if (!this.video.paused && !this.video.ended) {
      this.loop(); // 若已播放，立即渲染
    }
    this.video.play().catch(() => { }); // 自动播放，可能有浏览器限制
  }

  /**
   * 清理所有资源与事件
   */
  destroy() {
    this.stop();
    window.removeEventListener('resize', this._resizeHandler);
    if (this.video) {
      this.video.removeEventListener('play', this.loop);
      this.video.removeEventListener('pause', this.stop);
      this.video.removeEventListener('ended', this.stop);
    }
    if (this.playingDom) this.playingDom.innerHTML = '';
  }
}

/**
 * Three.js 实现的视频抠色/特效渲染
 */

/**
 * 获得自定义抠色Shader材质参数对象
 * @param domid        输入视频id
 * @param width        视频或输出宽度
 * @param height       高度
 * @param keyColor     抠色色彩（数字/字符串）
 * @param filtertype   滤镜类型参数
 */
const getShaderMaterial = (
  domid: string,
  width: number,
  height: number,
  keyColor: string | number,
  filtertype: number
) => {
  var keyColorObject = new Color(keyColor);    // Three.js颜色对象
  var video = document.getElementById(domid) as HTMLVideoElement;
  video?.setAttribute("webkit-playsinline", "webkit-playsinline");
  video?.setAttribute("playsinline", "playsinline");
  var videoTexture = new VideoTexture(video!); // 视频转为Three纹理
  videoTexture.minFilter = LinearFilter;
  videoTexture.format = RGBAFormat;
  // Shader需要的自定义uniforms
  var myuniforms = {
    pointTexture: { value: videoTexture },
    color: { value: keyColorObject },
    videowidth: { value: width },
    videoheight: { value: height },
    filterType: { value: filtertype },
    lightLevel: { value: 0.2 },
    gridSize: { value: 0.8 },
  };
  return {
    uniforms: myuniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
  };
};

/**
 * Three.js 视频处理核心逻辑
 */
class ProcessingVideoThreeJS {
  renderer: WebGLRenderer | null = null;
  scene: Scene | null = null;
  camera: OrthographicCamera | null = null;
  playingDom: HTMLDivElement | null = null;   // 输出容器
  movie: Mesh | null = null;                  // 视频Plane
  composer: EffectComposer | null = null;     // 后处理管线
  pixelRatio: number = 1;
  resizeObserver: ResizeObserver | null = null;
  fxaaPass: ShaderPass | null = null;
  videoDom: HTMLVideoElement | null = null;
  _raf: number | null = null;
  _frameCallback?: any; // requestVideoFrameCallback

  /**
   * 初始化Three.js场景与视频对象
   * @param inputVideoId   视频源id
   * @param outputVideoId  容器输出id
   * @param color          抠色色彩，可字符串或数字(Color)
   * @param pixelRatio     像素比
   * @param enableFXAA     是否抗锯齿
   */
  initVideoScene(
    inputVideoId: string,
    outputVideoId: string,
    color: string | number,
    pixelRatio?: number,
    enableFXAA: boolean = false
  ) {
    this.pixelRatio = pixelRatio ?? this.autoDetectPixelRatio();
    this.playingDom = document.getElementById(outputVideoId) as HTMLDivElement;
    if (!this.playingDom) throw new Error("Output DOM not found");
    this.renderer = new WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setPixelRatio(this.pixelRatio);
    this.playingDom.innerHTML = "";
    this.playingDom.appendChild(this.renderer.domElement);
    this.renderer.setClearColor(0xffffff, 0);
    this.updateRendererSize();
    // 构建基础场景与相机
    this.scene = new Scene();
    this.camera = new OrthographicCamera(-2, 2, 1.5, -1.5, 0.1, 100);
    this.camera.position.set(0, 0, 1);
    this.scene.add(this.camera);
    this.createVideoScene(inputVideoId, color);
    // 合成后处理链条
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    // 可选，添加FXAA抗锯齿
    if (enableFXAA) {
      this.fxaaPass = new ShaderPass(FXAAShader);
      this.fxaaPass.uniforms["resolution"].value.set(
        1 / (this.playingDom.clientWidth * this.pixelRatio),
        1 / (this.playingDom.clientHeight * this.pixelRatio)
      );
      this.composer.addPass(this.fxaaPass);
    }
    this.videoDom = document.getElementById(inputVideoId) as HTMLVideoElement;
    // 绑定渲染循环，与视频帧同步
    this._bindVideoFrameRender();
    // 容器变化自动resize
    this.resizeObserver = new ResizeObserver(this.onDomResize.bind(this));
    this.resizeObserver.observe(this.playingDom);
  }

  /**
   * 用于彻底解绑和重建 requestVideoFrameCallback / raf 渲染循环
   */
  _bindVideoFrameRender() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    if (!this.videoDom) return;
    // 清理上一次 requestVideoFrameCallback
    if (this._frameCallback && this.videoDom.cancelVideoFrameCallback) {
      try { this.videoDom.cancelVideoFrameCallback(this._frameCallback); } catch { }
      this._frameCallback = null;
    }
    // 渲染一帧函数
    const renderFrame = () => { this.composer!.render(); };
    // 优先使用requestVideoFrameCallback， 否则降级到raf
    if (this.videoDom.requestVideoFrameCallback) {
      const frameCallback = () => {
        renderFrame();
        this._frameCallback = this.videoDom!.requestVideoFrameCallback(frameCallback);
      };
      this._frameCallback = this.videoDom.requestVideoFrameCallback(frameCallback);
    } else {
      // 兼容性方案：事件驱动+raf
      this.videoDom.addEventListener('play', this._rafLoop);
      this.videoDom.addEventListener('pause', this._rafStop);
      this.videoDom.addEventListener('ended', this._rafStop);
      this.videoDom.addEventListener('seeked', renderFrame);
      this.videoDom.addEventListener('timeupdate', renderFrame);
    }
  }

  /** raf驱动渲染（兼容方案） */
  _rafLoop = () => {
    const loop = () => {
      if (!this.videoDom?.paused && !this.videoDom?.ended) {
        this.composer!.render();
        this._raf = requestAnimationFrame(loop);
      }
    };
    loop();
  };

  /** 停止raf循环 */
  _rafStop = () => {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  };

  /**
   * 构建视频+抠色shader平面并加入场景
   * @param inputVideoId 视频DOM id
   * @param color        抠色色彩
   */
  createVideoScene(inputVideoId: string, color: string | number) {
    if (!this.scene) return;
    const width = this.playingDom?.clientWidth || 0;
    const height = this.playingDom?.clientHeight || 0;
    const value = getShaderMaterial(inputVideoId, width, height, color, 0);
    const movieMaterial = new ShaderMaterial(value);
    const movieGeometry = new PlaneGeometry(4, 3); // 按 4:3 投影
    movieMaterial.side = DoubleSide;
    const movie = new Mesh(movieGeometry, movieMaterial);
    movie.position.set(0, 0, 0);
    movie.scale.set(1, 1, 1);
    movie.visible = true;
    // 清理旧资源及纹理
    if (this.movie) {
      const oldMat = this.movie.material as ShaderMaterial;
      if (oldMat.uniforms?.pointTexture?.value) {
        (oldMat.uniforms.pointTexture.value as VideoTexture).dispose();
      }
      oldMat.dispose();
      this.scene.remove(this.movie);
    }
    this.movie = movie;
    this.scene.add(this.movie);
  }

  /**
   * 智能检测像素比
   * @returns 推荐像素比
   */
  autoDetectPixelRatio(): number {
    const defaultRatio = window.devicePixelRatio || 1;
    // 针对部分移动和集显设备降至1
    if (navigator && /Intel|HD|UHD|Integrated|iPad|iPhone|Android/.test(navigator.userAgent)) return 1;
    return defaultRatio > 2 ? 1.5 : defaultRatio;
  }

  /**
   * 更新渲染器尺寸，与容器同步
   */
  updateRendererSize() {
    if (!this.renderer || !this.playingDom) return;
    const width = this.playingDom.clientWidth * this.pixelRatio;
    const height = this.playingDom.clientHeight * this.pixelRatio;
    this.renderer.setSize(width, height, false);
    this.renderer.domElement.style.width = `${this.playingDom.clientWidth}px`;
    this.renderer.domElement.style.height = `${this.playingDom.clientHeight}px`;
    if (this.composer) {
      this.composer.setSize(width, height);
      // 更新FXAA分辨率
      if (this.fxaaPass && this.fxaaPass.uniforms["resolution"]) {
        this.fxaaPass.uniforms["resolution"].value.set(1 / width, 1 / height);
      }
    }
  }

  /** ResizeObserver变动时响应 */
  onDomResize() {
    this.updateRendererSize();
  }

  /**
   * 切换新的视频源/抠色参数
   * @param inputVideoId 新视频id
   * @param color        新抠色色彩
   */
  setVideoSource(inputVideoId: string, color: string | number) {
    this.createVideoScene(inputVideoId, color);
  }

  /**
   * 析构与彻底清理资源回收
   */
  destroy() {
    if (this.resizeObserver && this.playingDom) {
      this.resizeObserver.unobserve(this.playingDom);
    }
    this._rafStop();
    // 清理Mesh/材质/纹理
    if (this.movie) {
      const oldMat = this.movie.material as ShaderMaterial;
      if (oldMat.uniforms?.pointTexture?.value) {
        (oldMat.uniforms.pointTexture.value as VideoTexture).dispose();
      }
      oldMat.dispose();
      this.scene?.remove(this.movie);
      this.movie = null;
    }
    if (this.playingDom) {
      this.playingDom.innerHTML = "";
      this.playingDom = null;
    }
    this.composer = null;
    this.fxaaPass = null;
    if (this.renderer) {
      try {
        this.renderer.dispose();
        (this.renderer as any).forceContextLoss?.();
      } catch { }
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
    if (this.videoDom) {
      this.videoDom.removeEventListener('play', this._rafLoop);
      this.videoDom.removeEventListener('pause', this._rafStop);
      this.videoDom.removeEventListener('ended', this._rafStop);
    }
    this.videoDom = null;
  }
}

// ---- 集成管理，自动选用最优渲染方式 ----
type RenderType = 'three' | 'canvas2d' | 'auto'; // 支持三种渲染方案
interface ProcessingOpts {
  inputVideoId: string;
  outputVideoId: string;
  keyColor?: string;            // 抠色颜色
  threshold?: number;           // 抠色容差
  pixelRatio?: number;          // 像素比
  enableFXAA?: boolean;         // three.js专属参数
  renderType?: RenderType;      // 显式设定类型
}

/**
 * 视频特效/抠色处理统一入口，自动判别用Canvas或Three
 */
class UnifiedProcessingVideo {
  private renderType: RenderType;
  private threejsInstance?: ProcessingVideoThreeJS;
  private canvas2dInstance?: CanvasVideoProcessing;
  private opts: ProcessingOpts;

  constructor() {
  }

  /** 判定是否应该选择Three.js渲染 */
  private shouldUseThree(): boolean {
    if (this.renderType === 'three') return true;
    if (this.renderType === 'canvas2d') return false;
    // 关键逻辑：只要有下面任一情况，优先使用three（高端/需要特效）
    if (
      typeof this.opts.keyColor === 'string' ||     // 非标准RGB格式
      this.opts.enableFXAA ||                       // 启用三效专属
      window.WebGLRenderingContext === undefined
    ) return true;
    // 移动端优先用canvas2d方案（节能且兼容性强）
    if (/android|iphone|ipad|mobile|intel|uhd|hd/.test(navigator.userAgent)) {
      return false; // 优先canvas
    }
    // 其他情况都用Three
    return true;
  }

  /**
   * 初始化入口，根据自动判定选择实现
   */
  async init(opts: ProcessingOpts) {
    this.opts = opts;
    this.renderType = opts.renderType ?? 'auto';
    await this.destroy(); // 先全部清理彻底
    if (this.shouldUseThree()) {
      // 使用three.js方案
      this.threejsInstance = new ProcessingVideoThreeJS();
      this.threejsInstance.initVideoScene(
        this.opts.inputVideoId,
        this.opts.outputVideoId,
        this.opts.keyColor || '#00ff00',
        this.opts.pixelRatio,
        !!this.opts.enableFXAA
      );
    } else {
      // 使用Canvas2d方案
      this.canvas2dInstance = new CanvasVideoProcessing();
      let colorArr: [number, number, number];
      if (typeof this.opts.keyColor === 'string') {
        let color = new Color(this.opts.keyColor).getStyle();
        let arr = color.replace(/[^\d,]/g, '').split(',').map(Number) as [number, number, number];
        colorArr = arr;
      } else {
        colorArr = (this.opts.keyColor as [number, number, number]) || [0, 255, 0];
      }
      this.canvas2dInstance.init(
        this.opts.inputVideoId,
        this.opts.outputVideoId,
        colorArr,
        this.opts.threshold ?? 60,
        this.opts.pixelRatio ?? 1
      );
      this.canvas2dInstance.loop();
    }
  }

  /**
   * 切换新的视频源或抠色色彩
   */
  async setVideoSource(inputVideoId: string, color?: string) {
    if (this.threejsInstance) {
      this.threejsInstance.setVideoSource(inputVideoId, color ?? this.opts.keyColor ?? '#00ff00');
    } else if (this.canvas2dInstance) {
      let colorArr: [number, number, number] | undefined;
      if (color) {
        colorArr = typeof color === 'string' ? this.parseColor(color) : color;
      }
      this.canvas2dInstance.setVideoSource(inputVideoId, colorArr);
    }
  }

  /**
   * 彻底销毁资源
   */
  async destroy() {
    if (this.threejsInstance) {
      this.threejsInstance.destroy();
      this.threejsInstance = undefined;
    }
    if (this.canvas2dInstance) {
      this.canvas2dInstance.destroy();
      this.canvas2dInstance = undefined;
    }
  }

  /**
   * string颜色转RGB数组
   */
  private parseColor(color: string): [number, number, number] {
    let c = new Color(color).getStyle();
    let arr = c.replace(/[^\d,]/g, '').split(',').map(Number) as [number, number, number];
    return arr;
  }
}

export default UnifiedProcessingVideo;