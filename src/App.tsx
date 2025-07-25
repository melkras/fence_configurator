import { Experience } from "./components/experience";
import { Interface } from "./components/interface";
import { ConfiguratorProvider } from "./contexts/configurator";

export default function App() {
    return (
        <ConfiguratorProvider>
            <Experience />
            <Interface />
        </ConfiguratorProvider>
    );
}
