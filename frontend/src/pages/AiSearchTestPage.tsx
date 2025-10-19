import React from 'react';
import AiSearchComponent from '../components/AiSearchComponent';

const AiSearchTestPage: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        paddingTop: '40px'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: 'white', 
          marginBottom: '40px',
          fontSize: '32px',
          fontWeight: '700',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          AI 搜索组件测试页面
        </h1>
        <AiSearchComponent />
      </div>
    </div>
  );
};

export default AiSearchTestPage;