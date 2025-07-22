import { Experience } from "./components/Experience";
import { Interface } from "./components/Interface";
import { Canvas } from "@react-three/fiber";

function App() {
  // Set a safe, fixed initial camera position always within any reasonable maxDistance
  // and always looking at [0,0,0]
  return (
    <>
      <Canvas shadows camera={{ position: [4, 4, -8], fov: 35 }} style={{
        background: "linear-gradient(rgb(183 209 255), rgb(148, 201, 215))",
      }}>
        <Experience />
      </Canvas>
      <Interface />
    </>
  );
}

export default App;
