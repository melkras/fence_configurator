import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { useConfigurator } from '../../contexts/configurator';

export default function Fence() {
  const { nodes, materials } = useGLTF('./models/fence.glb') as GLTF & {
    nodes: {
      post_side: THREE.Mesh;
      post_horizontal: THREE.Mesh;
      post_inner: THREE.Mesh;
    };
    materials: { iron_fence: THREE.Material };
  };

  const { fenceCount = 1, fenceWidth, postGap } = useConfigurator();
  const fence = useRef<THREE.Group>(null);
  const fenceStartPos = -(fenceWidth / 100) / 2;
  const fenceEndPos = fenceWidth / 100 / 2;

  // Calculate how many posts fit between start and end
  const availableLength = fenceEndPos - fenceStartPos;
  const postSpacing = postGap / 100;
  const postCount = Math.max(1, Math.floor(availableLength / postSpacing));

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

  // Generate positions for inner posts
  const innerPosts = Array.from({ length: postCount }, (_, i) => {
    // Start after the first side post
    const x = fenceStartPos + (i + 1) * postSpacing;
    return x;
  });

  if (!nodes) {
    console.error('Fence model not loaded properly.');
    return null;
  }

  // Calculate the total width of one fence section
  const sectionWidth = fenceEndPos - fenceStartPos;

  return (
    <group ref={fence} name="FenceGroup">
      {Array.from({ length: fenceCount }).map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <group key={`${index}`} position={[index * sectionWidth, 0, 0]}>
          {/* Side post at start */}
          <mesh
            geometry={nodes.post_side.geometry}
            material={nodes.post_side.material || materials?.iron_fence}
            name="post_side"
            position={[fenceStartPos, 0, 0]}
            castShadow
          />
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
          {/* Loop inner posts */}
          {innerPosts.map((postPosition, index) => (
            <mesh
              key={`post_inner_${postPosition + index}`}
              geometry={nodes.post_inner.geometry}
              material={nodes.post_inner.material || materials?.iron_fence}
              name="post_inner"
              position={[postPosition, 0, 0]}
              castShadow
            />
          ))}
          {/* Side post at end */}
          <mesh
            geometry={nodes.post_side.geometry}
            material={nodes.post_side.material || materials?.iron_fence}
            name="post_side"
            position={[fenceEndPos, 0, 0]}
            castShadow
          />
        </group>
      ))}
    </group>
  );
}

useGLTF.preload('./models/fence.glb');
