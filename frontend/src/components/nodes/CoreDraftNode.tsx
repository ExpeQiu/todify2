import React, { useState } from 'react';
import { Package, Code, Sparkles, ArrowLeft, RefreshCw, Download, Share2, Bot } from 'lucide-react';
import { BaseNodeProps } from '../../types/nodeComponent';
import KnowledgePointSelector, { SelectionItem, KnowledgePoint } from '../common/KnowledgePointSelector';
import ActionBar from '../common/ActionBar';
import './NodeComponent.css';

interface CoreDraftNodeProps extends BaseNodeProps {
  initialData?: any;
  isLoading?: boolean;
}

const CoreDraftNode: React.FC<CoreDraftNodeProps> = () => {
  const [coreDraftContent, setCoreDraftContent] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  const [showKnowledgeSelection, setShowKnowledgeSelection] = useState(false);
  const [selectedKnowledgePointForDetail, setSelectedKnowledgePointForDetail] = useState<KnowledgePoint | null>(null);
  const [activeVehicleModel, setActiveVehicleModel] = useState('全部车型');
  const [activeTechCategory, setActiveTechCategory] = useState('全部分类');
  const [isGenerating, setIsGenerating] = useState(false);

  // 模拟知识点数据 - 三维度结构：车型-技术分类-技术点
  const knowledgePoints: KnowledgePoint[] = [
    { id: '1', vehicleModel: 'Model S', vehicleSeries: 'Tesla', techCategory: '动力系统', techPoint: '三电系统集成', description: '高压电池包与电机控制系统的深度集成技术' },
    { id: '2', vehicleModel: 'Model S', vehicleSeries: 'Tesla', techCategory: '动力系统', techPoint: '电池热管理', description: '先进的液冷电池热管理系统，确保电池性能和寿命' },
    { id: '3', vehicleModel: 'Model S', vehicleSeries: 'Tesla', techCategory: '自动驾驶', techPoint: 'FSD芯片', description: '自研全自动驾驶芯片，算力达144TOPS' },
    { id: '4', vehicleModel: 'Model S', vehicleSeries: 'Tesla', techCategory: '自动驾驶', techPoint: '神经网络', description: '端到端神经网络架构，实现复杂场景理解' },
    { id: '5', vehicleModel: 'Model 3', vehicleSeries: 'Tesla', techCategory: '动力系统', techPoint: '4680电池', description: '新一代4680圆柱电池技术，能量密度提升5倍' },
    { id: '6', vehicleModel: 'Model 3', vehicleSeries: 'Tesla', techCategory: '制造工艺', techPoint: '一体化压铸', description: '前后车身一体化压铸技术，减重提效' },
    { id: '7', vehicleModel: 'Model X', vehicleSeries: 'Tesla', techCategory: '车身结构', techPoint: '鹰翼门', description: '独特的鹰翼门设计，双铰链结构' },
    { id: '8', vehicleModel: 'Model X', vehicleSeries: 'Tesla', techCategory: '空气动力学', techPoint: '主动格栅', description: '智能主动进气格栅，优化空气动力学性能' },
    { id: '9', vehicleModel: 'Model Y', vehicleSeries: 'Tesla', techCategory: '制造工艺', techPoint: '结构化电池包', description: '电池包作为车身结构件，提升刚性' },
    { id: '10', vehicleModel: 'Model Y', vehicleSeries: 'Tesla', techCategory: '热泵系统', techPoint: '八通阀热泵', description: '高效八通阀热泵系统，冬季续航提升' },
    { id: '11', vehicleModel: 'Cybertruck', vehicleSeries: 'Tesla', techCategory: '材料技术', techPoint: '不锈钢车身', description: '30X冷轧不锈钢外壳，防弹防刮' },
    { id: '12', vehicleModel: 'Cybertruck', vehicleSeries: 'Tesla', techCategory: '动力系统', techPoint: '三电机布局', description: '前单后双电机布局，实现极致性能' },
  ];

  // 处理知识点详情显示
  const handleKnowledgePointClick = (knowledgePoint: KnowledgePoint) => {
    setSelectedKnowledgePointForDetail(knowledgePoint);
  };

  // 处理知识点选择变化
  const handleSelectionChange = (selectedItems: SelectionItem[]) => {
    setSelectedItems(selectedItems);
  };

  // 处理保存知识点选择
  const handleSave = (selectedItems: SelectionItem[]) => {
    setSelectedItems(selectedItems);
    setShowKnowledgeSelection(false);
  };

  const handleCoreDraftGenerate = async () => {
    setIsGenerating(true);
    // 模拟AI生成过程
    setTimeout(() => {
      setCoreDraftContent(`# 核心草稿内容

## 技术概述
基于所选知识点：${selectedItems.map(item => {
  const point = knowledgePoints.find(p => p.id === item.knowledgePointId);
  return point ? `${point.vehicleModel} - ${point.techCategory} - ${point.techPoint}` : '';
}).join(', ')}

这是一个基于现代Web技术栈的创新解决方案，采用React + TypeScript + Node.js架构，为用户提供高效、稳定的服务体验。

## 核心技术特点
- **前端技术**：React 18 + TypeScript + Tailwind CSS
- **后端技术**：Node.js + Express + TypeScript  
- **数据库**：MongoDB + Redis缓存
- **部署方案**：Docker容器化 + Nginx负载均衡

## 技术优势
1. **高性能**：采用虚拟DOM和组件化架构，页面渲染速度提升40%
2. **可扩展**：微服务架构设计，支持水平扩展
3. **安全性**：JWT认证 + HTTPS加密传输
4. **易维护**：TypeScript类型检查，减少90%的运行时错误

## 应用场景
- 企业级管理系统
- 电商平台解决方案  
- 数据分析平台
- 内容管理系统`);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">核心草稿</h1>
                  <p className="text-sm text-gray-500">AI智能核心草稿生成</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                导出
              </button>
              <button className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                分享
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* 选择知识点区域 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">选择知识点</h2>
                <p className="text-sm text-gray-500 mt-1">在表格中选择知识点，将作为生成AI内容的输入信息</p>
              </div>
              <button
                onClick={() => setShowKnowledgeSelection(!showKnowledgeSelection)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Package className="w-4 h-4" />
                <span className="text-sm">{showKnowledgeSelection ? '收起' : '展开'}</span>
              </button>
            </div>

            {showKnowledgeSelection && (
              <KnowledgePointSelector
                knowledgePoints={knowledgePoints}
                initialSelectedItems={selectedItems}
                initialExpanded={true}
                onSelectionChange={handleSelectionChange}
                onSave={handleSave}
                onKnowledgePointClick={handleKnowledgePointClick}
                collapsible={false}
                showSaveButton={true}
                saveButtonText="保存选择"
                allowedContentTypes={['knowledge_point', 'tech_packaging', 'tech_press']}
              />
            )}
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* 左侧占位区域 - 显示知识点详情 */}
          {!showKnowledgeSelection && (
            <div className="w-1/2 bg-white rounded-lg border border-gray-200 p-6">
              {selectedKnowledgePointForDetail ? (
                <div className="space-y-6">
                  {/* 详情标题 */}
                  <div className="border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">知识点详情</h3>
                    </div>
                    <p className="text-sm text-gray-500">查看选中知识点的详细信息</p>
                  </div>

                  {/* 基本信息 */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-600 block mb-1">车型</label>
                        <p className="text-base font-semibold text-gray-900">{selectedKnowledgePointForDetail.vehicleModel}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-600 block mb-1">技术分类</label>
                        <p className="text-base font-semibold text-gray-900">{selectedKnowledgePointForDetail.techCategory}</p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <label className="text-sm font-medium text-blue-700 block mb-2">技术点</label>
                      <p className="text-lg font-bold text-blue-900">{selectedKnowledgePointForDetail.techPoint}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-600 block mb-2">描述</label>
                      <p className="text-sm text-gray-700 leading-relaxed">{selectedKnowledgePointForDetail.description}</p>
                    </div>
                  </div>

                  {/* 技术优势 */}
                  <div className="space-y-3">
                    <h4 className="text-base font-semibold text-gray-900">技术优势</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-green-800">行业领先的技术创新，提升整体性能表现</p>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-blue-800">优化用户体验，提供更智能的交互方式</p>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-purple-800">降低维护成本，提高系统可靠性和稳定性</p>
                      </div>
                    </div>
                  </div>

                  {/* 应用场景 */}
                  <div className="space-y-3">
                    <h4 className="text-base font-semibold text-gray-900">应用场景</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm font-medium text-orange-800">日常驾驶</p>
                        <p className="text-xs text-orange-600 mt-1">提升日常使用体验</p>
                      </div>
                      <div className="p-3 bg-teal-50 rounded-lg">
                        <p className="text-sm font-medium text-teal-800">长途旅行</p>
                        <p className="text-xs text-teal-600 mt-1">保障长距离行驶</p>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <p className="text-sm font-medium text-indigo-800">城市通勤</p>
                        <p className="text-xs text-indigo-600 mt-1">适应城市环境</p>
                      </div>
                      <div className="p-3 bg-pink-50 rounded-lg">
                        <p className="text-sm font-medium text-pink-800">极端环境</p>
                        <p className="text-xs text-pink-600 mt-1">应对恶劣条件</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Package className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">选择知识点查看详情</p>
                  <p className="text-sm text-center">在知识点选择器中点击任意知识点<br />查看详细的技术信息和应用场景</p>
                </div>
              )}
            </div>
          )}

          {/* 右侧内容生成区域 */}
          <div className={`${!showKnowledgeSelection ? 'w-1/2' : 'w-full'} bg-white rounded-lg border border-gray-200 flex flex-col`}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Bot className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI核心草稿生成</h3>
                    <p className="text-sm text-gray-500">基于选择的知识点生成核心草稿内容</p>
                  </div>
                </div>
                <button
                  onClick={handleCoreDraftGenerate}
                  disabled={selectedItems.length === 0 || isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      生成草稿
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 p-6">
               <textarea
                 value={coreDraftContent}
                 onChange={(e) => setCoreDraftContent(e.target.value)}
                 placeholder="点击生成草稿按钮，AI将基于您选择的知识点生成核心草稿内容..."
                 className="w-full h-full resize-none border-0 focus:ring-0 text-sm leading-relaxed"
                 style={{ minHeight: '400px' }}
               />
             </div>
 
             {/* 底部操作栏 */}
             <ActionBar
               onRegenerate={handleCoreDraftGenerate}
               onSaveDraft={() => console.log('保存草稿')}
               onSaveContent={() => console.log('保存内容')}
               isGenerating={isGenerating}
             />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoreDraftNode;