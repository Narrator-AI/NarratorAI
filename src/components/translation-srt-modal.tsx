import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Task } from "@/data/tasks"; // Assuming Task type is defined here
import taskService from "@/services/task-service"; // Assuming task service is here
import { Download, Upload } from "lucide-react";
import JSZip from "jszip"; // <-- Import JSZip
import { saveAs } from "file-saver"; // <-- Import saveAs

interface TranslationSrtModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  taskData: Task | null;
  onUpdateTask: (updatedTask: Task) => void; // Callback to update task data after import
}

interface SrtFileEntry {
  playlet_num: string;
  content: string;
  file: string;
}

const TranslationSrtModal: React.FC<TranslationSrtModalProps> = ({
  isOpen,
  onOpenChange,
  taskData,
  onUpdateTask,
}) => {
  const [activeTab, setActiveTab] = useState<"import" | "export">("export");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [filesToImport, setFilesToImport] = useState<FileList | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [srtListForLanguage, setSrtListForLanguage] = useState<SrtFileEntry[]>([]);
  const [selectedSrtIds, setSelectedSrtIds] = useState<number[]>([]); // <-- State for selected IDs

  useEffect(() => {
    if (taskData?.srt_list) {
      const availableLanguages = Object.keys(taskData.srt_list);
      setLanguages(availableLanguages);
      // Automatically select the first language if available
      if (availableLanguages.length > 0 && !selectedLanguage) {
        setSelectedLanguage(availableLanguages[0]);
      }
    } else {
      setLanguages([]);
      setSelectedLanguage(null);
    }
    setSelectedSrtIds([]); // <-- Reset selection when language changes
  }, [taskData, selectedLanguage]);

  useEffect(() => {
    if (
      selectedLanguage &&
      taskData?.srt_list &&
      taskData.srt_list[selectedLanguage]
    ) {
      setSrtListForLanguage(taskData.srt_list[selectedLanguage]);
    } else {
      setSrtListForLanguage([]);
    }
  }, [selectedLanguage, taskData]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilesToImport(event.target.files);
  };

  // Function to handle downloading a single SRT file
  const handleExportSingleSrt = async (srtEntry: SrtFileEntry) => {
    if (!srtEntry.file) {
      toast.error("该文件没有有效的下载链接。");
      return;
    }
    const fileName = `${
      taskData?.resources?.file_set_name || "task"
    }_${selectedLanguage}_${srtEntry.playlet_num}.srt`;
    const toastId = toast.loading(`正在下载: ${fileName}...`);
    try {
      const response = await fetch(srtEntry.file);
      if (!response.ok) {
        throw new Error(`下载失败 (${response.status} ${response.statusText})`);
      }
      const blob = await response.blob();
      saveAs(blob, fileName);
      toast.success(`已下载: ${fileName}`, { id: toastId });
    } catch (error: any) {
      console.error("下载失败:", error);
      toast.error(`下载失败: ${fileName} (${error.message || "未知错误"})`, {
        id: toastId,
      });
    }
  };

  const handleImportTranslatedSrts = async () => {
    if (
      !filesToImport ||
      filesToImport.length === 0 ||
      !selectedLanguage ||
      !taskData?.id // Use id based on previous assumptions
    ) {
      toast.error("请选择语言并选择要导入的SRT文件。任务ID缺失。");
      return;
    }

    const taskId = taskData.id;
    const srtFiles = Array.from(filesToImport).filter(
      (file) => file.name.toLowerCase().endsWith(".srt")
    );

    if (srtFiles.length === 0) {
      toast.error("未找到有效的 SRT 文件。请确保文件以 .srt 结尾。");
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = filesToImport.length - srtFiles.length;
    const totalToProcess = srtFiles.length;
    const loadingToast = toast.loading(`准备导入 ${totalToProcess} 个 SRT 文件...`);

    try {
      for (let i = 0; i < totalToProcess; i++) {
        const file = srtFiles[i];
        const currentFileNum = i + 1;
        toast.loading(`正在导入 ${currentFileNum}/${totalToProcess}: ${file.name}`, { id: loadingToast });

        // 1. Parse playlet_num from filename
        // Assuming format: anything_language_number.srt
        // Example: 视频翻译_阿拉伯语_1.srt -> playlet_num = 1
        const match = file.name.match(/(?:.+)_([^_]+)_(\d+)\.srt$/i);
        let playlet_num: number | null = null;
        if (match && match[2]) {
          playlet_num = parseInt(match[2], 10);
        } 

        if (playlet_num === null || isNaN(playlet_num)) {
            console.warn(`无法从文件名 ${file.name} 解析集数，已跳过。`);
            toast.warning(`跳过文件 ${file.name}: 无法解析集数`, { duration: 4000 });
            errorCount++; // Count as error or skip? Let's count as error for now.
            continue; // Skip to next file
        }

        try {
          // 2. Read file content
          const content = await readFileAsText(file);

          // 3. Prepare params
          const params = {
            playlet_num, // Parsed number
            type: "srt", // Hardcoded type
            target_lang: selectedLanguage, // Language selected in the UI
            content, // File content as string
          };
          console.log('Updating task content with params:', params);

          // 4. Call API
          // Ensure taskService.updateTaskContent exists and accepts these params
          const result = await taskService.updateTaskContent(taskId, params);
          console.log(`文件 ${file.name} 导入结果:`, result);
          successCount++;
          // Optional: Add a small success tick/toast per file?
          // toast.success(`文件 ${file.name} 导入成功!`, { duration: 1500 });

        } catch (fileError: any) {
          console.error(`处理文件 ${file.name} 时出错:`, fileError);
          toast.error(`导入 ${file.name} 失败: ${fileError.message || '请检查控制台'}`);
          errorCount++;
        }
      }

      // Final summary toast
      let summaryMessage = `导入完成: ${successCount} 个成功`;
      if (errorCount > 0) summaryMessage += `, ${errorCount} 个失败`;
      if (skippedCount > 0) summaryMessage += `, ${skippedCount} 个非SRT文件被跳过`;

      if (successCount > 0 && errorCount === 0) {
        toast.success(summaryMessage, { id: loadingToast, duration: 5000 });
        setFilesToImport(null); // Reset file input
        // Optionally call onUpdateTask to refresh data? depends on API response
        if (onUpdateTask) {
             onUpdateTask(); // Refresh task data if needed
        }
        // Consider closing modal only if all succeed?
        // onOpenChange(false); 
      } else if (errorCount > 0) {
        toast.warning(summaryMessage, { id: loadingToast, duration: 8000 });
      } else { // Only skipped files
         toast.info(summaryMessage, { id: loadingToast, duration: 5000 });
      }
       if(successCount > 0 && errorCount === 0 && skippedCount === 0){ // Close modal only if all files processed ok
            onOpenChange(false);
       }


    } catch (overallError) {
      console.error("导入过程中发生意外错误:", overallError);
      toast.error("导入过程中发生意外错误，请重试", { id: loadingToast });
    } finally {
      // Make sure loading toast is dismissed if not updated by success/error/info
       // toast.dismiss(loadingToast); // Now handled by specific outcomes
    }
  };

  // Helper function to read file as text using FileReader
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          resolve(event.target.result);
        } else {
          reject(new Error('无法读取文件内容'));
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(file); // Read as text for SRT content
    });
  };

  const handleExportSelectedSrts = async () => {
    if (!selectedLanguage || selectedSrtIds.length === 0) {
      toast.error("请选择语言并至少选择一个文件进行导出。");
      return;
    }

    // If only one file is selected, download it directly
    if (selectedSrtIds.length === 1) {
      const singleSrtId = selectedSrtIds[0];
      const srtToDownload = srtListForLanguage.find(srt => srt.playlet_num === singleSrtId);
      if (srtToDownload) {
        await handleExportSingleSrt(srtToDownload); // Await the single download
        return; // Stop execution here
      } else {
        toast.error("无法找到选中的文件信息。");
        return;
      }
    }

    // Proceed with zipping if multiple files are selected
    const filesToExport = srtListForLanguage.filter((srt) =>
      selectedSrtIds.includes(srt.playlet_num) && srt.file
    );

    if (filesToExport.length === 0) {
      toast.error("选中的文件没有有效的下载链接。");
      return;
    }

    const zip = new JSZip();
    let filesAddedCount = 0;
    let filesSkippedCount = selectedSrtIds.length - filesToExport.length; // Initial skipped count for those without links
    const toastId = toast.loading(`正在准备导出 ${filesToExport.length} 个文件...`);

    try {
      const promises = filesToExport.map(async (srtEntry) => {
        // File existence already checked by filter, but double-check doesn't hurt
        if (!srtEntry.file) {
          console.warn(`内部逻辑错误：跳过集 ${srtEntry.playlet_num}: 无下载链接`);
          // filesSkippedCount++; // Already accounted for
          return;
        }

        try {
          const response = await fetch(srtEntry.file);
          if (!response.ok) {
            throw new Error(
              `获取文件失败: ${response.statusText} (集 ${srtEntry.playlet_num})`
            );
          }
          const srtContent = await response.text();
          const fileName = `${
            taskData?.resources?.file_set_name || "task"
          }_${selectedLanguage}_${srtEntry.playlet_num}.srt`;
          zip.file(fileName, srtContent);
          filesAddedCount++;
        } catch (fetchError: any) {
          console.error(`处理集 ${srtEntry.playlet_num} 时出错:`, fetchError);
          filesSkippedCount++; // Increment for fetch errors
          // Optionally notify about specific file errors
        }
      });

      await Promise.all(promises);

      if (filesAddedCount === 0) {
        toast.error("没有文件被成功添加到压缩包中 (可能所有选中的文件下载均失败)。", {
          id: toastId,
        });
        // toast.dismiss(toastId); // Keep the error toast visible
        return;
      }

      // 生成 ZIP 文件
      toast.loading(`正在生成 ZIP 文件 (${filesAddedCount}个文件)...`, {
        id: toastId,
      });
      const content = await zip.generateAsync({ type: "blob" });

      // 触发下载
      const zipFileName = `${
        taskData?.resources?.file_set_name || "task"
      }_${selectedLanguage}_选中字幕导出.zip`; // Adjusted filename
      saveAs(content, zipFileName);

      let successMessage = `成功导出 ${filesAddedCount} 个文件!`;
      if (filesSkippedCount > 0) {
        successMessage += ` (${filesSkippedCount} 个文件因链接无效或下载错误被跳过)`;
      }
      toast.success(successMessage, { id: toastId, duration: 5000 });
    } catch (error: any) {
      console.error("创建或下载 ZIP 文件时出错:", error);
      toast.error(`创建 ZIP 文件失败: ${error.message || "未知错误"}`, { id: toastId });
    } finally {
      // Do not dismiss here if error occurred, let error toast stay
      // toast.dismiss(toastId);
    }
  };

  // Handler for individual checkbox changes
  const handleSelectSrt = (playletNum: number) => {
    setSelectedSrtIds((prev) =>
      prev.includes(playletNum)
        ? prev.filter((id) => id !== playletNum)
        : [...prev, playletNum]
    );
  };

  // Handler for 'Select All' checkbox changes
  const handleSelectAllSrts = (checked: boolean) => {
    if (checked) {
      // Select all available (with file links)
      const allSelectableIds = srtListForLanguage
        .filter((srt) => srt.file) // Only select those with a file link
        .map((srt) => srt.playlet_num);
      setSelectedSrtIds(allSelectableIds);
    } else {
      setSelectedSrtIds([]);
    }
  };

  // Calculate if all selectable items are currently selected
  const allSelectableCount = srtListForLanguage.filter((srt) => srt.file).length;
  const isAllSelected = allSelectableCount > 0 && selectedSrtIds.length === allSelectableCount;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>导入/导出翻译字幕</DialogTitle>
          <DialogDescription>
            选择目标语言，然后导入本地SRT文件或从服务器导出已生成的翻译字幕文件。
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "import" | "export")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">从服务器导出</TabsTrigger>
            <TabsTrigger value="import">导入本地文件</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export">
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="language-select-export" className="w-20">
                  选择语言:
                </Label>
                <Select
                  value={selectedLanguage || ""}
                  onValueChange={setSelectedLanguage}
                >
                  <SelectTrigger
                    id="language-select-export"
                    className="flex-grow"
                  >
                    <SelectValue placeholder="选择语言" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.length > 0 ? (
                      languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        无可用语言
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* SRT List Area */}
              <ScrollArea className="h-[300px] w-full rounded-md border p-2">
                {selectedLanguage && srtListForLanguage.length > 0 ? (
                  <div>
                    {/* Select All Checkbox */}
                    <div className="flex items-center space-x-2 p-1.5 border-b mb-1">
                      <Checkbox
                        id="select-all"
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAllSrts}
                        disabled={allSelectableCount === 0}
                      />
                      <Label
                        htmlFor="select-all"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {isAllSelected ? "取消全选" : `全选 (${allSelectableCount} 项可选)`}
                      </Label>
                    </div>
                    {/* File List */}
                    <ul className="space-y-1">
                      {srtListForLanguage.map((srt) => (
                        <li
                          key={srt.playlet_num}
                          className="flex items-center justify-between rounded-md p-1.5 hover:bg-muted"
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`srt-${srt.playlet_num}`}
                              checked={selectedSrtIds.includes(srt.playlet_num)}
                              onCheckedChange={() => handleSelectSrt(srt.playlet_num)}
                              disabled={!srt.file} // Disable if no file link
                            />
                            <Label
                              htmlFor={`srt-${srt.playlet_num}`}
                              className={`text-sm ${!srt.file ? "text-muted-foreground italic" : ""}`}
                            >
                              第 {srt.playlet_num} 集 {!srt.file ? "(无链接)" : ""}
                            </Label>
                          </div>
                          {/* Add individual download button back */}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleExportSingleSrt(srt)}
                            disabled={!srt.file}
                            aria-label={`下载第 ${srt.playlet_num} 集`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {selectedLanguage
                      ? "该语言下没有找到字幕文件。"
                      : "请先选择语言。"}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import">
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="language-select-import" className="w-20">
                  目标语言:
                </Label>
                <Select
                  value={selectedLanguage || ""}
                  onValueChange={setSelectedLanguage}
                >
                  <SelectTrigger
                    id="language-select-import"
                    className="flex-grow"
                  >
                    <SelectValue placeholder="选择要导入到的语言" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Allow selecting any potential language, maybe fetch full list? */}
                    {/* For now, using languages from srt_list */}
                    {languages.length > 0 ? (
                      languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        无可用语言
                      </SelectItem>
                    )}
                    {/* TODO: Consider adding an option for 'New Language' or fetching all supported languages */}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="srt-file-import">选择SRT文件:</Label>
                <Input 
                  id="srt-file-import" 
                  type="file" 
                  accept=".srt" 
                  multiple 
                  onChange={handleFileChange} 
                  className="cursor-pointer"
                />
                {/* Display selected file names */}
                <div className="mt-2 text-sm text-muted-foreground">
                  {filesToImport && filesToImport.length > 0 ? (
                    <ScrollArea className="h-[150px] w-full rounded-md border p-2">
                      <p className="mb-1 font-medium text-foreground">已选择 {filesToImport.length} 个文件:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {Array.from(filesToImport).map((file, index) => (
                          <li key={index} title={file.name} className="truncate">
                            {file.name}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <p>请选择一个或多个 SRT 文件进行导入。</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              取消
            </Button>
          </DialogClose>
          {activeTab === "import" && (
            <Button
              type="button"
              onClick={handleImportTranslatedSrts}
              disabled={
                !filesToImport ||
                filesToImport.length === 0 ||
                !selectedLanguage
              }
            >
              <Upload className="mr-1 h-4 w-4" />
              导入并更新 ({filesToImport?.length ?? 0})
            </Button>
          )}
          {activeTab === "export" && (
            <Button
              type="button"
              onClick={handleExportSelectedSrts} // <-- Use the updated handler
              disabled={selectedSrtIds.length === 0 || !selectedLanguage}
            >
              <Download className="mr-1 h-4 w-4" />
              导出选中 ({selectedSrtIds.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TranslationSrtModal;
