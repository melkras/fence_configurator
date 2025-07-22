import { OrbitControls, Stage, useTexture } from "@react-three/drei";
import { useConfigurator } from "../contexts/Configurator";
import { Fence } from "./Fence";

export const Experience = () => {
  const { fenceCount, fenceWidth, postGap } = useConfigurator();
  // Load the grass texture
  const grassTexture = useTexture("textures/grass.jpg");
  // Tile settings
  const areaSize = 40; // The current ground plane size
  const tileSize = 2; // Each tile will be 0.5x0.5
  const tilesPerSide = Math.ceil(areaSize / tileSize);
  const offset = -areaSize / 2 + tileSize / 2;
  return (
    <>
      {/* Grass ground plane as a grid of tiles covering the same area as before */}
      {Array.from({ length: tilesPerSide }).map((_, ix) =>
        Array.from({ length: tilesPerSide }).map((_, iz) => (
          <mesh
            key={`tile-${ix}-${iz}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[offset + ix * tileSize, -0.87, offset + iz * tileSize]}
            receiveShadow
          >
            <planeGeometry args={[tileSize, tileSize]} />
            <meshStandardMaterial map={grassTexture} />
          </mesh>
        ))
      )}
      <Stage
        key={`${fenceCount}-${fenceWidth}-${postGap}`}
        intensity={0.5}
        environment={null} // Remove HDRI for solid color
        shadows={{
          type: "accumulative",
          color: "#222222", // darker shadow color
          opacity: 1,
        }}
        adjustCamera={1}
      >
        <Fence />
      </Stage>
      <OrbitControls
        makeDefault
        enablePan={true}
        enableZoom={true}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={-Infinity}
        maxAzimuthAngle={Infinity}
        minDistance={2}
        maxDistance={Math.max(8, fenceWidth * fenceCount * 0.8)}
      />
    </>
  );
};
