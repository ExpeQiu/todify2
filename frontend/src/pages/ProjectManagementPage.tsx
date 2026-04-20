import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import { Project } from '../types/project';
import { TechPoint } from '../types/techPoint';
import { SourceInformation } from '../services/sourceService';
import { ConversationRecord } from '../services/chatHistoryService';
import projectService, { ProjectIntelligenceMiningResponse } from '../services/projectService';
import api from '../services/api';
import ProjectPageLayout from '../components/project/ProjectPageLayout';
import TechPointListSidebar from '../components/project/TechPointListSidebar';
import ResourceSidebar from '../components/project/ResourceSidebar';
import TechPointDetailPanel from '../components/project/TechPointDetailPanel';
import ResourceDetailPanel from '../components/project/ResourceDetailPanel';
import ConversationDetailPanel from '../components/project/ConversationDetailPanel';

type CenterPanelContent =
  | { type: 'techPoint'; data: TechPoint }
  | { type: 'resource'; data: SourceInformation | any }
  | { type: 'conversation'; data: ConversationRecord }
  | null;

const ProjectManagementPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [centerPanelContent, setCenterPanelContent] = useState<CenterPanelContent>(null);
  const [techPointListRefreshTrigger, setTechPointListRefreshTrigger] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [miningResult, setMiningResult] = useState<ProjectIntelligenceMiningResponse | null>(null);
  const [showMiningModal, setShowMiningModal] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  // 处理从技术点库返回的选中技术点
  useEffect(() => {
    const selectedTechPointIds = searchParams.get('selectedTechPointIds');
    if (selectedTechPointIds && projectId) {
      handleAddTechPointsFromLibrary(selectedTechPointIds);
    }
  }, [searchParams, projectId]);

  const handleAddTechPointsFromLibrary = async (selectedTechPointIdsStr: string) => {
    if (!projectId) return;

    const techPointIds = selectedTechPointIdsStr
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));

    if (techPointIds.length === 0) {
      // 清除 URL 参数
      setSearchParams({});
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      // 批量添加技术点到项目
      for (const techPointId of techPointIds) {
        try {
          const response = await api.post(`/projects/${projectId}/relations`, {
            relationType: 'tech_point',
            relationId: techPointId
          });

          if (response.data?.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`添加技术点 ${techPointId} 失败:`, error);
          failCount++;
        }
      }

      // 清除 URL 参数
      setSearchParams({});

      // 显示结果消息
      if (successCount > 0) {
        message.success(`成功添加 ${successCount} 个技术点到项目`);
        // 刷新技术点列表
        setTechPointListRefreshTrigger(prev => prev + 1);
      }
      if (failCount > 0) {
        message.warning(`${failCount} 个技术点添加失败，可能已存在`);
      }
    } catch (error) {
      console.error('添加技术点失败:', error);
      message.error('添加技术点失败');
      // 清除 URL 参数
      setSearchParams({});
    }
  };

  const loadProject = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await projectService.getProjectById(parseInt(projectId));
      if (response.success && response.data) {
        setProject(response.data);
      }
    } catch (error) {
      console.error('加载项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTechPoint = (techPoint: TechPoint) => {
    setCenterPanelContent({ type: 'techPoint', data: techPoint });
  };

  const handleSelectResource = (resource: SourceInformation | any) => {
    setCenterPanelContent({ type: 'resource', data: resource });
  };

  const handleSelectConversation = (conversation: ConversationRecord) => {
    setCenterPanelContent({ type: 'conversation', data: conversation });
  };

  const handleCloseCenterPanel = () => {
    setCenterPanelContent(null);
  };

  const handleTechPointSave = () => {
    // 刷新技术点列表数据
    // 可以触发重新加载
  };

  const handleIntelligenceMining = async () => {
    if (!projectId) {
      message.warning('项目ID不存在');
      return;
    }

    setIsMining(true);
    try {
      const response = await projectService.mineProjectIntelligence(parseInt(projectId, 10));
      if (response.success && response.data) {
        setMiningResult(response.data);
        setShowMiningModal(true);
        message.success('信息挖掘完成');
      } else {
        message.error(response.error || response.message || '信息挖掘失败');
      }
    } catch (error) {
      console.error('信息挖掘失败:', error);
      message.error('信息挖掘失败，请稍后重试');
    } finally {
      setIsMining(false);
    }
  };

  const selectedTechPointId =
    centerPanelContent?.type === 'techPoint' ? centerPanelContent.data.id : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">项目不存在</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">项目ID不存在</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ProjectPageLayout
        project={project}
        projectId={projectId}
        currentPage="management"
      >
        <div className="flex h-full">
        {/* 左侧边栏 - 技术点列表 */}
        <div className="w-80 border-r border-gray-200 flex-shrink-0 overflow-hidden bg-white">
          <TechPointListSidebar
            project={project}
            selectedTechPointId={selectedTechPointId}
            onSelectTechPoint={handleSelectTechPoint}
            onSelectResource={handleSelectResource}
            refreshTrigger={techPointListRefreshTrigger}
          />
        </div>

        {/* 中间区域 - 技术点详情 */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            {centerPanelContent === null ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-end gap-2 border-b border-gray-200 bg-white px-4 py-3">
                  <button
                    type="button"
                    onClick={handleIntelligenceMining}
                    disabled={isMining}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isMining ? '挖掘中...' : '信息挖掘'}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    信息诊断
                  </button>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <p className="text-sm">请从左侧选择技术点查看详情</p>
                  </div>
                </div>
              </div>
            ) : centerPanelContent.type === 'techPoint' ? (
              <TechPointDetailPanel
                techPoint={centerPanelContent.data}
                projectId={parseInt(projectId)}
                onClose={handleCloseCenterPanel}
                onSave={handleTechPointSave}
              />
            ) : centerPanelContent.type === 'resource' ? (
              <ResourceDetailPanel
                resource={centerPanelContent.data}
                onClose={handleCloseCenterPanel}
              />
            ) : (
              <ConversationDetailPanel
                conversation={centerPanelContent.data}
                onClose={handleCloseCenterPanel}
              />
            )}
          </div>

          {/* 右侧边栏 - 资源与对话 */}
          <div className="w-80 border-l border-gray-200 flex-shrink-0 overflow-hidden bg-white">
            <ResourceSidebar
              project={project}
              onSelectConversation={handleSelectConversation}
              showResourceSections={false}
            />
          </div>
        </div>
      </ProjectPageLayout>

      {showMiningModal && miningResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">信息挖掘结果</h3>
                <p className="mt-1 text-xs text-gray-500">
                  技术点 {miningResult.contextStats.techPointCount} 条 · 资源 {miningResult.contextStats.resourceCount} 条 · 共创对话 {miningResult.contextStats.conversationCount} 条
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMiningModal(false)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                关闭
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 text-sm text-gray-700">
              <section className="mb-5 rounded-lg border border-gray-200 p-4">
                <h4 className="mb-2 text-base font-semibold text-gray-900">项目概览</h4>
                <p className="mb-2">{miningResult.result.overview?.project_summary || '-'}</p>
                <div className="mb-1">
                  <span className="font-medium text-gray-900">成熟度阶段：</span>
                  <span>{miningResult.result.overview?.maturity_stage || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">核心关注：</span>
                  <span>{(miningResult.result.overview?.core_focus || []).join('、') || '-'}</span>
                </div>
              </section>

              <section className="mb-5 rounded-lg border border-gray-200 p-4">
                <h4 className="mb-2 text-base font-semibold text-gray-900">技术点洞察</h4>
                {(miningResult.result.technical_insights || []).length > 0 ? (
                  <div className="space-y-3">
                    {(miningResult.result.technical_insights || []).map((item, idx) => (
                      <div key={`technical-${idx}`} className="rounded border border-gray-100 bg-gray-50 p-3">
                        <div className="mb-1 font-medium text-gray-900">{item.topic || `技术主题 ${idx + 1}`}</div>
                        <div className="mb-1">发现：{item.finding || '-'}</div>
                        <div className="mb-1">价值：{item.value || '-'}</div>
                        <div>置信度：{item.confidence || '-'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>暂无洞察</p>
                )}
              </section>

              <section className="mb-5 rounded-lg border border-gray-200 p-4">
                <h4 className="mb-2 text-base font-semibold text-gray-900">技术资源洞察</h4>
                {(miningResult.result.resource_insights || []).length > 0 ? (
                  <div className="space-y-3">
                    {(miningResult.result.resource_insights || []).map((item, idx) => (
                      <div key={`resource-${idx}`} className="rounded border border-gray-100 bg-gray-50 p-3">
                        <div className="mb-1 font-medium text-gray-900">{item.topic || `资源主题 ${idx + 1}`}</div>
                        <div className="mb-1">发现：{item.finding || '-'}</div>
                        <div className="mb-1">缺口：{item.gap || '-'}</div>
                        <div>建议：{item.suggestion || '-'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>暂无洞察</p>
                )}
              </section>

              <section className="mb-5 rounded-lg border border-gray-200 p-4">
                <h4 className="mb-2 text-base font-semibold text-gray-900">AI共创洞察</h4>
                {(miningResult.result.cocreation_insights || []).length > 0 ? (
                  <div className="space-y-2">
                    {(miningResult.result.cocreation_insights || []).map((item, idx) => (
                      <div key={`cocreation-${idx}`} className="rounded border border-gray-100 bg-gray-50 p-3">
                        <div className="mb-1 font-medium text-gray-900">{item.app_type || `类型 ${idx + 1}`}</div>
                        <div className="mb-1">发现：{item.finding || '-'}</div>
                        <div>状态：{item.status || '-'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>暂无洞察</p>
                )}
              </section>

              <section className="mb-5 rounded-lg border border-gray-200 p-4">
                <h4 className="mb-2 text-base font-semibold text-gray-900">机会与风险</h4>
                <div className="mb-3">
                  <div className="mb-2 font-medium text-gray-900">机会点</div>
                  {(miningResult.result.opportunities || []).length > 0 ? (
                    <div className="space-y-2">
                      {(miningResult.result.opportunities || []).map((item, idx) => (
                        <div key={`opportunity-${idx}`} className="rounded border border-gray-100 bg-gray-50 p-3">
                          <div className="mb-1 font-medium">{item.title || `机会点 ${idx + 1}`}</div>
                          <div className="mb-1">原因：{item.reason || '-'}</div>
                          <div>优先级：{item.priority || '-'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>暂无机会点</p>
                  )}
                </div>
                <div>
                  <div className="mb-2 font-medium text-gray-900">风险点</div>
                  {(miningResult.result.risks || []).length > 0 ? (
                    <div className="space-y-2">
                      {(miningResult.result.risks || []).map((item, idx) => (
                        <div key={`risk-${idx}`} className="rounded border border-gray-100 bg-gray-50 p-3">
                          <div className="mb-1 font-medium">{item.title || `风险点 ${idx + 1}`}</div>
                          <div className="mb-1">影响：{item.impact || '-'}</div>
                          <div className="mb-1">缓解：{item.mitigation || '-'}</div>
                          <div>优先级：{item.priority || '-'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>暂无风险点</p>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-2 text-base font-semibold text-gray-900">建议下一步</h4>
                {(miningResult.result.next_actions || []).length > 0 ? (
                  <div className="space-y-2">
                    {(miningResult.result.next_actions || []).map((item, idx) => (
                      <div key={`action-${idx}`} className="rounded border border-gray-100 bg-gray-50 p-3">
                        <div className="mb-1 font-medium">{item.action || `动作 ${idx + 1}`}</div>
                        <div className="mb-1">负责人建议：{item.owner || '-'}</div>
                        <div className="mb-1">时间建议：{item.timeline || '-'}</div>
                        <div className="mb-1">预期产出：{item.expected_output || '-'}</div>
                        <div>优先级：{item.priority || '-'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>暂无建议动作</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectManagementPage;

