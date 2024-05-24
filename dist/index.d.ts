import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
declare class ProcessingVideo {
    renderer: null | THREE.WebGLRenderer;
    scene: null | THREE.Scene;
    camera: null | THREE.OrthographicCamera;
    playingDom: null | HTMLDivElement;
    movie: THREE.Mesh | null;
    composer: EffectComposer | null;
    constructor();
    createVideoScene(inputVideoId: string, color: string | number): void;
    initVideoScene(inputVideoId: string, outputVideoId: string, color: string | number, pixelRatio?: number): Promise<unknown>;
    setVideoSource(inputVideoId: string, color: number | string): void;
    destroy(): void;
}
export default ProcessingVideo;
