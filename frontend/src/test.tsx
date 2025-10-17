import React from 'react';
import { Link } from 'react-router-dom';

const TestComponent: React.FC = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Todify2 系统</h1>
      <p>如果你能看到这个页面，说明React应用正常运行</p>
      
      <div style={{ marginTop: '30px' }}>
        <h2>功能导航</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginTop: '20px' }}>
          <Link 
            to="/tech-points" 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '5px',
              display: 'inline-block',
              minWidth: '200px'
            }}
          >
            技术点管理页面
          </Link>
          <Link 
            to="/workflow" 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '5px',
              display: 'inline-block',
              minWidth: '200px'
            }}
          >
            工作流页面
          </Link>
          <Link 
            to="/config" 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#ffc107', 
              color: 'black', 
              textDecoration: 'none', 
              borderRadius: '5px',
              display: 'inline-block',
              minWidth: '200px'
            }}
          >
            配置管理页面
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;