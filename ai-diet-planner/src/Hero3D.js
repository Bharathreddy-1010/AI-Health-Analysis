import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows } from '@react-three/drei';

// --- 3D MEDICAL CROSS ---
const MedicalCross = ({ position, onClick }) => {
  const ref = useRef();
  const [hovered, setHover] = useState(false);

  // Animate the rotation automatically
  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.3;
    ref.current.rotation.x += delta * 0.1;
  });

  return (
    <Float speed={2.5} rotationIntensity={1} floatIntensity={2} position={position}>
      <group 
        ref={ref} 
        onClick={(e) => {
            e.stopPropagation();
            ref.current.rotation.y += Math.PI; // Spin on click
            onClick("Navigating to AI Analysis...");
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
        scale={hovered ? 1.1 : 1}
      >
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.4, 1.4, 0.4]} />
          <meshStandardMaterial color={hovered ? "#00D4FF" : "#0A84FF"} roughness={0.1} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.4, 0.4, 0.4]} />
          <meshStandardMaterial color={hovered ? "#00D4FF" : "#0A84FF"} roughness={0.1} metalness={0.5} />
        </mesh>
      </group>
    </Float>
  );
};

// --- 3D PILL/CAPSULE ---
const HealthPill = ({ position, onClick }) => {
  const ref = useRef();
  const [hovered, setHover] = useState(false);

  useFrame((state, delta) => {
    ref.current.rotation.z -= delta * 0.4;
    ref.current.rotation.x += delta * 0.2;
  });

  return (
    <Float speed={2} rotationIntensity={2} floatIntensity={1.5} position={position}>
      <mesh 
        ref={ref}
        onClick={(e) => {
            e.stopPropagation();
            ref.current.rotation.z -= Math.PI * 2; // Fast spin on click
            onClick("Opening Custom Diet Plans...");
        }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
        scale={hovered ? 1.1 : 1}
      >
        <capsuleGeometry args={[0.4, 0.8, 16, 32]} />
        <meshStandardMaterial color={hovered ? "#32D74B" : "#FFFFFF"} roughness={0.2} metalness={0.1} />
      </mesh>
    </Float>
  );
};

// --- MAIN CANVAS SETUP ---
export default function Hero3D({ onInteract }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
      {/* pointerEvents: 'auto' on Canvas allows clicks on the 3D items without blocking the rest of your site */}
      <Canvas style={{ pointerEvents: 'auto' }} camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        
        {/* Left side Cross */}
        <MedicalCross position={[-3, 1, -1]} onClick={onInteract} />
        
        {/* Right side Pill */}
        <HealthPill position={[3, -0.5, -2]} onClick={onInteract} />

        {/* Soft shadow on the "floor" */}
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={2} far={4} />
      </Canvas>
    </div>
  );
}