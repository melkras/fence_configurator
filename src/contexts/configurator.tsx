import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
} from 'react';

import { Point } from '@/components/top_view_planner';

type ConfiguratorContextType = {
  fenceCount: number;
  setFenceCount: Dispatch<SetStateAction<number>>;
  postGap: number;
  setPostGap: Dispatch<SetStateAction<number>>;
  fenceWidth: number;
  setFenceWidth: Dispatch<SetStateAction<number>>;
  mode: string;
  setMode: Dispatch<SetStateAction<string>>;
  topView: Point[];
  setTopView: Dispatch<SetStateAction<Point[]>>;
};

const ConfiguratorContext = createContext<ConfiguratorContextType | undefined>(
  undefined
);

export const ConfiguratorProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [fenceCount, setFenceCount] = useState(1);
  const [postGap, setPostGap] = useState(20);
  const [fenceWidth, setFenceWidth] = useState(200);
  const [mode, setMode] = useState('2D');
  const [topView, setTopView] = useState<Point[]>([]);
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
        topView,
        setTopView,
      }}
    >
      {children}
    </ConfiguratorContext.Provider>
  );
};

export const useConfigurator = () => {
  const context = useContext(ConfiguratorContext);
  if (!context) {
    throw new Error(
      'useConfigurator must be used within a ConfiguratorProvider'
    );
  }
  return context;
};
