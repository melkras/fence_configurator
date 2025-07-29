import { OrthographicCamera, Grid, Line, Html } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Vector3, TextureLoader, RepeatWrapping } from 'three';

import { useConfigurator } from '../contexts/configurator';

export type Point = [number, number]; // 2D XZ point
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
  const length = Math.sqrt(dx * dx + dz * dz);

  // 💥 New: If the vector is too short or nearly flat, do NOT snap
  if (length < 1.01) {
    return next;
  }

  const angle = Math.atan2(dz, dx);
  const snappedAngle = Math.round(angle / snapAngle) * snapAngle;

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
  const { topView, setTopView } = useConfigurator();

  const shouldSnapToGrid = true;
  const gridSize = 2.5; // 2.5 meters grid size
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
        const completedDrawing: Point[] = [...points, [startX, startZ]]; // Explicitly type completedDrawing as Point[]
        const roundedDrawing: Point[] = completedDrawing.map(([x, z]) => [
          snapToGrid(x, gridSize),
          snapToGrid(z, gridSize),
        ]);
        setCompletedDrawings([roundedDrawing]);
        console.log('Completed drawing (rounded):', roundedDrawing);
        setTopView(roundedDrawing); // Store the completed drawing in the configurator context
        setPoints([]); // Reset points to start a new drawing
        setPreview(null);
        return;
      }
    }

    setPoints([...points, [snappedX, snappedZ]]);
  };
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!e.point) return;

    const [rawX, , rawZ] = e.point.toArray();

    if (points.length === 0) return; // Nothing to preview from

    const last = points[points.length - 1];

    // Snap to grid
    let [snappedX, snappedZ] = shouldSnapToGrid
      ? getSnappedPoint(rawX, rawZ, gridSize)
      : [rawX, rawZ];

    // Apply angle lock
    if (angleLock) {
      const angleStepRad = (angleStepDegrees * Math.PI) / 180;
      [snappedX, snappedZ] = getSnappedAngle(
        last,
        [snappedX, snappedZ],
        angleStepRad
      );
    }

    // Prevent showing preview if snapped point is also too close
    const dxSnapped = snappedX - last[0];
    const dzSnapped = snappedZ - last[1];
    const snappedDistance = Math.sqrt(
      dxSnapped * dxSnapped + dzSnapped * dzSnapped
    );
    if (snappedDistance < gridSize) {
      setPreview(null);
      return;
    }

    // All checks passed — safe to preview
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

  useEffect(() => {
    if (topView.length > 0) {
      setPoints(topView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {completedDrawings.map((drawing, _index) =>
        drawing.map((pt, i) => {
          if (i === 0) return null;
          const start = new Vector3(drawing[i - 1][0], 0.02, drawing[i - 1][1]);
          const end = new Vector3(pt[0], 0.02, pt[1]);
          const length = start.distanceTo(end).toFixed(2); // Calculate length in meters
          const midPoint = new Vector3(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2, // Dynamically calculate the y-coordinate for the midpoint
            (start.z + end.z) / 2
          ); // Ensure the midpoint is calculated correctly for exact center
          const angle =
            Math.atan2(end.z - start.z, end.x - start.x) * (180 / Math.PI); // Calculate angle in degrees
          const normalizedAngle =
            angle > 90 || angle < -90 ? angle + 180 : angle; // Normalize angle to keep text upright
          return (
            <React.Fragment
              key={`${drawing[i - 1][0]}-${drawing[i - 1][1]}-${pt[0]}-${pt[1]}`}
            >
              <Line points={[start, end]} color="blue" lineWidth={2} />
              <Html
                position={[midPoint.x, midPoint.y, midPoint.z]}
                pointerEvents="none"
                style={{ pointerEvents: 'none' }}
              >
                <div
                  style={{
                    color: 'black',
                    background: 'white',
                    padding: '2px',
                    borderRadius: '4px',
                    transform: `translate(-50%, -50%) rotate(${normalizedAngle}deg)`, // Center the text and rotate
                    transformOrigin: 'center',
                    position: 'absolute',
                  }}
                >
                  {length}m
                </div>
              </Html>
            </React.Fragment>
          );
        })
      )}
      {/* Placed fence segments */}
      {points.length >= 2 &&
        points.map((pt, i) => {
          if (i === 0) return null;
          const start = new Vector3(points[i - 1][0], 0.02, points[i - 1][1]);
          const end = new Vector3(pt[0], 0.02, pt[1]);
          const length = start.distanceTo(end).toFixed(2); // Calculate length in meters
          const midPoint = new Vector3(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2, // Dynamically calculate the y-coordinate for the midpoint
            (start.z + end.z) / 2
          ); // Ensure the midpoint is calculated correctly for exact center
          const angle =
            Math.atan2(end.z - start.z, end.x - start.x) * (180 / Math.PI); // Calculate angle in degrees
          const normalizedAngle =
            angle > 90 || angle < -90 ? angle + 180 : angle; // Normalize angle to keep text upright
          return (
            <React.Fragment key={`${i + pt[0]}`}>
              <Line points={[start, end]} color="black" lineWidth={2} />
              <Html
                position={[midPoint.x, midPoint.y, midPoint.z]}
                pointerEvents="none"
                style={{ pointerEvents: 'none' }}
              >
                <div
                  style={{
                    color: 'black',
                    background: 'white',
                    padding: '2px',
                    borderRadius: '4px',
                    transform: `translate(-50%, -50%) rotate(${normalizedAngle}deg)`, // Center the text and rotate
                    transformOrigin: 'center',
                    position: 'absolute',
                  }}
                >
                  {length}m
                </div>
              </Html>
            </React.Fragment>
          );
        })}
      {/* Render preview line */}
      {preview &&
        points.length > 0 &&
        (() => {
          const lastPoint = points[points.length - 1];
          const start = new Vector3(lastPoint[0], 0.02, lastPoint[1]);
          const end = new Vector3(preview[0], 0.02, preview[1]);
          const length = start.distanceTo(end).toFixed(2); // Calculate length in meters
          const midPoint = new Vector3(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2, // Dynamically calculate the y-coordinate for the midpoint
            (start.z + end.z) / 2
          ); // Ensure the midpoint is calculated correctly for exact center
          const angle =
            Math.atan2(end.z - start.z, end.x - start.x) * (180 / Math.PI); // Calculate angle in degrees
          const normalizedAngle =
            angle > 90 || angle < -90 ? angle + 180 : angle; // Normalize angle to keep text upright
          return (
            <React.Fragment>
              <Line points={[start, end]} color="orange" lineWidth={2} />
              <Html
                position={[midPoint.x, midPoint.y, midPoint.z]}
                pointerEvents="none"
                style={{ pointerEvents: 'none' }}
              >
                <div
                  style={{
                    color: 'black',
                    background: 'white',
                    padding: '2px',
                    borderRadius: '4px',
                    transform: `translate(-50%, -50%) rotate(${normalizedAngle}deg)`, // Center the text and rotate
                    transformOrigin: 'center',
                    position: 'absolute',
                  }}
                >
                  {length}m
                </div>
              </Html>
            </React.Fragment>
          );
        })()}
    </Canvas>
  );
}
