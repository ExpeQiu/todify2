import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AIRoleManagementPage from '../AIRoleManagementPage';
import { AIRoleConfig } from '../../types/aiRole';

// Mock services
const mockGetAIRoles = vi.fn();
const mockGetRoleUsage = vi.fn();
const mockFindDuplicates = vi.fn();
const mockCreateAIRole = vi.fn();
const mockUpdateAIRole = vi.fn();
const mockDeleteAIRole = vi.fn();
const mockTestConnection = vi.fn();

const mockCheckMigrationStatus = vi.fn();
const mockGetLocalStorageConfigs = vi.fn();
const mockMigrateAgents = vi.fn();

vi.mock('../../services/aiRoleService', () => {
  return {
    default: {
      getAIRoles: () => mockGetAIRoles(),
      getRoleUsage: (id: string) => mockGetRoleUsage(id),
      findDuplicates: () => mockFindDuplicates(),
      createAIRole: (data: any) => mockCreateAIRole(data),
      updateAIRole: (id: string, data: any) => mockUpdateAIRole(id, data),
      deleteAIRole: (id: string) => mockDeleteAIRole(id),
      testConnection: (id: string) => mockTestConnection(id),
    },
  };
});

vi.mock('../../services/migrationService', () => {
  return {
    default: {
      checkMigrationStatus: (roles?: any[]) => mockCheckMigrationStatus(roles),
      getLocalStorageConfigs: () => mockGetLocalStorageConfigs(),
      migrateAgents: () => mockMigrateAgents(),
    },
  };
});

vi.mock('../../components/TopNavigation', () => ({
  default: () => <div>TopNavigation</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// 测试辅助函数
const createMockRole = (overrides?: Partial<AIRoleConfig>): AIRoleConfig => ({
  id: `role-${Date.now()}`,
  name: 'Test Role',
  description: 'Test Description',
  avatar: '',
  systemPrompt: '',
  difyConfig: {
    apiUrl: '/api/dify/chat-messages',
    apiKey: 'app-test-key',
    connectionType: 'chatflow',
    inputFields: [],
  },
  enabled: true,
  source: 'custom',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// 包装组件以提供路由上下文
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AIRoleManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 默认mock返回值
    mockGetAIRoles.mockResolvedValue([]);
    mockGetRoleUsage.mockResolvedValue(null);
    mockFindDuplicates.mockResolvedValue({
      duplicates: [],
      totalDuplicates: 0,
    });
    
    mockCheckMigrationStatus.mockResolvedValue({
      hasSmartWorkflowConfigs: false,
      hasIndependentPageConfigs: false,
      smartWorkflowCount: 0,
      independentPageCount: 0,
      backendAvailable: true,
    });
    
    mockGetLocalStorageConfigs.mockReturnValue({
      smartWorkflowConfigs: [],
      independentPageConfigs: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('页面加载', () => {
    it('应该正确加载并显示页面标题', async () => {
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('AI角色管理')).toBeInTheDocument();
        expect(screen.getByText('创建和管理您的AI对话角色')).toBeInTheDocument();
      });
    });

    it('应该加载角色列表', async () => {
      const mockRoles = [
        createMockRole({ id: 'role-1', name: 'Role 1' }),
        createMockRole({ id: 'role-2', name: 'Role 2' }),
      ];
      
      mockGetAIRoles.mockResolvedValue(mockRoles);
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Role 1')).toBeInTheDocument();
        expect(screen.getByText('Role 2')).toBeInTheDocument();
      });
    });

    it('应该在没有角色时显示空状态', async () => {
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/暂无AI角色/)).toBeInTheDocument();
      });
    });
  });

  describe('新建角色', () => {
    it('应该能够点击新建角色按钮并重置表单', async () => {
      const mockRoles = [createMockRole({ id: 'role-1', name: 'Existing Role' })];
      mockGetAIRoles.mockResolvedValue(mockRoles);
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Existing Role')).toBeInTheDocument();
      });
      
      // 先选择一个角色
      fireEvent.click(screen.getByText('Existing Role'));
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Role')).toBeInTheDocument();
      });
      
      // 点击新建角色按钮
      const newRoleButton = screen.getByText('新建角色');
      fireEvent.click(newRoleButton);
      
      // 表单应该被重置
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('例如：AI技术顾问') as HTMLInputElement;
        expect(nameInput.value).toBe('');
      });
    });

    it('应该能够创建新角色', async () => {
      const newRole = createMockRole({ id: 'new-role', name: 'New Role' });
      mockCreateAIRole.mockResolvedValue({
        success: true,
        data: newRole,
        message: '创建成功',
      });
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('新建角色')).toBeInTheDocument();
      });
      
      // 填写表单
      fireEvent.change(screen.getByPlaceholderText('例如：AI技术顾问'), {
        target: { value: 'New Role' },
      });
      fireEvent.change(screen.getByPlaceholderText('描述这个AI角色的用途和特点'), {
        target: { value: 'New Description' },
      });
      
      // 保存
      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockCreateAIRole).toHaveBeenCalled();
      });
    });

    it('创建新角色时应该验证必填字段', async () => {
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('保存')).toBeInTheDocument();
      });
      
      // 不填写必填字段直接保存
      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText('请填写角色名称和描述')).toBeInTheDocument();
      });
      
      expect(mockCreateAIRole).not.toHaveBeenCalled();
    });
  });

  describe('编辑角色', () => {
    it('应该能够进入编辑模式', async () => {
      const mockRole = createMockRole({ id: 'role-1', name: 'Test Role' });
      mockGetAIRoles.mockResolvedValue([mockRole]);
      mockGetRoleUsage.mockResolvedValue({
        roleId: 'role-1',
        roleName: 'Test Role',
        locations: [],
        totalUsageCount: 0,
      });
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Role')).toBeInTheDocument();
      });
      
      // 选择角色
      fireEvent.click(screen.getByText('Test Role'));
      
      await waitFor(() => {
        expect(screen.getByText('编辑')).toBeInTheDocument();
      });
      
      // 点击编辑按钮
      const editButton = screen.getByText('编辑');
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByText('编辑角色')).toBeInTheDocument();
      });
    });

    it('应该能够更新现有角色', async () => {
      const originalRole = createMockRole({ 
        id: 'role-1', 
        name: 'Original Name',
        description: 'Original Description',
      });
      const updatedRole = createMockRole({ 
        id: 'role-1', 
        name: 'Updated Name',
        description: 'Updated Description',
      });
      
      mockGetAIRoles.mockResolvedValue([originalRole]);
      mockUpdateAIRole.mockResolvedValue({
        success: true,
        data: updatedRole,
        message: '更新成功',
      });
      mockGetRoleUsage.mockResolvedValue({
        roleId: 'role-1',
        roleName: 'Updated Name',
        locations: [],
        totalUsageCount: 0,
      });
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Original Name')).toBeInTheDocument();
      });
      
      // 选择并编辑角色
      fireEvent.click(screen.getByText('Original Name'));
      
      await waitFor(() => {
        expect(screen.getByText('编辑')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('编辑'));
      
      await waitFor(() => {
        expect(screen.getByText('编辑角色')).toBeInTheDocument();
      });
      
      // 修改名称
      const nameInput = screen.getByDisplayValue('Original Name');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      
      // 保存
      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockUpdateAIRole).toHaveBeenCalledWith(
          'role-1',
          expect.objectContaining({
            name: 'Updated Name',
          })
        );
      });
    });

    it('编辑时切换角色应该提示未保存的更改', async () => {
      const role1 = createMockRole({ id: 'role-1', name: 'Role 1' });
      const role2 = createMockRole({ id: 'role-2', name: 'Role 2' });
      
      mockGetAIRoles.mockResolvedValue([role1, role2]);
      mockGetRoleUsage.mockResolvedValue({
        roleId: 'role-1',
        roleName: 'Role 1',
        locations: [],
        totalUsageCount: 0,
      });
      
      // Mock confirm
      window.confirm = vi.fn(() => false); // 用户取消切换
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Role 1')).toBeInTheDocument();
      });
      
      // 选择Role 1
      fireEvent.click(screen.getByText('Role 1'));
      
      await waitFor(() => {
        expect(screen.getByText('编辑')).toBeInTheDocument();
      });
      
      // 进入编辑模式
      fireEvent.click(screen.getByText('编辑'));
      
      // 修改名称
      const nameInput = screen.getByDisplayValue('Role 1');
      fireEvent.change(nameInput, { target: { value: 'Modified Role 1' } });
      
      // 尝试切换到Role 2（应该提示）
      fireEvent.click(screen.getByText('Role 2'));
      
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('未保存的更改')
      );
    });
  });

  describe('删除角色', () => {
    it('应该能够删除角色', async () => {
      const mockRole = createMockRole({ id: 'role-1', name: 'Test Role' });
      mockGetAIRoles.mockResolvedValue([mockRole]);
      mockDeleteAIRole.mockResolvedValue({
        success: true,
        message: '删除成功',
      });
      mockGetRoleUsage.mockResolvedValue({
        roleId: 'role-1',
        roleName: 'Test Role',
        locations: [],
        totalUsageCount: 0,
      });
      
      // Mock confirm
      window.confirm = vi.fn(() => true);
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Role')).toBeInTheDocument();
      });
      
      // 选择角色
      fireEvent.click(screen.getByText('Test Role'));
      
      await waitFor(() => {
        expect(screen.getByText('删除')).toBeInTheDocument();
      });
      
      // 点击删除按钮
      const deleteButton = screen.getByText('删除');
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockDeleteAIRole).toHaveBeenCalledWith('role-1');
        expect(mockGetAIRoles).toHaveBeenCalledTimes(2); // 初始加载 + 删除后重新加载
      });
    });

    it('删除角色时应该显示确认对话框', async () => {
      const mockRole = createMockRole({ id: 'role-1', name: 'Test Role' });
      mockGetAIRoles.mockResolvedValue([mockRole]);
      mockGetRoleUsage.mockResolvedValue({
        roleId: 'role-1',
        roleName: 'Test Role',
        locations: [],
        totalUsageCount: 0,
      });
      
      // Mock confirm返回false
      window.confirm = vi.fn(() => false);
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Role')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test Role'));
      
      await waitFor(() => {
        expect(screen.getByText('删除')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('删除'));
      
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Test Role')
      );
      
      // 用户取消，不应该调用删除API
      expect(mockDeleteAIRole).not.toHaveBeenCalled();
    });
  });

  describe('关联数据（使用情况）', () => {
    it('应该加载并显示角色使用情况', async () => {
      const mockRole = createMockRole({ id: 'role-1', name: 'Test Role' });
      const mockUsage = {
        roleId: 'role-1',
        roleName: 'Test Role',
        locations: [
          {
            type: 'independent-page' as const,
            name: 'AI问答',
            path: '/node/ai-search',
          },
          {
            type: 'agent-workflow' as const,
            name: '智能工作流',
            path: '/agent-workflow',
          },
        ],
        totalUsageCount: 2,
      };
      
      mockGetAIRoles.mockResolvedValue([mockRole]);
      mockGetRoleUsage.mockResolvedValue(mockUsage);
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Role')).toBeInTheDocument();
      });
      
      // 选择角色
      fireEvent.click(screen.getByText('Test Role'));
      
      await waitFor(() => {
        expect(mockGetRoleUsage).toHaveBeenCalledWith('role-1');
        expect(screen.getByText('使用情况')).toBeInTheDocument();
        expect(screen.getByText('AI问答')).toBeInTheDocument();
        expect(screen.getByText('智能工作流')).toBeInTheDocument();
        expect(screen.getByText(/2.*个位置使用/)).toBeInTheDocument();
      });
    });

    it('保存角色后应该重新加载使用情况', async () => {
      const mockRole = createMockRole({ id: 'role-1', name: 'Test Role' });
      const updatedRole = createMockRole({ id: 'role-1', name: 'Updated Role' });
      
      mockGetAIRoles.mockResolvedValue([mockRole]);
      mockUpdateAIRole.mockResolvedValue({
        success: true,
        data: updatedRole,
        message: '更新成功',
      });
      mockGetRoleUsage
        .mockResolvedValueOnce({
          roleId: 'role-1',
          roleName: 'Test Role',
          locations: [],
          totalUsageCount: 0,
        })
        .mockResolvedValueOnce({
          roleId: 'role-1',
          roleName: 'Updated Role',
          locations: [
            { type: 'agent-workflow' as const, name: '智能工作流', path: '/agent-workflow' },
          ],
          totalUsageCount: 1,
        });
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Role')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test Role'));
      
      await waitFor(() => {
        expect(screen.getByText('编辑')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('编辑'));
      
      const nameInput = screen.getByDisplayValue('Test Role');
      fireEvent.change(nameInput, { target: { value: 'Updated Role' } });
      
      fireEvent.click(screen.getByText('保存'));
      
      await waitFor(() => {
        // 应该重新加载使用情况
        expect(mockGetRoleUsage).toHaveBeenCalledTimes(2);
      });
    });

    it('删除角色后应该清除使用情况缓存', async () => {
      const mockRole = createMockRole({ id: 'role-1', name: 'Test Role' });
      mockGetAIRoles
        .mockResolvedValueOnce([mockRole])
        .mockResolvedValueOnce([]); // 删除后返回空数组
      mockDeleteAIRole.mockResolvedValue({
        success: true,
        message: '删除成功',
      });
      mockGetRoleUsage.mockResolvedValue({
        roleId: 'role-1',
        roleName: 'Test Role',
        locations: [],
        totalUsageCount: 0,
      });
      
      window.confirm = vi.fn(() => true);
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Role')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test Role'));
      
      await waitFor(() => {
        expect(screen.getByText('删除')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('删除'));
      
      await waitFor(() => {
        // 删除后应该重新加载角色列表
        expect(mockGetAIRoles).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('状态同步问题', () => {
    it('保存新角色后应该正确更新selectedRole', async () => {
      const newRole = createMockRole({ id: 'new-role', name: 'New Role' });
      
      mockGetAIRoles
        .mockResolvedValueOnce([]) // 初始加载
        .mockResolvedValueOnce([newRole]); // 创建后重新加载
      
      mockCreateAIRole.mockResolvedValue({
        success: true,
        data: newRole,
        message: '创建成功',
      });
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('例如：AI技术顾问')).toBeInTheDocument();
      });
      
      // 填写表单
      fireEvent.change(screen.getByPlaceholderText('例如：AI技术顾问'), {
        target: { value: 'New Role' },
      });
      fireEvent.change(screen.getByPlaceholderText('描述这个AI角色的用途和特点'), {
        target: { value: 'New Description' },
      });
      
      // 保存
      fireEvent.click(screen.getByText('保存'));
      
      await waitFor(() => {
        // 应该调用创建API
        expect(mockCreateAIRole).toHaveBeenCalled();
        // 应该重新加载角色列表
        expect(mockGetAIRoles).toHaveBeenCalledTimes(2);
      });
    });

    it('编辑保存后应该正确更新selectedRole和表单', async () => {
      const originalRole = createMockRole({ id: 'role-1', name: 'Original' });
      const updatedRole = createMockRole({ id: 'role-1', name: 'Updated' });
      
      mockGetAIRoles
        .mockResolvedValueOnce([originalRole])
        .mockResolvedValueOnce([updatedRole]);
      
      mockUpdateAIRole.mockResolvedValue({
        success: true,
        data: updatedRole,
        message: '更新成功',
      });
      mockGetRoleUsage.mockResolvedValue({
        roleId: 'role-1',
        roleName: 'Updated',
        locations: [],
        totalUsageCount: 0,
      });
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Original')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Original'));
      
      await waitFor(() => {
        expect(screen.getByText('编辑')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('编辑'));
      
      const nameInput = screen.getByDisplayValue('Original');
      fireEvent.change(nameInput, { target: { value: 'Updated' } });
      
      fireEvent.click(screen.getByText('保存'));
      
      await waitFor(() => {
        // 表单应该更新为新的值
        expect(screen.getByDisplayValue('Updated')).toBeInTheDocument();
      });
    });
  });

  describe('错误处理', () => {
    it('保存失败时应该显示错误消息', async () => {
      mockGetAIRoles.mockResolvedValue([]);
      mockCreateAIRole.mockResolvedValue({
        success: false,
        error: '创建失败：API密钥无效',
      });
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('例如：AI技术顾问')).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByPlaceholderText('例如：AI技术顾问'), {
        target: { value: 'Test Role' },
      });
      fireEvent.change(screen.getByPlaceholderText('描述这个AI角色的用途和特点'), {
        target: { value: 'Test Description' },
      });
      
      fireEvent.click(screen.getByText('保存'));
      
      await waitFor(() => {
        expect(screen.getByText('创建失败：API密钥无效')).toBeInTheDocument();
      });
    });

    it('删除失败时应该显示错误消息', async () => {
      const mockRole = createMockRole({ id: 'role-1', name: 'Test Role' });
      mockGetAIRoles.mockResolvedValue([mockRole]);
      mockDeleteAIRole.mockResolvedValue({
        success: false,
        error: '删除失败：角色正在使用中',
      });
      mockGetRoleUsage.mockResolvedValue({
        roleId: 'role-1',
        roleName: 'Test Role',
        locations: [],
        totalUsageCount: 0,
      });
      
      window.confirm = vi.fn(() => true);
      
      renderWithRouter(<AIRoleManagementPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Role')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test Role'));
      
      await waitFor(() => {
        expect(screen.getByText('删除')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('删除'));
      
      await waitFor(() => {
        expect(screen.getByText('删除失败：角色正在使用中')).toBeInTheDocument();
      });
    });
  });
});

