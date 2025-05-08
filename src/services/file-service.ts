/**
 * 文件服务
 * 提供文件相关操作
 */

import apiClient from './api-client';
import getEnvConfig from './env-config';
import { ApiResponse } from './project-service';

/**
 * 文件上传参数
 */
export interface UploadFileParams {
  file_set_id: number | string;
  files: File | File[];
}

/**
 * 文件重命名参数
 */
export interface RenameFileParams {
  file_id: string | number;
  new_file_name: string;
}

/**
 * 文件信息接口
 */
export interface FileInfo {
  file_id: string;
  file_name: string;
  file_type: string;
  file_url?: string;
  file_path?: string;
  duration?: number;
  subtitle_lines?: number;
  episode?: string;
  upload_time?: string;
  expiry_time?: string;
}

/**
 * 上传回调接口
 */
export interface UploadProgressCallback {
  onProgress?: (percentage: number, loaded: number, total: number) => void;
  onComplete?: (response: ApiResponse) => void;
  onError?: (error: string) => void;
}

/**
 * 百度网盘转存参数
 */
export interface BaiduPanSaveParams {
  short_link: string;
  file_set_id: string | number;
}

/**
 * 百度网盘转存任务信息
 */
export interface BaiduPanTaskInfo {
  file_set_id: number;
  transfer_task_id: string;
  link: string;
  status: number;
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

const fileService = {
  /**
   * 上传文件到文件夹
   * 支持单个或多个文件上传
   * @param params 上传参数
   * @param callbacks 上传进度回调函数
   */
  uploadFiles: async ({ file_set_id, files }: UploadFileParams, callbacks?: UploadProgressCallback): Promise<ApiResponse> => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        const errorResponse = { 
          success: false, 
          error: '未设置NarratorAI API密钥',
          requireApiKey: true
        };
        callbacks?.onError?.(errorResponse.error);
        return errorResponse;
      }
      
      console.log(`开始上传文件到文件夹[${file_set_id}]，文件数量:`, Array.isArray(files) ? files.length : 1);
      
      // 创建FormData对象
      const formData = new FormData();
      
      // 添加file_set_id参数 - 作为表单数据而不是文件
      formData.append('file_set_id', file_set_id.toString());
      
      // 添加文件，确保使用正确的格式
      if (Array.isArray(files)) {
        files.forEach((file) => {
          // 参考API示例中的格式: 'files[]': (filename, file_content, mimetype)
          formData.append('files[]', file);
          console.log(`添加文件: ${file.name}, 类型: ${file.type}, 大小: ${file.size}字节`);
        });
      } else {
        formData.append('files[]', files);
        console.log(`添加文件: ${files.name}, 类型: ${files.type}, 大小: ${files.size}字节`);
      }
      
      // 使用环境配置获取API基础URL
      const config = getEnvConfig();
      const url = `${config.API_BASE_URL}/api/narrator/ai/v1/files/upload`;
      
      console.log(`上传文件URL: ${url}`);
      
      // 使用Promise包装XMLHttpRequest以支持进度监听
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        // 监听上传进度
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentage = Math.round((event.loaded / event.total) * 100);
            console.log(`上传进度: ${percentage}%`);
            callbacks?.onProgress?.(percentage, event.loaded, event.total);
          }
        };
        
        // 请求完成处理
        xhr.onload = async () => {
          let response: ApiResponse;
          
          try {
            const jsonData = JSON.parse(xhr.responseText);
            console.log('上传文件响应:', jsonData);
            
            if (jsonData.code !== 10000) {
              console.error(`业务错误: ${jsonData.code}, 信息: ${jsonData.message}`);
              response = {
                success: false,
                error: jsonData.message || '上传文件失败',
                code: jsonData.code,
                isBusinessError: true
              };
            } else {
              // 确保data存在且有效
              if (!jsonData.data) {
                console.warn('上传成功但返回数据为空');
                response = {
                  success: true,
                  data: [] // 提供默认空数组
                };
              } else {
                response = {
                  success: true,
                  data: jsonData.data
                };
              }
            }
          } catch (error) {
            console.error('解析响应失败:', error);
            response = {
              success: false,
              error: '解析服务器响应失败'
            };
          }
          
          callbacks?.onComplete?.(response);
          resolve(response);
        };
        
        // 请求错误处理
        xhr.onerror = () => {
          console.error('上传文件网络错误');
          const errorResponse = {
            success: false,
            error: '网络连接失败，请检查网络设置或服务器地址是否正确'
          };
          callbacks?.onError?.(errorResponse.error);
          resolve(errorResponse);
        };
        
        // 请求超时处理
        xhr.ontimeout = () => {
          console.error('上传文件请求超时');
          const errorResponse = {
            success: false,
            error: '请求超时，请检查网络连接或稍后重试'
          };
          callbacks?.onError?.(errorResponse.error);
          resolve(errorResponse);
        };
        
        // 打开请求
        xhr.open('POST', url, true);
        
        // 设置请求头
        xhr.setRequestHeader('APP-KEY', apiKey);
        
        // 发送请求
        xhr.send(formData);
      });
      
    } catch (error: any) {
      console.error('上传文件失败:', error);
      
      const errorResponse = {
        success: false,
        error: error.message || '上传文件失败'
      };
      
      callbacks?.onError?.(errorResponse.error);
      return errorResponse;
    }
  },

  /**
   * 获取文件详情
   */
  getFileDetails: async (fileId: string | number): Promise<ApiResponse<FileInfo>> => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        return { success: false, error: '未设置API密钥' };
      }
      
      console.log(`获取文件详情, 文件ID: ${fileId}`);
      
      const response = await apiClient.get(`/api/narrator/ai/v1/files/file/${fileId}`);
      return handleApiResponse(response);
    } catch (error: any) {
      console.error('获取文件详情失败:', error);
      return {
        success: false,
        error: error.message || '获取文件详情失败',
      };
    }
  },

  /**
   * 修改文件名称
   */
  renameFile: async (fileId: string | number, newFileName: string): Promise<ApiResponse> => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        return { success: false, error: '未设置API密钥' };
      }
      
      console.log(`修改文件名称, 文件ID: ${fileId}, 新名称: ${newFileName}`);
      
      const response = await apiClient.post('/api/narrator/ai/v1/files/rename', {
        file_id: fileId,
        new_file_name: newFileName
      });
      return handleApiResponse(response);
    } catch (error: any) {
      console.error('修改文件名称失败:', error);
      return {
        success: false,
        error: error.message || '修改文件名称失败',
      };
    }
  },

  /**
   * 删除文件
   */
  deleteFile: async (fileId: string | number): Promise<ApiResponse> => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        return { success: false, error: '未设置API密钥' };
      }
      
      console.log(`删除文件, 文件ID: ${fileId}`);
      
      const response = await apiClient.delete(`/api/narrator/ai/v1/files/file/${fileId}`);
      return handleApiResponse(response);
    } catch (error: any) {
      console.error('删除文件失败:', error);
      return {
        success: false,
        error: error.message || '删除文件失败',
      };
    }
  },
  
  /**
   * 获取文件夹文件列表
   * @param projectId 文件夹ID（实际API中不使用）
   * @param params 可选的查询参数：folder_name, order, orderBy, page, pageSize, name(文件夹名称)
   */
  getProjectFiles: async (
    projectId: string | number, 
    params: {
      folder_name?: string;
      order?: string;
      orderBy?: string;
      page?: number;
      pageSize?: number;
      id?: number; // 文件夹名称，必须提供
    } = {}
  ): Promise<ApiResponse> => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        return { success: false, error: '未设置API密钥' };
      }
      
      console.log(`获取文件夹文件列表, 文件夹ID: ${projectId}, 参数:`, params);
      
      // 提取文件夹名称
      const { id, ...otherParams } = params;
      
      if (!id) {
        return { success: false, error: '文件夹不能为空' };
      }
      
      // 构建查询参数字符串
      const queryParams = new URLSearchParams();
      queryParams.append('id', id);
      
      // 添加其他可选参数
      if (otherParams.folder_name) queryParams.append('folder_name', otherParams.folder_name);
      if (otherParams.order) queryParams.append('order', otherParams.order);
      if (otherParams.orderBy) queryParams.append('orderBy', otherParams.orderBy);
      if (otherParams.page) queryParams.append('page', otherParams.page.toString());
      if (otherParams.pageSize) queryParams.append('pageSize', otherParams.pageSize.toString());
      
      // 构建完整URL
      const url = `/api/narrator/ai/v1/fileSets/${projectId}?${queryParams.toString()}`;
      console.log(`请求URL: ${url}`);
      
      // 使用GET方法获取文件夹文件列表，不再包含文件夹ID在路径中
      const response = await apiClient.get(url);
      
      console.log(`接口响应:`, response);
      
      // 处理响应数据
      const apiResponse = handleApiResponse(response);
      console.log(`处理后的响应:`, apiResponse);
      // 如果成功，从文件夹详情中提取文件列表
      if (apiResponse.success && apiResponse.data) {
        // 检查数据结构
        if (Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
          const projectData = apiResponse.data[0];
          const files = projectData.files || [];
          
          // 保留完整的原始数据，包括files字段
          return {
            success: true,
            data: apiResponse.data
          };
        } else if (apiResponse.data.files && Array.isArray(apiResponse.data.files)) {
          // 直接包含files字段的情况
          const files = apiResponse.data.files;
          
          // 保留完整的原始数据
          return {
            success: true,
            data: apiResponse.data
          };
        } else {
          // 其他情况，尝试提取files字段
          const files = apiResponse.data.files || [];
          
          return {
            success: true,
            data: {
              files: files,
              total: files.length,
              records: files
            }
          };
        }
      }
      
      return apiResponse;
    } catch (error: any) {
      console.error('获取文件夹文件列表失败:', error);
      return {
        success: false,
        error: error.message || '获取文件夹文件列表失败',
      };
    }
  },
  
  /**
   * 批量删除文件夹下的文件
   */
  batchDeleteFiles: async (fileIds: (string | number)[]): Promise<ApiResponse> => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        return { success: false, error: '未设置API密钥' };
      }
      
      console.log(`批量删除文件, 文件数量: ${fileIds.length}`);
      
      // 根据API文档，这里应该适配实际接口，如果没有批量删除接口，则串行删除
      const deleteFile = fileService.deleteFile; // 使用变量引用避免this指向问题
      const results = await Promise.all(fileIds.map(fileId => deleteFile(fileId)));
      
      // 检查所有删除结果
      const allSuccess = results.every((result: ApiResponse) => result.success);
      
      return {
        success: allSuccess,
        data: {
          deletedCount: results.filter((r: ApiResponse) => r.success).length,
          totalCount: fileIds.length
        },
        error: allSuccess ? undefined : '部分文件删除失败'
      };
    } catch (error: any) {
      console.error('批量删除文件失败:', error);
      return {
        success: false,
        error: error.message || '批量删除文件失败',
      };
    }
  },
  
  /**
   * 百度网盘转存
   * @param params 包含百度网盘链接和文件夹ID
   */
  saveBaiduPanFile: async (params: BaiduPanSaveParams): Promise<ApiResponse> => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        return { 
          success: false, 
          error: '未设置NarratorAI API密钥',
          requireApiKey: true
        };
      }
      
      console.log(`开始转存百度网盘文件到文件夹[${params.file_set_id}]，链接: ${params.short_link}`);
      
      // 使用apiClient的post方法，该方法已经会处理API密钥
      const response = await apiClient.post(
        '/baidu/pan/save',  // 端点路径，apiClient会自动添加前缀
        params  // 请求数据
      );
      
      console.log('百度网盘转存响应:', response);
      
      return response;
    } catch (error: any) {
      console.error('转存百度网盘文件失败:', error);
      return {
        success: false,
        error: error.message || '网络请求失败，请稍后重试'
      };
    }
  },
  
  /**
   * 获取百度网盘转存任务列表
   * 返回最近20条转存任务
   */
  getBaiduPanTasks: async (): Promise<ApiResponse<BaiduPanTaskInfo[]>> => {
    try {
      const apiKey = localStorage.getItem('narrator_api_key');
      if (!apiKey) {
        return { 
          success: false, 
          error: '未设置NarratorAI API密钥',
          requireApiKey: true
        };
      }
      
      console.log('获取百度网盘转存任务列表');
      
      // 使用apiClient的get方法，该方法已经会处理API密钥
      const response = await apiClient.get(
        '/baidu/pan/save/tasks'  // 端点路径，apiClient会自动添加前缀
      );
      
      console.log('百度网盘转存任务列表响应:', response);
      
      return response;
    } catch (error: any) {
      console.error('获取百度网盘转存任务列表失败:', error);
      return {
        success: false,
        error: error.message || '网络请求失败，请稍后重试'
      };
    }
  }
};

export default fileService;
