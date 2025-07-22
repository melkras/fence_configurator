import { createContext, useContext, useState } from "react";

const ConfiguratorContext = createContext();

export const ConfiguratorProvider = ({ children }) => {
  const [fenceCount, setFenceCount] = useState(1);
  const [postGap, setPostGap] = useState(20);
  const [fenceWidth, setFenceWidth] = useState(200);
  return (
    <ConfiguratorContext.Provider
      value={{
        fenceCount,
        setFenceCount,
        fenceWidth,
        setFenceWidth,
        postGap,
        setPostGap,
      }}
    >
      {children}
    </ConfiguratorContext.Provider>
  );
};

export const useConfigurator = () => {
  return useContext(ConfiguratorContext);
};
