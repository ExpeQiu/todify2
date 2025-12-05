import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicKnowledgeService } from '../../services/publicKnowledgeService';
import {
  CategoryTreeNode,
  PublicKnowledgeFile,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateFileDTO,
} from '../../types/publicKnowledge';
import CategorySidebar from '../../components/publicKnowledge/CategorySidebar';
import FileList from '../../components/publicKnowledge/FileList';
import UploadModal from '../../components/publicKnowledge/UploadModal';
import { toast } from 'sonner';
import { List, Grid, ChevronDown, Plus } from 'lucide-react';

const PublicKnowledgePage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [files, setFiles] = useState<PublicKnowledgeFile[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTreeNode | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // 加载分类树
  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await publicKnowledgeService.getCategoryTree();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        toast.error(response.message || '加载分类失败');
      }
    } catch (error) {
      console.error('加载分类失败:', error);
      toast.error('加载分类失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载文件列表
  const loadFiles = async (categoryId?: number | null) => {
    try {
      setLoading(true);
      const response = await publicKnowledgeService.getFiles(categoryId);
      if (response.success && response.data) {
        setFiles(response.data);
      } else {
        toast.error(response.message || '加载文件失败');
      }
    } catch (error) {
      console.error('加载文件失败:', error);
      toast.error('加载文件失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadCategories();
    loadFiles();
  }, []);

  // 当选择分类改变时，重新加载文件
  useEffect(() => {
    loadFiles(selectedCategoryId);
  }, [selectedCategoryId]);

  // 创建分类
  const handleCreateCategory = async (data: CreateCategoryDTO) => {
    try {
      const response = await publicKnowledgeService.createCategory(data);
      if (response.success) {
        toast.success('分类创建成功');
        await loadCategories();
        setShowCategoryForm(false);
      } else {
        toast.error(response.message || '创建分类失败');
      }
    } catch (error) {
      console.error('创建分类失败:', error);
      toast.error('创建分类失败');
    }
  };

  // 更新分类
  const handleUpdateCategory = async (id: number, data: UpdateCategoryDTO) => {
    try {
      const response = await publicKnowledgeService.updateCategory(id, data);
      if (response.success) {
        toast.success('分类更新成功');
        await loadCategories();
        setEditingCategory(null);
      } else {
        toast.error(response.message || '更新分类失败');
      }
    } catch (error) {
      console.error('更新分类失败:', error);
      toast.error('更新分类失败');
    }
  };

  // 删除分类
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('确定要删除这个分类吗？删除后，该分类下的所有子分类和文件也将被删除。')) {
      return;
    }

    try {
      const response = await publicKnowledgeService.deleteCategory(id);
      if (response.success) {
        toast.success('分类删除成功');
        await loadCategories();
        if (selectedCategoryId === id) {
          setSelectedCategoryId(null);
        }
        await loadFiles(selectedCategoryId === id ? null : selectedCategoryId);
      } else {
        toast.error(response.message || '删除分类失败');
      }
    } catch (error) {
      console.error('删除分类失败:', error);
      toast.error('删除分类失败');
    }
  };

  // 上传文件
  const handleUploadFile = async (file: File, data?: CreateFileDTO) => {
    try {
      const response = await publicKnowledgeService.uploadFile(file, {
        ...data,
        category_id: selectedCategoryId,
      });
      if (response.success) {
        toast.success('文件上传成功');
        setShowUploadModal(false);
        await loadFiles(selectedCategoryId);
      } else {
        toast.error(response.message || '文件上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      toast.error('文件上传失败');
    }
  };

  // 删除文件
  const handleDeleteFile = async (id: number) => {
    if (!confirm('确定要删除这个文件吗？')) {
      return;
    }

    try {
      const response = await publicKnowledgeService.deleteFile(id);
      if (response.success) {
        toast.success('文件删除成功');
        await loadFiles(selectedCategoryId);
      } else {
        toast.error(response.message || '删除文件失败');
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      toast.error('删除文件失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧标签页 */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                全部
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                我的项目
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                精选项目
              </button>
              <button
                onClick={() => navigate('/public-knowledge')}
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-blue-100 text-blue-700"
              >
                公共知识库
              </button>
            </div>

            {/* 右侧操作栏 */}
            <div className="flex items-center space-x-4">
              {/* 视图切换 */}
              <div className="flex items-center border border-gray-300 rounded-md">
                <button className="p-2 hover:bg-gray-100">
                  <List className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 border-l border-gray-300">
                  <Grid className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* 排序 */}
              <div className="relative">
                <button className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                  <span>最近</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* 上传文件按钮 */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>上传文件</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">公共知识库</h1>
          <p className="mt-2 text-gray-600">
            管理和维护公共知识库文件，支持分类管理和文件上传
          </p>
        </div>

        {/* 主要内容区域 */}
        <div className="flex gap-6">
          {/* 左侧分类侧边栏 */}
          <div className="w-64 flex-shrink-0">
            <CategorySidebar
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              editingCategory={editingCategory}
              setEditingCategory={setEditingCategory}
              showCategoryForm={showCategoryForm}
              setShowCategoryForm={setShowCategoryForm}
              loading={loading}
            />
          </div>

          {/* 右侧文件列表 */}
          <div className="flex-1">
            <FileList
              files={files}
              selectedCategoryId={selectedCategoryId}
              onDeleteFile={handleDeleteFile}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* 上传文件弹窗 */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadFile}
          selectedCategoryId={selectedCategoryId}
        />
      )}
    </div>
  );
};

export default PublicKnowledgePage;
