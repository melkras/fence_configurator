import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { useConfigurator } from "../contexts/Configurator";

export function Fence(props) {
  const { nodes, materials } = useGLTF("./models/fence.glb");
  const { fenceCount = 1, fenceWidth, postGap } = useConfigurator();
  const fence = useRef();
  const fenceStartPos = (-(fenceWidth / 100) / 2);
  const fenceEndPos = (fenceWidth / 100 / 2);

  // Calculate how many posts fit between start and end
  const availableLength = (fenceEndPos - fenceStartPos);
  const postSpacing = postGap / 100;
  const postCount = Math.max(1, Math.floor(availableLength / postSpacing));

  // Get the original width of the horizontal bar geometry
  let originalBarWidth = 1;
  if (nodes.post_horizontal && nodes.post_horizontal.geometry) {
    nodes.post_horizontal.geometry.computeBoundingBox();
    const bbox = nodes.post_horizontal.geometry.boundingBox;
    originalBarWidth = bbox.max.x - bbox.min.x;
  }
  // Calculate the scale needed to stretch the bar to the fence width (between side posts)
  const desiredBarWidth = (fenceEndPos - fenceStartPos);
  const horizontalBarScale = desiredBarWidth / originalBarWidth;

  // Generate positions for inner posts
  const innerPosts = Array.from({ length: postCount }, (_, i) => {
    // Start after the first side post
    const x = fenceStartPos + (i + 1) * postSpacing;
    return x;
  });

  if (!nodes) {
    console.error("Fence model not loaded properly.");
    return null;
  }

  // Calculate the total width of one fence section
  const sectionWidth = fenceEndPos - fenceStartPos;

  // Get the width of a post from the geometry
  let postWidth = 1;
  if (nodes.post_inner && nodes.post_inner.geometry) {
    nodes.post_inner.geometry.computeBoundingBox();
    const bbox = nodes.post_inner.geometry.boundingBox;
    postWidth = bbox.max.x - bbox.min.x;
  }

  return (
    <group {...props} ref={fence} name="FenceGroup">
      {Array.from({ length: fenceCount }).map((_, idx) => (
        <group key={idx} position={[idx * sectionWidth, 0, 0]}>
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
          {innerPosts.map((x, iidx) => (
            <mesh
              key={`post_inner_${idx}_${iidx}`}
              geometry={nodes.post_inner.geometry}
              material={nodes.post_inner.material || materials?.iron_fence}
              name="post_inner"
              position={[x, 0, 0]}
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

useGLTF.preload("./models/fence.glb");