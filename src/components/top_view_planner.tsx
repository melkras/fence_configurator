import { OrthographicCamera, Grid, Line } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Vector3, TextureLoader, RepeatWrapping } from 'three';

type Point = [number, number]; // 2D XZ point
type CameraRefType = {
  zoom: number;
  updateProjectionMatrix: () => void;
};

function snapToGrid(val: number, step: number) {
  return Math.round(val / step) * step;
}

function getSnappedPoint(x: number, z: number, gridSize: number): Point {
  return [snapToGrid(x, gridSize), snapToGrid(z, gridSize)];
}

function getSnappedAngle(prev: Point, next: Point, snapAngle: number): Point {
  const dx = next[0] - prev[0];
  const dz = next[1] - prev[1];
  const angle = Math.atan2(dz, dx);
  const snappedAngle = Math.round(angle / snapAngle) * snapAngle;
  const length = Math.sqrt(dx * dx + dz * dz);
  return [
    prev[0] + Math.cos(snappedAngle) * length,
    prev[1] + Math.sin(snappedAngle) * length,
  ];
}

export default function TopViewPlanner() {
  const [points, setPoints] = useState<Point[]>([]);
  const [preview, setPreview] = useState<Point | null>(null);
  const [completedDrawings, setCompletedDrawings] = useState<Point[][]>([]);
  const cameraRef = useRef<CameraRefType>(null);

  const shouldSnapToGrid = true;
  const gridSize = 1;
  const angleLock = true;
  const angleStepDegrees = 45;

  const grassTexture = useMemo(() => {
    const texture = new TextureLoader().load('/textures/grass.jpg');
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(500, 500); // Adjust repeat values as needed
    return texture;
  }, []);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!e.point) return;
    const [x, , z] = e.point.toArray();
    let [snappedX, snappedZ] = shouldSnapToGrid
      ? getSnappedPoint(x, z, gridSize)
      : [x, z];

    if (angleLock && points.length > 0) {
      const last = points[points.length - 1];
      const angleStepRad = (angleStepDegrees * Math.PI) / 180;
      [snappedX, snappedZ] = getSnappedAngle(
        last,
        [snappedX, snappedZ],
        angleStepRad
      );
    }

    // Check if the new point connects back to the starting point
    if (points.length > 1) {
      const [startX, startZ] = points[0];
      const distance = Math.sqrt(
        Math.pow(snappedX - startX, 2) + Math.pow(snappedZ - startZ, 2)
      );
      if (distance < gridSize * 0.5) {
        // Threshold to consider it connected
        setCompletedDrawings([
          ...completedDrawings,
          [...points, [startX, startZ]],
        ]); // Save the completed drawing including the last line
        setPoints([]); // Reset points to start a new drawing
        setPreview(null);
        return;
      }
    }

    setPoints([...points, [snappedX, snappedZ]]);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!e.point) return;
    const [x, , z] = e.point.toArray();
    let [snappedX, snappedZ] = shouldSnapToGrid
      ? getSnappedPoint(x, z, gridSize)
      : [x, z];

    if (angleLock && points.length > 0) {
      const last = points[points.length - 1];
      const angleStepRad = (angleStepDegrees * Math.PI) / 180;
      [snappedX, snappedZ] = getSnappedAngle(
        last,
        [snappedX, snappedZ],
        angleStepRad
      );
    }

    setPreview([snappedX, snappedZ]);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (cameraRef.current) {
      cameraRef.current.zoom = Math.max(
        10,
        Math.min(100, cameraRef.current.zoom - e.deltaY * 0.01)
      );
      cameraRef.current.updateProjectionMatrix();
    }
  };

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel);
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  return (
    <Canvas orthographic style={{ height: '100vh', background: '#eee' }}>
      <OrthographicCamera
        makeDefault
        // @ts-ignore
        ref={cameraRef}
        position={[0, 10, 0]}
        zoom={50}
        up={[0, 0, 1]}
        onUpdate={(self) => self.lookAt(0, 0, 0)}
      />
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial map={grassTexture} />
      </mesh>
      <Grid
        args={[100, 100]}
        position={[0, 0.01, 0]} // Slightly above y=0 to avoid z-fighting
        sectionSize={gridSize} // Keep only larger grid lines
        sectionColor={'#888'}
        cellSize={gridSize} // Match cell size to section size to remove small lines
        cellColor={'#ccc'}
        infiniteGrid
        fadeDistance={100}
        fadeStrength={0.5}
      />
      {/* Render completed drawings */}
      {completedDrawings.map((drawing, index) =>
        drawing.map((pt, i) => {
          if (i === 0) return null;
          const start = new Vector3(drawing[i - 1][0], 0.02, drawing[i - 1][1]);
          const end = new Vector3(pt[0], 0.02, pt[1]);
          return (
            <Line
              key={`${index + i}`}
              points={[start, end]}
              color="blue"
              lineWidth={2}
            />
          );
        })
      )}
      {/* Placed fence segments */}
      {points.length >= 2 &&
        points.map((pt, i) => {
          if (i === 0) return null;
          const start = new Vector3(points[i - 1][0], 0.02, points[i - 1][1]);
          const end = new Vector3(pt[0], 0.02, pt[1]);
          return (
            <Line
              key={`${i + pt[0]}`}
              points={[start, end]}
              color="black"
              lineWidth={2}
            />
          );
        })}
      {/* Preview segment */}
      {preview && points.length > 0 && (
        <Line
          points={[
            new Vector3(
              points[points.length - 1][0],
              0.02,
              points[points.length - 1][1]
            ),
            new Vector3(preview[0], 0.02, preview[1]),
          ]}
          color="orange"
          lineWidth={2}
          dashed
          dashSize={0.5}
          gapSize={0.2}
        />
      )}
    </Canvas>
  );
}
