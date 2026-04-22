import { Card } from 'antd';
import { useAuth } from '../../lib/auth/geelyhubAuth';

export function WelcomeCard() {
  const { user } = useAuth();

  return (
    <Card style={{ marginBottom: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
      <h2 style={{ color: '#fff', margin: 0 }}>欢迎回来，{user?.name || '用户'}</h2>
      <p style={{ margin: '8px 0 0', opacity: 0.9 }}>
        {user?.department || '-'} | {user?.employee_id || '-'}
      </p>
    </Card>
  );
}
