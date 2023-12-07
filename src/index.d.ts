declare module "video-green-screen-processing" {
  export default class ProcessingVideo {
    constructor();
    initVideoScene(
      inputVideoId: string,
      outputVideoId: string,
      color: number | string
    ): Promise<void>;
    setVideoSource(inputVideoId: string, color: number | string): void;
    destroy(): void;
  }
}
