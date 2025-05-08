/**
 * 文件夹服务
 * 提供文件夹相关操作
 */

import apiClient from './api-client';
import getEnvConfig from './env-config';

/**
 * 文件夹创建参数
 */
export interface CreateProjectParams {
  name: string;
}

/**
 * 文件夹查询参数
 */
export interface ProjectQueryParams {
  [key: string]: string | number | boolean | undefined;
  folder_name?: string;
  page?: number;
  limit?: number;
  orderBy?: 'createTime' | 'name';
  order?: 'asc' | 'desc';
}

/**
 * 文件夹信息接口
 */
export interface ProjectInfo {
  id: number | string;
  name: string;
  description?: string; // 添加描述字段
  createTime?: string;
  created_at?: string;
  files?: any[];
  fileCount?: number; // 添加文件数量字段
  message?: string;
}

/**
 * API响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
  isBusinessError?: boolean;
  requireApiKey?: boolean; // 表示需要API密钥
}

// 处理API响应
const handleApiResponse = (response: any): ApiResponse => {
  // 如果已经是新的响应格式，直接返回
  if (response && typeof response === 'object' && 'success' in response) {
    return response;
  }
  
  // 否则，包装为新格式
  return {
    success: true,
    data: response
  };
};

/**
 * 检查API密钥并处理相关操作
 * @param action 需要执行的函数
 * @returns 处理结果，包含密钥验证结果
 */
async function checkApiKeyBeforeAction<T>(action: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  const apiKey = localStorage.getItem('narrator_api_key');
  if (!apiKey) {
    return { 
      success: false, 
      error: '未设置API密钥',
      requireApiKey: true
    };
  }
  
  try {
    // 执行业务操作
    return await action();
  } catch (error: any) {
    // 检查是否是API密钥相关错误
    if (error.message && (error.message.includes('API密钥') || error.message.includes('无效') || error.message.includes('未授权'))) {
      return {
        success: false,
        error: error.message,
        requireApiKey: true
      };
    }
    
    return {
      success: false,
      error: error.message || '操作失败'
    };
  }
}

const projectService = {
  /**
   * 创建新文件夹
   */
  createProject: async (data: CreateProjectParams): Promise<ApiResponse<ProjectInfo>> => {
    return checkApiKeyBeforeAction(async () => {
      console.log('创建新文件夹:', data);
      const response = await apiClient.post('/api/narrator/ai/v1/fileSets', data);
      return handleApiResponse(response);
    });
  },

  /**
   * 获取文件夹列表
   * 支持分页和排序
   */
  getProjects: async (params: ProjectQueryParams = {}): Promise<ApiResponse<{items: ProjectInfo[], total: number}>> => {
    return checkApiKeyBeforeAction(async () => {
      console.log('获取文件夹列表，参数:', params);
      const response = await apiClient.get('/api/narrator/ai/v1/fileSets', params);
      
      // 处理响应数据格式
      const apiResponse = handleApiResponse(response);
      
      if (apiResponse.success && apiResponse.data) {
        // 标准化返回数据格式
        const items = Array.isArray(apiResponse.data) 
          ? apiResponse.data 
          : (apiResponse.data.items || apiResponse.data.data || []);
        
        const total = typeof apiResponse.data.total === 'number' 
          ? apiResponse.data.total 
          : items.length;
        
        return {
          success: true,
          data: {
            items,
            total,
            page: apiResponse.data.page || 1,
            limit: apiResponse.data.limit || items.length
          }
        };
      }
      
      return apiResponse;
    });
  },

  /**
   * 获取单个文件夹详情
   */
  getProject: async (projectId: string | number): Promise<ApiResponse<ProjectInfo>> => {
    return checkApiKeyBeforeAction(async () => {
      console.log('获取文件夹详情，文件夹ID:', projectId);
      const response = await apiClient.get(`/api/narrator/ai/v1/fileSets/${projectId}`);
      return handleApiResponse(response);
    });
  },
  
  /**
   * 更新文件夹信息
   */
  updateProject: async (projectId: string | number, data: Partial<CreateProjectParams>): Promise<ApiResponse<ProjectInfo>> => {
    return checkApiKeyBeforeAction(async () => {
      console.log('更新文件夹信息，文件夹ID:', projectId);
      const response = await apiClient.put(`/api/narrator/ai/v1/fileSets/${projectId}`, data);
      return handleApiResponse(response);
    });
  },
  
  /**
   * 删除文件夹
   */
  deleteProject: async (projectId: string | number): Promise<ApiResponse> => {
    return checkApiKeyBeforeAction(async () => {
      console.log('删除文件夹，文件夹ID:', projectId);
      const response = await apiClient.delete(`/api/narrator/ai/v1/fileSets/${projectId}`);
      return handleApiResponse(response);
    });
  }
};

export default projectService;
