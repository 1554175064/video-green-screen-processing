import * as THREE from 'three'
import vertexShader from "./shader/vertexShader.js";
import fragmentShader from "./shader/fragmentShader.js";

const getShaderMaterial = (
  domid: string,
  width: number,
  height: number,
  keyColor: string | number,
  filtertype: number
) => {
  var keyColorObject = new THREE.Color(keyColor);
  var video = document.getElementById(domid) as HTMLVideoElement;
  // video.loop = true;
  video?.setAttribute("webkit-playsinline", "webkit-playsinline");
  video?.setAttribute("playsinline", "playsinline");
  var videoTexture = new THREE.VideoTexture(video!);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBAFormat;
  var myuniforms = {
    pointTexture: {
      type: "t",
      value: videoTexture,
    },
    color: {
      type: "c",
      value: keyColorObject,
    },
    videowidth: {
      type: "f",
      value: width,
    },
    videoheight: {
      type: "f",
      value: height,
    },
    filterType: {
      type: "i",
      value: filtertype,
    },
    lightLevel: {
      type: "f",
      value: 0.2,
    },
    gridSize: {
      type: "f",
      value: 0.8,
    },
  };
  return {
    uniforms: myuniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
  };
};
class ProcessingVideo {
  renderer: null | THREE.WebGLRenderer = null;
  scene: null | THREE.Scene = null;
  camera: null | THREE.OrthographicCamera = null;
  playingDom: null | HTMLDivElement = null;
  movie: THREE.Mesh | null = null;
  constructor() {}
  createVideoScene(inputVideoId: string, color: string | number) {
    var movie: THREE.Mesh;
    var movieGeometry: THREE.PlaneGeometry;
    const value = getShaderMaterial(
      inputVideoId,
      this.playingDom?.clientWidth || 0,
      this.playingDom?.clientHeight || 0,
      color,
      0
    );
    var movieMaterial = new THREE.ShaderMaterial(value);
    movieGeometry = new THREE.PlaneGeometry(4, 3);
    movieMaterial.side = THREE.DoubleSide;
    movie = new THREE.Mesh(movieGeometry, movieMaterial);
    movie.position.set(0, 0, 0);
    movie.scale.set(1, 1, 1);
    movie.visible = false;
    this.scene?.remove(this.movie!);
    this.movie = movie;
    this.scene?.add(this.movie!);
  }
  /**
   *
   * @param {string} inputVideoId 输入视频video标签 id
   * @param {string} outputVideoId 输出视频dom id
   * @param {number | string} color 要过滤的颜色 如0x00ff05
   * @returns 开始播放的promise
   */
  initVideoScene(
    inputVideoId: string,
    outputVideoId: string,
    color: string | number
  ) {
    return new Promise((res) => {
      this.playingDom = document.getElementById(
        outputVideoId
      ) as HTMLDivElement;
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      // this.renderer.setSize(
      //   (this.playingDom as any).innerWidth,
      //   (this.playingDom as any).innerHeight
      // );
      this.playingDom.appendChild(this.renderer.domElement);
      this.renderer.setClearColor(0xffffff, 0);
      this.renderer.setSize(
        this.playingDom.clientWidth,
        this.playingDom.clientHeight
      );
      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-2, 2, 1.5, -1.5, 1, 10);
      this.camera.position.set(0, 0, 1);
      this.scene.add(this.camera);
      this.createVideoScene(inputVideoId, color);
      // this.scene.add(this.movie);
      const animate = () => {
        if (!this.renderer) {
          return;
        }
        if (this.movie?.visible == false) {
          this.movie.visible = true;
          res(null);
        }
        requestAnimationFrame(animate);
        this.renderer.render(this.scene!, this.camera!);
      };
      animate();
    });
  }
  /**
   *
   * @param {string} inputVideoId 更改的视频标签id
   * @param {number | string} color 要过滤的颜色
   */
  setVideoSource(inputVideoId: string, color: number | string) {
    this.createVideoScene(inputVideoId, color);
  }
  destroy() {
    if (this.playingDom) {
      this.playingDom.innerHTML = "";
      this.playingDom = null;
    }
    if (this.scene) {
      this.renderer?.dispose();
      this.renderer?.forceContextLoss();
      // this.renderer.domElement = null;

      this.renderer = null;
      this.scene = null;
      this.camera = null;
    }
  }
}
export default ProcessingVideo;

