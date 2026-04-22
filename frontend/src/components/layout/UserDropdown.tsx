import { Dropdown, Avatar, Space } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { clearToken } from '../../lib/auth/geelyhubAuth';

interface UserDropdownProps {
  user: { name: string; employee_id: string; department?: string } | null;
}

export function UserDropdown({ user }: UserDropdownProps) {
  if (!user) return null;

  const handleLogout = () => {
    clearToken();
    window.location.href = '/';
  };

  return (
    <Dropdown menu={{
      items: [
        { key: 'name', label: user.name, disabled: true },
        { key: 'dept', label: user.department || '-', disabled: true },
        { type: 'divider' as const },
        { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout }
      ]
    }}>
      <Space style={{ cursor: 'pointer' }}>
        <Avatar icon={<UserOutlined />} />
        <span>{user.name}</span>
      </Space>
    </Dropdown>
  );
}
