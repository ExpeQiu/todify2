import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, Play, Square, RefreshCw, FileText, Users, MessageSquare, Loader2, Send } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { brainstormService } from '@/services/brainstormService';
import { BrainstormSession, BrainstormMessage, CreateBrainstormSessionDTO } from '@/types/brainstorm';
import { BrainstormSetupModal } from '@/components/brainstorm/BrainstormSetupModal';
import { BrainstormMessageList } from '@/components/brainstorm/BrainstormMessageList';
import { BrainstormSummary } from '@/components/brainstorm/BrainstormSummary';
import SourceSidebar, { Source } from '@/components/ai-search/SourceSidebar';
import sourceService from '@/services/sourceService';
import TopNavigation from '@/components/TopNavigation';
import { toast } from 'sonner';
import { exportDiscussion } from '@/utils/brainstormExport';
import { Download } from 'lucide-react';
import { projectService } from '@/services/projectService';
import { Project } from '@/types/project';

const BrainstormPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const [sessions, setSessions] = useState<BrainstormSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<BrainstormSession | null>(null);
  const [messages, setMessages] = useState<BrainstormMessage[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [userInput, setUserInput] = useState('');
  const [sendingUserMessage, setSendingUserMessage] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 加载来源信息（根据是否有 projectId 选择不同的查询方式）
  const loadSources = useCallback(async () => {
    try {
      setLoadingSources(true);
      let result;
      
      if (projectId) {
        // 如果有项目ID，使用项目级查询
        const projectIdNum = parseInt(projectId);
        if (!isNaN(projectIdNum)) {
          result = await sourceService.loadSourceInformationByProjectId(projectIdNum);
        } else {
          console.warn('[BrainstormPage] 无效的项目ID:', projectId);
          return;
        }
      } else {
        // 如果没有项目ID，使用页面类型查询
        result = await sourceService.loadSourceInformationByPageType('tech-strategy');
      }
      
      if (result.success && result.data) {
        setSources(result.data);
      }
    } catch (error) {
      console.error('加载来源信息失败:', error);
    } finally {
      setLoadingSources(false);
    }
  }, [projectId]);

  // 加载项目信息
  useEffect(() => {
    const loadProject = async () => {
      if (projectId) {
        const projectIdNum = parseInt(projectId);
        if (!isNaN(projectIdNum)) {
          try {
            const result = await projectService.getProjectById(projectIdNum);
            if (result.success && result.data) {
              setProject(result.data);
            }
          } catch (error) {
            console.error('加载项目信息失败:', error);
          }
        }
      } else {
        setProject(null);
      }
    };
    loadProject();
  }, [projectId]);

  // 加载会话列表
  useEffect(() => {
    loadSessions();
    loadSources();
  }, [loadSources]);

  // 当选中会话变化时，加载消息
  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id);
      startPolling(selectedSession.id);
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [selectedSession?.id]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await brainstormService.listSessions();
      setSessions(data);
      
      // 如果有选中的会话，更新它
      if (selectedSession) {
        const updated = data.find(s => s.id === selectedSession.id);
        if (updated) {
          setSelectedSession(updated);
        }
      }
    } catch (error) {
      console.error('加载会话列表失败:', error);
      toast.error('加载会话列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      setLoadingMessages(true);
      const data = await brainstormService.getMessages(sessionId);
      setMessages(data);
    } catch (error) {
      console.error('加载消息失败:', error);
      toast.error('加载消息失败');
    } finally {
      setLoadingMessages(false);
    }
  };

  const startPolling = (sessionId: string) => {
    // 如果会话是活跃状态，每3秒轮询一次
    const interval = setInterval(async () => {
      try {
        const status = await brainstormService.getSessionStatus(sessionId);
        if (status.isActive || status.status === 'active') {
          await loadMessages(sessionId);
          // 同时更新会话状态
          const updated = await brainstormService.getSession(sessionId);
          setSelectedSession(updated);
        } else {
          // 讨论已结束，停止轮询
          stopPolling();
          await loadMessages(sessionId);
          const updated = await brainstormService.getSession(sessionId);
          setSelectedSession(updated);
        }
      } catch (error) {
        console.error('轮询失败:', error);
      }
    }, 3000);

    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const handleCreateSession = async (data: CreateBrainstormSessionDTO) => {
    try {
      const session = await brainstormService.createSession(data);
      setSessions([session, ...sessions]);
      setSelectedSession(session);
      setIsSetupModalOpen(false);
      toast.success('会话创建成功');
    } catch (error) {
      console.error('创建会话失败:', error);
      throw error;
    }
  };

  const handleStartSession = async () => {
    if (!selectedSession) return;

    try {
      await brainstormService.startSession(selectedSession.id);
      toast.success('讨论已启动');
      // 重新加载会话状态
      const updated = await brainstormService.getSession(selectedSession.id);
      setSelectedSession(updated);
      startPolling(selectedSession.id);
    } catch (error) {
      console.error('启动讨论失败:', error);
      toast.error(error instanceof Error ? error.message : '启动讨论失败');
    }
  };

  const handleStopSession = async () => {
    if (!selectedSession) return;

    try {
      await brainstormService.stopSession(selectedSession.id);
      toast.success('讨论已停止');
      stopPolling();
      // 重新加载会话状态
      const updated = await brainstormService.getSession(selectedSession.id);
      setSelectedSession(updated);
    } catch (error) {
      console.error('停止讨论失败:', error);
      toast.error(error instanceof Error ? error.message : '停止讨论失败');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('确定要删除这个会话吗？')) return;

    try {
      await brainstormService.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
      toast.success('会话已删除');
    } catch (error) {
      console.error('删除会话失败:', error);
      toast.error('删除会话失败');
    }
  };

  const handleSendUserMessage = async () => {
    if (!selectedSession || !userInput.trim() || sendingUserMessage) return;

    try {
      setSendingUserMessage(true);
      const message = await brainstormService.addUserMessage(
        selectedSession.id,
        userInput.trim()
      );
      setUserInput('');
      setMessages([...messages, message]);
      toast.success('消息已发送');
    } catch (error) {
      console.error('发送用户消息失败:', error);
      toast.error(error instanceof Error ? error.message : '发送消息失败');
    } finally {
      setSendingUserMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendUserMessage();
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      stopped: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getStatusText = (status: string) => {
    const texts = {
      draft: '草稿',
      active: '进行中',
      completed: '已完成',
      stopped: '已停止',
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopNavigation />
      {project && (
        <div className="mx-4 mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-blue-900">项目编号：</span>
            <span className="text-blue-700">{project.id}</span>
            <span className="text-blue-400">|</span>
            <span className="font-medium text-blue-900">项目名称：</span>
            <span className="text-blue-700">{project.name}</span>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧来源栏 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <SourceSidebar
            sources={sources}
            selectedSources={selectedSourceIds}
            onSourcesChange={(newSources) => {
              setSources(newSources);
              loadSources();
            }}
            onSelectionChange={setSelectedSourceIds}
            pageType="tech-strategy"
          />
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedSession ? (
            <>
              {/* 会话头部 */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">{selectedSession.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>话题：{selectedSession.topic}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{selectedSession.participants?.length || 0} 位专家</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedSession.status === 'draft' && (
                      <button
                        onClick={handleStartSession}
                        className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        <span>开始讨论</span>
                      </button>
                    )}
                    {selectedSession.status === 'active' && (
                      <button
                        onClick={handleStopSession}
                        className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Square className="w-4 h-4" />
                        <span>停止讨论</span>
                      </button>
                    )}
                    {(selectedSession.status === 'completed' || selectedSession.status === 'stopped') && (
                      <button
                        onClick={() => loadMessages(selectedSession.id)}
                        className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>刷新</span>
                      </button>
                    )}
                    <div className="relative group">
                      <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>导出</span>
                      </button>
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => exportDiscussion(selectedSession, messages, selectedSession.participants, 'md')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                        >
                          导出为 Markdown
                        </button>
                        <button
                          onClick={() => exportDiscussion(selectedSession, messages, selectedSession.participants, 'txt')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                        >
                          导出为文本
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSession(selectedSession.id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
                {selectedSession.description && (
                  <p className="text-sm text-gray-600">{selectedSession.description}</p>
                )}
              </div>

              {/* 消息内容区 */}
              <div className="flex-1 flex overflow-hidden">
                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <>
                      {messages.length > 0 ? (
                        <BrainstormMessageList
                          messages={messages}
                          participants={selectedSession.participants}
                          autoScroll={selectedSession.status === 'active'}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p>讨论尚未开始</p>
                            {selectedSession.status === 'draft' && (
                              <p className="text-sm mt-2">点击"开始讨论"按钮启动讨论</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 右侧栏：上半部分专家列表，下半部分会话列表 */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                  {/* 上半部分：专家列表 */}
                  {selectedSession.participants && selectedSession.participants.length > 0 && (
                    <div className="flex-shrink-0">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900">参与专家</h3>
                        <p className="text-xs text-gray-500 mt-1">{selectedSession.participants.length} 位专家</p>
                      </div>
                      <div className="overflow-y-auto p-4" style={{ maxHeight: '40vh' }}>
                        <div className="space-y-3">
                          {selectedSession.participants.map((participant) => {
                            const role = participant.aiRole;
                            const displayName = participant.displayName || role?.name || '未知专家';
                            const description = role?.description || '';
                            const avatar = role?.avatar;
                            const isModerator = selectedSession.config?.moderatorConfig?.enabled && 
                                              selectedSession.config?.moderatorConfig?.moderatorRoleId === participant.aiRoleId;

                            return (
                              <div
                                key={participant.id}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                              >
                                <div className="flex items-start space-x-3">
                                  {avatar ? (
                                    <img
                                      src={avatar}
                                      alt={displayName}
                                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                      <span className="text-blue-600 text-lg font-medium">
                                        {displayName.charAt(0)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-medium text-gray-900 text-sm">{displayName}</span>
                                      {isModerator && (
                                        <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                                          主持人
                                        </span>
                                      )}
                                    </div>
                                    {description && (
                                      <p className="text-xs text-gray-600 line-clamp-2">{description}</p>
                                    )}
                                    {participant.roleType && (
                                      <p className="text-xs text-gray-500 mt-1">角色类型: {participant.roleType}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 下半部分：会话列表 */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-gray-900">会话列表</h2>
                      <button
                        onClick={() => setIsSetupModalOpen(true)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>新建</span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {loading ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      ) : sessions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-sm">还没有会话</p>
                          <p className="text-xs mt-2">点击"新建"创建第一个会话</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {sessions.map((session) => (
                            <div
                              key={session.id}
                              onClick={() => setSelectedSession(session)}
                              className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                                selectedSession?.id === session.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{session.title}</h3>
                                <span className={`px-1.5 py-0.5 text-xs font-medium rounded flex-shrink-0 ${getStatusBadge(session.status)}`}>
                                  {getStatusText(session.status)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-1">{session.topic}</p>
                              <div className="flex items-center space-x-3 text-xs text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <Users className="w-3 h-3" />
                                  <span>{session.participants?.length || 0}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{session.messageCount || 0}</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 用户输入区 */}
              {(selectedSession.status === 'active' || selectedSession.status === 'completed') && (
                <div className="border-t border-gray-200 p-4 bg-white">
                  <div className="flex items-end space-x-2">
                    <textarea
                      ref={inputRef}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="输入你的观点或问题..."
                      rows={2}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      disabled={sendingUserMessage}
                    />
                    <button
                      onClick={handleSendUserMessage}
                      disabled={!userInput.trim() || sendingUserMessage}
                      className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>发送</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    按 Enter 发送，Shift+Enter 换行
                  </p>
                </div>
              )}

              {/* 总结区域 */}
              {selectedSession.summary && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <BrainstormSummary
                    summary={selectedSession.summary}
                    sessionTitle={selectedSession.title}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {/* 未选中会话时的消息区域 */}
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>请选择一个会话或创建新会话</p>
                </div>
              </div>

              {/* 右侧栏：上半部分为空，下半部分会话列表 */}
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                {/* 上半部分：空占位，保持布局一致 */}
                <div className="flex-shrink-0"></div>

                {/* 下半部分：会话列表 */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900">会话列表</h2>
                    <button
                      onClick={() => setIsSetupModalOpen(true)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>新建</span>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">还没有会话</p>
                        <p className="text-xs mt-2">点击"新建"创建第一个会话</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            onClick={() => setSelectedSession(session)}
                            className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedSession?.id === session.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{session.title}</h3>
                              <span className={`px-1.5 py-0.5 text-xs font-medium rounded flex-shrink-0 ${getStatusBadge(session.status)}`}>
                                {getStatusText(session.status)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-1">{session.topic}</p>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{session.participants?.length || 0}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <MessageSquare className="w-3 h-3" />
                                <span>{session.messageCount || 0}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 创建会话弹窗 */}
      <BrainstormSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSubmit={handleCreateSession}
        projectId={projectId ? parseInt(projectId, 10) : undefined}
      />
    </div>
  );
};

export default BrainstormPage;

