/// <reference types="vite/client" />

// 为 three.js GLTFLoader 添加类型声明
declare module 'three/examples/jsm/loaders/GLTFLoader' {
  import { Loader, LoadingManager, Object3D, Group } from 'three';
  export interface GLTF {
    animations: any[];
    scene: Group;
    scenes: Group[];
    cameras: any[];
    asset: object;
    parser: any;
    userData: any;
  }
  export class GLTFLoader extends Loader {
    constructor(manager?: LoadingManager);
    setDRACOLoader(dracoLoader: any): this;
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }
}


