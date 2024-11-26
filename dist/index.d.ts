import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
declare class ProcessingVideo {
    renderer: null | THREE.WebGLRenderer;
    scene: null | THREE.Scene;
    camera: null | THREE.OrthographicCamera;
    playingDom: null | HTMLDivElement;
    movie: THREE.Mesh | null;
    composer: EffectComposer | null;
    pixelRatio: number;
    resizeObserver: ResizeObserver | null;
    constructor();
    createVideoScene(inputVideoId: string, color: string | number): void;
    initVideoScene(inputVideoId: string, outputVideoId: string, color: string | number, pixelRatio?: number): Promise<unknown>;
    updateRendererSize(): void;
    onDomResize(): void;
    setVideoSource(inputVideoId: string, color: number | string): void;
    destroy(): void;
}
export default ProcessingVideo;
