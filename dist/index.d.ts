type RenderType = 'three' | 'canvas2d' | 'auto';
interface ProcessingOpts {
    inputVideoId: string;
    outputVideoId: string;
    keyColor?: string;
    threshold?: number;
    pixelRatio?: number;
    enableFXAA?: boolean;
    renderType?: RenderType;
}
/**
 * 视频特效/抠色处理统一入口，自动判别用Canvas或Three
 */
declare class UnifiedProcessingVideo {
    private renderType;
    private threejsInstance?;
    private canvas2dInstance?;
    private opts;
    constructor();
    /** 判定是否应该选择Three.js渲染 */
    private shouldUseThree;
    /**
     * 初始化入口，根据自动判定选择实现
     */
    initVideoScene(opts: ProcessingOpts): Promise<void>;
    /**
     * 切换新的视频源或抠色色彩
     */
    setVideoSource(inputVideoId: string, color?: string): Promise<void>;
    /**
     * 彻底销毁资源
     */
    destroy(): Promise<void>;
    /**
     * string颜色转RGB数组
     */
    private parseColor;
}
export default UnifiedProcessingVideo;
