import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 预加载 Draco 解码器（全局单例）
let dracoLoader: DRACOLoader | null = null;
const getDracoLoader = () => {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  }
  return dracoLoader;
};

// 全局预加载模型（所有实例共享同一个 GLTF）
let cachedGLTF: GLTF | null = null;

const MODEL_URL = `${import.meta.env.BASE_URL}models/model-final.glb`;

const useSharedGLTF = () => {
  const [gltf, setGltf] = useState<GLTF | null>(cachedGLTF);
  useEffect(() => {
    if (cachedGLTF) return;
    const loader = new GLTFLoader();
    loader.setDRACOLoader(getDracoLoader());
    loader.load(MODEL_URL, (result) => {
      cachedGLTF = result;
      setGltf(result);
    });
  }, []);
  return gltf;
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
}> = ({ position, rotationX, rotationY, rotationZ, isHeads, progress, totalSpin, model }) => {
  const groupRef = useRef<THREE.Group>(null);
  // 每个实例使用 clone 避免共享变换
  const clonedModel = useMemo(() => model.clone(true), [model]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2]);
    }
  });

  // 计算当前旋转角度
  const spinProgress = progress < 0.85 ? progress / 0.85 : 1;
  const currentSpin = spinProgress * totalSpin;

  // 反面 Y 轴翻转 180 度
  const finalRotY = isHeads ? rotationY : rotationY + Math.PI;

  return (
    <group ref={groupRef} scale={[0.42, 0.42, 0.42]}>
      <primitive
        object={clonedModel}
        scale={[3, 3, 3]}
        rotation={[rotationX, finalRotY + currentSpin, rotationZ]}
      />
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
}> = ({ coins, coinRotationX, coinRotationY, coinRotationZ, progress, controlsRef }) => {
  const gltf = useSharedGLTF();

  // 获取模型根节点
  const modelScene = gltf?.scene;

  if (!modelScene) {
    return null;
  }

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} castShadow intensity={1.5} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3, 5, -3]} intensity={0.6} color="#ffd700" />

      {coins.map(coin => (
        <Coin
          key={coin.id}
          position={coin.targetPos}
          rotationX={coinRotationX}
          rotationY={coinRotationY}
          rotationZ={coinRotationZ}
          isHeads={coin.isHeads}
          progress={progress}
          totalSpin={coin.totalSpin}
          model={modelScene}
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
  resetViewSignal
}) => {
  const [coins, setCoins] = useState<CoinData[]>([
    { id: 1, basePos: [-1.5, 0.1, 0], targetPos: [-1.5, 0.1, 0], rotationSpeed: 0, isHeads: true, totalSpin: 0 },
    { id: 2, basePos: [0, 0.1, 0], targetPos: [0, 0.1, 0], rotationSpeed: 0, isHeads: true, totalSpin: 0 },
    { id: 3, basePos: [1.5, 0.1, 0], targetPos: [1.5, 0.1, 0], rotationSpeed: 0, isHeads: true, totalSpin: 0 },
  ]);

  const [phase, setPhase] = useState<'idle' | 'shaking' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const controlsRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const defaultCameraPosition = useRef<[number, number, number]>([0, 4, 3.5]);
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
      setCoins(newCoins);

      const throwVec = new THREE.Vector3(-0.7854, 1.4312, 0.9250).normalize();
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
              if (t < 0.5) {
                xOffset = Math.sin(elapsed * 0.015 + idx * 2) * 0.5 * (1 - t);
              } else {
                xOffset = Math.sin(elapsed * 0.008 + idx) * 0.3 * (1 - t);
              }
            }

            const finalX = coin.basePos[0] + xOffset + throwVec.x * throwDistance;
            const finalY = 0.1 + throwVec.y * throwDistance;
            const finalZ = throwVec.z * throwDistance;

            return { ...coin, targetPos: [finalX, finalY, finalZ] };
          }));

          requestAnimationFrame(animate);
        } else {
          setPhase('done');
          onThrowComplete(newCoins.map(c => c.isHeads));
        }
      };

      animate();
    }
  }, [isThrowing, phase, onThrowComplete, coins]);

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 4, 3.5], fov: 45 }} gl={{ alpha: true }}>
        <Scene
          coins={coins}
          coinRotationX={coinRotationX}
          coinRotationY={coinRotationY}
          coinRotationZ={coinRotationZ}
          progress={progress}
          controlsRef={controlsRef}
        />
      </Canvas>
    </div>
  );
};

export default CoinThrower;
