import React, { useState } from 'react';
import { Search, Plus, X, ChevronDown, ChevronUp, Package } from 'lucide-react';

interface TechPoint {
  id: string;
  name: string;
  category: string;
}

interface RelatedTechPointsProps {
  onTechPointsChange?: (techPoints: TechPoint[]) => void;
}

const RelatedTechPoints: React.FC<RelatedTechPointsProps> = ({ onTechPointsChange }) => {
  const [selectedTechPoints, setSelectedTechPoints] = useState<TechPoint[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const predefinedTechPoints: TechPoint[] = [
    // 核心技术
    { id: '1', name: 'React', category: '核心技术' },
    { id: '2', name: 'TypeScript', category: '核心技术' },
    { id: '3', name: 'Node.js', category: '核心技术' },
    { id: '4', name: 'Vue.js', category: '核心技术' },
    { id: '5', name: 'Angular', category: '核心技术' },
    
    // 应用领域
    { id: '6', name: '人工智能', category: '应用领域' },
    { id: '7', name: '机器学习', category: '应用领域' },
    { id: '8', name: '区块链', category: '应用领域' },
    { id: '9', name: '物联网', category: '应用领域' },
    { id: '10', name: '云计算', category: '应用领域' },
    
    // 数据技术
    { id: '11', name: 'MongoDB', category: '数据技术' },
    { id: '12', name: 'PostgreSQL', category: '数据技术' },
    { id: '13', name: 'Redis', category: '数据技术' },
    { id: '14', name: 'Elasticsearch', category: '数据技术' },
    
    // 基础设施
    { id: '15', name: 'Docker', category: '基础设施' },
    { id: '16', name: 'Kubernetes', category: '基础设施' },
    { id: '17', name: 'AWS', category: '基础设施' },
    { id: '18', name: 'Nginx', category: '基础设施' }
  ];

  const filteredTechPoints = predefinedTechPoints.filter(point =>
    point.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTechPoints.some(selected => selected.id === point.id)
  );

  const groupedTechPoints = filteredTechPoints.reduce((acc, point) => {
    if (!acc[point.category]) {
      acc[point.category] = [];
    }
    acc[point.category].push(point);
    return acc;
  }, {} as Record<string, TechPoint[]>);

  const addTechPoint = (techPoint: TechPoint) => {
    const newSelectedPoints = [...selectedTechPoints, techPoint];
    setSelectedTechPoints(newSelectedPoints);
    onTechPointsChange?.(newSelectedPoints);
  };

  const removeTechPoint = (techPointId: string) => {
    const newSelectedPoints = selectedTechPoints.filter(point => point.id !== techPointId);
    setSelectedTechPoints(newSelectedPoints);
    onTechPointsChange?.(newSelectedPoints);
  };

  return (
    <div className="ai-search-component">
      {/* 头部 */}
      <div className="ai-search-header">
        <div className="header-left">
          <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">关</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">关联技术点</h3>
        </div>
        <p className="text-sm text-gray-600">选择相关的技术知识点来增强AI回答的准确性</p>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 内容区域 */}
      <div className="ai-search-content">
        <p className="text-sm text-gray-600 mb-3">
          选择与您的内容相关的技术点，将为您提供更精准的内容建议
        </p>

        {/* 已选择的技术点 */}
        {selectedTechPoints.length > 0 && (
          <div className="response-section">
            <div className="response-header">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-800">已选择的技术点</span>
              <span className="ml-auto text-xs text-gray-500">({selectedTechPoints.length})</span>
            </div>
            <div className="response-content">
              <div className="flex flex-wrap gap-2">
                {selectedTechPoints.map((point) => (
                  <span
                    key={point.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200"
                  >
                    {point.name}
                    <button
                      onClick={() => removeTechPoint(point.id)}
                      className="action-btn p-0.5 hover:bg-blue-100"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 可选择的技术点 */}
        {isExpanded && (
          <div className="response-section">
            <div className="response-header">
              <Search className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-800">选择技术点</span>
            </div>
            <div className="response-content">
              {/* 搜索框 */}
              <div className="input-section">
                <div className="input-container">
                  <input
                    type="text"
                    placeholder="搜索技术点..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="query-input"
                  />
                </div>
              </div>

              {/* 技术点分类列表 */}
              <div className="space-y-4">
                {Object.entries(groupedTechPoints).map(([category, points]) => (
                  <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700">{category}</h5>
                    </div>
                    <div className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {points.map((point) => (
                          <button
                            key={point.id}
                            onClick={() => addTechPoint(point)}
                            disabled={selectedTechPoints.some(selected => selected.id === point.id)}
                            className="send-button text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            + {point.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .ai-search-component {
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          border: 1px solid #f1f5f9;
        }

        .ai-search-header {
          padding: 32px 24px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          position: relative;
        }

        .ai-search-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .header-icon {
          width: 28px;
          height: 28px;
          filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
        }

        .ai-search-content {
          padding: 24px;
        }

        .input-section {
          margin-bottom: 28px;
        }

        .input-container {
          display: flex;
          gap: 16px;
          align-items: flex-end;
        }

        .query-input {
          flex: 1;
          padding: 16px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          line-height: 1.6;
          resize: vertical;
          transition: all 0.3s ease;
          background: #fafbfc;
          font-family: inherit;
        }

        .query-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          background: white;
          transform: translateY(-1px);
        }

        .query-input::placeholder {
          color: #94a3b8;
          font-style: italic;
        }

        .send-button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 28px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          font-size: 14px;
        }

        .send-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .send-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .send-button:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .response-section {
          margin-bottom: 28px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .response-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 1px solid #e2e8f0;
          font-weight: 600;
        }

        .response-content {
          padding: 20px;
        }

        .action-btn {
          padding: 8px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
          position: relative;
        }

        .action-btn:hover {
          background: #e2e8f0;
          color: #334155;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default RelatedTechPoints;