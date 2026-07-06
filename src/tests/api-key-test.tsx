'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

// 导入API服务
import apiClient from '@/services/api-client';
import { setApiKey, clearApiKey, getEnvConfig } from '@/services/env-config';

/**
 * API密钥测试组件
 * 用于测试API密钥验证功能
 */
export default function ApiKeyTest() {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [savedApiKey, setSavedApiKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [localStorageItems, setLocalStorageItems] = useState<{[key: string]: string}>({});

  // 初始化时从localStorage获取API密钥
  useEffect(() => {
    refreshLocalStorage();
  }, []);

  // 刷新localStorage信息
  const refreshLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const items: {[key: string]: string} = {};
      
      // 获取所有localStorage项
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          items[key] = localStorage.getItem(key) || '';
        }
      }
      
      setLocalStorageItems(items);
      
      // 获取当前环境配置中的API密钥
      const config = getEnvConfig();
      setSavedApiKey(config.API_KEY || '');
    }
  };

  // 清除API密钥
  const handleClearApiKey = () => {
    clearApiKey();
    toast({
      title: 'API密钥已清除',
      variant: 'success'
    });
    refreshLocalStorage();
  };

  // 保存API密钥
  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: '错误',
        description: '请输入API密钥',
        variant: 'destructive'
      });
      return;
    }
    
    setApiKey(apiKey);
    toast({
      title: 'API密钥已保存',
      variant: 'success'
    });
    refreshLocalStorage();
  };

  // 测试API密钥
  const handleTestApiKey = async () => {
    try {
      setLoading(true);
      setTestResult(null);
      
      const keyToTest = apiKey.trim() || savedApiKey;
      
      if (!keyToTest) {
        toast({
          title: '错误',
          description: '请先输入或保存API密钥',
          variant: 'destructive'
        });
        return;
      }
      
      toast({
        title: '正在测试API密钥...',
        variant: 'default'
      });
      
      const isValid = await apiClient.validateApiKey(keyToTest);
      
      setTestResult({
        success: isValid,
        message: isValid ? 'API密钥验证成功' : 'API密钥验证失败'
      });
      
      if (isValid) {
        toast({
          title: 'API密钥验证成功',
          variant: 'success'
        });
      } else {
        toast({
          title: 'API密钥验证失败',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('API密钥测试失败:', error);
      
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: '测试失败',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">API密钥测试</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* API密钥输入 */}
        <Card>
          <CardHeader>
            <CardTitle>API密钥管理</CardTitle>
            <CardDescription>输入并测试API密钥</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">API密钥</label>
              <Input 
                value={apiKey} 
                onChange={e => setApiKeyState(e.target.value)}
                placeholder="输入API密钥进行测试" 
              />
            </div>
            
            <div>
              <p className="text-sm font-medium">当前保存的API密钥:</p>
              <p className="p-2 bg-gray-100 dark:bg-gray-800 rounded mt-1 text-xs break-all">
                {savedApiKey || '(未设置)'}
              </p>
            </div>
            
            {testResult && (
              <div className={`p-3 rounded ${testResult.success ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                <p className={`font-medium ${testResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {testResult.message}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button onClick={handleSaveApiKey}>
              保存API密钥
            </Button>
            <Button variant="outline" onClick={handleClearApiKey}>
              清除API密钥
            </Button>
            <Button 
              variant="default" 
              onClick={handleTestApiKey}
              disabled={loading}
            >
              {loading ? '测试中...' : '测试API密钥'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* localStorage 内容 */}
        <Card>
          <CardHeader>
            <CardTitle>localStorage 内容</CardTitle>
            <CardDescription>当前浏览器存储的内容</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.keys(localStorageItems).length === 0 ? (
                <p className="text-gray-500">localStorage 为空</p>
              ) : (
                Object.entries(localStorageItems).map(([key, value]) => (
                  <div key={key} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                    <p className="font-medium text-sm">{key}</p>
                    <p className="text-xs break-all mt-1">{value}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={refreshLocalStorage}>
              刷新 localStorage
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
