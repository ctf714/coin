import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

interface CoinData {
  id: number;
  basePos: [number, number, number];
  targetPos: [number, number, number];
  rotationSpeed: number;
  modelPath: string;
  isHeads: boolean; // true正面，false反面
  totalSpin: number; // 总共要旋转多少角度
}

interface CoinThrowerProps {
  onThrowComplete: (results: boolean[]) => void; // 三个铜钱的正反面，true正面
  isThrowing: boolean;
  coinRotationX: number;
  coinRotationY: number;
  coinRotationZ: number;
  resetViewSignal: number;
}

// 单个铜钱组件
const Coin: React.FC<{
  position: [number, number, number];
  rotationSpeed: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  modelPath: string;
  isHeads: boolean;
  progress: number; // 0-1，动画进度
  totalSpin: number;
}> = ({ position, rotationSpeed: _rotationSpeed, rotationX, rotationY, rotationZ, modelPath, isHeads, progress, totalSpin }) => {
  const mtlPath = `${import.meta.env.BASE_URL}models/${modelPath}/model.mtl`;
  const objPath = `${import.meta.env.BASE_URL}models/${modelPath}/model.obj`;
  
  const materials = useLoader(MTLLoader, mtlPath);
  const obj = useLoader(OBJLoader, objPath, (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });

  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1], position[2]);
    }
  });

  // 计算当前旋转角度：空中转，落地后再转一圈
  let spinProgress = 0;
  if (progress < 0.85) {
    // 前85%的时间完成全部旋转（包括落地后转一圈）
    spinProgress = progress / 0.85;
  } else {
    // 最后15%保持不动
    spinProgress = 1;
  }
  const currentSpin = spinProgress * totalSpin;

  // 计算最终角度：正面用原值，反面旋转180度（π弧度）
  let finalRotX = rotationX;
  let finalRotY = rotationY;
  let finalRotZ = rotationZ;
  
  if (!isHeads) {
    // 反面：Y轴旋转180度让它翻过来
    finalRotY = rotationY + Math.PI;
  }

  return (
    <group ref={groupRef} scale={[0.42, 0.42, 0.42]}>
      <primitive
        object={obj}
        scale={[3, 3, 3]}
        rotation={[finalRotX, finalRotY + currentSpin, finalRotZ]}
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
}> = ({ coins, coinRotationX, coinRotationY, coinRotationZ, progress }) => {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} castShadow intensity={1.5} shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-3, 5, -3]} intensity={0.6} color="#ffd700" />

      {coins.map(coin => (
        <Coin
          key={coin.id}
          position={coin.targetPos}
          rotationSpeed={coin.rotationSpeed}
          rotationX={coinRotationX}
          rotationY={coinRotationY}
          rotationZ={coinRotationZ}
          modelPath={coin.modelPath}
          isHeads={coin.isHeads}
          progress={progress}
          totalSpin={coin.totalSpin}
        />
      ))}

      <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={10} blur={2} far={2} color="#000000" />
      <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
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
    { id: 1, basePos: [-1.5, 0.1, 0], targetPos: [-1.5, 0.1, 0], rotationSpeed: 0, modelPath: 'model1', isHeads: true, totalSpin: 0 },
    { id: 2, basePos: [0, 0.1, 0], targetPos: [0, 0.1, 0], rotationSpeed: 0, modelPath: 'model2', isHeads: true, totalSpin: 0 },
    { id: 3, basePos: [1.5, 0.1, 0], targetPos: [1.5, 0.1, 0], rotationSpeed: 0, modelPath: 'model3', isHeads: true, totalSpin: 0 },
  ]);

  const [phase, setPhase] = useState<'idle' | 'shaking' | 'done'>('idle');
  const [progress, setProgress] = useState(0); // 0-1 动画进度
  const controlsRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const defaultCameraPosition = useRef<[number, number, number]>([0, 4, 3.5]);
  const defaultTarget = useRef<[number, number, number]>([0, 0, 0]);

  const animateResetView = () => {
    if (!controlsRef.current) {
      return;
    }

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
      
      // 抛起前就随机决定每个铜钱的正反面和旋转次数
      const newCoins = coins.map(coin => {
        // 每个铜钱独立随机：0或1
        const randomValue = Math.floor(Math.random() * 2);
        const isHeads = randomValue === 1;
        
        // 空中转2-3圈，落地后再转1圈，总共3-4圈
        const airSpinCount = 2 + Math.floor(Math.random() * 2);
        const totalSpin = (airSpinCount + 1) * Math.PI * 2; // +1是落地后转的一圈
        
        return {
          ...coin,
          isHeads,
          totalSpin
        };
      });
      setCoins(newCoins);
      
      // 抛起向量：X: -0.7854, Y: 1.4312, Z: 0.9250
      const throwVec = new THREE.Vector3(-0.7854, 1.4312, 0.9250).normalize();
      
      const totalDuration = 1600; // 总动画时长
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        setProgress(progress);
        
        if (elapsed < totalDuration) {
          setCoins(prev => prev.map((coin, idx) => {
            let throwDistance = 0;
            let xOffset = 0;

            // 简单的一次抛起：0-0.625 动画，之后不动
            if (progress < 0.625) {
              // 归一化到 0-1
              const t = progress / 0.625;
              // 使用 sin 曲线模拟抛起落下：0 -> 最高点 -> 0
              throwDistance = Math.sin(t * Math.PI) * 2;
              
              // 左右摇晃
              if (t < 0.5) {
                // 上抛阶段摇晃大一点
                xOffset = Math.sin(elapsed * 0.015 + idx * 2) * 0.5 * (1 - t);
              } else {
                // 下落阶段摇晃小一点
                xOffset = Math.sin(elapsed * 0.008 + idx) * 0.3 * (1 - t);
              }
            } else {
              // 落地后不动
              throwDistance = 0;
              xOffset = 0;
            }

            // 计算沿着抛起向量的位置
            const finalX = coin.basePos[0] + xOffset + throwVec.x * throwDistance;
            const finalY = 0.1 + throwVec.y * throwDistance;
            const finalZ = throwVec.z * throwDistance;

            return {
              ...coin,
              targetPos: [finalX, finalY, finalZ]
            };
          }));

          requestAnimationFrame(animate);
        } else {
          setPhase('done');
          // 传递三个铜钱的正反面结果
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
