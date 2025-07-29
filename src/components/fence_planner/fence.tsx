import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function Fence({
  width,
  showEndPosts,
  showStartPosts,
}: {
  width: number;
  showEndPosts?: boolean;
  showStartPosts?: boolean;
}) {
  const { nodes, materials } = useGLTF('./models/fence.glb') as GLTF & {
    nodes: {
      post_side: THREE.Mesh;
      post_horizontal: THREE.Mesh;
      post_inner: THREE.Mesh;
    };
    materials: { iron_fence: THREE.Material };
  };

  const fence = useRef<THREE.Group>(null);
  const fenceStartPos = -(width / 100) / 2;
  const fenceEndPos = width / 100 / 2;

  // Calculate how many posts fit between start and end
  const availableLength = fenceEndPos - fenceStartPos;
  const postSpacing = 2.5; // Side posts every 2.5m

  // Calculate how many side posts fit between start and end
  const postCount = Math.max(1, Math.floor(availableLength / postSpacing));

  // Generate positions for side posts
  const sidePosts = Array.from({ length: postCount + 1 }, (_, i) => {
    const x = fenceStartPos + i * postSpacing;
    return x;
  });

  // Generate positions for vertical bars (fill space evenly between side posts)
  const verticalBars = [];

  // Process each pair of adjacent side posts
  for (let i = 0; i < sidePosts.length - 1; i++) {
    // Fix floating-point precision issues
    const start = Number(sidePosts[i].toFixed(10));
    const end = Number(sidePosts[i + 1].toFixed(10));

    // Handle potential zero-width sections due to floating-point errors
    const sectionWidth = Math.max(0.01, end - start);

    // Skip if section is too small (likely a floating-point error)
    if (sectionWidth < 0.05) continue;

    // For standard 2.5m section, place ~11 vertical bars (one every ~20cm)
    const targetBarsPerMeter = 4.5; // ~4-5 bars per meter
    const targetBars = Math.max(
      Math.round(sectionWidth * targetBarsPerMeter),
      1
    );

    // Calculate actual spacing to distribute evenly
    const spacing = sectionWidth / (targetBars + 1);
    console.log(
      `FENCE SECTION ${i + 1}: start=${start.toFixed(2)}, end=${end.toFixed(2)}, width=${sectionWidth.toFixed(2)}m`
    );

    // Generate positions for this section
    for (let j = 1; j <= targetBars; j++) {
      // Ensure we don't place bars too close to the posts
      const position = start + j * spacing;

      // Add the position if it's not too close to start or end
      if (position > start + 0.05 && position < end - 0.05) {
        verticalBars.push(position);
      }
    }
  }

  // Get the original width of the horizontal bar geometry
  let originalBarWidth = 1;
  if (nodes.post_horizontal && nodes.post_horizontal.geometry) {
    nodes.post_horizontal.geometry.computeBoundingBox();
    const bbox = nodes.post_horizontal.geometry.boundingBox;
    if (bbox?.max && bbox?.min) {
      // Ensure the bounding box is defined before accessing its properties
      originalBarWidth = bbox.max.x - bbox.min.x;
    }
  }
  // Calculate the scale needed to stretch the bar to the fence width (between side posts)
  const desiredBarWidth = fenceEndPos - fenceStartPos;
  const horizontalBarScale = desiredBarWidth / originalBarWidth;

  if (!nodes) {
    console.error('Fence model not loaded properly.');
    return null;
  }

  return (
    <group ref={fence} name="FenceGroup">
      <group position={[0, 0, 0]}>
        {/* Render side posts */}
        {sidePosts.map((postPosition, index) => {
          if (
            (index === 0 && !showStartPosts) ||
            (index === sidePosts.length - 1 && !showEndPosts)
          ) {
            return null;
          }
          return (
            <mesh
              key={`post_side_${postPosition + index}`}
              geometry={nodes.post_side.geometry}
              material={nodes.post_side.material || materials?.iron_fence}
              name="post_side"
              position={[postPosition, 0, 0]}
              castShadow
            />
          );
        })}

        {/* Render vertical bars between side posts */}
        {verticalBars.map((barPosition, index) => (
          <mesh
            key={`vertical_bar_${barPosition}_${index}`}
            geometry={nodes.post_inner.geometry}
            material={nodes.post_inner.material || materials?.iron_fence}
            name="post_inner"
            position={[barPosition, 0, 0]}
            castShadow
          />
        ))}

        {/* Horizontal bars */}
        <mesh
          geometry={nodes.post_horizontal.geometry}
          material={nodes.post_horizontal.material || materials?.iron_fence}
          name="post_horizontal"
          position={[0, 1.1, 0]}
          scale={[horizontalBarScale, 1, 1]}
          castShadow
        />
        <mesh
          geometry={nodes.post_horizontal.geometry}
          material={nodes.post_horizontal.material || materials?.iron_fence}
          name="post_horizontal"
          position={[0, 0.1, 0]}
          scale={[horizontalBarScale, 1, 1]}
          castShadow
        />
      </group>
    </group>
  );
}

useGLTF.preload('./models/fence.glb');
