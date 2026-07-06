"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * ASS格式的颜色（&HAABBGGRR）转换为标准的十六进制颜色（#RRGGBB）
 */
function assToHex(assColor: string): string {
  // 确保格式是 &HAABBGGRR
  if (!assColor || !assColor.startsWith("&H")) {
    return "#FFFFFF";
  }
  
  // 提取RGB部分（注意ASS格式是AABBGGRR，我们需要RRGGBB部分且顺序需要反转）
  const colorStr = assColor.substring(2); // 去掉 &H 前缀
  const colorNum = parseInt(colorStr, 16);
  
  // 提取RGB并转换为十六进制
  const r = (colorNum & 0x0000FF).toString(16).padStart(2, '0');
  const g = ((colorNum & 0x00FF00) >>> 8).toString(16).padStart(2, '0');
  const b = ((colorNum & 0xFF0000) >>> 16).toString(16).padStart(2, '0');
  
  return `#${r}${g}${b}`;
}

/**
 * 标准十六进制颜色（#RRGGBB）转换为ASS格式（&H00BBGGRR）
 * 注意这里我们将Alpha设为00（完全不透明）
 */
function hexToAss(hexColor: string): string {
  // 确保是标准6位十六进制颜色
  if (!hexColor || !hexColor.startsWith("#") || hexColor.length !== 7) {
    return "&H00FFFFFF"; // 默认白色
  }
  
  // 提取RGB
  const r = hexColor.substring(1, 3);
  const g = hexColor.substring(3, 5);
  const b = hexColor.substring(5, 7);
  
  // 转换为ASS格式 &H00BBGGRR
  return `&H00${b}${g}${r}`;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  // 将ASS格式转换为标准十六进制用于内部显示
  const [hexColor, setHexColor] = useState(assToHex(value));
  
  // 当外部传入的value变化时，更新内部状态
  useEffect(() => {
    setHexColor(assToHex(value));
  }, [value]);
  
  // 当内部颜色变化时，转换为ASS格式并调用onChange
  const handleColorChange = (hex: string) => {
    setHexColor(hex);
    onChange(hexToAss(hex));
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn("w-full h-8 p-0 border-1 relative flex items-center justify-start gap-2", className)}
        >
          <div 
            className="h-6 w-6 rounded-sm ml-2" 
            style={{ background: hexColor }} 
          />
          <span className="ml-1 text-xs">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <div>
            <Label>选择颜色</Label>
            <div className="mt-2 w-full h-24 rounded-md border cursor-pointer" style={{ 
              background: `linear-gradient(to bottom, transparent, #000),
                           linear-gradient(to right, #fff, ${hexColor})` 
            }} onClick={(e) => {
              // 简单的点击选择颜色示例，实际文件夹可能会使用更复杂的颜色选择器
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const xPercent = Math.min(Math.max(x / rect.width, 0), 1);
              const yPercent = Math.min(Math.max(y / rect.height, 0), 1);
              
              // 根据点击位置计算颜色
              const r = Math.round(255 * (1 - yPercent) * xPercent).toString(16).padStart(2, '0');
              const g = Math.round(255 * (1 - yPercent) * xPercent).toString(16).padStart(2, '0');
              const b = Math.round(255 * (1 - yPercent)).toString(16).padStart(2, '0');
              
              const newColor = `#${r}${g}${b}`;
              handleColorChange(newColor);
            }} />
          </div>
          
          <div className="grid grid-cols-8 gap-1">
            {[
              "#FF0000", "#FF7F00", "#FFFF00", "#00FF00", 
              "#0000FF", "#4B0082", "#9400D3", "#000000",
              "#FF69B4", "#00FFFF", "#FF00FF", "#ADFF2F", 
              "#1E90FF", "#FFA500", "#A52A2A", "#FFFFFF"
            ].map((color, i) => (
              <div 
                key={i} 
                className="w-6 h-6 rounded-sm cursor-pointer hover:scale-110 transition-transform"
                style={{ background: color }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="hex-input">十六进制</Label>
              <Input 
                id="hex-input" 
                value={hexColor}
                onChange={e => handleColorChange(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="ass-input">ASS格式</Label>
              <Input 
                id="ass-input" 
                value={value}
                onChange={e => onChange(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
