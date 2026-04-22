import { Card } from 'antd';
import { WelcomeCard } from '../components/dashboard/WelcomeCard';
import { StatsCard } from '../components/dashboard/StatsCard';

export function DashboardPage() {
  return (
    <div>
      <WelcomeCard />
      <StatsCard />
      <Card title="快捷操作">
        <p>项目列表 / 新建项目 / AI 配置</p>
      </Card>
    </div>
  );
}
