import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// 全局预加载模型（所有实例共享同一个 GLTF）
let cachedGLTF: GLTF | null = null;
let cachedLoadError: boolean = false;

const MODEL_URL = `${import.meta.env.BASE_URL}models/model-final.glb`;

type LoadState = 'loading' | 'loaded' | 'error';

const useSharedGLTF = () => {
  const [gltf, setGltf] = useState<GLTF | null>(cachedGLTF);
  const [loadState, setLoadState] = useState<LoadState>(cachedGLTF ? 'loaded' : cachedLoadError ? 'error' : 'loading');

  useEffect(() => {
    if (cachedGLTF || cachedLoadError) return;
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
    loader.setDRACOLoader(dracoLoader);
    loader.load(
      MODEL_URL,
      (result) => {
        cachedGLTF = result;
        setGltf(result);
        setLoadState('loaded');
      },
      undefined,
      (error) => {
        console.error('Failed to load 3D coin model:', error);
        cachedLoadError = true;
        setLoadState('error');
      },
    );
  }, []);
  return { gltf, loadState };
};

interface CoinData {
  id: number;
  basePos: [number, number, number];
  targetPos: [number, number, number];
  rotationSpeed: number;
  isHeads: boolean;
  totalSpin: number;
}

interface CoinThrowerProps {
  onThrowComplete: (results: boolean[]) => void;
  isThrowing: boolean;
  coinRotationX: number;
  coinRotationY: number;
  coinRotationZ: number;
  resetViewSignal: number;
  onModelLoaded?: () => void;
  isMobile?: boolean;
  /** 随机数生成后立即调用，可修改硬币结果（用于凶卦过滤等） */
  augmentResult?: (results: boolean[]) => boolean[];
}

// 单个铜钱组件
const Coin: React.FC<{
  position: [number, number, number];
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  isHeads: boolean;
  progress: number;
  totalSpin: number;
  model: THREE.Group;
  isMobile?: boolean;
}> = ({ position, rotationX, rotationY, rotationZ, isHeads, progress, totalSpin, model, isMobile }) => {
  const groupRef = useRef<THREE.Group>(null);
  const clonedModel = useMemo(() => model.clone(true), [model]);
  // desktop: 0.42*3=1.26, spacing=1.5, ratio≈0.84
  // mobile:  0.36*2.7=0.972, spacing=0.65, ratio≈0.67 — 视觉紧凑但铜钱明显更大
  const s = isMobile ? [0.36, 0.36, 0.36] : [0.42, 0.42, 0.42];
  const modelScale = isMobile ? [2.7, 2.7, 2.7] : [3, 3, 3];

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2]);
    }
  });

  const spinProgress = progress < 0.85 ? progress / 0.85 : 1;
  const currentSpin = spinProgress * totalSpin;
  const finalRotY = isHeads ? rotationY : rotationY + Math.PI;

  return (
    <group ref={groupRef} scale={s as [number, number, number]}>
      <primitive
        object={clonedModel}
        scale={modelScale as [number, number, number]}
        rotation={[rotationX, finalRotY + currentSpin, rotationZ]}
      />
    </group>
  );
};

// 主场景
// Fallback：模型加载失败时渲染简单铜钱几何体
const FallbackCoin: React.FC<{ position: [number, number, number]; isMobile?: boolean }> = ({ position, isMobile }) => {
  const s = isMobile ? 0.36 : 0.42;
  return (
    <group position={position} scale={[s, s, s]}>
      <mesh>
        <cylinderGeometry args={[0.5, 0.5, 0.08, 32]} />
        <meshStandardMaterial color="#d4a853" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.04, 4]} />
        <meshStandardMaterial color="#b8943a" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh>
        <ringGeometry args={[0.3, 0.4, 8]} />
        <meshStandardMaterial color="#b8943a" metalness={0.7} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// 主场景
const Scene: React.FC<{
  coins: CoinData[];
  coinRotationX: number;
  coinRotationY: number;
  coinRotationZ: number;
  progress: number;
  controlsRef: React.MutableRefObject<any>;
  modelScene: THREE.Group | null;
  useFallback: boolean;
  isMobile?: boolean;
}> = ({ coins, coinRotationX, coinRotationY, coinRotationZ, progress, controlsRef, modelScene, useFallback, isMobile }) => {

  if (!modelScene && !useFallback) {
    return null;
  }

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} castShadow intensity={1.5} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3, 5, -3]} intensity={0.6} color="#ffd700" />

      {useFallback
        ? coins.map(coin => (
            <FallbackCoin key={coin.id} position={coin.targetPos} isMobile={isMobile} />
          ))
        : coins.map(coin => (
            <Coin
              key={coin.id}
              position={coin.targetPos}
              rotationX={coinRotationX}
              rotationY={coinRotationY}
              rotationZ={coinRotationZ}
              isHeads={coin.isHeads}
              progress={progress}
              totalSpin={coin.totalSpin}
              model={modelScene!}
              isMobile={isMobile}
            />
          ))}

      <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={10} blur={2} far={2} color="#000000" />
      <OrbitControls ref={controlsRef} enableZoom={true} enablePan={true} enableRotate={true} />
    </>
  );
};

const CoinThrower: React.FC<CoinThrowerProps> = ({
  onThrowComplete,
  isThrowing,
  coinRotationX,
  coinRotationY,
  coinRotationZ,
  resetViewSignal,
  onModelLoaded,
  isMobile,
  augmentResult,
}) => {
  const { gltf, loadState } = useSharedGLTF();
  const modelScene = gltf?.scene ?? null;
  const useFallback = loadState === 'error';

  // 移动端缩小铜钱间距、拉远镜头
  const coinSpacing = isMobile ? 1.2 : 1.5;
  // 手机端镜头拉近，确保大铜钱在屏幕内
  const camPos: [number, number, number] = isMobile ? [0, 3.5, 2.8] : [0, 4, 3.5];
  const camFov = isMobile ? 45 : 45;

  // 模型加载完成通知父组件
  useEffect(() => {
    if (modelScene && onModelLoaded) {
      onModelLoaded();
    }
  }, [modelScene, onModelLoaded]);

  const makeCoins = (spacing: number): CoinData[] => [
    { id: 1, basePos: [-spacing, 0.1, 0], targetPos: [-spacing, 0.1, 0], rotationSpeed: 0, isHeads: true, totalSpin: 0 },
    { id: 2, basePos: [0, 0.1, 0], targetPos: [0, 0.1, 0], rotationSpeed: 0, isHeads: true, totalSpin: 0 },
    { id: 3, basePos: [spacing, 0.1, 0], targetPos: [spacing, 0.1, 0], rotationSpeed: 0, isHeads: true, totalSpin: 0 },
  ];

  const [coins, setCoins] = useState<CoinData[]>(() => makeCoins(coinSpacing));

  // 修复: useDeviceDetect 首次渲染 isMobile=false, useEffect 后才变 true —
  // useState 初始化器只用第一次的值, 须在 coinSpacing 变化时同步位置
  useEffect(() => {
    setCoins(makeCoins(coinSpacing));
  }, [coinSpacing]);

  const [phase, setPhase] = useState<'idle' | 'shaking' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const controlsRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const defaultCameraPosition = useRef<[number, number, number]>(camPos);
  const defaultTarget = useRef<[number, number, number]>([0, 0, 0]);

  const animateResetView = () => {
    if (!controlsRef.current) return;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const camera = controlsRef.current.object as THREE.PerspectiveCamera;
    const startCameraPosition = camera.position.clone();
    const startTarget = controlsRef.current.target.clone();
    const endCameraPosition = new THREE.Vector3(...defaultCameraPosition.current);
    const endTarget = new THREE.Vector3(...defaultTarget.current);
    const duration = 600;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(startCameraPosition, endCameraPosition, eased);
      controlsRef.current.target.lerpVectors(startTarget, endTarget, eased);
      controlsRef.current.update();

      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (!isThrowing && phase === 'done') {
      setPhase('idle');
    }
  }, [isThrowing, phase]);

  useEffect(() => {
    animateResetView();
  }, [resetViewSignal]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isThrowing && phase === 'idle') {
      setPhase('shaking');
      setProgress(0);

      const newCoins = coins.map(coin => {
        const randomValue = Math.floor(Math.random() * 2);
        const isHeads = randomValue === 1;
        const airSpinCount = 2 + Math.floor(Math.random() * 2);
        const totalSpin = (airSpinCount + 1) * Math.PI * 2;
        return { ...coin, isHeads, totalSpin };
      });

      // 凶卦过滤：随机数生成后立即判断并修正，动画使用修正后的结果
      let finalCoins = newCoins;
      if (augmentResult) {
        const rawResults = newCoins.map(c => c.isHeads);
        const filtered = augmentResult(rawResults);
        finalCoins = newCoins.map((coin, i) => ({
          ...coin,
          isHeads: filtered[i],
        }));
      }
      // 保存修正后的结果，onThrowComplete 也使用修正后的值
      const isHeadsResults = finalCoins.map(c => c.isHeads);

      setCoins(finalCoins);

      const throwVec = new THREE.Vector3(0, 0.45, 1).normalize();
      const totalDuration = 1600;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        setProgress(progress);

        if (elapsed < totalDuration) {
          setCoins(prev => prev.map((coin, idx) => {
            let throwDistance = 0;
            let xOffset = 0;

            if (progress < 0.625) {
              const t = progress / 0.625;
              throwDistance = Math.sin(t * Math.PI) * 2;
              // 单一连续抖动，频率和幅度平滑递减，消除两段跳跃
              const shakeAmp = 0.6 * (1 - t);
              const shakeFreq = 10 + (1 - t) * 6;
              xOffset = Math.sin(t * shakeFreq + idx * 2.5) * shakeAmp;
            }

            const finalX = coin.basePos[0] + xOffset + throwVec.x * throwDistance;
            const finalY = 0.1 + throwVec.y * throwDistance;
            const finalZ = throwVec.z * throwDistance;

            return { ...coin, targetPos: [finalX, finalY, finalZ] };
          }));

          requestAnimationFrame(animate);
        } else {
          setPhase('done');
          onThrowComplete(isHeadsResults);
        }
      };

      animate();
    }
  }, [isThrowing, phase, onThrowComplete, coins]);

  return (
    <div className="w-full h-full relative">
      {/* 加载中提示 */}
      {loadState === 'loading' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <p className="text-amber-500/60 text-xs tracking-wider animate-pulse">
            铜钱加载中...
          </p>
        </div>
      )}
      <Canvas
        camera={{ position: camPos, fov: camFov }}
        gl={{ alpha: true, premultipliedAlpha: true }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); }}
        style={{ background: 'transparent' }}
      >
        <Scene
          coins={coins}
          coinRotationX={coinRotationX}
          coinRotationY={coinRotationY}
          coinRotationZ={coinRotationZ}
          progress={progress}
          controlsRef={controlsRef}
          modelScene={modelScene}
          useFallback={useFallback}
          isMobile={isMobile}
        />
      </Canvas>
    </div>
  );
};

export default CoinThrower;
