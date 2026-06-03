import React, { useRef, useState, useEffect, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

interface CoinProps {
  position: [number, number, number];
  rotationSpeed: number;
  isHeads: boolean;
  scale?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  id: number;
}

const CoinModel: React.FC<{
  scale: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}> = ({ scale, rotationX, rotationY, rotationZ }) => {
  // 加载材质
  const materials = useLoader(MTLLoader, '/models/model.mtl');
  materials.preload();
  
  // 加载模型
  const obj = useLoader(OBJLoader, '/models/model.obj', (loader) => {
    loader.setMaterials(materials);
  });

  return (
    <primitive
      object={obj}
      scale={[scale * 3, scale * 3, scale * 3]}
      rotation={[rotationX, rotationY, rotationZ]}
    />
  );
};

const Coin: React.FC<CoinProps> = ({ 
  position, 
  rotationSpeed: _rotationSpeed, 
  isHeads: _isHeads, 
  scale = 1,
  rotationX = -2.5133,
  rotationY = -0.6807,
  rotationZ = -3.1416,
  id: _id
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [targetPosition, setTargetPosition] = useState<[number, number, number]>(position);
  const [currentPos, setCurrentPos] = useState<[number, number, number]>(position);
  const [currentSpin, setCurrentSpin] = useState(0);

  useFrame((_, delta) => {
    if (meshRef.current) {
      // 铜钱在桌面上旋转
      if (_rotationSpeed !== 0) {
        setCurrentSpin(prev => prev + delta * _rotationSpeed);
      }

      // 平滑移动
      const dx = targetPosition[0] - currentPos[0];
      const dy = targetPosition[1] - currentPos[1];
      const dz = targetPosition[2] - currentPos[2];

      const newPos: [number, number, number] = [
        currentPos[0] + dx * delta * 12,
        currentPos[1] + dy * delta * 12,
        currentPos[2] + dz * delta * 12
      ];
      setCurrentPos(newPos);

      meshRef.current.position.set(newPos[0], newPos[1], newPos[2]);
    }
  });

  useEffect(() => {
    setTargetPosition(position);
  }, [position]);

  return (
    <group ref={meshRef} position={currentPos} scale={[scale * 0.35, scale * 0.35, scale * 0.35]}>
      <Suspense fallback={null}>
        <CoinModel 
          scale={scale} 
          rotationX={rotationX} 
          rotationY={rotationY + currentSpin} 
          rotationZ={rotationZ} 
        />
      </Suspense>
    </group>
  );
};

export default Coin;
