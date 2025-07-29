import { useGLTF, useTexture, Stage, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';

import { useConfigurator } from '../../contexts/configurator';

import Fence from './fence';

function withCanvas(Component: React.ComponentType) {
  return function WrappedWithCanvas(
    props: React.ComponentProps<typeof Component>
  ) {
    return (
      <Canvas
        shadows
        camera={{ position: [4, 4, -8], fov: 35 }}
        style={{
          background: 'linear-gradient(rgb(183 209 255), rgb(148, 201, 215))',
        }}
      >
        <Component {...props} />
      </Canvas>
    );
  };
}

function FencePlannerInner() {
  const { topView, fenceCount = 1, fenceWidth, postGap } = useConfigurator();

  // Load the grass texture
  const grassTexture = useTexture('textures/grass.jpg');
  // Tile settings
  const areaSize = 40; // The current ground plane size
  const tileSize = 2; // Each tile will be 0.5x0.5
  const tilesPerSide = Math.ceil(areaSize / tileSize);
  const offset = -areaSize / 2 + tileSize / 2;

  // Function to calculate distance between two points
  const calculateDistance = (
    point1: [number, number],
    point2: [number, number]
  ) => {
    const dx = point2[0] - point1[0];
    const dy = point2[1] - point1[1];
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Function to calculate angle between two points
  const calculateAngle = (
    point1: [number, number],
    point2: [number, number]
  ) => {
    const dx = point2[0] - point1[0];
    const dy = point2[1] - point1[1];
    return Math.atan2(dy, dx);
  };

  console.log('TopView Points:', topView);

  return (
    <>
      {/* Grass ground plane as a grid of tiles covering the same area as before */}
      {Array.from({ length: tilesPerSide }).map((_, ix) =>
        Array.from({ length: tilesPerSide }).map((_, iz) => (
          <mesh
            key={`tile-${iz + ix}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[offset + ix * tileSize, -0.87, offset + iz * tileSize]}
            receiveShadow
          >
            <planeGeometry args={[tileSize, tileSize]} />
            <meshStandardMaterial map={grassTexture} />
          </mesh>
        ))
      )}
      {/* Posts and fences along the topView drawing */}
      {topView.map((point, index) => {
        if (index === topView.length - 1) return null; // Skip the last point

        const nextPoint = topView[index + 1];
        const distance = calculateDistance(point, nextPoint);
        const angle = calculateAngle(point, nextPoint);

        console.log(
          `Segment ${index}: Start=${point}, End=${nextPoint}, Distance=${distance.toFixed(2)}, Angle=${angle.toFixed(2)}`
        );

        return (
          <group key={`segment-${index}`}>
            {/* Fence segment between the current and next point */}
            {(() => {
              const numFences = Math.floor(distance / fenceWidth); // Number of full fence pieces
              let remainingGap = distance % fenceWidth; // Remaining gap to adjust the last fence

              // Ensure the remaining gap is not too small to render a fence
              const minFenceWidth = 0.5; // Minimum width for a visible fence
              if (remainingGap > 0 && remainingGap < minFenceWidth) {
                remainingGap += fenceWidth; // Add the small gap to the last full fence
              }

              return Array.from({
                length: numFences + (remainingGap > 0 ? 1 : 0),
              }).map((_, i) => {
                const isLastFence = i === numFences && remainingGap > 0;
                const currentFenceWidth = isLastFence
                  ? remainingGap
                  : fenceWidth; // Adjust the last fence width

                // Calculate the angle between the current fence and the next one
                let hideEndPost = false;
                let hideStartPost = false;
                if (index < topView.length - 2) {
                  const nextNextPoint = topView[index + 2];
                  const angleToNextFence = Math.abs(
                    calculateAngle(nextPoint, nextNextPoint) - angle
                  );
                  hideEndPost = Math.abs(angleToNextFence - Math.PI / 2) > 0.01; // Check if the angle is not 90 degrees
                }

                // Check if the start post overlaps with the previous fence's end post
                if (i === 0 && index > 0) {
                  const prevPoint = topView[index - 1];
                  const prevAngle = calculateAngle(prevPoint, point);
                  const angleToPrevFence = Math.abs(angle - prevAngle);
                  hideStartPost =
                    Math.abs(angleToPrevFence - Math.PI / 2) > 0.01; // Check if the angle is not 90 degrees
                }

                // Adjust the starting position to align with the edge of the red corner post
                const fraction =
                  (i * fenceWidth + (isLastFence ? remainingGap / 2 : 0)) /
                  distance; // Fraction along the line
                const x = point[0] + fraction * (nextPoint[0] - point[0]);
                const z = point[1] + fraction * (nextPoint[1] - point[1]);

                return (
                  <group
                    key={`fence-${index}-${i}`}
                    position={[x, -0.87, z]} // Adjusted y-position to align with the grass surface
                    rotation={[0, -angle, 0]}
                  >
                    {/* Pass the width prop directly to the Fence component */}
                    <Fence
                      width={currentFenceWidth * 100}
                      showEndPosts={!hideEndPost || isLastFence}
                      showStartPosts={!hideStartPost}
                    />
                  </group>
                );
              });
            })()}
          </group>
        );
      })}
      <Stage
        key={`${fenceCount}-${fenceWidth}-${postGap}`}
        environment={'park'}
        shadows={{
          type: 'accumulative',
          color: '#222222', // darker shadow color
          opacity: 1,
        }}
        adjustCamera={1}
      >
        {/* <Fence width={fenceWidth} /> */}
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
}

const FencePlannerInnerWithCanvas = withCanvas(FencePlannerInner);

export default function FencePlanner() {
  return <FencePlannerInnerWithCanvas />;
}

useGLTF.preload('./models/fence.glb');
