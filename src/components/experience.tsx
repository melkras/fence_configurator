import { useConfigurator } from "../contexts/configurator";
import TopViewPlanner from "./top_view_planner";
import FencePlanner from './fence_planner/index';

export const Experience = () => {
  const { mode } = useConfigurator();
  return (
    mode === '2D' ?
      <TopViewPlanner />
      :
      <FencePlanner />
  );
};
