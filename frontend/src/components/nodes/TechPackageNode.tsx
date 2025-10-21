import React, { useState } from 'react';
import { 
  Brain, 
  ArrowLeft, 
  Package,
  BookOpen, 
  ArrowRight, 
  Download, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw,
  Copy,
  Share2,
  Sparkles,
  Save,
  X,
  Check
} from 'lucide-react';
import { BaseNodeProps } from '../../types/nodeComponent';
import { workflowAPI } from '../../services/api';
import KnowledgePointSelector, { KnowledgePoint, SelectionItem, ContentType } from '../common/KnowledgePointSelector';
import AIInterArea from '../AIInterArea';
import './NodeComponent.css';

interface TechPackageNodeProps extends BaseNodeProps {
  initialData?: any;
  isLoading?: boolean;
}

const TechPackageNode: React.FC<TechPackageNodeProps> = ({
  onExecute,
  initialData,
  isLoading = false
}) => {
  const [query, setQuery] = useState(initialData?.query || '');
  const [activeTab, setActiveTab] = useState('技术包装');
  const [aiResponse, setAiResponse] = useState('');
  const [userContent, setUserContent] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  
  // 知识点选择相关状态
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  const [showKnowledgeSelection, setShowKnowledgeSelection] = useState(true);
  
  // 保存模态框相关状态
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [modalSelectedItems, setModalSelectedItems] = useState<SelectionItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const tabs = ['信息检索', '技术包装', '技术策略', '技术通稿', '技术发布稿'];
  
  // 模拟知识点数据
  const knowledgePoints: KnowledgePoint[] = [
    { id: '1', vehicleModel: 'Model S', vehicleSeries: 'Tesla', techCategory: '动力系统', techPoint: '三元锂电池', description: '高能量密度的锂离子电池技术，提供长续航里程' },
    { id: '2', vehicleModel: 'Model S', vehicleSeries: 'Tesla', techCategory: '电池管理', techPoint: 'BMS系统', description: '智能电池管理系统，确保电池安全和性能' },
    { id: '3', vehicleModel: 'Model S', vehicleSeries: 'Tesla', techCategory: '自动驾驶', techPoint: 'FSD芯片', description: '自主研发的全自动驾驶芯片，算力强大' },
    { id: '4', vehicleModel: 'Model 3', vehicleSeries: 'Tesla', techCategory: '动力系统', techPoint: '永磁同步电机', description: '高效率的永磁同步电机，提供强劲动力' },
    { id: '5', vehicleModel: 'Model 3', vehicleSeries: 'Tesla', techCategory: '智能网联', techPoint: '车载娱乐系统', description: '17英寸触控屏，集成丰富的娱乐功能' },
    { id: '6', vehicleModel: 'Model X', vehicleSeries: 'Tesla', techCategory: '车身结构', techPoint: '鹰翼门', description: '独特的鹰翼门设计，提升乘坐体验' },
    { id: '7', vehicleModel: 'Model X', vehicleSeries: 'Tesla', techCategory: '空气动力学', techPoint: '主动进气格栅', description: '智能调节进气量，优化空气动力学性能' },
    { id: '8', vehicleModel: 'Model Y', vehicleSeries: 'Tesla', techCategory: '制造工艺', techPoint: '一体化压铸', description: '后车身一体化压铸技术，提高结构强度' }
  ];

  // AI搜索处理函数
  const handleAiSearch = async () => {
    if (!query.trim()) return;
    
    setInternalLoading(true);
    setAiResponse('');
    setLiked(false);
    setDisliked(false);
    
    try {
      const response = await workflowAPI.techPackage({
        query: query,
        selectedKnowledgePoints: selectedItems.filter(item => item.contentType === 'knowledge_point')
      });
      
      if (response.success) {
        setAiResponse(response.data.content || '技术包装方案已生成，请查看右侧编辑区域进行进一步完善。');
        setUserContent(response.data.content || '');
        
        // 执行工作流
        if (onExecute) {
          onExecute({
            query,
            response: response.data.content,
            selectedKnowledgePoints: selectedItems
          });
        }
      } else {
        setAiResponse('生成失败，请重试。');
      }
    } catch (error) {
      console.error('AI搜索失败:', error);
      setAiResponse('网络错误，请检查连接后重试。');
    } finally {
      setInternalLoading(false);
    }
  };

  const handleAdopt = () => {
    setShowSaveModal(true);
    setModalSelectedItems([...selectedItems]);
  };

  // 打开保存模态框
  const handleOpenSaveModal = () => {
    setShowSaveModal(true);
    setModalSelectedItems([...selectedItems]);
  };

  // 关闭保存模态框
  const handleCloseSaveModal = () => {
    setShowSaveModal(false);
    setModalSelectedItems([]);
  };

  // 确认保存
  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      // 这里可以调用保存API
      await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟保存过程
      
      // 保存成功后关闭模态框
      setShowSaveModal(false);
      setModalSelectedItems([]);
      
      // 可以显示成功提示
      console.log('知识点保存成功');
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!userContent) return;
    
    // 创建下载链接
    const element = document.createElement('a');
    const file = new Blob([userContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `tech-package-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // 清理URL对象
    URL.revokeObjectURL(element.href);
  };

  // 复制功能
  const handleCopy = async () => {
    if (!aiResponse) return;
    
    try {
      await navigator.clipboard.writeText(aiResponse);
      // 这里可以显示复制成功的提示
      console.log('内容已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
  };

  const handleShare = () => {
    // 采纳功能 - 将AI回答复制到用户内容区域
    if (aiResponse) {
      setUserContent(aiResponse);
    }
  };

  const handleRegenerate = () => {
    // 重新生成 - 重新调用AI搜索
    handleAiSearch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">返回</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-orange-600" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">技术包装</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">中文</span>
              <span className="text-sm text-gray-500">分享</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* 知识点选择器 */}
        <KnowledgePointSelector
          knowledgePoints={knowledgePoints}
          initialSelectedItems={selectedItems}
          allowedContentTypes={['knowledge_point', 'tech_packaging', 'tech_promotion', 'tech_press']}
          initialExpanded={showKnowledgeSelection}
          onSelectionChange={(selectedItems) => {
            setSelectedItems(selectedItems);
          }}
          onSave={(selectedItems) => {
            const content = selectedItems
             .filter(item => item.contentType !== 'knowledge_point')
             .map(item => {
               const kp = item.knowledgePoint;
               return `【${kp.vehicleModel} - ${kp.techCategory}】${kp.techPoint}: ${kp.description}`;
             })
             .join('\n\n');
            
            if (content) {
              setUserContent(prev => prev ? `${prev}\n\n${content}` : content);
            }
          }}
          className="mb-6"
        />

        {/* 主要内容区域 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ height: 'calc(100vh - 200px)' }}>
            {/* 左侧AI对话区域 */}
            <div className="p-8 border-r border-gray-200">
              <AIInterArea
                pageType="tech_package"
                query={query}
                aiResponse={aiResponse}
                liked={liked}
                disliked={disliked}
                onCopy={handleCopy}
                onLike={handleLike}
                onDislike={handleDislike}
                onShare={handleShare}
                onRegenerate={handleRegenerate}
                onQueryChange={setQuery}
                onSubmit={handleAiSearch}
                loading={internalLoading}
              />
            </div>

            {/* 右侧编辑区域 */}
            <div className="p-8">
              <div className="h-full flex flex-col">
                {/* 编辑区域标题 */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">编辑修订</h2>
                </div>

                {/* 文本编辑区域 */}
                <div className="flex-1 mb-6">
                  <textarea
                    value={userContent}
                    onChange={(e) => setUserContent(e.target.value)}
                    placeholder="在这里编辑和完善技术包装内容..."
                    className="w-full h-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none text-sm leading-relaxed min-h-[500px]"
                  />
                </div>

                {/* 底部操作按钮 */}
                <div className="flex gap-4">
                  <button
                    onClick={handleAdopt}
                    disabled={!aiResponse}
                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>保存知识点</span>
                  </button>
                  
                  <button
                    onClick={handleExport}
                    disabled={!userContent}
                    className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>导出</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 保存确认模态框 */}
        {showSaveModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  <Save className="w-5 h-5 text-orange-600" />
                  确认保存知识点
                </h3>
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-close-button"
                  disabled={isSaving}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="modal-body">
                <p className="modal-description">
                  您即将保存以下 {modalSelectedItems.length} 个知识点，请确认选择：
                </p>
                
                <div className="knowledge-points-preview">
                  <KnowledgePointSelector
                    knowledgePoints={knowledgePoints}
                    initialSelectedItems={modalSelectedItems}
                    initialExpanded={true}
                    title=""
                    description=""
                    onSelectionChange={setModalSelectedItems}
                    showSaveButton={false}
                    collapsible={false}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button
                  onClick={handleCloseSaveModal}
                  className="modal-cancel-button"
                  disabled={isSaving}
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmSave}
                  className="modal-confirm-button"
                  disabled={isSaving || modalSelectedItems.length === 0}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      确认保存 ({modalSelectedItems.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TechPackageNode;