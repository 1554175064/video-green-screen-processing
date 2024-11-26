import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
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
  composer: EffectComposer | null = null;
  pixelRatio: number = 1;
  resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.onDomResize = this.onDomResize.bind(this);
  }

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

  initVideoScene(
    inputVideoId: string,
    outputVideoId: string,
    color: string | number,
    pixelRatio = 1
  ) {
    return new Promise((res) => {
      this.pixelRatio = pixelRatio;
      this.playingDom = document.getElementById(outputVideoId) as HTMLDivElement;
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      this.renderer.setPixelRatio(window.devicePixelRatio); // 设置像素比率
      this.playingDom.appendChild(this.renderer.domElement);
      this.renderer.setClearColor(0xffffff, 0);

      this.updateRendererSize();

      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-2, 2, 1.5, -1.5, 1, 10);
      this.camera.position.set(0, 0, 1);
      this.scene.add(this.camera);

      this.createVideoScene(inputVideoId, color);

      // FXAA
      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      const fxaaPass = new ShaderPass(FXAAShader);
      fxaaPass.uniforms["resolution"].value.set(
        1 / (this.playingDom.clientWidth * pixelRatio),
        1 / (this.playingDom.clientHeight * pixelRatio)
      );
      this.composer.addPass(fxaaPass);

      const animate = () => {
        if (!this.renderer) {
          return;
        }
        if (this.movie?.visible == false) {
          this.movie.visible = true;
          res(null);
        }
        requestAnimationFrame(animate);
        this.composer!.render();
      };
      animate();

      this.resizeObserver = new ResizeObserver(this.onDomResize);
      this.resizeObserver.observe(this.playingDom);
    });
  }

  updateRendererSize() {
    if (this.renderer && this.playingDom) {
      const width = this.playingDom.clientWidth * this.pixelRatio;
      const height = this.playingDom.clientHeight * this.pixelRatio;
      this.renderer.setSize(width, height, false);
      this.renderer.domElement.style.width = `${this.playingDom.clientWidth}px`;
      this.renderer.domElement.style.height = `${this.playingDom.clientHeight}px`;

      if (this.composer) {
        this.composer.setSize(width, height);
        const fxaaPass = this.composer.passes.find(
          (pass) => pass instanceof ShaderPass
        ) as ShaderPass;
        if (fxaaPass && fxaaPass.uniforms["resolution"]) {
          fxaaPass.uniforms["resolution"].value.set(1 / width, 1 / height);
        }
      }
    }
  }

  onDomResize() {
    this.updateRendererSize();
  }

  setVideoSource(inputVideoId: string, color: number | string) {
    this.createVideoScene(inputVideoId, color);
  }

  destroy() {
    if (this.resizeObserver && this.playingDom) {
      this.resizeObserver.unobserve(this.playingDom);
      this.resizeObserver = null;
    }
    if (this.playingDom) {
      this.playingDom.innerHTML = "";
      this.playingDom = null;
    }
    if (this.scene) {
      this.renderer?.dispose();
      this.renderer?.forceContextLoss();
      this.renderer = null;
      this.scene = null;
      this.camera = null;
    }
  }
}

export default ProcessingVideo;