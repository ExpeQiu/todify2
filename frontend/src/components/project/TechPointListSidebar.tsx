import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Check, Plus } from 'lucide-react';
import { Project } from '../../types/project';
import { TechPoint } from '../../types/techPoint';
import api from '../../services/api';

interface TechPointListSidebarProps {
  project: Project;
  selectedTechPointId?: number;
  onSelectTechPoint: (techPoint: TechPoint) => void;
  onRefresh?: () => void;
  refreshTrigger?: number;
}

const TechPointListSidebar: React.FC<TechPointListSidebarProps> = ({
  project,
  selectedTechPointId,
  onSelectTechPoint,
  onRefresh,
  refreshTrigger
}) => {
  const navigate = useNavigate();
  const [techPoints, setTechPoints] = useState<TechPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTechPoints();
  }, [project.id, refreshTrigger]);

  const loadTechPoints = async () => {
    try {
      setLoading(true);
      const detailsResponse = await api.get(`/projects/${project.id}/details`);
      const techPoints = detailsResponse.data?.success && detailsResponse.data?.data?.techPoints
        ? detailsResponse.data.data.techPoints
        : [];
      setTechPoints(techPoints);
      onRefresh?.();
    } catch (error) {
      console.error('加载技术点失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  const handleAddTechPoint = () => {
    const returnUrl = `/project/${project.id}/management`;
    const currentTechPointIds = techPoints.map(tp => tp.id).join(',');
    navigate(`/tech-point-library?mode=select&returnUrl=${encodeURIComponent(returnUrl)}&selectedIds=${currentTechPointIds}`);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 标题 */}
      <div className="bg-gray-200 px-4 py-3 border-b border-gray-300 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">技术点列表</h2>
        <button
          onClick={handleAddTechPoint}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
          title="添加技术点"
        >
          <Plus className="w-3 h-3" />
          <span>添加</span>
        </button>
      </div>

      {/* 技术点列表 */}
      <div className="flex-1 overflow-y-auto">
        {techPoints.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            <div className="mb-4">暂无技术点</div>
            <button
              onClick={handleAddTechPoint}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>添加技术点</span>
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {techPoints.map((tp) => (
              <div
                key={tp.id}
                onClick={() => onSelectTechPoint(tp)}
                className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedTechPointId === tp.id
                    ? 'bg-blue-100 border border-blue-300'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Package className={`w-4 h-4 flex-shrink-0 ${
                  selectedTechPointId === tp.id ? 'text-blue-600' : 'text-purple-600'
                }`} />
                <span className={`text-sm truncate flex-1 ${
                  selectedTechPointId === tp.id
                    ? 'text-blue-900 font-medium'
                    : 'text-gray-700'
                }`}>
                  {tp.name}
                </span>
                {selectedTechPointId === tp.id && (
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechPointListSidebar;

