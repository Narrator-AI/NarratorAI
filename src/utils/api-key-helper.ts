/**
 * API密钥帮助工具
 * 用于处理API密钥相关的操作和验证
 */

// 从localStorage获取API密钥
export const getApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('narrator_api_key');
  }
  return null;
};

// 保存API密钥到localStorage
export const saveApiKey = (apiKey: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('narrator_api_key', apiKey);
  }
};

// 检查API密钥是否存在
export const hasApiKey = (): boolean => {
  return !!getApiKey();
};

// 验证API密钥是否有效
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const config = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://openapi.jieshuo.cn';
    const apiUrl = `${config}/api/narrator/ai/v1/fileSets`;
    console.log(`尝试验证API密钥，请求URL: ${apiUrl}`);
    
    // 使用获取文件夹列表端点验证API密钥
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'APP-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('API密钥验证响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('API密钥验证失败, 状态码:', response.status);
      return false;
    }
    
    const data = await response.json().catch(err => {
      console.error('解析响应JSON失败:', err);
      return { code: -1, message: '无法解析服务器响应' };
    });
    
    console.log('API密钥验证响应数据:', data);
    
    // 根据API文档检查响应码
    if (data.code !== 10000) {
      if (data.code === 10004 || data.code === 10002) {
        console.error('API密钥无效:', data.message);
        return false;
      }
      return false;
    }
    
    return true;
  } catch (error) {
    // 处理网络错误等情况
    console.error('API密钥验证请求失败:', error);
    
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      if (error.message === 'INVALID_API_KEY' || 
          error.message.includes('无效') || 
          error.message.includes('失效')) {
        return false;
      }
    }
    
    return false;
  }
};

// 判断错误是否与API密钥相关
export const isApiKeyError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('API密钥未设置') || 
           error.message.includes('API密钥无效') ||
           error.message.includes('401') ||
           error.message.includes('403');
  }
  return false;
};
