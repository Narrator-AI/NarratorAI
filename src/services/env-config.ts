/**
 * 环境配置服务
 * 处理API地址和密钥配置
 */

// 默认配置
const defaultConfig = {
  API_BASE_URL: 'https://openapi.jieshuo.cn',
  API_KEY: ''
};

// 从localStorage获取API密钥
const getApiKeyFromStorage = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('narrator_api_key') || defaultConfig.API_KEY;
  }
  return defaultConfig.API_KEY;
};

// 设置API密钥到localStorage
export const setApiKey = (apiKey: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('narrator_api_key', apiKey);
  }
};

// 清除API密钥
export const clearApiKey = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('narrator_api_key');
    console.log('API密钥已清除');
  }
};

// 获取环境变量，如果不存在则使用默认值
export const getEnvConfig = () => {
  return {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || defaultConfig.API_BASE_URL,
    API_KEY: getApiKeyFromStorage()
  };
};

export default getEnvConfig;
