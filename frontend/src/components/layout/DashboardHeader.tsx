import { Layout, Input, Space, Badge } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useAuth } from '../../lib/auth/geelyhubAuth';
import { UserDropdown } from './UserDropdown';

const { Header } = Layout;

export function DashboardHeader() {
  const { user } = useAuth();

  return (
    <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ fontWeight: 'bold', fontSize: 18 }}>Todify4</div>
      <Input.Search placeholder="搜索项目..." style={{ width: 300 }} />
      <div style={{ marginLeft: 'auto' }}>
        <Space>
          <Badge count={0}>
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          </Badge>
          <UserDropdown user={user} />
        </Space>
      </div>
    </Header>
  );
}
