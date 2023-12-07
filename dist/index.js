"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var THREE = require("three.js");
var _require = require("./shader/vertexShader.js"),
  vertexShader = _require.vertexShader;
var _require2 = require("./shader/fragmentShader.js"),
  fragmentShader = _require2.fragmentShader;
var ChromaKeyMaterial = function ChromaKeyMaterial(domid, width, height, keyColor, filtertype) {
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
      value: videoTexture
    },
    color: {
      type: "c",
      value: keyColorObject
    },
    videowidth: {
      type: "f",
      value: width
    },
    videoheight: {
      type: "f",
      value: height
    },
    filterType: {
      type: "i",
      value: filtertype
    },
    lightLevel: {
      type: "f",
      value: 0.2
    },
    gridSize: {
      type: "f",
      value: 0.8
    }
  };
  this.setValues({
    uniforms: myuniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true
  });
};
ChromaKeyMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
var ProcessingVideo = /*#__PURE__*/function () {
  function ProcessingVideo() {
    _classCallCheck(this, ProcessingVideo);
    _defineProperty(this, "video", null);
    _defineProperty(this, "renderer", null);
    _defineProperty(this, "scene", null);
    _defineProperty(this, "camera", null);
    _defineProperty(this, "playingDom", null);
    _defineProperty(this, "videoSource", null);
    _defineProperty(this, "movie", null);
  }
  _createClass(ProcessingVideo, [{
    key: "createVideoScene",
    value: function createVideoScene(inputVideoId, color) {
      var movie;
      var movieGeometry;
      var movieMaterial;
      movieMaterial = new ChromaKeyMaterial(inputVideoId, this.playingDom.clientWidth, this.playingDom.clientHeight, color, 0);
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
  }, {
    key: "initVideoScene",
    value: function initVideoScene(inputVideoId, outputVideoId, color) {
      var _this = this;
      return new Promise(function (res) {
        _this.playingDom = document.getElementById(outputVideoId);
        _this.renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true
        });
        _this.renderer.setSize(_this.playingDom.innerWidth, _this.playingDom.innerHeight);
        _this.playingDom.appendChild(_this.renderer.domElement);
        _this.renderer.setClearColor(0xffffff, 0);
        _this.renderer.setSize(_this.playingDom.clientWidth, _this.playingDom.clientHeight);
        _this.scene = new THREE.Scene();
        _this.camera = new THREE.OrthographicCamera(-2, 2, 1.5, -1.5, 1, 10);
        _this.camera.position.set(0, 0, 1);
        _this.scene.add(_this.camera);
        _this.createVideoScene(inputVideoId, color);
        // this.scene.add(this.movie);
        var animate = function animate() {
          if (!_this.renderer) {
            return;
          }
          if (_this.movie.visible == false) {
            _this.movie.visible = true;
            res();
          }
          requestAnimationFrame(animate);
          _this.renderer.render(_this.scene, _this.camera);
        };
        animate();
      });
    }
    /**
     *
     * @param {string} inputVideoId 更改的视频标签id
     * @param {number | string} color 要过滤的颜色
     */
  }, {
    key: "setVideoSource",
    value: function setVideoSource(inputVideoId, color) {
      this.createVideoScene(inputVideoId, color);
    }
  }, {
    key: "destroy",
    value: function destroy() {
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
  }]);
  return ProcessingVideo;
}();
module.exports = ProcessingVideo;