import React, { useState } from 'react';
import { Package, Code, Sparkles, ArrowLeft, RefreshCw, Download, Share2, Bot } from 'lucide-react';
import { BaseNodeProps } from '../../types/nodeComponent';
import KnowledgePointSelector, { KnowledgePoint as KnowledgePointType, SelectionItem } from '../common/KnowledgePointSelector';
import ActionBar from '../common/ActionBar';
import './NodeComponent.css';

interface SpeechNodeProps extends BaseNodeProps {
  initialData?: any;
  isLoading?: boolean;
}

const SpeechNode: React.FC<SpeechNodeProps> = ({
  onExecute,
  initialData,
  isLoading = false
}) => {
  const [speechContent, setSpeechContent] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  const [showKnowledgeSelection, setShowKnowledgeSelection] = useState(false);
  const [selectedKnowledgePointForDetail, setSelectedKnowledgePointForDetail] = useState<KnowledgePointType | null>(null);
  const [activeVehicleModel, setActiveVehicleModel] = useState('全部车型');
  const [activeTechCategory, setActiveTechCategory] = useState('全部分类');
  const [isGenerating, setIsGenerating] = useState(false);

  // 模拟知识点数据 - 三维度结构：车型-技术分类-技术点
  const knowledgePoints: KnowledgePointType[] = [
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
  const handleKnowledgePointClick = (knowledgePoint: KnowledgePointType) => {
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

  const handleSpeechGenerate = async () => {
    setIsGenerating(true);
    // 模拟AI生成过程
    setTimeout(() => {
      setSpeechContent(`# 演讲稿内容

## 开场白
尊敬的各位来宾，大家好！今天我将为大家介绍基于所选内容的技术创新成果：${selectedItems.map(item => {
  const { knowledgePoint, contentType } = item;
  const contentTypeLabels = {
    knowledge_point: '知识点',
    tech_packaging: '技术包装',
    tech_promotion: '技术推广',
    tech_press: '技术通稿'
  };
  return `${knowledgePoint.vehicleModel} - ${knowledgePoint.techCategory} - ${knowledgePoint.techPoint} (${contentTypeLabels[contentType]})`;
}).join(', ')}

## 技术亮点
在当今快速发展的科技时代，我们始终坚持创新驱动发展战略，致力于为用户提供更优质的产品和服务。

### 核心技术优势
1. **前沿技术架构**：采用最新的技术栈，确保系统的先进性和稳定性
2. **用户体验优化**：以用户为中心的设计理念，提供直观便捷的操作体验
3. **性能卓越表现**：通过技术优化，实现了显著的性能提升
4. **安全可靠保障**：多层次的安全防护机制，确保数据和系统安全

### 创新成果展示
我们的技术团队经过不懈努力，在多个关键领域取得了突破性进展：
- 系统响应速度提升40%以上
- 用户满意度达到95%以上
- 技术指标行业领先

## 未来展望
展望未来，我们将继续秉承创新精神，不断推进技术进步，为行业发展贡献更多力量。

谢谢大家！`);
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
                <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg text-white">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">演讲稿生成</h1>
                  <p className="text-sm text-gray-500">AI智能演讲稿生成与优化</p>
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
                <p className="text-sm text-gray-500 mt-1">选择知识点及其关联内容类型，将作为生成AI内容的输入信息</p>
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
                allowedContentTypes={['knowledge_point', 'tech_promotion', 'tech_press']}
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
                      <label className="text-sm font-medium text-gray-600 block mb-2">详细描述</label>
                      <p className="text-sm text-gray-700 leading-relaxed">{selectedKnowledgePointForDetail.description}</p>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        const hasKnowledgePoint = selectedItems.some(item => 
                          item.knowledgePointId === selectedKnowledgePointForDetail.id && 
                          item.contentType === 'knowledge_point'
                        );
                        if (!hasKnowledgePoint) {
                          setSelectedItems(prev => [...prev, {
                            knowledgePointId: selectedKnowledgePointForDetail.id,
                            contentType: 'knowledge_point',
                            knowledgePoint: selectedKnowledgePointForDetail
                          }]);
                        }
                      }}
                      disabled={selectedItems.some(item => 
                        item.knowledgePointId === selectedKnowledgePointForDetail.id && 
                        item.contentType === 'knowledge_point'
                      )}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedItems.some(item => 
                          item.knowledgePointId === selectedKnowledgePointForDetail.id && 
                          item.contentType === 'knowledge_point'
                        )
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {selectedItems.some(item => 
                        item.knowledgePointId === selectedKnowledgePointForDetail.id && 
                        item.contentType === 'knowledge_point'
                      ) ? '已选择' : '选择此知识点'}
                    </button>
                    <button
                      onClick={() => setSelectedKnowledgePointForDetail(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      清除选择
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 h-full flex flex-col items-center justify-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">知识点详情区域</p>
                  <p className="text-sm">点击上方表格中的知识点查看详情</p>
                  <p className="text-xs text-gray-400 mt-2">或点击"展开"按钮选择知识点</p>
                </div>
              )}
            </div>
          )}
          
          {/* 右侧：演讲稿内容 */}
          <div className={`${showKnowledgeSelection ? 'w-full' : 'w-1/2'} bg-white rounded-lg border border-gray-200 flex flex-col`}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Code className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">演讲稿内容</h2>
                    <p className="text-sm text-gray-500">AI生成的演讲稿内容</p>
                  </div>
                </div>
                <button
                  onClick={handleSpeechGenerate}
                  disabled={isGenerating || selectedItems.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      生成演讲稿
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-4">
              {speechContent ? (
                <div className="h-full">
                  <textarea
                    value={speechContent}
                    onChange={(e) => setSpeechContent(e.target.value)}
                    className="w-full h-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono text-sm"
                    placeholder="演讲稿内容将在这里显示..."
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">暂无演讲稿内容</p>
                    <p className="text-sm">点击"生成演讲稿"按钮开始AI生成</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <ActionBar
        onRegenerate={() => {
          setSpeechContent('');
          setSelectedItems([]);
        }}
        onSaveDraft={() => {
          // 保存草稿逻辑
          console.log('保存草稿');
        }}
        onSaveContent={() => onExecute({ speechContent, selectedItems })}
        saveContentText="保存演讲稿"
        saveContentIcon={<Sparkles className="w-4 h-4" />}
        disabled={!speechContent}
        isGenerating={isGenerating}
        hasContent={!!speechContent}
      />
    </div>
  );
};

export default SpeechNode;