/**
 * API客户端
 * 处理与API的所有通信
 */

import getConfig from './env-config';

// 标准错误码映射
const ERROR_CODE_MAP: Record<number, string> = {
  10001: '系统内部异常',
  10002: 'API密钥不正确',
  10003: '访问被拒绝',
  10004: 'API密钥已失效',
  10005: '请求参数错误',
  10006: '服务暂时不可用',
  10007: '请求方法不支持',
  10008: '资源不存在',
  10009: '点数不足',
  10010: '请求超时'
};

/**
 * API客户端接口
 */
const apiClient = {
  /**
   * 验证API密钥
   * @param apiKey API密钥
   * @returns 如果密钥有效则返回true，否则返回false
   */
  validateApiKey: async (apiKey: string): Promise<boolean> => {
    console.log('开始验证API密钥');
    
    if (!apiKey || apiKey.trim() === '') {
      console.log('API密钥为空，验证失败');
      return false;
    }
    
    try {
      // 详细记录请求头信息（为了调试）
      const headers = {
        'APP-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      console.log(`验证API密钥请求头: ${JSON.stringify(headers)}`);
      
      const config = getConfig();
      const url = `${config.API_BASE_URL}/api/narrator/ai/v1/fileSets`;
      console.log(`验证API密钥URL: ${url}`);
      
      // 发送请求
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      console.log(`验证API密钥HTTP状态: ${response.status} ${response.statusText}`);
      
      // 检查HTTP状态
      if (!response.ok) {
        console.error(`验证API密钥失败，HTTP错误: ${response.status}`);
        return false;
      }
      
      // 解析响应
      const data = await response.json();
      console.log(`验证API密钥响应数据: ${JSON.stringify(data)}`);
      
      // 检查业务状态码
      if (data.code !== 10000) {
        console.error(`验证API密钥业务错误: code=${data.code}, message=${data.message}`);
        return false;
      }
      
      // 验证成功
      console.log('API密钥验证成功');
      return true;
    } catch (error: any) {
      // 记录详细错误信息
      console.error('验证API密钥过程中发生错误:', error);
      
      // 检查是否是网络错误
      if (error instanceof TypeError && error.message.includes('网络请求失败')) {
        console.error('网络错误，可能是CORS问题或服务器不可达');
      }
      
      return false;
    }
  },
  
  /**
   * 处理API响应
   * @param response - 响应对象
   */
  handleResponse: async function(response: Response): Promise<any> {
    try {
      // 检查HTTP状态码
      if (!response.ok) {
        // 处理非200响应
        const errorText = await response.text();
        console.error(`HTTP错误 ${response.status}: ${errorText}`);
        return {
          success: false,
          error: `HTTP错误 ${response.status}: ${response.statusText}`,
          message: `HTTP错误 ${response.status}: ${response.statusText}`,
          code: response.status
        };
      }

      // 解析JSON响应
      const jsonData = await response.json();
      
      // 检查业务状态码
      if (jsonData && jsonData.code !== 10000) {
        // 业务错误处理 - 记录错误但不抛出异常
        console.error(`业务错误: ${jsonData.code}, 信息: ${jsonData.message}`);
        return {
          success: false,
          message: jsonData.message,
          error: jsonData.message,
          code: jsonData.code,
          isApiBusinessError: true
        };
      }
      
      // 正常返回数据，数据在data字段中
      return {
        success: true,
        data: jsonData.data,
        page: jsonData.page || 1,
        limit: jsonData.limit || 10,
        total: jsonData.total || 0
      };
    } catch (error) {
      console.error('解析响应失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误',
        error: error instanceof Error ? error.message : '未知错误',
        isParseError: true
      };
    }
  },

  /**
   * 处理错误
   * @param error - 错误对象
   */
  handleError: function(error: any): any {
    // 记录详细错误信息
    console.error('API请求错误:', error);
    
    // 检查是否是API业务错误
    if (error.message && error.message.startsWith('业务错误:')) {
      return {
        success: false,
        message: error.message,
        error: error.message,
        isApiBusinessError: true
      };
    }
    
    // HTTP错误或网络错误
    return {
      success: false,
      message: error.message || '未知错误',
      error: error.message || '未知错误'
    };
  },
  
  /**
   * 构建请求选项
   */
  buildRequestOptions: (method: string, params: any = {}, customHeaders: any = {}) => {
    // 获取API密钥
    const apiKey = localStorage.getItem('narrator_api_key');
    
    // 基础请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders
    };
    
    // 如果存在API密钥，添加到请求头
    if (apiKey) {
      headers['APP-KEY'] = apiKey;
    }
    
    const options: RequestInit = {
      method,
      headers
    };
    
    // 对于GET请求，参数通过URL传递
    // 对于其他请求类型，参数通过body传递
    if (method !== 'GET' && Object.keys(params).length > 0) {
      options.body = JSON.stringify(params);
    }
    
    return options;
  },
  
  /**
   * 获取用户点数
   */
  getUserPoints: async () => {
    const { API_KEY } = getConfig();
    if (!API_KEY) {
      throw new Error('API_KEY_NOT_SET'); // 使用特殊错误代码，方便页面中识别
    }
    return apiClient.get('/user/points');
  },
  
  /**
   * 发送GET请求
   */
  get: async (endpoint: string, params: any = {}) => {
    // 确保端点以/api/narrator/ai/v1开头
    const apiEndpoint = endpoint.startsWith('/api/') 
      ? endpoint 
      : `/api/narrator/ai/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      
    // 构建URL查询参数
    const queryParams = Object.keys(params).length > 0
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    
    const url = `${getConfig().API_BASE_URL}${apiEndpoint}${queryParams}`;
    console.log(`发送GET请求: ${url}`);
    
    const options = apiClient.buildRequestOptions('GET');
    
    try {
      const response = await fetch(url, options);
      console.log(`GET请求响应状态: ${response.status} ${response.statusText}`);
      
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },
  
  /**
   * 发送POST请求
   */
  post: async (endpoint: string, data: any = {}) => {
    // 确保端点以/api/narrator/ai/v1开头
    const apiEndpoint = endpoint.startsWith('/api/') 
      ? endpoint 
      : `/api/narrator/ai/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      
    const url = `${getConfig().API_BASE_URL}${apiEndpoint}`;
    console.log(`发送POST请求: ${url}`);
    
    const options = apiClient.buildRequestOptions('POST', data);
    
    try {
      const response = await fetch(url, options);
      console.log(`POST请求响应状态: ${response.status} ${response.statusText}`);
      
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },
  
  /**
   * 发送PUT请求
   */
  put: async (endpoint: string, data: any = {}) => {
    // 确保端点以/api/narrator/ai/v1开头
    const apiEndpoint = endpoint.startsWith('/api/') 
      ? endpoint 
      : `/api/narrator/ai/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      
    const url = `${getConfig().API_BASE_URL}${apiEndpoint}`;
    console.log(`发送PUT请求: ${url}`);
    
    const options = apiClient.buildRequestOptions('PUT', data);
    
    try {
      const response = await fetch(url, options);
      console.log(`PUT请求响应状态: ${response.status} ${response.statusText}`);
      
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },
  
  /**
   * 发送DELETE请求
   */
  delete: async (endpoint: string) => {
    // 确保端点以/api/narrator/ai/v1开头
    const apiEndpoint = endpoint.startsWith('/api/') 
      ? endpoint 
      : `/api/narrator/ai/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      
    const url = `${getConfig().API_BASE_URL}${apiEndpoint}`;
    console.log(`发送DELETE请求: ${url}`);
    
    const options = apiClient.buildRequestOptions('DELETE');
    
    try {
      const response = await fetch(url, options);
      console.log(`DELETE请求响应状态: ${response.status} ${response.statusText}`);
      
      return apiClient.handleResponse(response);
    } catch (error) {
      return apiClient.handleError(error);
    }
  },
  
  /**
   * 上传文件
   */
  uploadFile: async (endpoint: string, files: File | File[], additionalData?: Record<string, any>) => {
    const { API_KEY } = getConfig();
    if (!API_KEY) {
      throw new Error('API_KEY_NOT_SET');
    }
    
    // 确保端点以/api/narrator/ai/v1开头
    const apiEndpoint = endpoint.startsWith('/api/') 
      ? endpoint 
      : `/api/narrator/ai/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      
    const formData = new FormData();
    
    if (Array.isArray(files)) {
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
    } else {
      formData.append('file', files);
    }
    
    // 添加其他数据
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    
    const apiKey = localStorage.getItem('narrator_api_key') || API_KEY;
    
    const url = `${getConfig().API_BASE_URL}${apiEndpoint}`;
    console.log(`发送文件上传请求: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'APP-KEY': apiKey,
      },
      body: formData,
    });
    
    console.log(`文件上传响应状态: ${response.status} ${response.statusText}`);
    
    return apiClient.handleResponse(response);
  },
  
  /**
   * 获取任务费用
   */
  getTaskFee: async (taskType: string, params: { duration?: number, subtitles_count?: number }) => {
    const { API_KEY } = getConfig();
    if (!API_KEY) {
      throw new Error('API_KEY_NOT_SET'); // 使用特殊错误代码，方便页面中识别
    }
    const queryParams = {
      task_type: taskType,
      ...params,
    };
    
    return apiClient.get('/tasks/fee', queryParams);
  },
};

export default apiClient;
