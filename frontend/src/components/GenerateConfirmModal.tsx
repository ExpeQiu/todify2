import React, { useState } from 'react';
import { X, Sparkles, Package, Target, Newspaper } from 'lucide-react';

export interface ExtractedRequirement {
  scene: 'tech-package' | 'tech-strategy' | 'tech-article' | 'unknown';
  confidence: number;
  techScope: string[];
  targetAudience: string;
  outputFormat: string;
  keyRequirements: string[];
  selectedResources: {
    techPointIds: number[];
    knowledgePointIds: number[];
    sourceIds: number[];
  };
  conversationSummary: string;
}

interface GenerateConfirmModalProps {
  requirement: ExtractedRequirement;
  onConfirm: (scene: string) => void;
  onCancel: () => void;
}

const GenerateConfirmModal: React.FC<GenerateConfirmModalProps> = ({
  requirement,
  onConfirm,
  onCancel
}) => {
  const [selectedScene, setSelectedScene] = useState(requirement.scene);

  const scenes = [
    {
      id: 'tech-package',
      name: '技术包装',
      description: '生成技术亮点、卖点包装内容',
      icon: Package,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      id: 'tech-strategy',
      name: '技术策略',
      description: '生成技术传播策略文档',
      icon: Target,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      id: 'tech-article',
      name: '技术通稿',
      description: '生成新闻稿、技术文章',
      icon: Newspaper,
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    }
  ];

  const getSceneInfo = (sceneId: string) => {
    return scenes.find(s => s.id === sceneId) || scenes[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">确认生成内容</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 需求摘要 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">需求摘要</h3>
            <p className="text-sm text-gray-600 mb-3">{requirement.conversationSummary}</p>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">目标受众：</span>
                <span className="text-gray-800 font-medium">{requirement.targetAudience}</span>
              </div>
              <div>
                <span className="text-gray-500">输出格式：</span>
                <span className="text-gray-800 font-medium">{requirement.outputFormat}</span>
              </div>
              {requirement.techScope.length > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-500">技术范围：</span>
                  <span className="text-gray-800 font-medium">{requirement.techScope.join(', ')}</span>
                </div>
              )}
              {requirement.keyRequirements.length > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-500">关键要求：</span>
                  <span className="text-gray-800 font-medium">{requirement.keyRequirements.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* 场景选择 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">选择生成场景</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {scenes.map(scene => {
                const Icon = scene.icon;
                const isSelected = selectedScene === scene.id;
                const isRecommended = requirement.scene === scene.id && requirement.confidence > 0.6;
                
                return (
                  <div
                    key={scene.id}
                    onClick={() => setSelectedScene(scene.id)}
                    className={`
                      relative p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : scene.color
                      }
                      ${isSelected ? 'ring-2 ring-blue-200' : ''}
                    `}
                  >
                    {isRecommended && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        推荐
                      </div>
                    )}
                    <div className="flex flex-col items-center text-center space-y-2">
                      <Icon className={`w-8 h-8 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                          {scene.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {scene.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 已选资源 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">已选资源</h3>
            <div className="flex space-x-4 text-sm">
              <div>
                <span className="text-gray-500">技术点：</span>
                <span className="text-gray-800 font-medium">
                  {requirement.selectedResources.techPointIds.length}个
                </span>
              </div>
              <div>
                <span className="text-gray-500">知识点：</span>
                <span className="text-gray-800 font-medium">
                  {requirement.selectedResources.knowledgePointIds.length}个
                </span>
              </div>
              <div>
                <span className="text-gray-500">来源：</span>
                <span className="text-gray-800 font-medium">
                  {requirement.selectedResources.sourceIds.length}个
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(selectedScene)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>开始生成</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateConfirmModal;

