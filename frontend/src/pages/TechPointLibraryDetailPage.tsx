import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Spin, message } from 'antd';
import { techPointService } from '../services/techPointService';
import TechPointDetail from '../components/techPoint/TechPointDetail';
import { TechPoint } from '../types/techPoint';

const TechPointLibraryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [techPoint, setTechPoint] = useState<TechPoint | null>(null);

  useEffect(() => {
    if (id) {
      loadTechPointDetail();
    }
  }, [id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && id) {
        loadTechPointDetail();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  const getReturnPath = () => {
    const from = (location.state as any)?.from;
    if (from) {
      return from;
    }
    return '/tech-point-library';
  };

  const loadTechPointDetail = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const pointIdNum = parseInt(id);
      const response = await techPointService.getTechPointById(pointIdNum);
      
      if (response.success && response.data) {
        setTechPoint(response.data);
      } else {
        message.error('技术点不存在');
        navigate(getReturnPath());
      }
    } catch (error) {
      console.error('加载技术点详情失败:', error);
      message.error('加载技术点详情失败');
      navigate(getReturnPath());
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate(getReturnPath());
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!techPoint) {
    return null;
  }

  return <TechPointDetail techPoint={techPoint} onClose={handleClose} />;
};

export default TechPointLibraryDetailPage;
