import { createContext, useContext, useState, Dispatch, SetStateAction } from "react";

type ConfiguratorContextType = {
    fenceCount: number;
    setFenceCount: Dispatch<SetStateAction<number>>;
    postGap: number;
    setPostGap: Dispatch<SetStateAction<number>>;
    fenceWidth: number;
    setFenceWidth: Dispatch<SetStateAction<number>>;
    mode: string;
    setMode: Dispatch<SetStateAction<string>>;
};

const ConfiguratorContext = createContext<ConfiguratorContextType | undefined>(undefined);

export const ConfiguratorProvider = ({ children }: { children: React.ReactNode; }) => {
    const [fenceCount, setFenceCount] = useState(1);
    const [postGap, setPostGap] = useState(20);
    const [fenceWidth, setFenceWidth] = useState(200);
    const [mode, setMode] = useState("3D"); // Default mode is 3D
    return (
        <ConfiguratorContext.Provider
            value={{
                fenceCount,
                setFenceCount,
                fenceWidth,
                setFenceWidth,
                postGap,
                setPostGap,
                mode,
                setMode,
            }}
        >
            {children}
        </ConfiguratorContext.Provider>
    );
};

export const useConfigurator = () => {
    const context = useContext(ConfiguratorContext);
    if (!context) {
        throw new Error("useConfigurator must be used within a ConfiguratorProvider");
    }
    return context;
};
