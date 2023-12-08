import * as THREE from 'three';
declare class ProcessingVideo {
    renderer: null | THREE.WebGLRenderer;
    scene: null | THREE.Scene;
    camera: null | THREE.OrthographicCamera;
    playingDom: null | HTMLDivElement;
    movie: THREE.Mesh | null;
    constructor();
    createVideoScene(inputVideoId: string, color: string | number): void;
    /**
     *
     * @param {string} inputVideoId 输入视频video标签 id
     * @param {string} outputVideoId 输出视频dom id
     * @param {number | string} color 要过滤的颜色 如0x00ff05
     * @returns 开始播放的promise
     */
    initVideoScene(inputVideoId: string, outputVideoId: string, color: string | number): Promise<unknown>;
    /**
     *
     * @param {string} inputVideoId 更改的视频标签id
     * @param {number | string} color 要过滤的颜色
     */
    setVideoSource(inputVideoId: string, color: number | string): void;
    destroy(): void;
}
export default ProcessingVideo;
