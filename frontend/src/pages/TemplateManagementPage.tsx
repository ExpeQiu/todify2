import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Eye, X, 
  Sparkles, Layers, Copy, Check, ChevronLeft 
} from 'lucide-react';
import TopNavigation from '../components/TopNavigation';

/**
 * 模板接口定义
 */
interface Template {
  id: string;
  name: string;
  type: 'speech' | 'ai-chat' | 'ai-chat-edit' | 'ai-chat-knowledge' | 'ai-chat-source' | 'ai-chat-source-tools' | 'custom';
  description?: string;
  html: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 模板管理页面
 */
const TemplateManagementPage: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom' as 'speech' | 'ai-chat' | 'ai-chat-edit' | 'ai-chat-knowledge' | 'ai-chat-source' | 'ai-chat-source-tools' | 'custom',
    description: '',
    html: '',
  });

  // 预览HTML内容
  const [previewHtml, setPreviewHtml] = useState('');

  // 预设模板
  const PRESET_TEMPLATES = {
    'speech': {
      id: 'preset-speech',
      name: 'A问答模版',
      type: 'speech' as const,
      description: '发布会稿助手页面模板',
      html: `<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div class="w-full min-h-[calc(100vh-180px)] flex flex-col">
      <div class="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 min-h-0">
        <div class="mb-4 sm:mb-6 p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm font-medium text-purple-700">补充信息</span>
          </div>
          <textarea
            placeholder="请输入补充信息，如发布会背景、产品特色、目标受众等，这将帮助AI生成更精准的演讲稿..."
            class="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none text-sm bg-white"
            rows="3"
          ></textarea>
          <div class="mt-2 text-xs text-purple-600">
            提示：详细的背景信息将帮助AI生成更专业、更符合您需求的发布会稿
          </div>
        </div>
        <div class="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-shrink-0">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-700">发布会稿助手</span>
        </div>
        <div class="flex-1 bg-gray-50 rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 overflow-y-auto min-h-0">
          <div class="flex justify-start">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
              </div>
              <div class="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-4 max-w-full sm:max-w-2xl lg:max-w-3xl shadow-sm">
                <p class="text-sm text-gray-800 leading-relaxed">
                  您好！我是发布会稿助手，专门为您撰写专业的发布会演讲稿。请输入您的发布会主题和内容，我会为您生成精彩的演讲稿。
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">对话提醒：1-生成内容大纲📝 2-生成初稿📄 3-风格化领导发言稿</span>
        </div>
      </div>
    </div>
  </div>
</div>`,
    },
    'ai-chat': {
      id: 'preset-ai-chat',
      name: 'AI问答模版（带附加信息）',
      type: 'ai-chat' as const,
      description: 'AI问答页面模板',
      html: `<div class="bg-white border-b border-gray-200 px-6 py-4">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-lg font-semibold text-gray-800">AI问答</h1>
      <div class="flex items-center mt-1 space-x-4 text-sm text-gray-500">
        <span class="flex items-center">
          <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          技术包装
        </span>
        <span class="flex items-center">
          <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
          技术策略
        </span>
        <span class="flex items-center">
          <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
          技术通稿
        </span>
        <span class="flex items-center">
          <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
          发布会稿
        </span>
      </div>
    </div>
    <div class="flex items-center space-x-2">
      <button class="flex items-center space-x-1.5 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-md">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        <span>新对话</span>
      </button>
      <button class="flex items-center space-x-1.5 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-all duration-200 shadow-md">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>搜索历史记录</span>
      </button>
    </div>
  </div>
</div>
<div class="flex-1 overflow-y-auto p-6">
  <div class="flex flex-col items-center justify-center h-full">
    <div class="text-center">
      <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
      </div>
      <h2 class="text-xl font-medium text-gray-800 mb-2">您在忙什么？</h2>
      <p class="text-gray-500 text-sm max-w-md">
        我是您的AI助手，可以帮助您处理技术包装、推广策略、技术通稿等各种工作流程。
      </p>
    </div>
  </div>
</div>
<div class="bg-white border-t border-gray-200 p-4"></div>`,
    },
    'ai-chat-edit': {
      id: 'preset-ai-chat-edit',
      name: 'AI对话编辑',
      type: 'ai-chat-edit' as const,
      description: 'AI对话和内容编辑一体化模板',
      html: `<div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style="max-height: 70vh;">
  <div class="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-hidden">
    <!-- 左侧AI对话区域 -->
    <div class="p-8 border-r border-gray-200 flex flex-col overflow-hidden">
      <div class="flex-1 overflow-y-auto">
        <div class="space-y-4">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">AI对话</h2>
          </div>
          <div class="bg-gray-50 rounded-lg p-4 mb-4">
            <p class="text-sm text-gray-600">您好！我是AI助手，可以帮助您处理各种工作。请输入您的问题，我会为您提供帮助。</p>
          </div>
          <div class="space-y-3">
            <textarea 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
              rows="4" 
              placeholder="请输入您的问题..."
            ></textarea>
            <button class="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium">
              发送
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧编辑区域 -->
    <div class="p-8 flex flex-col overflow-hidden">
      <div class="h-full flex flex-col">
        <!-- 编辑区域标题 -->
        <div class="flex items-center justify-between mb-6 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </div>
            <h2 class="text-lg font-semibold text-gray-900">编辑修订</h2>
          </div>
          
          <!-- 预览/编辑切换按钮 -->
          <div class="flex gap-2">
            <button class="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg transition-all duration-200 text-sm font-medium">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              编辑
            </button>
            <button class="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 text-sm font-medium">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              预览
            </button>
          </div>
        </div>

        <!-- 文本编辑/预览区域 -->
        <div class="flex-1 mb-6 overflow-hidden">
          <textarea
            placeholder="在这里编辑和完善内容..."
            class="w-full h-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none text-sm leading-relaxed overflow-y-auto"
          ></textarea>
        </div>

        <!-- 底部操作按钮 -->
        <div class="flex gap-4 flex-shrink-0">
          <button class="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
            <span>保存内容</span>
          </button>

          <button class="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            <span>导出</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>`,
    },
    'ai-chat-knowledge': {
      id: 'preset-ai-chat-knowledge',
      name: 'AI对话带知识点',
      type: 'ai-chat-knowledge' as const,
      description: '包含技术点选择、AI对话和内容编辑的完整模板',
      html: `<div class="max-w-7xl mx-auto p-6">
  <!-- 技术点选择器 -->
  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
    <div class="flex-shrink-0 p-6 border-b border-gray-100">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">关联技术点</h2>
          <p class="text-sm text-gray-500 mt-1">选择知识点及其关联内容类型，将作为后续AI智能助手的输入信息</p>
        </div>
        <button class="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          <span class="text-sm">展开</span>
        </button>
      </div>
    </div>
    <div class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">车型</label>
          <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>全部车型</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">车系</label>
          <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>全部车系</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">技术分类</label>
          <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>全部分类</option>
          </select>
        </div>
      </div>
      <div class="flex gap-2 mb-4">
        <button class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg">知识点</button>
        <button class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg">技术包装</button>
        <button class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg">技术推广</button>
        <button class="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg">技术通稿</button>
      </div>
      <div class="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
        <p class="text-sm text-gray-500 text-center py-4">请选择过滤条件查看知识点</p>
      </div>
      <div class="mt-4 flex justify-end">
        <button class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          确认选择
        </button>
      </div>
    </div>
  </div>

  <!-- 主要内容区域：AI对话框 + 内容编辑区 -->
  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style="max-height: 70vh;">
    <div class="grid grid-cols-1 lg:grid-cols-2 flex-1 overflow-hidden">
      <!-- 左侧AI对话区域 -->
      <div class="p-8 border-r border-gray-200 flex flex-col overflow-hidden">
        <div class="flex-1 overflow-y-auto">
          <div class="space-y-4">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">AI对话</h2>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 mb-4">
              <p class="text-sm text-gray-600">您好！我是AI助手，可以帮助您处理各种工作。请输入您的问题，我会为您提供帮助。</p>
            </div>
            <div class="space-y-3">
              <textarea 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                rows="4" 
                placeholder="请输入您的问题..."
              ></textarea>
              <button class="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium">
                发送
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧编辑区域 -->
      <div class="p-8 flex flex-col overflow-hidden">
        <div class="h-full flex flex-col">
          <!-- 编辑区域标题 -->
          <div class="flex items-center justify-between mb-6 flex-shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900">编辑修订</h2>
            </div>
            
            <!-- 预览/编辑切换按钮 -->
            <div class="flex gap-2">
              <button class="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg transition-all duration-200 text-sm font-medium">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                编辑
              </button>
              <button class="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 text-sm font-medium">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                预览
              </button>
            </div>
          </div>

          <!-- 文本编辑/预览区域 -->
          <div class="flex-1 mb-6 overflow-hidden">
            <textarea
              placeholder="在这里编辑和完善内容..."
              class="w-full h-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none text-sm leading-relaxed overflow-y-auto"
            ></textarea>
          </div>

          <!-- 底部操作按钮 -->
          <div class="flex gap-4 flex-shrink-0">
            <button class="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
              <span>保存内容</span>
            </button>

            <button class="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              <span>导出</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
    },
    'ai-chat-source': {
      id: 'preset-ai-chat-source',
      name: 'AI问答+来源',
      type: 'ai-chat-source' as const,
      description: '左侧来源选择 + 中间AI对话的页面模板',
      html: `<div class="flex h-screen bg-gray-50">
  <!-- 左侧来源栏 -->
  <div class="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
    <!-- 标题和操作按钮 -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900 mb-3">来源</h2>
      <div class="flex gap-2">
        <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          添加文件
        </button>
        <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          知识库选择
        </button>
      </div>
    </div>
    <!-- 选择所有来源 -->
    <div class="px-4 py-3 border-b border-gray-200">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
        <span class="text-sm text-gray-700">选择所有来源</span>
      </label>
    </div>
    <!-- 来源列表 -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-4 text-center text-gray-500 text-sm">
        暂无来源，点击"添加文件"或"知识库选择"添加来源
      </div>
    </div>
  </div>
  <!-- 中间AI对话栏 -->
  <div class="flex-1 flex flex-col">
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold text-gray-800">AI问答</h1>
          <div class="flex items-center mt-1 space-x-4 text-sm text-gray-500">
            <span class="flex items-center">
              <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              技术包装
            </span>
            <span class="flex items-center">
              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              技术策略
            </span>
            <span class="flex items-center">
              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              技术通稿
            </span>
            <span class="flex items-center">
              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              发布会稿
            </span>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button class="flex items-center space-x-1.5 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-md">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>新对话</span>
          </button>
          <button class="flex items-center space-x-1.5 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-all duration-200 shadow-md">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>搜索历史记录</span>
          </button>
        </div>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto p-6">
      <div class="flex flex-col items-center justify-center h-full">
        <div class="text-center">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-medium text-gray-800 mb-2">您在忙什么？</h2>
          <p class="text-gray-500 text-sm max-w-md">
            我是您的AI助手，可以帮助您处理技术包装、推广策略、技术通稿等各种工作流程。
          </p>
        </div>
      </div>
    </div>
    <div class="bg-white border-t border-gray-200 p-4"></div>
  </div>
</div>`,
    },
    'ai-chat-source-tools': {
      id: 'preset-ai-chat-source-tools',
      name: 'AI问答+来源+更多工具箱',
      type: 'ai-chat-source-tools' as const,
      description: '左侧来源选择 + 中间AI对话 + 右侧工具箱的完整页面模板',
      html: `<div class="flex h-screen bg-gray-50">
  <!-- 左侧来源栏 -->
  <div class="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
    <!-- 标题和操作按钮 -->
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900 mb-3">来源</h2>
      <div class="flex gap-2">
        <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          添加文件
        </button>
        <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          知识库选择
        </button>
      </div>
    </div>
    <!-- 选择所有来源 -->
    <div class="px-4 py-3 border-b border-gray-200">
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
        <span class="text-sm text-gray-700">选择所有来源</span>
      </label>
    </div>
    <!-- 来源列表 -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-4 text-center text-gray-500 text-sm">
        暂无来源，点击"添加文件"或"知识库选择"添加来源
      </div>
    </div>
  </div>
  <!-- 中间AI对话栏 -->
  <div class="flex-1 flex flex-col">
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold text-gray-800">AI问答</h1>
          <div class="flex items-center mt-1 space-x-4 text-sm text-gray-500">
            <span class="flex items-center">
              <div class="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              技术包装
            </span>
            <span class="flex items-center">
              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              技术策略
            </span>
            <span class="flex items-center">
              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              技术通稿
            </span>
            <span class="flex items-center">
              <div class="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
              发布会稿
            </span>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button class="flex items-center space-x-1.5 px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-md">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>新对话</span>
          </button>
          <button class="flex items-center space-x-1.5 px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-all duration-200 shadow-md">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>搜索历史记录</span>
          </button>
        </div>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto p-6">
      <div class="flex flex-col items-center justify-center h-full">
        <div class="text-center">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-medium text-gray-800 mb-2">您在忙什么？</h2>
          <p class="text-gray-500 text-sm max-w-md">
            我是您的AI助手，可以帮助您处理技术包装、推广策略、技术通稿等各种工作流程。
          </p>
        </div>
      </div>
    </div>
    <div class="bg-white border-t border-gray-200 p-4"></div>
  </div>
  <!-- 右侧工具箱栏 -->
  <div class="w-80 h-full bg-white border-l border-gray-200 flex flex-col">
    <!-- 标题 -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 h-[76px]">
      <div class="flex-1 flex flex-col justify-center">
        <h2 class="text-lg font-semibold text-gray-900">更多工具箱</h2>
        <div class="text-xs text-transparent mt-1">占位</div>
      </div>
    </div>
    <!-- 工具网格 -->
    <div class="p-4 border-b border-gray-200">
      <div class="grid grid-cols-2 gap-3">
        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">
          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
          <span class="text-xs text-gray-700 text-center">技术转译</span>
        </button>
        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">
          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <span class="text-xs text-gray-700 text-center">用户场景挖掘</span>
        </button>
        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">
          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
          </svg>
          <span class="text-xs text-gray-700 text-center">发布会场景化</span>
        </button>
        <button class="relative flex flex-col items-center justify-center p-4 border rounded-lg transition-all bg-white border-gray-300 hover:bg-gray-50 hover:border-blue-500">
          <svg class="w-6 h-6 mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
          </svg>
          <span class="text-xs text-gray-700 text-center">领导人口语化</span>
        </button>
      </div>
    </div>
    <!-- 相关内容 -->
    <div class="flex-1 overflow-y-auto">
      <div class="p-4">
        <h3 class="text-sm font-medium text-gray-700 mb-3">相关内容</h3>
        <div class="text-center py-8 text-gray-400 text-sm">
          暂无相关内容
        </div>
      </div>
    </div>
  </div>
</div>`,
    },
  };

  // 从localStorage加载模板列表
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const stored = localStorage.getItem('pageTemplates');
      if (stored) {
        const parsed = JSON.parse(stored);
        setTemplates(parsed.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        })));
      }
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  const saveTemplates = (newTemplates: Template[]) => {
    try {
      localStorage.setItem('pageTemplates', JSON.stringify(newTemplates));
      setTemplates(newTemplates);
    } catch (error) {
      console.error('保存模板失败:', error);
      throw error;
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: 'custom',
      description: '',
      html: '',
    });
    setShowModal(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      description: template.description || '',
      html: template.html,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('请输入模板名称');
      return;
    }
    if (!formData.html.trim()) {
      alert('请输入HTML内容');
      return;
    }

    const newTemplate: Template = {
      id: editingTemplate?.id || `template-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: formData.name,
      type: formData.type,
      description: formData.description,
      html: formData.html,
      createdAt: editingTemplate?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const updated = editingTemplate
      ? templates.map(t => t.id === editingTemplate.id ? newTemplate : t)
      : [...templates, newTemplate];

    saveTemplates(updated);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定要删除此模板吗？')) {
      return;
    }
    const updated = templates.filter(t => t.id !== id);
    saveTemplates(updated);
  };

  const handleUsePreset = (type: 'speech' | 'ai-chat' | 'ai-chat-edit' | 'ai-chat-knowledge' | 'ai-chat-source' | 'ai-chat-source-tools') => {
    const preset = PRESET_TEMPLATES[type];
    setEditingTemplate(null);
    setFormData({
      name: preset.name,
      type: preset.type,
      description: preset.description,
      html: preset.html,
    });
    setShowModal(true);
  };

  const handlePreview = (html: string) => {
    setPreviewHtml(html);
    setShowPreview(true);
  };

  const handleCopy = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    
    setCopyingId(id);
    try {
      await navigator.clipboard.writeText(template.html);
      setTimeout(() => setCopyingId(null), 1000);
    } catch (error) {
      console.error('复制失败:', error);
      setCopyingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <a 
              href="/public-page-configs" 
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-2"
            >
              <ChevronLeft size={16} />
              返回公开页面配置
            </a>
            <h1 className="text-3xl font-bold text-gray-900">页面模板管理</h1>
            <p className="text-gray-600 mt-1">创建和管理您的公开页面HTML模板</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            创建模板
          </button>
        </div>

        {/* 预设模板提示 */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-2">快速开始</h3>
              <p className="text-sm text-blue-800 mb-3">您可以使用预设模板快速创建新模板</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                  onClick={() => handleUsePreset('speech')}
                  className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  使用A问答模版
                </button>
                <button
                  onClick={() => handleUsePreset('ai-chat')}
                  className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  使用AI问答模版
                </button>
                <button
                  onClick={() => handleUsePreset('ai-chat-edit')}
                  className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  使用AI对话编辑
                </button>
                <button
                  onClick={() => handleUsePreset('ai-chat-knowledge')}
                  className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  使用AI对话带知识点
                </button>
                <button
                  onClick={() => handleUsePreset('ai-chat-source')}
                  className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  使用AI问答+来源
                </button>
                <button
                  onClick={() => handleUsePreset('ai-chat-source-tools')}
                  className="px-4 py-2 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  使用AI问答+来源+更多工具箱
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 模板列表 */}
        {templates.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无模板</h3>
            <p className="text-gray-600 mb-6">开始创建您的第一个页面模板吧</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              创建模板
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-gray-600">{template.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      template.type === 'speech' ? 'bg-purple-100 text-purple-800' :
                      template.type === 'ai-chat' ? 'bg-blue-100 text-blue-800' :
                      template.type === 'ai-chat-edit' ? 'bg-green-100 text-green-800' :
                      template.type === 'ai-chat-knowledge' ? 'bg-orange-100 text-orange-800' :
                      template.type === 'ai-chat-source' ? 'bg-indigo-100 text-indigo-800' :
                      template.type === 'ai-chat-source-tools' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {template.type === 'speech' && 'A问答'}
                      {template.type === 'ai-chat' && 'AI问答'}
                      {template.type === 'ai-chat-edit' && 'AI对话编辑'}
                      {template.type === 'ai-chat-knowledge' && 'AI对话带知识点'}
                      {template.type === 'ai-chat-source' && 'AI问答+来源'}
                      {template.type === 'ai-chat-source-tools' && 'AI问答+来源+工具箱'}
                      {template.type === 'custom' && '自定义'}
                    </span>
                  </div>
                </div>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    更新于 {template.updatedAt.toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="p-4 flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(template.html)}
                    className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Eye size={16} className="inline-block mr-1" />
                    预览
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 size={16} className="inline-block mr-1" />
                    编辑
                  </button>
                  <button
                    onClick={() => handleCopy(template.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="复制HTML"
                  >
                    {copyingId === template.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 创建/编辑对话框 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {editingTemplate ? '编辑模板' : '创建模板'}
                </h2>
                <button onClick={() => setShowModal(false)}>
                  <X size={24} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* 模板名称 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      模板名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="请输入模板名称"
                    />
                  </div>

                  {/* 模板类型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      模板类型 *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="custom">自定义</option>
                      <option value="speech">A问答</option>
                      <option value="ai-chat">AI问答</option>
                      <option value="ai-chat-edit">AI对话编辑</option>
                      <option value="ai-chat-knowledge">AI对话带知识点</option>
                      <option value="ai-chat-source">AI问答+来源</option>
                      <option value="ai-chat-source-tools">AI问答+来源+更多工具箱</option>
                    </select>
                  </div>

                  {/* 描述 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      描述
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="请输入模板描述"
                    />
                  </div>

                  {/* HTML内容 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        HTML内容 *
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePreview(formData.html)}
                        disabled={!formData.html.trim()}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <Eye size={16} className="inline-block mr-1" />
                        预览
                      </button>
                    </div>
                    <textarea
                      value={formData.html}
                      onChange={(e) => setFormData({ ...formData, html: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                      rows={20}
                      placeholder="请输入HTML内容..."
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      提示：使用Tailwind CSS类名进行样式设置
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTemplate ? '保存修改' : '创建模板'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 预览对话框 */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold">模板预览</h2>
                <button onClick={() => setShowPreview(false)}>
                  <X size={24} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div 
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  className="bg-white rounded-lg shadow-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManagementPage;

