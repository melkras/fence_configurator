import { useConfigurator } from '../contexts/configurator';

import FencePlanner from './fence_planner/index';
import TopViewPlanner from './top_view_planner';

export const Experience = () => {
  const { mode } = useConfigurator();
  return mode === '2D' ? <TopViewPlanner /> : <FencePlanner />;
};
