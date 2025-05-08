import { useState, useRef } from 'react';
import { LocalizationData, LocalizationEntity } from '../types/workflow.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, FileDown, Upload, FileUp } from 'lucide-react';
import { deepCloneWithNewIds } from '../utils/localization.utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface LocalizationEditorProps {
  data: LocalizationData;
  allLanguagesData?: Record<string, LocalizationData>;
  availableLanguages?: string[];
  currentLanguage?: string;
  onSave: (data: LocalizationData, language?: string) => void;
  onLanguageChange?: (language: string) => void;
  taskId: string;
}

export const LocalizationEditor = ({
  data: initialData,
  allLanguagesData = {},
  availableLanguages = [],
  currentLanguage = '',
  onSave,
  onLanguageChange,
  taskId
}: LocalizationEditorProps) => {
  const [data, setData] = useState<LocalizationData>(initialData);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [selectedCategory, setSelectedCategory] = useState<keyof LocalizationData>('角色');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 语言切换时的处理函数
  const handleLanguageChange = (language: string) => {
    console.log(`切换语言从 ${selectedLanguage} 到 ${language}`);
    setSelectedLanguage(language);
    
    // 如果语言变化，需要加载对应语言的数据
    if (allLanguagesData && allLanguagesData[language]) {
      setData(allLanguagesData[language]);
    }
    
    // 通知父组件更新当前语言，但不保存数据
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  };

  const getCurrentData = (): LocalizationEntity[] => {
    if (selectedCategory === '角色') {
      const characterEntities: LocalizationEntity[] = [];
      Object.values(data.角色).forEach(entities => {
        characterEntities.push(...entities);
      });
      return characterEntities;
    }
    return data[selectedCategory];
  };

  const addNewEntity = () => {
    const newEntity: LocalizationEntity = {
      id: `entity-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      原文: '',
      本土化: '',
      注释: ''
    };

    if (selectedCategory === '角色') {
      setData(prev => ({
        ...prev,
        角色: {
          ...prev.角色,
          '未分类': [...(prev.角色['未分类'] || []), newEntity]
        }
      }));
    } else {
      setData(prev => ({
        ...prev,
        [selectedCategory]: [...prev[selectedCategory], newEntity]
      }));
    }
  };

  const addNewCharacter = () => {
    const characterName = prompt('请输入新角色名称');
    if (characterName && !data.角色[characterName]) {
      setData(prev => ({
        ...prev,
        角色: {
          ...prev.角色,
          [characterName]: []
        }
      }));
    }
  };

  const handleEntityChange = (id: string, field: keyof LocalizationEntity, value: string) => {
    if (selectedCategory === '角色') {
      setData(prev => {
        const newData = { ...prev };
        Object.keys(newData.角色).forEach(character => {
          newData.角色[character] = newData.角色[character].map(entity =>
            entity.id === id ? { ...entity, [field]: value } : entity
          );
        });
        return newData;
      });
    } else {
      setData(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory].map(entity =>
          entity.id === id ? { ...entity, [field]: value } : entity
        )
      }));
    }
  };

  const handleCharacterNameChange = (oldName: string, newName: string) => {
    if (oldName === newName || !newName) return;
    
    setData(prev => {
      const newData = { ...prev };
      const entities = newData.角色[oldName];
      delete newData.角色[oldName];
      newData.角色[newName] = entities;
      return newData;
    });
  };

  const deleteEntity = (id: string) => {
    if (selectedCategory === '角色') {
      setData(prev => {
        const newData = { ...prev };
        Object.keys(newData.角色).forEach(character => {
          newData.角色[character] = newData.角色[character].filter(
            entity => entity.id !== id
          );
        });
        return newData;
      });
    } else {
      setData(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory].filter(entity => entity.id !== id)
      }));
    }
  };

  const deleteCharacter = (characterName: string) => {
    if (window.confirm(`确定要删除角色"${characterName}"吗？`)) {
      setData(prev => {
        const newData = { ...prev };
        delete newData.角色[characterName];
        return newData;
      });
    }
  };

  const handleSaveAll = () => {
    onSave(data, selectedLanguage);
  };

  const exportToExcel = () => {
    try {
      const exportData: any[] = [];
      
      if (selectedCategory === '角色') {
        Object.entries(data.角色).forEach(([character, entities]) => {
          entities.forEach(entity => {
            exportData.push({
              '角色名称': character,
              '序号': exportData.length + 1,
              '原文': entity.原文,
              '本土化': entity.本土化,
              '注释': entity.注释,
              '_id': entity.id
            });
          });
        });
      } else {
        data[selectedCategory].forEach((entity, index) => {
          exportData.push({
            '序号': index + 1,
            '原文': entity.原文,
            '本土化': entity.本土化,
            '注释': entity.注释,
            '_id': entity.id
          });
        });
      }
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      const columnWidths = [
        { wch: 15 },
        { wch: 10 },
        { wch: 25 },
        { wch: 25 },
        { wch: 30 },
      ];
      
      ws['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, selectedCategory);
      
      const fileName = `本土化数据_${selectedLanguage || '默认'}_${selectedCategory}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      toast.success('导出成功');
    } catch (error) {
      console.error('导出Excel失败:', error);
      toast.error('导出失败，请重试');
    }
  };

  const importFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
        
        if (jsonData.length === 0) {
          toast.error('Excel文件为空或格式不正确');
          return;
        }
        
        if (selectedCategory === '角色') {
          const newData = { ...data };
          const charactersData: Record<string, LocalizationEntity[]> = {};
          
          jsonData.forEach(row => {
            const character = row['角色名称'] || '未分类';
            if (!charactersData[character]) {
              charactersData[character] = [];
            }
            
            const entity: LocalizationEntity = {
              id: row['_id'] || `entity-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              原文: row['原文'] || '',
              本土化: row['本土化'] || '',
              注释: row['注释'] || ''
            };
            
            charactersData[character].push(entity);
          });
          
          newData.角色 = charactersData;
          setData(newData);
        } else {
          const entities: LocalizationEntity[] = jsonData.map(row => ({
            id: row['_id'] || `entity-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            原文: row['原文'] || '',
            本土化: row['本土化'] || '',
            注释: row['注释'] || ''
          }));
          
          setData(prev => ({
            ...prev,
            [selectedCategory]: entities
          }));
        }
        
        toast.success('导入成功');
      } catch (error) {
        console.error('导入Excel失败:', error);
        toast.error('导入失败，请检查文件格式');
      }
    };
    
    reader.readAsArrayBuffer(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* 隐藏式文件输入框 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={importFromExcel}
        accept=".xlsx, .xls"
        className="hidden"
      
      newData.角色 = charactersData;
      setData(newData);
    } else {
      const entities: LocalizationEntity[] = jsonData.map(row => ({
        id: row['_id'] || `entity-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        原文: row['原文'] || '',
        本土化: row['本土化'] || '',
        注释: row['注释'] || ''
      }));
      
      setData(prev => ({
        ...prev,
        [selectedCategory]: entities
      }));
    }
    
    toast.success('导入成功');
  } catch (error) {
    console.error('导入Excel失败:', error);
    toast.error('导入失败，请检查文件格式');
  }
};
  
reader.readAsArrayBuffer(file);
  
if (fileInputRef.current) {
  fileInputRef.current.value = '';
}
};

return (
  <div className="space-y-4">
    {/* 隐藏式文件输入框 */}
    <input
      type="file"
      ref={fileInputRef}
      onChange={importFromExcel}
      accept=".xlsx, .xls"
      className="hidden"
    />
    
    {/* 顶部操作栏 */}
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        {availableLanguages.length > 0 && (
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="选择语言" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="角色">角色 ({Object.keys(data.角色).length})</SelectItem>
              <SelectItem value="地名">地名 ({data.地名.length})</SelectItem>
              <SelectItem value="组织名">组织名 ({data.组织名.length})</SelectItem>
              <SelectItem value="文化相关">文化相关 ({data.文化相关.length})</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()} 
            className="flex items-center gap-1 h-8"
          >
            <FileUp className="w-4 h-4" />
            <span>导入Excel</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToExcel}
            className="flex items-center gap-1 h-8"
          >
            <FileDown className="w-4 h-4" />
            <span>导出Excel</span>
          </Button>
          
          <Button 
            onClick={selectedCategory === '角色' ? addNewCharacter : addNewEntity} 
            size="sm"
            className="flex items-center gap-1 h-8"
          >
            <Plus className="w-4 h-4" />
            {selectedCategory === '角色' ? '添加角色' : '添加条目'}
          </Button>
        </div>
      </div>

      {selectedCategory === '角色' ? (
        Object.entries(data.角色).map(([character, entities]) => (
          <div key={character} className="space-y-2">
            <div className="flex items-center justify-between">
              <Input
                value={character}
                onChange={(e) => handleCharacterNameChange(character, e.target.value)}
                className="w-48"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteCharacter(character)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            {entities.map(entity => (
              <div key={entity.id} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="原文"
                    value={entity.原文}
                    onChange={(e) => handleEntityChange(entity.id, '原文', e.target.value)}
                  />
                  <Input
                    placeholder="本土化"
                    value={entity.本土化}
                    onChange={(e) => handleEntityChange(entity.id, '本土化', e.target.value)}
                  />
                  <Textarea
                    placeholder="注释"
                    value={entity.注释}
                    onChange={(e) => handleEntityChange(entity.id, '注释', e.target.value)}
                    rows={2}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteEntity(entity.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="space-y-2">
          {getCurrentData().map(entity => (
            <div key={entity.id} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="原文"
                  value={entity.原文}
                  onChange={(e) => handleEntityChange(entity.id, '原文', e.target.value)}
                />
                <Input
                  placeholder="本土化"
                  value={entity.本土化}
                  onChange={(e) => handleEntityChange(entity.id, '本土化', e.target.value)}
                />
                <Textarea
                  placeholder="注释"
                  value={entity.注释}
                  onChange={(e) => handleEntityChange(entity.id, '注释', e.target.value)}
                  rows={2}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteEntity(entity.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSaveAll}>保存本土化数据</Button>
      </div>
    </div>
  );
}; 