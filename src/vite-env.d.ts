/// <reference types="vite/client" />

// 为 three.js 加载器添加类型声明
declare module 'three/examples/jsm/loaders/OBJLoader' {
  import { Loader, LoadingManager, Object3D } from 'three';
  export class OBJLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad: (object: Object3D) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    parse(text: string): Object3D;
  }
}

declare module 'three/examples/jsm/loaders/MTLLoader' {
  import { Loader, LoadingManager, Material } from 'three';
  export class MTLLoader extends Loader {
    constructor(manager?: LoadingManager);
    load(
      url: string,
      onLoad: (materials: MaterialCreator) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    parse(text: string, path: string): MaterialCreator;
    setMaterialOptions(options: any): void;
  }
  
  export class MaterialCreator {
    constructor(baseUrl?: string, options?: any);
    setCrossOrigin(value: string): void;
    setManager(manager: LoadingManager): void;
    preload(): void;
    create(materialName: string): Material | null;
    getTextureParams(value: string, matParams: any): any;
  }
}
