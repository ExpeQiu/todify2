import React, { useState, useEffect, useRef } from 'react';
import { History, X, Check, X as XIcon, Loader2, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';
import VersionTimeline, { ContentVersion } from './VersionTimeline';

export interface LocalOptimizationRequest {
  executionId: string;
  versionId: string;
  selectedText: string;
  startPosition: number;
  endPosition: number;
  toolAgentId: string;
  instruction?: string;
  contextBefore?: string;
  contextAfter?: string;
}

// ContentVersion类型已移至VersionTimeline组件

interface LocalContentEditorProps {
  executionId: string;
  content: string;
  versionId: string;
  onOptimize: (request: LocalOptimizationRequest) => Promise<void>;
  onRevert: (versionId: string) => Promise<void>;
}

const LocalContentEditor: React.FC<LocalContentEditorProps> = ({
  executionId,
  content,
  versionId,
  onOptimize,
  onRevert
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{start: number; end: number} | null>(null);
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [customInstruction, setCustomInstruction] = useState('');
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [hoveredVersion, setHoveredVersion] = useState<ContentVersion | null>(null);
  const [toolUsageStats, setToolUsageStats] = useState<Record<string, number>>({});
  const [recentlyUsedTools, setRecentlyUsedTools] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationPreview, setOptimizationPreview] = useState<{
    original: string;
    optimized: string;
    toolName: string;
  } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const selectionHighlightRef = useRef<HTMLSpanElement | null>(null);

  // 工具Agent定义
  const TOOL_AGENTS = [
    {
      id: 'polish-writer',
      name: '文字润色',
      description: '改进文字表达，使其更加流畅、专业',
      category: 'optimize',
      icon: '✨'
    },
    {
      id: 'simplify-writer',
      name: '简化表达',
      description: '将复杂的技术内容简化，提高可读性',
      category: 'optimize',
      icon: '📝'
    },
    {
      id: 'enhance-technical',
      name: '技术增强',
      description: '增加技术深度，补充技术细节',
      category: 'optimize',
      icon: '🔬'
    },
    {
      id: 'web-search-supplement',
      name: '互联网搜索补充',
      description: '通过互联网搜索补充相关信息',
      category: 'search',
      icon: '🔍'
    },
    {
      id: 'competitor-research',
      name: '竞品调研',
      description: '补充竞品对比和市场调研信息',
      category: 'research',
      icon: '📊'
    },
    {
      id: 'case-study-finder',
      name: '案例补充',
      description: '为技术点补充应用案例和实践经验',
      category: 'research',
      icon: '💼'
    },
    {
      id: 'format-structure',
      name: '结构优化',
      description: '优化内容结构和层次',
      category: 'format',
      icon: '📐'
    },
    {
      id: 'bullet-points',
      name: '转换为要点',
      description: '将段落内容转换为要点列表',
      category: 'format',
      icon: '📋'
    }
  ];

  // 处理文本选择
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0 && contentRef.current) {
      // 计算选中文本的位置
      const range = selection!.getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(contentRef.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const start = preSelectionRange.toString().length;
      const end = start + text.length;

      setSelectedText(text);
      setSelectionRange({ start, end });

      // 高亮选中文本
      try {
        // 创建高亮标记
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'bg-yellow-200 rounded px-0.5';
        highlightSpan.style.backgroundColor = 'rgba(254, 240, 138, 0.5)';
        
        // 如果已有高亮，先移除
        if (selectionHighlightRef.current) {
          const parent = selectionHighlightRef.current.parentNode;
          if (parent) {
            parent.replaceChild(
              document.createTextNode(selectionHighlightRef.current.textContent || ''),
              selectionHighlightRef.current
            );
          }
        }
        
        range.surroundContents(highlightSpan);
        selectionHighlightRef.current = highlightSpan;
      } catch (e) {
        // 如果surroundContents失败（跨节点选择），忽略高亮
        console.warn('无法高亮选中文本:', e);
      }

      // 显示工具菜单
      const rect = range.getBoundingClientRect();
      setMenuPosition({ 
        x: rect.right + 10, 
        y: rect.top 
      });
      setShowToolMenu(true);
    } else {
      // 清除高亮
      if (selectionHighlightRef.current) {
        const parent = selectionHighlightRef.current.parentNode;
        if (parent) {
          parent.replaceChild(
            document.createTextNode(selectionHighlightRef.current.textContent || ''),
            selectionHighlightRef.current
          );
        }
        selectionHighlightRef.current = null;
      }
      setShowToolMenu(false);
    }
  };

  // 调用工具Agent
  const handleToolSelect = async (toolAgentId: string) => {
    if (!selectionRange) return;

    setIsOptimizing(true);
    setShowToolMenu(false);

    // 更新使用统计
    const newStats = { ...toolUsageStats };
    newStats[toolAgentId] = (newStats[toolAgentId] || 0) + 1;
    setToolUsageStats(newStats);
    
    // 更新最近使用
    const newRecent = [toolAgentId, ...recentlyUsedTools.filter(id => id !== toolAgentId)].slice(0, 5);
    setRecentlyUsedTools(newRecent);
    
    // 保存到localStorage
    try {
      localStorage.setItem(`tool-usage-${executionId}`, JSON.stringify(newStats));
      localStorage.setItem(`recent-tools-${executionId}`, JSON.stringify(newRecent));
    } catch (e) {
      console.warn('保存工具使用统计失败:', e);
    }

    // 获取上下文
    const contextBefore = content.substring(
      Math.max(0, selectionRange.start - 200),
      selectionRange.start
    );
    const contextAfter = content.substring(
      selectionRange.end,
      Math.min(content.length, selectionRange.end + 200)
    );

    const request: LocalOptimizationRequest = {
      executionId,
      versionId,
      selectedText,
      startPosition: selectionRange.start,
      endPosition: selectionRange.end,
      toolAgentId,
      instruction: customInstruction || undefined,
      contextBefore,
      contextAfter
    };

    try {
      const response = await api.post('/agent/optimize-local', request);
      
      if (response.data.success && response.data.data) {
        const result = response.data.data;
        const toolName = TOOL_AGENTS.find(t => t.id === toolAgentId)?.name || toolAgentId;
        
        // 显示优化预览
        setOptimizationPreview({
          original: result.originalText,
          optimized: result.optimizedText,
          toolName
        });
      } else {
        throw new Error(response.data.error || '优化失败');
      }
    } catch (error: any) {
      console.error('优化失败:', error);
      alert('优化失败：' + (error.response?.data?.error || error.message || '未知错误'));
      setIsOptimizing(false);
    }
  };

  // 确认应用优化
  const handleConfirmOptimization = async () => {
    if (!optimizationPreview || !selectionRange) return;

    try {
      // 调用onOptimize来应用优化
      const contextBefore = content.substring(
        Math.max(0, selectionRange.start - 200),
        selectionRange.start
      );
      const contextAfter = content.substring(
        selectionRange.end,
        Math.min(content.length, selectionRange.end + 200)
      );

      const request: LocalOptimizationRequest = {
        executionId,
        versionId,
        selectedText: optimizationPreview.original,
        startPosition: selectionRange.start,
        endPosition: selectionRange.end,
        toolAgentId: '', // 不需要再次调用，直接应用
        contextBefore,
        contextAfter
      };

      // 直接调用onOptimize，但需要先找到对应的toolAgentId
      // 这里简化处理，直接应用优化结果
      await onOptimize({
        ...request,
        toolAgentId: TOOL_AGENTS.find(t => t.name === optimizationPreview.toolName)?.id || ''
      });

      // 清除状态
      setOptimizationPreview(null);
      setShowToolMenu(false);
      setCustomInstruction('');
      setSelectedText('');
      setSelectionRange(null);
      setIsOptimizing(false);
      
      // 清除高亮
      if (selectionHighlightRef.current) {
        const parent = selectionHighlightRef.current.parentNode;
        if (parent) {
          parent.replaceChild(
            document.createTextNode(selectionHighlightRef.current.textContent || ''),
            selectionHighlightRef.current
          );
        }
        selectionHighlightRef.current = null;
      }
    } catch (error) {
      console.error('应用优化失败:', error);
    }
  };

  // 取消优化
  const handleCancelOptimization = () => {
    setOptimizationPreview(null);
    setIsOptimizing(false);
    setShowToolMenu(true);
  };

  // 加载工具使用统计
  useEffect(() => {
    if (executionId) {
      try {
        const statsStr = localStorage.getItem(`tool-usage-${executionId}`);
        const recentStr = localStorage.getItem(`recent-tools-${executionId}`);
        if (statsStr) {
          setToolUsageStats(JSON.parse(statsStr));
        }
        if (recentStr) {
          setRecentlyUsedTools(JSON.parse(recentStr));
        }
      } catch (e) {
        console.warn('加载工具使用统计失败:', e);
      }
    }
  }, [executionId]);

  // 加载版本历史
  useEffect(() => {
    const loadVersions = async () => {
      try {
        const response = await api.get(`/agent/executions/${executionId}/versions`);
        if (response.data.success && response.data.data) {
          const versionsData = response.data.data.versions.map((v: any) => ({
            ...v,
            timestamp: new Date(v.timestamp)
          }));
          setVersions(versionsData);
        }
      } catch (error) {
        console.error('加载版本历史失败:', error);
        // 失败时使用空数组，不影响使用
        setVersions([]);
      }
    };

    if (executionId) {
      loadVersions();
    }
  }, [executionId]);

  return (
    <div className="local-content-editor relative">
      {/* 内容展示区 */}
      <div
        ref={contentRef}
        id="content-container"
        className="content-container min-h-[400px] p-4 border border-gray-200 rounded-lg bg-white"
        onMouseUp={handleTextSelection}
      >
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      </div>

      {/* 工具菜单 */}
      {showToolMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-[320px]"
          style={{ 
            left: `${menuPosition.x}px`, 
            top: `${menuPosition.y}px`,
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">选择优化工具</span>
            <button
              onClick={() => {
                setShowToolMenu(false);
                setCustomInstruction('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 选中文本信息 */}
          {selectedText && (
            <div className="p-3 border-b border-gray-200 bg-blue-50">
              <div className="text-xs text-gray-600 mb-1">已选中文本</div>
              <div className="text-sm text-gray-800 font-medium mb-1 line-clamp-2">
                {selectedText}
              </div>
              <div className="text-xs text-gray-500">
                字符数: {selectedText.length} | 位置: {selectionRange?.start}-{selectionRange?.end}
              </div>
            </div>
          )}

          {/* 上下文预览 */}
          {selectedText && selectionRange && (
            <div className="p-3 border-b border-gray-200 bg-gray-50 max-h-32 overflow-y-auto">
              <div className="text-xs text-gray-600 mb-1">上下文预览</div>
              <div className="text-xs text-gray-700 space-y-1">
                {content.substring(Math.max(0, selectionRange.start - 100), selectionRange.start) && (
                  <div className="text-gray-500">
                    ...{content.substring(Math.max(0, selectionRange.start - 50), selectionRange.start)}
                  </div>
                )}
                <div className="bg-yellow-100 px-1 rounded font-medium">
                  {selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}
                </div>
                {content.substring(selectionRange.end, Math.min(content.length, selectionRange.end + 100)) && (
                  <div className="text-gray-500">
                    {content.substring(selectionRange.end, Math.min(content.length, selectionRange.end + 50))}...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 自定义指令 */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="自定义优化要求（可选）"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 工具列表 - 按分类显示 */}
          <div className="p-2 max-h-[400px] overflow-y-auto">
            {(() => {
              // 按分类分组
              const categories: Record<string, typeof TOOL_AGENTS> = {
                optimize: [],
                search: [],
                research: [],
                format: []
              };

              TOOL_AGENTS.forEach(tool => {
                if (categories[tool.category]) {
                  categories[tool.category].push(tool);
                }
              });

              // 排序：最近使用的优先，然后按使用次数
              const sortTools = (tools: typeof TOOL_AGENTS) => {
                return [...tools].sort((a, b) => {
                  const aRecent = recentlyUsedTools.indexOf(a.id);
                  const bRecent = recentlyUsedTools.indexOf(b.id);
                  if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
                  if (aRecent !== -1) return -1;
                  if (bRecent !== -1) return 1;
                  const aCount = toolUsageStats[a.id] || 0;
                  const bCount = toolUsageStats[b.id] || 0;
                  return bCount - aCount;
                });
              };

              const categoryNames: Record<string, string> = {
                optimize: '优化工具',
                search: '搜索工具',
                research: '研究工具',
                format: '格式工具'
              };

              return Object.entries(categories).map(([category, tools]) => {
                if (tools.length === 0) return null;
                const sortedTools = sortTools(tools);
                
                return (
                  <div key={category} className="mb-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                      {categoryNames[category]}
                    </div>
                    {sortedTools.map(tool => {
                      const usageCount = toolUsageStats[tool.id] || 0;
                      const isRecent = recentlyUsedTools.includes(tool.id);
                      
                      return (
                        <button
                          key={tool.id}
                          className="w-full flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left mb-1 relative"
                          onClick={() => handleToolSelect(tool.id)}
                        >
                          <span className="text-2xl flex-shrink-0">{tool.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium text-gray-800">{tool.name}</div>
                              {isRecent && (
                                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                  最近使用
                                </span>
                              )}
                              {usageCount > 0 && (
                                <span className="text-xs text-gray-400">
                                  ({usageCount}次)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{tool.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* 优化预览弹窗 */}
      {optimizationPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                优化预览 - {optimizationPreview.toolName}
              </h3>
              <button
                onClick={handleCancelOptimization}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* 原文 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">原文</h4>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {optimizationPreview.original}
                  </p>
                </div>
              </div>

              {/* 优化后 */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">优化后</h4>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {optimizationPreview.optimized}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={handleCancelOptimization}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmOptimization}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>确认应用</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 优化中提示 */}
      {isOptimizing && !optimizationPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-700">正在优化中...</p>
          </div>
        </div>
      )}

      {/* 版本历史按钮 */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setShowVersionHistory(!showVersionHistory)}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <History className="w-4 h-4" />
          <span>查看版本历史</span>
        </button>
      </div>

      {/* 版本历史面板 */}
      {showVersionHistory && (
        <div className="mt-4">
          <VersionTimeline
            versions={versions}
            currentVersionId={versionId}
            onRevert={onRevert}
            onVersionHover={setHoveredVersion}
          />
        </div>
      )}
    </div>
  );
};

export default LocalContentEditor;

