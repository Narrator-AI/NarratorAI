"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";
import { toast } from "@/lib/toast";
import { setApiKey } from "@/services/env-config";
import apiClient from "@/services/api-client";

// 定义API密钥表单类型
interface ApiKeyForm {
  narratorApiKey: string;
}

// 获取本地存储中的API密钥
const getDefaultValues = (): ApiKeyForm => {
  if (typeof window !== "undefined") {
    return {
      narratorApiKey: localStorage.getItem("narrator_api_key") || ""
    };
  }
  return {
    narratorApiKey: ""
  };
};

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: () => void;
}

export function ApiKeyDialog({ open, onOpenChange, onSaveSuccess }: ApiKeyDialogProps) {
  const [form, setForm] = useState<ApiKeyForm>(getDefaultValues());

  // 当对话框打开时重新获取存储的密钥
  useEffect(() => {
    if (open) {
      setForm(getDefaultValues());
    }
  }, [open]);

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    console.log('-----------------------------------------')
    e.preventDefault();
    
    // 检查API密钥是否为空
    if (!form.narratorApiKey.trim()) {
      toast({
        title: "错误",
        description: "请输入有效的API密钥",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // 显示加载状态
      toast({
        title: "正在验证...",
        description: "正在验证API密钥有效性",
        variant: "default"
      });
      
      // 使用Promise.race添加超时机制
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('API_REQUEST_TIMEOUT')), 5000);
      });
      
      // 验证API密钥是否有效
      const validatePromise = apiClient.validateApiKey(form.narratorApiKey);
      await Promise.race([validatePromise, timeout]);
      
      // 保存API密钥到localStorage (使用env-config中的方法保证一致性)
      setApiKey(form.narratorApiKey);
      localStorage.setItem("narrator_api_key", form.narratorApiKey);

      // 显示成功消息
      toast({
        title: "API密钥已验证并保存",
        description: "您的NarratorAI API密钥已成功验证并保存。",
        variant: "success"
      });

      // 关闭对话框
      onSaveSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("API密钥验证失败:", error);
      
      // 显示错误消息
      if ((error as Error).message === 'API_SERVER_UNREACHABLE' || (error as Error).message === 'Failed to fetch') {
        // 服务器不可达的情况
        toast({
          title: "服务器连接失败",
          description: "无法连接到API服务器，请检查网络连接或服务器状态",
          variant: "destructive"
        });
      } else if ((error as Error).message === 'API_REQUEST_TIMEOUT') {
        // 请求超时情况
        toast({
          title: "请求超时",
          description: "验证API密钥请求超时，请检查网络连接或服务器状态",
          variant: "destructive"
        });
      } else {
        // 其他验证失败情况
        toast({
          title: "验证失败",
          description: "API密钥无效，请检查后重试",
          variant: "destructive"
        });
      }
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API密钥设置
          </DialogTitle>
          <DialogDescription>
            设置您的NarratorAI API密钥，以便使用翻译服务功能。密钥将安全地存储在本地浏览器中。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="narratorApiKey" className="text-sm font-medium">
                NarratorAI API密钥
              </label>
              <a 
                href="https://ceex7z9m67.feishu.cn/share/base/form/shrcnmSHfAbYrFLsSeIrktEuYGf" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-blue-500 hover:text-blue-700 hover:underline font-medium"
              >
                申请API密钥
              </a>
            </div>
            <Input
              id="narratorApiKey"
              name="narratorApiKey"
              placeholder="narrator_api_..."
              type="password"
              value={form.narratorApiKey}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground">
              输入您的NarratorAI API密钥以使用所有的翻译和视频处理功能。
              如果您还没有密钥，请点击上方申请按钮。
            </p>
          </div>

          <DialogFooter>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
