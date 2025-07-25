import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useConfigurator } from "../../contexts/configurator";
import Fence from "./fence";
import { useTexture, Stage, OrbitControls } from "@react-three/drei";


function withCanvas(Component) {
    return function WrappedWithCanvas(props) {
        return (
            <Canvas
                shadows
                camera={{ position: [4, 4, -8], fov: 35 }}
                style={{
                    background: "linear-gradient(rgb(183 209 255), rgb(148, 201, 215))",
                }}
            >
                <Component {...props} />
            </Canvas>
        );
    };
}

function FencePlannerInner() {
    const { fenceCount = 1, fenceWidth, postGap } = useConfigurator();

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
                environment={'park'}
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

const FencePlannerInnerWithCanvas = withCanvas(FencePlannerInner);

export default function FencePlanner() {
    return <FencePlannerInnerWithCanvas />;
}

useGLTF.preload("./models/fence.glb");