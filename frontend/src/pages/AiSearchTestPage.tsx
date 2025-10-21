import React from 'react';
import AiSearchComponent from '../components/AiSearchComponent';

const AiSearchTestPage: React.FC = () => {
  return (
    <div style={{
      padding: '10px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      height: '100vh',
      maxHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        paddingTop: '10px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: 'white', 
          marginBottom: '10px',
          fontSize: '28px',
          fontWeight: '700',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          flexShrink: 0,
          maxHeight: '40px',
          overflow: 'hidden'
        }}>
          AI 搜索组件测试页面
        </h1>
        <div style={{ 
          flex: 1, 
          display: 'flex',
          minHeight: 0,
          maxHeight: 'calc(100vh - 80px)'
        }}>
          <AiSearchComponent />
        </div>
      </div>
    </div>
  );
};

export default AiSearchTestPage;