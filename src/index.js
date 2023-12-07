"use strict";

const THREE = require("three.js");
const { vertexShader } = require("./shader/vertexShader.js");
const { fragmentShader } = require("./shader/fragmentShader.js");
const ChromaKeyMaterial = function (
  domid,
  width,
  height,
  keyColor,
  filtertype
) {
  THREE.ShaderMaterial.call(this);
  var keyColorObject = new THREE.Color(keyColor);
  var video = document.getElementById(domid);
  // video.loop = true;
  video.setAttribute("webkit-playsinline", "webkit-playsinline");
  video.setAttribute("playsinline", "playsinline");
  var videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBAFormat;
  var myuniforms = {
    texture: {
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
  this.setValues({
    uniforms: myuniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
  });
};
ChromaKeyMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
class ProcessingVideo {
  video = null;
  renderer = null;
  scene = null;
  camera = null;
  playingDom = null;
  videoSource = null;
  movie = null;
  constructor() {}
  createVideoScene(inputVideoId, color) {
    var movie;
    var movieGeometry;
    var movieMaterial;
    movieMaterial = new ChromaKeyMaterial(
      inputVideoId,
      this.playingDom.clientWidth,
      this.playingDom.clientHeight,
      color,
      0
    );
    movieGeometry = new THREE.PlaneGeometry(4, 3);
    movieMaterial.side = THREE.DoubleSide;
    movie = new THREE.Mesh(movieGeometry, movieMaterial);
    movie.position.set(0, 0, 0);
    movie.scale.set(1, 1, 1);
    movie.visible = false;
    this.scene.remove(this.movie);
    this.movie = movie;
    this.scene.add(this.movie);
  }
  /**
   *
   * @param {string} inputVideoId 输入视频video标签 id
   * @param {string} outputVideoId 输出视频dom id
   * @param {number} color 要过滤的颜色 如0x00ff05
   * @returns 开始播放的promise
   */
  initVideoScene(inputVideoId, outputVideoId, color) {
    return new Promise((res) => {
      this.playingDom = document.getElementById(outputVideoId);
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      this.renderer.setSize(
        this.playingDom.innerWidth,
        this.playingDom.innerHeight
      );
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
        if (this.movie.visible == false) {
          this.movie.visible = true;
          res();
        }
        requestAnimationFrame(animate);
        this.renderer.render(this.scene, this.camera);
      };
      animate();
    });
  }
  /**
   *
   * @param {string} inputVideoId 更改的视频标签id
   * @param {number | string} color 要过滤的颜色
   */
  setVideoSource(inputVideoId, color) {
    this.createVideoScene(inputVideoId, color);
  }
  destroy() {
    if (this.playingDom) {
      this.playingDom.innerHTML = "";
      this.playingDom = null;
    }
    if (this.scene) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
    }
  }
}
module.exports = ProcessingVideo;
