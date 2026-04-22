import { Row, Col, Card, Statistic } from 'antd';

export function StatsCard() {
  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card><Statistic title="我的项目" value={0} /></Card>
      </Col>
      <Col span={6}>
        <Card><Statistic title="进行中" value={0} /></Card>
      </Col>
      <Col span={6}>
        <Card><Statistic title="已完成" value={0} /></Card>
      </Col>
      <Col span={6}>
        <Card><Statistic title="团队成员" value={0} /></Card>
      </Col>
    </Row>
  );
}
