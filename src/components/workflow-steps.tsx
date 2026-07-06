import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Check,
  Loader2,
  ChevronRight,
  User,
  Bot,
  Video,
  FileText,
  ListChecks,
  Globe,
  Languages,
  CheckCircle,
  Clock,
  Code,
  Database,
  Cpu,
  Zap,
  Server,
  Download,
  Upload,
  FileUp,
  CircleCheck,
  Circle,
  CircleDashed,
  FileDown,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import taskService from "@/services/task-service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input"; // Already likely imported
import { List } from "lucide-react"; // For listing selected files
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area"; // Optional, but recommended
import workflowService from "@/services/workflow-service";
import workflowTool from "@/services/workflow-tool";
import { TaskType } from "@/services/task-service";
import TranslationSrtModal from "./translation-srt-modal";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { setTimeout } from "timers";
import * as XLSX from "xlsx";

// 字幕结构定义
export type Subtitle = {
  id: string;
  startTime: string; // 格式 "00:00:00,000"
  endTime: string; // 格式 "00:00:00,000"
  text: string;
};

// 翻译结果结构定义
export type TranslationResult = {
  id: string;
  startTime: string; // 格式 "00:00:00,000"
  endTime: string; // 格式 "00:00:00,000"
  originalText: string; // 原文内容
  translatedText: string; // 翻译内容
  language: string; // 翻译语言，如"英语"、"日语"等
  episode: number; // 集数，如1、2、3等
};

// 执行链路项类型
export type ExecutionLogItem = {
  id: string;
  stepId: string;
  timestamp: Date;
  message: string;
  type: "command" | "info" | "result" | "warning" | "error";
  progress?: number; // 百分比进度，0-100
};

// 工作流步骤状态类型
type StepStatus = "not-started" | "in-progress" | "completed" | "error";

// 工作流步骤类型
export type WorkflowStep = {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  result?: string;
  substeps?: ProcessSubstep[];
  subtitles?: Subtitle[]; // 添加字幕数组
  subtitleSets?: {
    id: string;
    name: string;
    subtitles: Subtitle[];
    originalIndex: number;
  }[]; // 添加字幕集合数组
  localizationData?: LocalizationData; // 添加本土化数据字段
  translationResults?: TranslationResult[]; // 添加翻译结果字段
  icon: React.ReactNode;
  content?: string;
  executionLogs?: ExecutionLogItem[]; // 添加执行链路记录
  progress?: number; // 当前步骤总体进度，0-100
};

// 处理子步骤类型
export type ProcessSubstep = {
  id: string;
  description: string;
  status: "waiting" | "processing" | "completed" | "error";
  timeEstimate?: string;
};

// 本土化实体类型
export type LocalizationEntity = {
  id: string;
  原文: string;
  本土化: string;
  注释: string;
};

// 本土化角色类型（多个有关联的实体）
export type LocalizationCharacter = {
  name: string;
  entities: LocalizationEntity[];
};

// 本土化数据类型
export type LocalizationData = {
  角色: Record<string, LocalizationEntity[]>;
  地名: LocalizationEntity[];
  组织名: LocalizationEntity[];
  文化相关: LocalizationEntity[];
};

// 定义日志类型 (如果尚未在别处定义)
// 请根据你的实际文件夹调整 ExecutionLog 类型
interface ExecutionLog {
  id?: string | number;
  timestamp?: Date;
  type?: "command" | "result" | "error" | "info";
  message: string;
  progress?: number; // 假设日志对象可能包含进度
}

// 新组件：用于动态显示步骤日志
const StepLogs = ({
  logs,
  stepProcess,
}: {
  logs?: ExecutionLog[];
  stepProcess?: number;
}) => {
  const [dynamicLogText, setDynamicLogText] = useState("正在处理...");
  // console.log("logs--------------:", logs);

  // 检查步骤是否正在进行中
  const isInProgress =
    typeof stepProcess === "number" && stepProcess > 0 && stepProcess < 100;
  // 检查是否有足够的日志用于动态效果 (至少3条)
  const hasEnoughLogsForEffect = logs && logs.length >= 3;

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    // 仅当步骤在进行中且至少有3条日志时启动定时器
    if (isInProgress && hasEnoughLogsForEffect) {
      // 从 logs 提取 message，去掉前2条和最后1条
      const potentialMessages = logs.slice(2, -1).map((log) => log.message);

      // 如果提取后的数组为空（例如 logs 总数小于等于 3），则使用默认消息
      const messages =
        potentialMessages.length > 0
          ? potentialMessages
          : ["正在处理", "请稍候"]; // 使用更简洁的默认消息

      let messageIndex = 0;
      intervalId = setInterval(() => {
        // 循环显示不同的消息，并添加变化的省略号
        setDynamicLogText(
          messages[messageIndex % messages.length] +
            ".".repeat(1 + (messageIndex % 3))
        );
        messageIndex++;
      }, 800); // 每 800 毫秒更新一次
    } else {
      // 如果不满足条件，重置文本
      setDynamicLogText("正在处理...");
    }

    // 清理函数：组件卸载或依赖变化时清除定时器
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // 依赖项：当步骤进度或日志数量变化时，重新运行 effect
  }, [isInProgress, hasEnoughLogsForEffect]);

  // 如果没有日志，显示提示信息
  if (!logs || logs.length === 0) {
    return <p className="text-xs text-gray-500 italic pl-1">暂无执行日志</p>;
  }

  // 根据是否在进行中决定显示多少条日志
  // 同时，应用现有的过滤逻辑：只显示进度小于等于步骤进度的日志
  const logsToShow = (isInProgress ? logs.slice(0, 3) : logs).filter(
    (log) =>
      typeof log.progress !== "number" ||
      (typeof stepProcess === "number" && log.progress <= stepProcess)
  );

  // 如果过滤后没有日志，也显示提示
  if (logsToShow.length === 0) {
    return (
      <p className="text-xs text-gray-500 italic pl-1">发生部分错误已停止。</p>
    );
  }

  return (
    <>
      {logsToShow.map((log, index) => (
        <div
          // 确保 key 的唯一性，结合 id 或时间戳和索引
          key={log.id || `log-${log.timestamp?.getTime()}-${index}`}
          className="text-xs flex items-start pl-1" // 添加左边距
        >
          <span
            className={`
              text-xs truncate pr-2 block w-full /* Truncate + padding + block */
              ${
                log.type === "command" ? "text-blue-600 dark:text-blue-400" : ""
              }
              ${
                log.type === "result"
                  ? "text-green-600 dark:text-green-400 font-medium"
                  : ""
              }
              ${
                log.type === "error"
                  ? "text-red-600 dark:text-red-400 font-semibold"
                  : ""
              }
              ${
                log.type === "info" || !log.type
                  ? "text-gray-600 dark:text-gray-400"
                  : ""
              }
            `}
            // 添加 title 属性，鼠标悬停时显示完整日志
            title={log.message}
          >
            {/* 当步骤进行中且这是第三条日志(index 2)并且日志足够多时，显示动态文本 */}
            {isInProgress && index === 2 && hasEnoughLogsForEffect
              ? dynamicLogText
              : log.message}
          </span>
        </div>
      ))}
      {/* 如果日志被截断 (因为正在进行中且原日志超过3条)，显示省略号提示 */}
      {/* {isInProgress && logs.length > 3 && logsToShow.length === 3 && (
         <div className="text-xs text-gray-500 pl-1">...</div>
       )} */}
    </>
  );
};

// 生成模拟字幕数据
const generateFakeSubtitles = (count: number, setId: string): Subtitle[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `subtitle-${setId}-${i}`,
    startTime: `00:0${Math.floor(i / 10)}:${(i % 10) * 6}0`,
    endTime: `00:0${Math.floor(i / 10)}:${(i % 10) * 6 + 5}0`,
    text: `这是第 ${i + 1} 条测试字幕，位于视频 ${
      Math.floor(i / 5) + 1
    } 分钟处。`,
  }));
};

let initTranslationLanguage = null;
let initTranslationEpisode = null;

let removeSrtConfirm = false;

// 生成模拟翻译结果数据
const generateFakeTranslationResults = (
  count: number,
  setId: string
): TranslationResult[] => {
  const results: TranslationResult[] = [];

  const originalTexts = [
    "这是一段演示文本，用于测试翻译结果的显示效果。",
    "我们在这里展示的是翻译前的原文内容示例。",
    "原文可能包含多行内容，\n这样可以测试多行显示效果。",
    "这是第四条测试文本，用于演示较长的内容在界面中的表现。这段文字会稍微长一些，以便我们可以看出在有限空间内文本的展示方式。",
    "第五条原文内容，这里可能包含一些专业词汇或特殊术语，例如人工智能、深度学习、计算机视觉等。",
  ];

  const languageMap: Record<string, string[]> = {
    英语: [
      "This is a demo text used to test the display effect of translation results.",
      "Here we show an example of the original content before translation.",
      "The original text may contain multiple lines,\nso we can test the multi-line display effect.",
      "This is the fourth test text, used to demonstrate how longer content performs in the interface. This text will be slightly longer so we can see how text is displayed in a limited space.",
      "The fifth original content, which may contain some professional vocabulary or special terms, such as artificial intelligence, deep learning, computer vision, etc.",
    ],
    日语: [
      "これは翻訳結果の表示効果をテストするためのデモテキストです。",
      "ここでは、翻訳前の原文コンテンツの例を示しています。",
      "原文は複数行のコンテンツを含む場合があります。\nこれにより、複数行の表示効果をテストできます。",
      "これは4番目のテストテキストで、インターフェイスでのより長いコンテンツのパフォーマンスを示すために使用されます。このテキストは少し長くなり、限られたスペースでのテキストの表示方法を確認できます。",
      "5番目のオリジナルコンテンツには、人工知能、ディープラーニング、コンピュータビジョンなど、専門的な語彙や特殊な用語が含まれている場合があります。",
    ],
    法语: [
      "Ceci est un texte de démonstration utilisé pour tester l'effet d'affichage des résultats de traduction.",
      "Nous montrons ici un exemple du contenu original avant traduction.",
      "Le texte original peut contenir plusieurs lignes,\nafin que nous puissions tester l'effet d'affichage multiligne.",
      "Ceci est le quatrième texte de test, utilisé pour démontrer comment un contenu plus long fonctionne dans l'interface. Ce texte sera légèrement plus long pour que nous puissions voir comment le texte s'affiche dans un espace limité.",
      "Le cinquième contenu original, qui peut contenir du vocabulaire professionnel ou des termes spéciaux, tels que l'intelligence artificielle, l'apprentissage profond, la vision par ordinateur, etc.",
    ],
    德语: [
      "Dies ist ein Demotext, der verwendet wird, um den Anzeigeeffekt von Übersetzungsergebnissen zu testen.",
      "Hier zeigen wir ein Beispiel für den ursprünglichen Inhalt vor der Übersetzung.",
      "Der Originaltext kann mehrere Zeilen enthalten,\ndamit wir den mehrzeiligen Anzeigeeffekt testen können.",
      "Dies ist der vierte Testtext, der zeigen soll, wie längere Inhalte in der Benutzeroberfläche dargestellt werden. Dieser Text wird etwas länger sein, damit wir sehen können, wie Text in einem begrenzten Raum angezeigt wird.",
      "Der fünfte Originalinhalt, der einige Fachvokabeln oder spezielle Begriffe enthalten kann, wie künstliche Intelligenz, Deep Learning, Computer Vision usw.",
    ],
  };

  // 可用语言列表
  const languages = Object.keys(languageMap);

  // 生成随机的集数范围，确保覆盖1-80集
  const episodeRanges = [
    { min: 1, max: 20 },
    { min: 21, max: 40 },
    { min: 41, max: 60 },
    { min: 61, max: 80 },
  ];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * originalTexts.length);
    const randomLanguage =
      languages[Math.floor(Math.random() * languages.length)];
    const randomEpisodeRange =
      episodeRanges[Math.floor(Math.random() * episodeRanges.length)];
    const randomEpisode =
      Math.floor(
        Math.random() * (randomEpisodeRange.max - randomEpisodeRange.min + 1)
      ) + randomEpisodeRange.min;

    // 创建随机的时间码
    const hours = Math.floor(Math.random() * 2);
    const minutes = Math.floor(Math.random() * 60);
    const seconds = Math.floor(Math.random() * 60);
    const milliseconds = Math.floor(Math.random() * 1000);

    const startTime = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")},${milliseconds
      .toString()
      .padStart(3, "0")}`;

    // 结束时间比开始时间晚几秒
    const endSeconds = (seconds + 5) % 60;
    const endMinuteIncrement = seconds + 5 >= 60 ? 1 : 0;
    const endMinutes = (minutes + endMinuteIncrement) % 60;
    const endHourIncrement = minutes + endMinuteIncrement >= 60 ? 1 : 0;
    const endHours = hours + endHourIncrement;

    const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes
      .toString()
      .padStart(2, "0")}:${endSeconds
      .toString()
      .padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`;

    results.push({
      id: `${setId}-${i}`,
      startTime,
      endTime,
      originalText: originalTexts[randomIndex],
      translatedText: languageMap[randomLanguage][randomIndex],
      language: randomLanguage,
      episode: randomEpisode,
    });
  }

  return results;
};

// 生成模拟结果文本
const generateFakeResult = (stepTitle: string): string => {
  const results: Record<string, string> = {
    字幕君: "成功从视频中提取字幕，共10条字幕记录。",
    本土文化君: "字幕格式验证通过，准确率评估为98%。",
    翻译君: "翻译完成，保留了原始格式和时间码。",
    剪辑师: "已完成字幕对白同步和长度适配，可以完美匹配视频画面。",
    无情的下载机器: "成功生成双语字幕文件和独立字幕文件，格式为SRT和VTT。",
    文本提取: "成功提取文档中的文本内容，共15页，约5000字。",
    文本分析: "文本分析完成，识别了3种主要文体风格和专业术语库。",
    OCR数据提取: "OCR处理完成，成功识别图像中的文本内容，准确率达95%。",
    翻译结果: "翻译结果已生成，共10条翻译记录。",
    视频压制: "视频压制完成，生成了各语言版本的视频文件。",
    下载成品: "下载链接已生成，点击即可下载各语言版本的成品视频。",
  };
  return results[stepTitle] || `${stepTitle}处理完成！`;
};

// 将字幕转换为SRT格式的字符串
const convertSubtitlesToSrt = (subtitles: Subtitle[]): string => {
  return subtitles
    .map((subtitle, index) => {
      const number = index + 1;
      const timeCode = `${subtitle.startTime} --> ${subtitle.endTime}`;
      const text = subtitle.text;

      return `${number}\n${timeCode}\n${text}`;
    })
    .join("\n\n");
};

// 生成示例本土化数据
const generateSampleLocalizationData = (): LocalizationData => {
  return {
    角色: {
      季凌霄: [
        {
          id: "char-1-1",
          原文: "季凌霄",
          本土化: "Victoria Stone",
          注释: "女性，季氏集团总裁兼掌权人，经营有方，地位显赫，能拒绝楚靖川这样的天之骄子，遭遇暗杀后策划假死，是沈幼宁的表姐，脖子上有颗小红痣",
        },
        {
          id: "char-1-2",
          原文: "凌霄表姐",
          本土化: "Cousin Vicky",
          注释: "亲属称呼",
        },
        {
          id: "char-1-3",
          原文: "凌霄",
          本土化: "Vicky",
          注释: "简称",
        },
      ],
      沈幼宁: [
        {
          id: "char-2-1",
          原文: "沈幼宁",
          本土化: "Emily Parker",
          注释: "女性，楚家少夫人，因与季凌霄相像而嫁入楚家，是季凌霄的表妹，曾被赶出家门导致失明和失忆，被指控给楚怀瑾下药，性格从畏缩变得强势",
        },
        {
          id: "char-2-2",
          原文: "幼宁表妹",
          本土化: "Cousin Emily",
          注释: "亲属称呼",
        },
      ],
    },
    地名: [
      {
        id: "place-1",
        原文: "沈家别墅",
        本土化: "Parker Manor",
        注释: "一处高档住宅区的别墅",
      },
      {
        id: "place-2",
        原文: "楚家",
        本土化: "Blake Estate",
        注释: "楚家所在的宅邸位置",
      },
    ],
    组织名: [
      {
        id: "org-1",
        原文: "季氏集团",
        本土化: "Stone Corporation",
        注释: "一个大型企业集团的具体企业实体",
      },
      {
        id: "org-2",
        原文: "楚家",
        本土化: "The Blake Family",
        注释: "一个显赫的家族组织",
      },
    ],
    文化相关: [
      {
        id: "culture-1",
        原文: "海归",
        本土化: "Overseas returnee",
        注释: "指在国外留学后回国的人员",
      },
      {
        id: "culture-2",
        原文: "家法",
        本土化: "Family discipline",
        注释: "古代家族内部的惩戒规矩，用于管教家族成员的规章制度",
      },
    ],
  };
};

export type ChatMessage = {
  id: string;
  sender: "system" | "user" | "extract_srt";
  content: string;
  timestamp: Date;
  type: "status" | "result" | "info" | "error";
  relatedStep?: string;
  loading?: boolean;
  hasAction?: boolean;
  actionType?: "translate" | "extract" | "localize" | "merge" | string;
  showSubtitles?: boolean;
  showLocalizationData?: boolean;
  showTranslationResults?: boolean;
  showVideoProcessing?: boolean;
  showVideoDownload?: boolean;
  showContactUs?: boolean;
};

// 防抖函数定义 - 限制函数在短时间内多次调用
const debounce = (fn, delay = 300) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

// 全局变量类型声明补充
declare global {
  interface Window {
    __isAddingInitialMessages?: boolean;
  }
}

// 请求状态跟踪缓存
const confirmRequestCache = {};

// 创建包含所有可能的TaskType值的数组，用于调试和参考
const allTaskTypes: TaskType[] = [
  "video_translation", // 视频翻译
  "srt_translation", // 纯SRT翻译
  "video_erasure", // 视频擦除
  "video_extraction", // 视频提取
  "video_merging", // 视频压制
];

// 定时器ID存储，用于在组件外部清除定时器
let refreshTaskDataInterval: NodeJS.Timeout | null = null;

// 是否自动工作流
let autoRun = false;
// 任务类型,默认 video_translation视频任务
let taskType = "video_translation";
// let videoUrlsAnalysisResult = {
//   hasFailedFiles: false,
//   failedFileMessages: ""
// };

// document.addEventListener("visibilitychange", () => {
//   if (document.hidden) {
//     console.log("页面已切换到后台");
//     // 在这里可以执行一些操作，比如暂停视频、停止轮询等
//   } else {
//     console.log("页面已切换回前台");
//     // 在这里可以执行一些操作，比如恢复视频播放、重新开始轮询等
//   }
// });

export function WorkflowSteps() {
  // 添加任务数据状态
  const [taskData, setTaskData] = useState<any>(null);
  // 添加任务ID状态
  const [taskId, setTaskId] = useState<string | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedSrtIds, setSelectedSrtIds] = useState<number[]>([]);
  const [currentOriginSrts, setCurrentOriginSrts] = useState<any[]>([]); // <--- Add new state
  const [filesToImport, setFilesToImport] = useState<FileList | null>(null); // <-- New state for import files
  
  // const [removeSrtConfirm, setRemoveSrtConfirm] = useState(true);
  const [videoUrlsAnalysisResult, setVideoUrlsAnalysisResult] = useState({ hasFailedFiles: true, failedFileMessages: "123" });

  const [isTranslationSrtModalOpen, setIsTranslationSrtModalOpen] =
    useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const linesEndRef = useRef<HTMLDivElement>(null);

  // 假设 origin_srts 在 project prop 中
  const originSrts = useMemo(
    () => currentOriginSrts || [],
    [currentOriginSrts]
  );
  // console.log("originSrts", originSrts);

  // Add this useEffect hook within the WorkflowSteps component body
  useEffect(() => {
    console.log("[useEffect] currentOriginSrts 状态已更新:", currentOriginSrts);
  }, [currentOriginSrts]);

  // 处理非srt文件
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      // Filter for .srt files only (client-side check)
      const srtFiles = Array.from(event.target.files).filter((file) =>
        file.name.toLowerCase().endsWith(".srt")
      );
      if (srtFiles.length !== event.target.files.length) {
        toast.warning("已自动过滤非 SRT 文件。");
      }
      // Create a new FileList-like object (DataTransfer is a common way)
      const dataTransfer = new DataTransfer();
      srtFiles.forEach((file) => dataTransfer.items.add(file));
      setFilesToImport(
        dataTransfer.files.length > 0 ? dataTransfer.files : null
      );
    } else {
      setFilesToImport(null);
    }
  };

  // Helper to extract ID from filename like "xxx_id12345.srt"
  const extractIdFromFilename = (filename: string): number | null => {
    // 匹配 _id<数字>.srt 结尾，忽略大小写
    const match = filename.match(/_id(\d+)\.srt$/i);
    if (match && match[1]) {
      const id = parseInt(match[1], 10);
      if (!isNaN(id)) {
        return id;
      }
    }
    console.error(`无法从文件名中提取有效的 ID: ${filename}`);
    toast.error(`文件名格式无效，无法提取ID: ${filename}`, { duration: 4000 });
    return null;
  };

  // Helper to read file as text using Promise
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === "string") {
          resolve(e.target.result);
        } else {
          reject(new Error(`无法读取文件内容: ${file.name}`));
        }
      };
      reader.onerror = (e) => {
        console.error("FileReader error:", reader.error);
        reject(new Error(`读取文件时出错 ${file.name}`));
      };
      // 指定 UTF-8 编码以确保兼容性
      reader.readAsText(file, "UTF-8");
    });
  };

  // Handler for the import button click
  const handleImportSrts = async () => {
    // <-- Mark as async
    if (!filesToImport || filesToImport.length === 0) {
      toast.warning("请先选择要导入的 SRT 文件。");
      return;
    }

    const filesArray = Array.from(filesToImport); // Convert FileList to Array if needed
    const totalFiles = filesArray.length;
    const toastId = toast.loading(`准备导入 ${totalFiles} 个文件...`);
    let successCount = 0;
    let errorCount = 0;

    // Use for...of loop for async/await compatibility
    for (let i = 0; i < totalFiles; i++) {
      const file = filesArray[i];
      const currentFileNum = i + 1;
      toast(`正在导入文件 ${currentFileNum}/${totalFiles}: ${file.name}`, {
        id: toastId,
      });

      // 1. Extract ID
      const srtId = extractIdFromFilename(file.name);

      if (srtId === null) {
        // extractIdFromFilename already shows a toast error
        console.error(`Skipping file due to invalid ID: ${file.name}`);
        errorCount++;
        continue; // Skip to the next file
      }

      try {
        // 2. Read File Content
        const content = await readFileAsText(file);
        console.log(`准备更新 ID: ${srtId} 来自文件: ${file.name}`);
        // console.log("SRT 内容:", JSON.stringify(content)); // Log content if needed for debugging

        // 3. Call API
        // Make sure workflowService is accessible here
        if (!workflowService) {
          throw new Error("workflowService is not available");
        }
        const response = await workflowService.updateSubtitleContent(
          srtId,
          content,
          taskData?.id
        );

        // 4. Handle API Response (adjust based on actual response structure)
        console.log(`API response for ID ${srtId}:`, response);
        // Assuming success if no error is thrown. Add specific checks if needed.
        // e.g., if (response.code !== 0) throw new Error(response.message);

        toast.success(`成功导入: ${file.name}`, { duration: 2000 });
        successCount++;
      } catch (error: any) {
        console.error(`导入文件 ${file.name} (ID: ${srtId}) 失败:`, error);
        const errorMessage = error?.message || "未知错误";
        // Use specific error from API response if available, e.g., error?.response?.data?.message
        toast.error(`导入失败 ${file.name}: ${errorMessage}`, {
          duration: 4000,
        });
        errorCount++;
      }
    }

    // --- Update final toast ---
    let finalMessage = `导入完成: ${successCount} 个成功`;
    if (errorCount > 0) {
      finalMessage += `, ${errorCount} 个失败`;
    }
    const finalToastType =
      errorCount === 0 ? "success" : successCount > 0 ? "warning" : "error";

    toast.dismiss(toastId); // Dismiss the loading toast first

    // Show a new toast based on the final result
    if (finalToastType === "success") {
      toast.success(finalMessage, { duration: 5000, closeButton: true });
    } else if (finalToastType === "warning") {
      toast.warning(finalMessage, { duration: 5000, closeButton: true });
    } else {
      toast.error(finalMessage, { duration: 5000, closeButton: true });
    }

    // --- Refresh data if needed ---
    if (successCount > 0) {
      console.log("Import successful, attempting to refresh editor data...");
      if (typeof refreshEditorData === "function") {
        refreshEditorData(); // Refresh the editor/subtitle list
      } else {
        console.warn("refreshEditorData function not found.");
        toast.warning("部分字幕已导入，但无法自动刷新列表。");
      }
    }

    // --- Reset file input ---
    // Make sure setFilesToImport exists and is the correct state setter
    if (typeof setFilesToImport === "function") {
      setFilesToImport(null);
    } else {
      console.warn(
        "setFilesToImport function not found, cannot clear file input state."
      );
      // Consider resetting the input element via ref if state setter is unavailable
      // e.g., if (fileInputRef.current) fileInputRef.current.value = '';
    }

    // ---> 添加以下代码来关闭弹窗 <---
    if (typeof setIsExportModalOpen === "function") {
      setIsExportModalOpen(false); // 关闭弹窗
      setEditorData((prev) => ({ ...prev, isOpen: false }));
    } else {
      console.warn(
        "setIsExportModalOpen function not found, cannot close modal automatically."
      );
      toast.info("导入完成，请手动关闭弹窗。");
    }
  };

  // 处理单个选择
  const handleSelectSrt = (id: number, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedSrtIds((prev) => [...prev, id]);
    } else {
      setSelectedSrtIds((prev) => prev.filter((srtId) => srtId !== id));
    }
  };

  // 处理全选
  const handleSelectAllSrts = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedSrtIds(originSrts.map((srt) => srt.id));
    } else {
      setSelectedSrtIds([]);
    }
  };

  // 格式化 SRT 文件名
  const formatSrtFilename = (
    ossKey: string | undefined,
    episodeNum: number | undefined,
    id: number
  ): string => {
    const baseName = ossKey
      ? ossKey
          .split("/")
          .pop()
          ?.replace(/\.(srt|vtt)$/i, "") ?? `字幕_${episodeNum ?? id}`
      : `字幕_${episodeNum ?? id}`;
    return `${baseName}_id${id}.srt`;
  };

  // 触发单个文件下载的辅助函数
  const triggerDownload = async (
    real_url: string,
    url: string,
    ossKey: string | undefined,
    episodeNum: number | undefined,
    id: number
  ) => {
    let urls = real_url || url
    if (!urls) {
      toast.error("文件 URL 无效，无法下载。");
      return;
    }
    const filename = formatSrtFilename(url, episodeNum, id);
    const toastId = toast.loading(`正在下载: ${filename}...`);
    try {
      // ---> 添加以下 fetch 逻辑 <---
      const response = await fetch(urls);
      if (!response.ok) {
        throw new Error(`下载失败 (${response.status} ${response.statusText})`);
      }
      const blob = await response.blob(); // <--- 获取 blob
      // ---> 结束添加 <---

      saveAs(blob, filename); // 现在 blob 变量已定义
      toast.success(`已下载: ${filename}`, { id: toastId });
    } catch (error: any) {
      // <--- 确保捕获 error 并给出类型提示
      console.error("下载失败:", error);
      // 使用 error.message 提供更具体的错误信息
      toast.error(`下载失败: ${filename} (${error.message || "未知错误"})`, {
        id: toastId,
      });
    }
  };

  // 处理导出选择的文件
  const handleExportSelectedSrts = async () => {
    const selectedSrts = originSrts.filter((srt) =>
      selectedSrtIds.includes(srt.id)
    );

    console.log("selectedSrts:", selectedSrts);

    if (selectedSrts.length === 0) {
      toast.info("请至少选择一个文件进行导出。");
      return;
    }

    // --- 单文件下载逻辑 ---
    if (selectedSrts.length === 1) {
      const srt = selectedSrts[0];
      const filename = formatSrtFilename(srt.oss_key, srt.episode_num, srt.id); // <--- 添加 srt.id
      if (!srt.url) {
        toast.error(`文件 ${filename} 没有有效的下载链接。`);
        return;
      }
      console.log("[Export] 单文件下载:", filename);
      // 使用更新后的 triggerDownload 函数
      triggerDownload(srt.real_url, srt.url, srt.oss_key, srt.episode_num, srt.id);
      // 关闭模态框并重置选择 (如果需要)
      // setIsExportModalOpen(false);
      // setSelectedSrtIds([]);
      return;
    }

    // --- 多文件 ZIP 打包逻辑 ---
    const zip = new JSZip();
    const toastId = toast.loading(`正在准备 ${selectedSrts.length} 个文件...`);
    let filesAddedCount = 0;
    let filesSkippedCount = 0;

    try {
      // 使用 for...of 循环以便更好地处理异步和错误
      for (const srt of selectedSrts) {
        const filename = formatSrtFilename(srt.url, srt.episode_num, srt.id); // <--- 添加 srt.id
        console.log(`[Export] 正在处理文件: ${filename}`, srt);
        if (!srt.url) {
          console.warn(`跳过文件 ${filename}: 无有效链接。`);
          toast.warning(`跳过文件 ${filename}：无有效链接。`, {
            duration: 2000,
          });
          filesSkippedCount++;
          continue; // 跳过这个文件
        }
        try {
          toast.info(`正在获取: ${filename}`, {
            id: `fetch-${srt.id}`,
            duration: 5000,
          });
          const response = await fetch(srt.real_url);
          if (!response.ok) {
            throw new Error(
              `下载失败 (${response.status} ${response.statusText})`
            );
          }
          const blob = await response.blob();
          // 将文件添加到 ZIP 中
          zip.file(filename, blob);
          filesAddedCount++;
          toast.dismiss(`fetch-${srt.id}`); // 清除单个文件的获取提示
        } catch (fetchError: any) {
          console.error(`获取文件 ${filename} 出错:`, fetchError);
          toast.error(
            `获取文件 ${filename} 失败: ${fetchError.message || "未知错误"}`,
            { duration: 3000 }
          );
          filesSkippedCount++;
          // 这里选择继续处理其他文件，而不是中断整个过程
        }
      } // end for loop

      // 检查是否有任何文件被成功添加
      if (filesAddedCount === 0) {
        toast.error("未能成功获取任何文件内容，无法生成ZIP包。");
        toast.dismiss(toastId);
        return;
      }

      // 生成 ZIP 文件
      toast.loading(`正在生成 ZIP 文件 (${filesAddedCount}个文件)...`, {
        id: toastId,
      }); // 更新提示
      const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
        // 可选：更新打包进度
        // console.log("压缩进度: " + metadata.percent.toFixed(2) + " %");
        // toast.loading(`正在压缩 ${filesAddedCount} 个文件... ${metadata.percent.toFixed(0)}%`, { id: toastId });
      });

      // 触发下载
      saveAs(content, `导出的字幕_${Date.now()}.zip`);

      let successMessage = `成功导出 ${filesAddedCount} 个文件!`;
      if (filesSkippedCount > 0) {
        successMessage += ` (${filesSkippedCount} 个文件因错误被跳过)`;
      }
      toast.success(successMessage);

      // 关闭模态框并重置选择 (如果需要)
      // setIsExportModalOpen(false);
      // setSelectedSrtIds([]);
    } catch (error: any) {
      console.error("创建或下载 ZIP 文件时出错:", error);
      toast.error(`创建 ZIP 文件失败: ${error.message || "请检查控制台"}`);
    } finally {
      toast.dismiss(toastId); // 确保最终关闭加载提示
    }
  };

  // 处理弹窗打开/关闭状态变化
  const handleModalOpenChange = (open: boolean) => {
    setIsExportModalOpen(open);
    if (!open) {
      // 关闭时清空选项
      setSelectedSrtIds([]);
    }
  };

  // 判断是否所有项都被选中
  const isAllSelected =
    originSrts.length > 0 && selectedSrtIds.length === originSrts.length;
  // 判断是否有部分项被选中
  const isIndeterminate =
    selectedSrtIds.length > 0 && selectedSrtIds.length < originSrts.length;

  // 初始化工作流步骤
  const initializeSteps = () => {
    console.log("初始化工作流步骤");
    // 重置现有的步骤状态，而不是替换整个步骤数组
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        status: "not-started" as const,
        progress: 0,
        executionLogs: [],
        result: undefined,
        subtitles: undefined,
        subtitleSets: undefined,
        localizationData: undefined,
        translationResults: undefined,
      }))
    );
  };

  // 重置工作流的进度和状态
  const resetWorkflowProgress = () => {
    console.log("重置工作流进度和状态");
    // 重置步骤状态
    if (steps && steps.length > 0) {
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          status: "not-started" as const,
          progress: 0,
          executionLogs: [],
          result: undefined,
          subtitles: undefined,
          subtitleSets: undefined,
          localizationData: undefined,
          translationResults: undefined,
        }))
      );
    }
    // 重置当前步骤索引
    setCurrentStepIndex(0);
  };

  // 添加字幕编辑器状态
  const [subtitleEditorData, setSubtitleEditorData] = useState({
    isOpen: false,
    subtitles: [] as Subtitle[],
    relatedStep: "",
  });

  // 添加消息状态
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // 添加系统消息函数
  const addSystemMessage = (
    content: string,
    type: "status" | "result" | "info" | "error" = "info",
    hasAction: boolean = false,
    showSubtitles: boolean = false,
    showLocalizationData: boolean = false,
    showTranslationResults: boolean = false,
    showVideoDownload: boolean = false,
    showContactUs: boolean = false,
    actionType?: "translate" | "extract" | "localize" | "merge" | string,
    relatedStep?: string
  ) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: "system",
      content,
      timestamp: new Date(),
      type,
      hasAction,
      actionType, // 添加操作类型，用于区分不同确认按钮
      relatedStep, // 关联的步骤ID
      showSubtitles,
      showLocalizationData,
      showTranslationResults,
      showVideoDownload,
      showContactUs,
    };

    console.log(
      `添加系统消息: 类型=${type}, 操作类型=${actionType || "无"}, 关联步骤=${
        relatedStep || "无"
      }`
    );
    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  };

  // 确认对话框相关状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmStepId, setConfirmStepId] = useState<string>("");
  const [confirmActionType, setConfirmActionType] = useState<string>("");

  const onTaskUpdate = () => {
    setTranslationEditorData((prev) => ({
      ...prev,
      isOpen: false,
    }));
    refreshEditorData();
  };

  // 监听任务状态更新事件
  useEffect(() => {
    const handleTaskStatusUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { taskId: receivedTaskId, taskData } = customEvent.detail;

      console.log("工作流组件收到任务状态更新事件:", customEvent.detail);
      console.log("任务ID:", receivedTaskId, taskId);
      console.log("任务数据:", taskData);

      // 清空之前任务的消息和状态，避免叠加显示
      if (taskId !== receivedTaskId) {
        console.log("任务已切换，重置消息和工作流状态");

        // 1. 清空所有消息状态
        setMessages([]);

        // 2. 重置对话框相关状态
        setShowConfirmDialog(false);
        setConfirmStepId("");
        setConfirmActionType("");

        // 3. 重置字幕编辑器状态
        setSubtitleEditorData({
          isOpen: false,
          subtitles: [] as Subtitle[],
          relatedStep: "",
        });

        // 4. 重置视频处理数据
        setVideoProcessingData({
          isOpen: false,
          stepId: "",
        });

        // 5. 重置视频下载数据
        setVideoDownloadData({
          isOpen: false,
          stepId: "",
        });

        // 6. 重置当前步骤索引
        setCurrentStepIndex(0);

        // 7. 尝试重置工作流步骤状态（如果存在）
        if (typeof setSteps === "function") {
          // 重置步骤状态到初始值
          initializeSteps();
        } else {
          console.log("无法重置步骤状态，setSteps函数不存在");
        }

        // 8. 重置其他可能存在的状态变量
        // 注意：只尝试重置已确认存在的状态变量
        try {
          if (typeof setChatMessages === "function") {
            setChatMessages([]);
          }
        } catch (e) {
          // 忽略不存在的状态变量错误
        }

        // 9. 重置任务处理进度和状态
        resetWorkflowProgress();

        // 10. 重新添加初始化系统消息，确保有完整的引导消息
        // 添加关键标记，表示正在运行初始化引导消息
        window.__isAddingInitialMessages = true;

        // 使用更长的延迟，确保其他操作已经完成
        setTimeout(() => {
          // 初始化一个空数组，然后依次添加引导消息
          setMessages([]);

          // 添加系统欢迎消息
          const welcomeId = addSystemMessage(
            "欢迎使用Narrator AI视频翻译工作流。该工具集成了字幕OCR识别、本土化处理、翻译和视频压制功能。",
            "info",
            false,
            false,
            false,
            false,
            false,
            undefined,
            "init-guide"
          );
          console.log("添加欢迎消息，ID:", welcomeId);

          // 等待100ms后添加字幕提取消息
          setTimeout(() => {
            const extractId = addSystemMessage(
              "首先进行字幕提取步骤：我们将从视频中自动提取字幕文字，请等待...",
              "status",
              false,
              false,
              false,
              false,
              false,
              undefined,
              "init-guide"
            );
            console.log("添加字幕提取消息，ID:", extractId);

            // 等待100ms后添加数据准备完成消息
            setTimeout(() => {
              const readyId = addSystemMessage(
                "数据准备完成，进入字幕处理流程，根据左侧流程提示依次进行。",
                "info",
                false,
                false,
                false,
                false,
                false,
                undefined,
                "init-guide"
              );
              console.log("添加数据准备完成消息，ID:", readyId);

              // 引导消息全部添加完成，清除标记
              window.__isAddingInitialMessages = false;
              console.log("引导消息全部添加完成");
            }, 100);
          }, 100);
        }, 300); // 增加延迟时间到300毫秒，确保其他操作完成
      }

      localStorage.setItem("currentTaskData", JSON.stringify(taskData));
      
      // 添加real_url字段到origin_srts中的每个对象
      let originSrtsWithUrls = (taskData?.origin_srts || []).map((item: any) => ({
        ...item,
        real_url: item.role_srt ? workflowTool.createSrtFileUrl(item.role_srt) : ''
      }));

      console.log(
        "[fetchTaskData]即将设置currentOriginSrts的值:",
        originSrtsWithUrls
      );
      // 然后设置状态
      setCurrentOriginSrts(originSrtsWithUrls);

      // 保存任务ID
      setTaskId(receivedTaskId);

      // 打印auto_run字段并说明其含义
      console.log(
        "自动化工作流状态 (auto_run):",
        taskData?.auto_run,
        taskData?.auto_run ? "自动化工作流" : "非自动化工作流"
      );
      autoRun = taskData?.auto_run;
      taskType = taskData?.task_type;

      // 如果任务状态为3（已完成），清除定时器
      if (taskData?.status === 3) {
        console.log("任务已完成，清除定时器", taskData?.status);
        if (refreshTaskDataInterval) {
          clearInterval(refreshTaskDataInterval);
          refreshTaskDataInterval = null;
          console.log("定时器已清除");
        }
      }

      // 立即更新steps状态以反映正确的任务类型
      setSteps(getInitialSteps());

      // 解析SRT格式的字幕内容
      const parseSrtContent = (srtContent: string): Subtitle[] => {
        if (!srtContent) return [];

        const subtitles: Subtitle[] = [];
        const blocks = srtContent.trim().split("\n\n");

        blocks.forEach((block, index) => {
          const lines = block.split("\n");
          if (lines.length >= 3) {
            const id = lines[0].trim();
            const timeInfo = lines[1].trim();
            const textLines = lines.slice(2);

            // 解析时间信息 "00:00:20,000 --> 00:00:25,000"
            const timeMatch = timeInfo.match(/([\d:,]+)\s+-->\s+([\d:,]+)/);
            if (timeMatch) {
              const startTime = timeMatch[1];
              const endTime = timeMatch[2];
              const text = textLines.join("\n");

              subtitles.push({
                id: `subtitle-${id}`,
                startTime,
                endTime,
                text,
              });
            }
          }
        });

        return subtitles;
      };

      // 解析字幕数据
      if (taskData?.origin_srts) {
        console.log("原始字幕数据 (origin_srts):", taskData.origin_srts);

        // 如果是字符串，尝试解析JSON
        let srtsData = taskData.origin_srts;
        if (typeof srtsData === "string") {
          try {
            srtsData = JSON.parse(srtsData);
            console.log("解析后的字幕数据:", srtsData);
          } catch (error) {
            console.error("解析origin_srts字符串失败:", error);
            // 如果解析JSON失败，可能是纯文本SRT格式，直接解析
            const parsedSubtitles = parseSrtContent(srtsData);
            if (parsedSubtitles.length > 0) {
              console.log("直接解析SRT文本得到字幕:", parsedSubtitles);
              // 创建字幕集合
              const subtitleSets = [
                {
                  id: "subtitle-set-0",
                  name: "字幕集 1",
                  subtitles: parsedSubtitles,
                  originalIndex: 0,
                },
              ];
              // 更新字幕数据到字幕提取步骤
              setSteps((prev) =>
                prev.map((step) =>
                  step.id === "extract_srt" ? { ...step, subtitleSets } : step
                )
              );
              return;
            }
          }
        }

        // 创建一个新的字幕集合数组，每个子项作为独立的字幕集
        const subtitleSets = [];

        // 如果是数组，处理每一项，但不合并它们
        if (Array.isArray(srtsData)) {
          console.log(`共有 ${srtsData.length} 条字幕数据`);

          // 处理每一个字幕项，但不合并它们
          srtsData.forEach((srtItem, index) => {
            console.log(`处理字幕项 ${index + 1}:`, srtItem);
            let processedSubtitles = [];

            // 如果是字符串，尝试解析为字幕对象
            if (typeof srtItem === "string") {
              processedSubtitles = parseSrtContent(srtItem);
            }

            // 如果是对象，检查是否有role_srt字段
            else if (typeof srtItem === "object" && srtItem !== null) {
              // 检查是否有role_srt字段（基于示例数据结构）
              if (srtItem.role_srt) {
                console.log(
                  `解析role_srt字段，字幕ID: ${srtItem.id}, 当前集数: ${srtItem.num}`
                );
                // 解析role_srt字段中的SRT内容
                const parsedSubtitles = parseSrtContent(srtItem.role_srt);
                // 添加原始数据到解析后的字幕中
                processedSubtitles = parsedSubtitles.map((subtitle) => ({
                  ...subtitle,
                  originalId: srtItem.id,
                  num: srtItem.num,
                }));
              } else if (
                srtItem.id &&
                srtItem.startTime &&
                srtItem.endTime &&
                srtItem.text
              ) {
                // 如果已经是标准字幕格式，直接添加
                processedSubtitles = [srtItem];
              }
            }

            // 只有当处理后的字幕不为空时，才添加到字幕集合中
            if (processedSubtitles.length >= 0) {
              // 保存原始的id和num字段，重命名为origin_id和origin_name
              subtitleSets.push({
                id: `subtitle-set-${index}`,
                name: `字幕集 ${srtItem.num}`,
                origin_id: srtItem.id || null, // 保留原始id
                origin_name: srtItem.num || null, // 保留原始num作为name
                subtitles: processedSubtitles,
                originalIndex: index,
              });
            }
          });

          console.log("处理后的字幕集合:", subtitleSets);
        }

        localStorage.setItem("subtitleSets", JSON.stringify(subtitleSets));

        if (taskType === "video_translation") {
          processStep("extract_srt");
        } else {
          processStep("localize_terms");
        }
      }

      // 从taskData.srt_list解析翻译结果数据并更新translate_subtitle步骤
      if (
        taskData?.srt_list &&
        typeof taskData.srt_list === "object" &&
        Object.keys(taskData.srt_list).length > 0
      ) {
        console.log("检测到srt_list数据，解析翻译结果...");

        // 检查是否有原文字幕数据
        console.log(
          "原文字幕数据 (origin_srts) 类型:",
          typeof taskData.origin_srts
        );
        console.log("原文字幕数据 (origin_srts):", taskData.origin_srts);

        let originSrts = [];
        if (taskData.origin_srts) {
          // 如果origin_srts是字符串，尝试解析为JSON
          if (typeof taskData.origin_srts === "string") {
            try {
              originSrts = JSON.parse(taskData.origin_srts);
              console.log("成功解析origin_srts字符串为数组:", originSrts);
            } catch (error) {
              console.error("解析origin_srts字符串失败:", error);
              // 如果无法解析为JSON，可能是SRT文本格式，尝试将其包装为数组项
              originSrts = [
                {
                  num: "1",
                  srt_content: taskData.origin_srts,
                },
              ];
              console.log("将origin_srts字符串包装为数组项:", originSrts);
            }
          } else if (Array.isArray(taskData.origin_srts)) {
            // 如果已经是数组，直接使用
            originSrts = taskData.origin_srts;
            console.log(
              "使用现有的origin_srts数组，共",
              originSrts.length,
              "项:"
            );
            console.log("数组第一项示例:", originSrts[0]);
          } else if (
            typeof taskData.origin_srts === "object" &&
            taskData.origin_srts !== null
          ) {
            // 如果是对象，尝试将其转换为数组
            const objKeys = Object.keys(taskData.origin_srts);
            console.log("尝试将origin_srts对象转为数组，对象键:", objKeys);

            if (objKeys.length > 0) {
              try {
                // 尝试不同的解析方式
                originSrts = objKeys.map((key) => ({
                  num: key,
                  srt_content:
                    typeof taskData.origin_srts[key] === "string"
                      ? taskData.origin_srts[key]
                      : JSON.stringify(taskData.origin_srts[key]),
                }));
                console.log("将origin_srts对象转换为数组:", originSrts);
              } catch (error) {
                console.error("将origin_srts对象转换为数组失败:", error);
              }
            }
          }
        } else {
          console.log("未找到可用的srt_list数据，不更新翻译结果");
        }
      }

      // 更新任务数据状态
      setTaskData(taskData);
    };

    // 注册任务状态更新事件监听器
    window.addEventListener("taskStatusUpdated", handleTaskStatusUpdate);

    // 清理函数
    return () => {
      window.removeEventListener("taskStatusUpdated", handleTaskStatusUpdate);
    };
  }, []);

  // console.log("workflow-steps.tsx 渲染完成, tasktype:", taskData?.task_type);

  // 根据任务类型定义不同的初始步骤
  const getInitialSteps = () => {
    // console.log("getInitialSteps: ", taskData?.task_type, taskType);
    // 使用全局变量 taskType 来保持一致性
    if (taskType === "srt_translation") {
      return [
        {
          id: "localize_terms",
          title: "本土文化君",
          description: "让内容自然地跨越文化边界",
          status: "not-started",
          icon: <Globe className="h-5 w-5 text-purple-500" />,
          localizationData: generateSampleLocalizationData(), // 预先为测试添加本土化数据
          executionLogs: [], // 添加执行链路记录
          progress: 0, // 添加进度
        },
        {
          id: "translate_subtitle",
          title: "翻译君",
          description: "精心打磨每一个译文",
          status: "not-started",
          icon: <Languages className="h-5 w-5 text-green-500" />,
          translationResults: generateFakeTranslationResults(
            10,
            "translate_subtitle"
          ), // 预先为测试添加翻译结果
          executionLogs: [], // 添加执行链路记录
          progress: 0, // 添加进度
        },
      ];
    } else {
      // 默认视频翻译或其他任务类型
      return [
        {
          id: "extract_srt",
          title: "字幕君",
          description: "捕捉图像中的每一个文字痕迹",
          status: "not-started",
          icon: <FileText className="h-5 w-5 text-blue-500" />,
          subtitles: generateFakeSubtitles(8, "extract_srt"), // 预先为测试添加字幕
          executionLogs: [], // 添加执行链路记录
          progress: 0, // 添加进度
        },
        {
          id: "localize_terms",
          title: "本土文化君",
          description: "让内容自然地跨越文化边界",
          status: "not-started",
          icon: <Globe className="h-5 w-5 text-purple-500" />,
          localizationData: generateSampleLocalizationData(), // 预先为测试添加本土化数据
          executionLogs: [], // 添加执行链路记录
          progress: 0, // 添加进度
        },
        {
          id: "translate_subtitle",
          title: "翻译君",
          description: "精心打磨每一个译文",
          status: "not-started",
          icon: <Languages className="h-5 w-5 text-green-500" />,
          translationResults: generateFakeTranslationResults(
            10,
            "translate_subtitle"
          ), // 预先为测试添加翻译结果
          executionLogs: [], // 添加执行链路记录
          progress: 0, // 添加进度
        },
        {
          id: "video_rendering",
          title: "剪辑师",
          description: "确保成品安全送达",
          status: "not-started",
          icon: <Video className="h-5 w-5 text-orange-500" />,
          content: "", // 用于存储下载链接
          executionLogs: [], // 添加执行链路记录
          progress: 0, // 添加进度
        },
      ];
    }
  };

  // 将steps状态提到外部，避免条件渲染引起的问题
  const [steps, setSteps] = useState<WorkflowStep[]>(getInitialSteps());

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
  ]);

  // 这个 Effect 会在消息列表更新后执行滚动操作
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    linesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // 注意：你需要将下面的 [messages] 替换为实际驱动消息列表更新的那个 state 或 prop
    // 例如，如果你的消息数据在一个名为 `steps` 的 prop 中，就用 [steps]
  }, [chatMessages]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // 字幕编辑器状态
  const [editorData, setEditorData] = useState<{
    isOpen: boolean;
    subtitles: Subtitle[];
    subtitleSets?: {
      id: string;
      name: string;
      subtitles: Subtitle[];
      originalIndex: number;
    }[];
    currentSetId?: string | null;
    relatedStep: string | null;
  }>({
    isOpen: false,
    subtitles: [],
    subtitleSets: [],
    currentSetId: null,
    relatedStep: null,
  });

  // 本土化编辑器状态
  const [localizationEditorData, setLocalizationEditorData] = useState<{
    isOpen: boolean;
    data: LocalizationData;
    allLanguagesData: Record<string, LocalizationData>; // 存储所有语言的本土化数据
    availableLanguages: string[]; // 可用的语言列表
    currentLanguage: string; // 当前选择的语言
    relatedStep: string | null;
  }>({
    isOpen: false,
    data: {
      角色: {},
      地名: [],
      组织名: [],
      文化相关: [],
    },
    allLanguagesData: {}, // 所有语言的本土化数据
    availableLanguages: [], // 可用的语言列表
    currentLanguage: "", // 当前选择的语言
    relatedStep: null,
  });

  // 解析SRT内容的辅助函数
  const parseSrtContent = (
    srtString: string
  ): Array<{
    startTime: string;
    endTime: string;
    originalText?: string;
    translatedText?: string;
    text?: string;
  }> => {
    if (!srtString || typeof srtString !== "string") {
      return [];
    }

    const entries: Array<{
      startTime: string;
      endTime: string;
      originalText?: string;
      translatedText?: string;
      text?: string;
    }> = [];

    try {
      // 按双空行分割SRT内容获取每个字幕条目
      const srtBlocks = srtString
        .split(/\n\s*\n/)
        .filter((block) => block.trim());

      srtBlocks.forEach((block) => {
        const lines = block.split("\n").filter((line) => line.trim());

        // SRT格式通常是：序号、时间码、内容(可能多行)
        if (lines.length >= 2) {
          // 跳过第一行（序号）
          // 解析时间码行
          const timeCodeLine = lines[1];
          const timeCodeMatch = timeCodeLine.match(
            /([\d:,]+)\s*-->\s*([\d:,]+)/
          );

          if (timeCodeMatch) {
            const startTime = timeCodeMatch[1];
            const endTime = timeCodeMatch[2];

            // 提取文本内容（可能有多行）
            const contentLines = lines.slice(2);
            const text = contentLines.join("\n");

            entries.push({
              startTime,
              endTime,
              originalText: text, // 原始文本
              translatedText: text, // 初始时翻译文本与原文相同
              text: text, // 兼容其他可能的命名
            });
          }
        }
      });
    } catch (error) {
      console.error("解析SRT内容时出错:", error);
    }

    return entries;
  };

  // 从taskData.srt_list解析翻译结果数据
  const parseTranslationResultsFromSrtList = (
    srtList: any,
    originSrts?: any[]
  ): TranslationResult[] => {
    if (!srtList || typeof srtList !== "object") {
      console.log("无可用的srt_list数据解析");
      return [];
    }

    // srt_list是一个对象，键是语言，值是字幕数组
    console.log(
      "开始从taskData.srt_list解析翻译结果，语言:",
      Object.keys(srtList)
    );

    if (Object.keys(srtList).length !== 0) {
      initTranslationLanguage = Object.keys(srtList)[0] || null;
      console.log(
        "初始化翻译语言为initTranslationLanguage:",
        initTranslationLanguage
      );
    }

    // 缓存原文数据，以集数为键进行索引
    const originalContentMap: Record<
      string,
      Array<{ startTime: string; endTime: string; text: string }>
    > = {};

    // 如果提供了原文字幕，先解析并缓存
    if (originSrts && Array.isArray(originSrts)) {
      console.log(`解析原文字幕数据，共${originSrts.length}项:`, originSrts);

      initTranslationEpisode = originSrts[0].num || null;
      console.log("initTranslationEpisode:", initTranslationEpisode);

      originSrts.forEach((srtItem: any, index: number) => {
        console.log(`处理原文字幕项 ${index + 1}:`, srtItem);

        if (srtItem && typeof srtItem === "object") {
          // 提取集数，注意不同的字段名称
          const num = srtItem.num || srtItem.playlet_num || "1";
          console.log(`原文字幕集数: ${num}`);

          // 提取内容，检查所有可能的字段名
          let srtContent = "";
          if (srtItem.srt_content) {
            srtContent = srtItem.srt_content;
            console.log("使用srt_content字段作为原文内容");
          } else if (srtItem.content) {
            srtContent = srtItem.content;
            console.log("使用content字段作为原文内容");
          } else if (srtItem.role_srt) {
            srtContent = srtItem.role_srt;
            console.log("使用role_srt字段作为原文内容");
          }

          console.log(
            `原文内容类型: ${typeof srtContent}, 内容长度: ${
              srtContent ? srtContent.length : 0
            }`
          );
          console.log("原文内容样例:", srtContent?.substring(0, 100));

          if (srtContent) {
            // 解析SRT内容
            const entries = parseSrtContent(srtContent);
            console.log(`原文字幕解析结果: 共${entries.length}条`);

            if (entries.length > 0) {
              // 以集数为键存储原文条目
              originalContentMap[num] = entries.map((entry) => ({
                startTime: entry.startTime,
                endTime: entry.endTime,
                text: entry.text || entry.originalText || "",
              }));

              console.log(`成功解析第${num}集原文字幕，共${entries.length}条`);
              console.log("第一条原文条目示例:", entries[0]);
            } else {
              console.log(`警告: 第${num}集原文字幕解析结果为空`);
            }
          } else {
            console.log(`错误: 找不到第${num}集原文字幕的内容`);
          }
        } else {
          console.log("警告: 原文字幕项不是有效的对象");
        }
      });

      // 检查原文内容是否成功解析
      const numKeys = Object.keys(originalContentMap);
      console.log(
        `原文内容缓存结果: 共${numKeys.length}集, 集数列表:`,
        numKeys
      );

      // 打印每个集数的条目数
      numKeys.forEach((num) => {
        console.log(
          `第${num}集原文条目数量: ${originalContentMap[num].length}`
        );
      });
    } else {
      console.log("未提供原文字幕数据或数据格式不正确");
    }

    const parsedResults: TranslationResult[] = [];

    // 遍历每个语言
    Object.entries(srtList).forEach(([languageName, srtItems]) => {
      console.log(
        `处理${languageName}语言的翻译数据，共${
          Array.isArray(srtItems) ? srtItems.length : 0
        }项`
      );

      // 确保是数组
      if (Array.isArray(srtItems)) {
        // 遍历该语言下的所有字幕项
        srtItems.forEach((srtItem: any, index: number) => {
          // 确保字幕项包含必要字段
          if (srtItem && typeof srtItem === "object") {
            // 提取集数信息（playlet_num或episode字段）
            const episode = srtItem.playlet_num || srtItem.episode || "1";
            const episodeNum = episode.toString();

            // 提取内容
            const content = srtItem.content || srtItem.srt_content || "";

            console.log(`解析${languageName}语言第${episodeNum}集字幕内容`);

            // 解析SRT内容，提取字幕项
            const srtEntries = parseSrtContent(content);
            console.log(`从内容中解析出${srtEntries.length}条字幕条目`);

            // 获取当前集数的原文内容
            const originalEntries = originalContentMap[episodeNum] || [];
            console.log(
              `从原文字幕中解析出${originalEntries.length}条字幕条目`
            );

            // 将每个字幕项转换为翻译结果
            srtEntries.forEach((entry, entryIndex) => {
              // 尝试找到对应的原文
              const originalEntry = originalEntries[entryIndex] || {};

              parsedResults.push({
                id: `srt-${languageName}-${episodeNum}-${entryIndex}`,
                startTime: entry.startTime,
                endTime: entry.endTime,
                // 优先使用原文导入的数据，如果没有就用当前条目的数据
                originalText: originalEntry.text || entry.originalText || "",
                translatedText: entry.translatedText || entry.text || "",
                language: languageName,
                episode: parseInt(episodeNum, 10),
              });
            });
          }
        });
      }
    });

    console.log(`从srt_list成功解析出${parsedResults.length}条翻译结果数据`);
    return parsedResults;
  };

  // 将翻译结果转换回SRT格式并更新taskData.srt_list
  const updateTaskSrtList = (translationResults: TranslationResult[]) => {
    if (!taskData || !taskData.srt_list || !Array.isArray(taskData.srt_list))
      return;

    // 按语言和集数分组翻译结果
    const resultsByLangAndEpisode = translationResults.reduce<
      Record<string, Record<number, TranslationResult[]>>
    >((groups, result) => {
      const lang = result.language;
      const episode = result.episode;

      if (!groups[lang]) groups[lang] = {};
      if (!groups[lang][episode]) groups[lang][episode] = [];

      groups[lang][episode].push(result);
      return groups;
    }, {});

    // 遍历taskData.srt_list，更新匹配的项
    taskData.srt_list.forEach((srtItem: any, index: number) => {
      if (srtItem && typeof srtItem === "object") {
        const language = srtItem.target_lang || srtItem.language || "";
        const episode = parseInt(
          srtItem.playlet_num || srtItem.episode || "1",
          10
        );

        // 如果有匹配的翻译结果，更新内容
        if (
          resultsByLangAndEpisode[language] &&
          resultsByLangAndEpisode[language][episode]
        ) {
          const matchingResults = resultsByLangAndEpisode[language][episode];

          // 排序结果（基于开始时间）确保顺序正确
          matchingResults.sort((a, b) => {
            return a.startTime.localeCompare(b.startTime);
          });

          // 将结果转换为SRT格式字符串
          const srtContent = matchingResults
            .map((result, idx) => {
              return `${idx + 1}\n${result.startTime} --> ${result.endTime}\n${
                result.translatedText
              }`;
            })
            .join("\n\n");

          // 更新srt_list中的内容
          srtItem.content = srtContent;
          srtItem.srt_content = srtContent; // 兼容不同的字段名

          console.log(
            `已更新srt_list[${index}]的内容，语言:${language}, 集数:${episode}`
          );
        }
      }
    });
  };

  // 翻译结果编辑器状态
  const [translationEditorData, setTranslationEditorData] = useState<{
    isOpen: boolean;
    translationResults: TranslationResult[];
    relatedStep: string | null;
    // 当前选择的语言和集数（与translationEditor组件中使用的属性名保持一致）
    selectedLanguage?: string;
    selectedEpisode?: number;
    // 可用的语言和集数列表
    availableLanguages?: string[];
    availableEpisodes?: number[];
  }>({
    isOpen: false,
    translationResults: [],
    relatedStep: null,
  });

  // 视频压制处理组件状态
  const [videoProcessingData, setVideoProcessingData] = useState<{
    isOpen: boolean;
    stepId: string | null;
  }>({
    isOpen: false,
    stepId: null,
  });

  // 视频下载组件状态
  const [videoDownloadData, setVideoDownloadData] = useState<{
    isOpen: boolean;
    stepId: string | null;
  }>({
    isOpen: false,
    stepId: null,
  });

  // 翻译编辑器数据变更时，更新相关步骤的数据
  useEffect(() => {
    if (
      translationEditorData.relatedStep &&
      translationEditorData.translationResults.length > 0
    ) {
      console.log(
        `更新步骤 ${translationEditorData.relatedStep} 的翻译结果:`,
        translationEditorData.translationResults.length
      );

      setSteps((prev) =>
        prev.map((step) =>
          step.id === translationEditorData.relatedStep
            ? {
                ...step,
                translationResults: translationEditorData.translationResults,
                status:
                  step.status === "not-started" ? "in-progress" : step.status,
              }
            : step
        )
      );
    }
  }, [translationEditorData]);

  // 生成网盘链接
  const handleGenerateNetdiskLink = async () => {
    try {
      if (!taskId) {
        toast.error("任务ID不存在，无法生成网盘链接");
        return;
      }
      const result = await taskService.createBaiduUrl(taskId);
      console.log(result);
      if (result.success) {
        toast.success("百度分享任务已提交，等待转存")
      }
    } catch (error) {
      toast.error("生成网盘链接失败: ");
    }
  }

  // 保存翻译字幕到服务器
  const handleSaveTranslations = async () => {
    try {
      if (!taskId) {
        toast.error("任务ID不存在，无法保存翻译字幕");
        return;
      }

      // 先触发编辑器组件的保存操作，确保最新的编辑内容被存储到父组件
      const editorSaveButton = document.querySelector(
        ".translation-editor-save-button"
      ) as HTMLButtonElement;
      if (editorSaveButton) {
        console.log("触发翻译编辑器的保存按钮");
        editorSaveButton.click();
      }

      // 等待微秒，确保状态更新
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 获取当前编辑器中的翻译结果
      const translationResults = translationEditorData.translationResults;
      console.log("翻译编辑器中的翻译结果:", translationResults);

      if (translationResults.length === 0) {
        toast.warning("没有翻译结果可保存");
        return;
      }

      // 显示加载提示
      const loadingToast = toast.loading("正在保存翻译字幕...");

      // 从翻译结果中提取可用的语言和集数作为备选
      const availableLanguages = Array.from(
        new Set(translationResults.map((result) => result.language))
      ).sort();

      const availableEpisodes = Array.from(
        new Set(translationResults.map((result) => result.episode))
      ).sort((a, b) => a - b);

      // 获取当前选择的语言和集数，使用编辑器组件中使用的selectedLanguage和selectedEpisode属性
      const currentLanguage =
        translationEditorData.selectedLanguage ||
        (availableLanguages.length > 0 ? availableLanguages[0] : "未知语言");
      const currentEpisode =
        translationEditorData.selectedEpisode ||
        (availableEpisodes.length > 0 ? availableEpisodes[0] : 1);

      console.log(
        `翻译编辑器选择: 语言=${
          translationEditorData.selectedLanguage || "未选择"
        }, 集数=${translationEditorData.selectedEpisode || "未选择"}`
      );
      console.log(
        `可用语言和集数: 语言=[${availableLanguages.join(
          ", "
        )}], 集数=[${availableEpisodes.join(", ")}]`
      );
      console.log(`最终使用: 语言=${currentLanguage}, 集数=${currentEpisode}`);

      // 筛选当前选中的语言和集数的翻译结果
      const selectedResults = translationResults.filter((result) => {
        const resultLanguage = result.language || "未知语言";
        const resultEpisode = result.episode || 1;
        return (
          resultLanguage === currentLanguage && resultEpisode === currentEpisode
        );
      });

      if (selectedResults.length === 0) {
        toast.dismiss(loadingToast);
        toast.warning(
          `未找到语言为"${currentLanguage}"且集数为${currentEpisode}的翻译结果`
        );
        return;
      }

      // 生成SRT格式内容
      let srtContent = "";
      selectedResults
        .sort((a, b) => {
          // 按时间顺序排序
          const timeA = a.startTime.replace(",", ".");
          const timeB = b.startTime.replace(",", ".");
          return timeA.localeCompare(timeB);
        })
        .forEach((result, index) => {
          srtContent += `${index + 1}\n`;
          srtContent += `${result.startTime} --> ${result.endTime}\n`;
          srtContent += `${result.translatedText}\n\n`;
        });

      // 发送保存请求
      const params = {
        playlet_num: currentEpisode.toString(),
        type: "srt", // 类型为翻译字幕数据
        content: srtContent, // SRT格式内容
        target_lang: currentLanguage, // 目标语言
      };

      console.log(
        `[翻译字幕] 保存第${currentEpisode}集${currentLanguage}字幕数据:`,
        params
      );

      // 发送保存请求
      const result = await taskService.updateTaskContent(taskId, params);

      // 关闭加载提示
      toast.dismiss(loadingToast);

      // 检查结果
      if (!result.success) {
        toast.error("保存翻译字幕失败: " + (result.message || "未知错误"));
      } else {
        // 更新步骤状态
        if (translationEditorData.relatedStep) {
          setSteps((prev) =>
            prev.map((step) =>
              step.id === translationEditorData.relatedStep
                ? {
                    ...step,
                    translationResults:
                      translationEditorData.translationResults,
                    status:
                      step.status === "not-started"
                        ? "in-progress"
                        : step.status,
                  }
                : step
            )
          );
          console.log(
            `更新步骤 ${translationEditorData.relatedStep} 的翻译结果数据`
          );
        }

        // 添加成功提示
        toast.success("翻译字幕已成功保存到服务器");
        addSystemMessage("翻译字幕已成功保存到服务器", "success");

        // 关闭编辑器弹窗
        setTranslationEditorData((prev) => ({ ...prev, isOpen: false }));

        refreshEditorData();
      }
    } catch (error) {
      console.error("保存翻译字幕时出错:", error);
      toast.error("保存翻译字幕失败，请查看控制台日志");
    }
  };

  // 执行链路显示组件
  const ExecutionLogs = ({ steps }: { steps: WorkflowStep[] }) => {
    // 计算总体进度
    const calculateOverallProgress = () => {
      const completedSteps = steps.filter(
        (step) => step.status === "completed"
      ).length;
      const inProgressSteps = steps.filter(
        (step) => step.status === "in-progress"
      );

      if (inProgressSteps.length === 0) {
        // 直接按已完成步骤比例计算
        return (completedSteps / steps.length) * 100;
      } else {
        // 已完成步骤 + 当前进行中步骤的贡献
        const completedContribution = (completedSteps / steps.length) * 100;
        const inProgressContribution =
          inProgressSteps.reduce((sum, step) => sum + (step.progress || 0), 0) /
          steps.length;
        return completedContribution + inProgressContribution;
      }
    };

    // 获取当前正在执行的步骤
    const currentExecutingStep = steps.find(
      (step) => step.status === "in-progress"
    );

    // 格式化时间
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    // 自定义状态标签样式
    const getBadgeVariant = (status: StepStatus) => {
      switch (status) {
        case "completed":
          return "outline" as const;
        case "in-progress":
          return "default" as const;
        case "error":
          return "destructive" as const;
        default:
          return "outline" as const;
      }
    };

    // 获取状态文本
    const getStatusText = (status: StepStatus) => {
      switch (status) {
        case "completed":
          return "已完成";
        case "in-progress":
          return "进行中";
        case "error":
          return "错误";
        default:
          return "等待中";
      }
    };

    // 获取进度图标
    const getProgressIcon = (step: WorkflowStep) => {
      if (step.status === "completed") {
        return <CircleCheck className="h-5 w-5 text-green-500" />;
      } else if (step.status === "in-progress") {
        // 进度小于25%展示不同的图标
        if ((step.progress || 0) < 25) {
          return (
            <div className="relative">
              <CircleDashed className="h-5 w-5 text-blue-500" />
              <div className="absolute -bottom-5 left-0 right-0 text-center text-xs font-semibold text-blue-600">
                {Math.round(step.progress || 0)}%
              </div>
            </div>
          );
        }
        // 进度在25%-75%之间展示不同的图标
        else if ((step.progress || 0) < 75) {
          return (
            <div className="relative">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <div className="absolute -bottom-5 left-0 right-0 text-center text-xs font-semibold text-blue-600">
                {/* {Math.round(step.progress || 0)}% */}
              </div>
            </div>
          );
        }
        // 进度超过75%展示不同的图标
        else {
          return (
            <div className="relative">
              <div className="h-5 w-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
              </div>
              <div className="absolute -bottom-5 left-0 right-0 text-center text-xs font-semibold text-blue-600">
                {Math.round(step.progress || 0)}%
              </div>
            </div>
          );
        }
      } else if (step.status === "error") {
        return <Circle className="h-5 w-5 text-red-500" />;
      } else {
        return <Circle className="h-5 w-5 text-gray-300" />;
      }
    };

    return (
      <div className="flex flex-col h-full border-l">
        <div className="p-2 border-b bg-gray-50 dark:bg-gray-800">
          <h3 className="text-sm font-semibold mb-1">执行链路与进度</h3>
          <div className="flex items-center gap-2">
            <Progress value={calculateOverallProgress()} className="flex-1" />
            <span className="text-xs font-medium">
              {Math.round(calculateOverallProgress())}%
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="relative">
                {/* 左侧进度指示器 */}
                <div className="absolute left-0 top-0 flex flex-col items-center">
                  <div className="mb-1">{getProgressIcon(step)}</div>
                  {step.status !== "not-started" &&
                    step.status !== "completed" && (
                      <div className="h-full w-0.5 bg-blue-200 mt-1"></div>
                    )}
                </div>

                {/* 步骤主体内容 */}
                <div className="ml-6 pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="scale-75">{step.icon}</span>
                      <h4 className="font-medium text-xs">{step.title}</h4>
                    </div>
                    <Badge
                      variant={getBadgeVariant(step.status)}
                      className={`
                        text-xs py-0 px-1.5
                        ${
                          step.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : ""
                        }
                        ${
                          step.status === "in-progress"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : ""
                        }
                      `}
                    >
                      {getStatusText(step.status)}
                    </Badge>
                  </div>

                  <StepLogs
                    logs={step.executionLogs}
                    stepProcess={step.progress}
                  />
                </div>
              </div>
            ))}
          </div>
          <div ref={linesEndRef} />
        </div>
      </div>
    );
  };

  // 已在前面定义了addSystemMessage函数，这里不需要重复定义

  // 更新消息加载状态
  const updateMessageLoadingState = (messageId: string, loading: boolean) => {
    setChatMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, loading } : msg))
    );
  };

  // 处理步骤模拟函数
  const processStep = (stepId: string) => {
    console.log(
      "处理步骤 processStep-------------------------------------------------------------------------------:",
      stepId
    );

    let taskData = localStorage.getItem("currentTaskData");
    taskData = taskData ? JSON.parse(taskData) : {};

    let subtitleSets = localStorage.getItem("subtitleSets");
    subtitleSets = subtitleSets ? JSON.parse(subtitleSets) : {};

    const currentStep = steps.find((step) => step.id === stepId);
    if (!currentStep) return;

    // 更新步骤状态，重置进度
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? {
              ...step,
              status: "in-progress" as const,
              progress: 0,
              executionLogs: [], // 清空执行日志，为新的执行过程做准备
            }
          : step
      )
    );

    // 确定下一个步骤用于后续调度
    const currentIndex = steps.findIndex((step) => step.id === stepId);
    const nextStep =
      currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;

    // 添加系统指令消息，系统@当前角色
    const loadingMessageId = `loading-${Date.now()}-${Math.floor(
      Math.random() * 1000
    )}`;
    addSystemMessage(
      `@${currentStep.title} 系统指令：请开始执行任务，处理相关内容。`,
      "info",
      "system",
      true,
      loadingMessageId
    );

    // 获取执行命令列表
    const executionCommands = generateExecutionCommands(stepId);
    const totalCommands = executionCommands.length;

    // 启动执行链路模拟
    let commandIndex = 0;

    // 完成步骤处理
    const finishStepProcessing = () => {
      // 更新加载消息状态
      updateMessageLoadingState(loadingMessageId, false);

      // 添加最终进度100%的执行日志
      addExecutionLog(stepId, "处理完成！", "result", 100);
      updateStepProgress(stepId, 100);

      // 如果是OCR提取步骤，生成字幕数据
      if (currentStep.title.includes("字幕君")) {
        const subtitles = generateFakeSubtitles(10, currentStep.id);

        // 更新步骤状态和字幕数据
        setSteps((prev) =>
          prev.map((step) =>
            step.id === stepId
              ? {
                  ...step,
                  status: "completed" as const,
                  subtitles,
                  result: generateFakeResult(step.title),
                  progress: 100,
                }
              : step
          )
        );

        // 添加结果消息 - 角色向系统汇报
        addSystemMessage(
          `@系统 ${currentStep.title}汇报：成功捕捉到所有文字痕迹，共提取${subtitles.length}条字幕内容。`,
          "result",
          currentStep.id
        );

        // welcome---1
        const confirmMessage0: ChatMessage = {
          id: `welcome-${Date.now()}`,
          sender: "system",
          content: `欢迎使用Narrator助手，我将开始为您工作。`,
          timestamp: new Date(),
          type: "info",
          relatedStep: "system", // 这里改为system，表示是系统消息
        };
        setChatMessages((prev) => [...prev, confirmMessage0]);
        // 字幕君---1
        const confirmMessage1: ChatMessage = {
          id: `welcome-${Date.now()}-1`,
          sender: "system",
          content: `@字幕君 请开始执行任务，处理相关内容。`,
          timestamp: new Date(),
          type: "info",
          relatedStep: "system", // 这里改为system，表示是系统消息
        };
        setChatMessages((prev) => [...prev, confirmMessage1]);
        // 字幕君---2
        const confirmMessage2: ChatMessage = {
          id: `welcome-${Date.now()}-2`,
          sender: "system",
          content: `收到，已经开始处理，正在进行视频字幕擦除和字幕提取工作，请耐心等待...`,
          timestamp: new Date(),
          type: "info",
          relatedStep: "extract_srt", // 这里改为system，表示是系统消息
        };
        setChatMessages((prev) => [...prev, confirmMessage2]);

        // 检查task_flows中的字幕提取状态
        const extractSrtFlow = taskData.task_flows?.find(
          (flow) => flow.flow_type === "extract_srt"
        );
        const removeSrtFlow = taskData.task_flows?.find(
          (flow) => flow.flow_type === "remove_srt"
        );
        const localizeTermsFlow = taskData.task_flows?.find(
          (flow) => flow.flow_type === "localize_terms"
        );
        console.log("字幕提取流程状态:", extractSrtFlow, removeSrtFlow);
        console.log("-------------自动工作流-----------------:", autoRun, removeSrtFlow.status, localizeTermsFlow.status, removeSrtFlow.confirm_status, removeSrtConfirm);

        if (removeSrtFlow.status === 2 && removeSrtFlow.confirm_status === 0 && localizeTermsFlow.status === 0 && removeSrtFlow.file_failed.length) {
          console.log("进入擦除失败状态---", removeSrtFlow.file_failed.length);
          autoRun = false;
          removeSrtConfirm = false;
          let failMessage = `其中失败${removeSrtFlow.file_failed.length}集`
          let filenames = removeSrtFlow.file_failed.map(item => {
            const parts = item.file.split('/');
            return parts[parts.length - 1]; // 获取路径的最后一部分作为文件名
          });
        
          failMessage += `（${filenames.join('、')}）`;
          // 系统响应并@用户确认
          const confirmMessage1: ChatMessage = {
            id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sender: "system",
            content: `@用户 ${currentStep.title}已完成全部视频字幕擦除工作。${failMessage}，请确认是否继续。`,
            timestamp: new Date(),
            type: "error",
            relatedStep: "system", // 这里改为system，表示是系统消息
            hasAction: true,
            showSubtitles: false, // 标记显示字幕编辑界面
            actionType: "removesrt",
          };
          setChatMessages((prev) => [...prev, confirmMessage1]);
        } else {
          removeSrtConfirm = true;
        }

        // 根据字幕提取状态处理
        if (extractSrtFlow) {
          console.log("removeSrtConfirm:", removeSrtConfirm);
          if (extractSrtFlow.status === 3) {
            // 字幕君---3 失败
            // 系统响应
            const confirmMessage: ChatMessage = {
              id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              sender: "system",
              content: `哎呀，发生了一点小错误，任务失败，如需帮助，联系我们`,
              timestamp: new Date(),
              type: "info",
              relatedStep: "system",
              hasAction: true,
              showContactUs: false, // 联系我们组件
              actionType: "null",
            };
            setChatMessages((prev) => [...prev, confirmMessage]);
            // 3=失败
            // 更新字幕君步骤的数据
            setSteps((prev) =>
              prev.map((step) =>
                step.id === "extract_srt"
                  ? {
                      ...step,
                      status: "error",
                      progress: 0,
                    }
                  : step
              )
            );
          }
          // 字幕提取已完成（status=2）
          if (extractSrtFlow.status === 2 && removeSrtConfirm && removeSrtFlow.status === 2) {
            console.log("字幕提取已完成，可以编辑字幕");

            // 字幕君---3
            const confirmMessage3: ChatMessage = {
              id: `welcome-${Date.now()}-3`,
              sender: "system",
              content: `@系统 成功从视频获取所有文字痕迹，已提取所有字幕内容。`,
              timestamp: new Date(),
              type: "info",
              relatedStep: "extract_srt", // 这里改为system，表示是系统消息
            };
            setChatMessages((prev) => [...prev, confirmMessage3]);

            if (removeSrtFlow.confirm_status === 1 && removeSrtConfirm) {
              let failMessage = `其中失败${removeSrtFlow.file_failed.length}集`
              let filenames = removeSrtFlow.file_failed.map((item: any) => {
                const parts = item.file.split('/');
                return parts[parts.length - 1]; // 获取路径的最后一部分作为文件名
              });
            
              failMessage += `（${filenames.join('、')}）`;
              // 系统响应并@用户确认
              const confirmMessage1: ChatMessage = {
                id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                sender: "system",
                content: `@用户 ${currentStep.title}已完成全部视频字幕擦除工作。${failMessage}，请确认是否继续。`,
                timestamp: new Date(),
                type: "error",
                relatedStep: "system", // 这里改为system，表示是系统消息
                hasAction: true,
                showSubtitles: false, // 标记显示字幕编辑界面
                actionType: "",
              };
              setChatMessages((prev) => [...prev, confirmMessage1]);

              setChatMessages((prev) => [
                ...prev,
                {
                  id: `user-${Date.now()}-${Math.floor(
                    Math.random() * 1000
                  )}`,
                  sender: "user",
                  content: `我已确认「${'字幕擦除'}」的结果，请继续下一步`,
                  timestamp: new Date(),
                  type: "info",
                },
              ]);
            }

            let analyzeResult = workflowTool.analyzeOriginSrts(taskData?.origin_srts)
            if (!autoRun) {
              if (analyzeResult.hasEmptyFiles) {
                autoRun = false;
                // 提取的原字幕存在空文件
                // 系统响应并@用户确认
                const confirmMessage: ChatMessage = {
                  id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  sender: "system",
                  content: `@用户 ${currentStep.title}已完成字幕提取工作。${analyzeResult.emptyFileMessages}，请确认继续。`,
                  timestamp: new Date(),
                  type: "error",
                  relatedStep: "system", // 这里改为system，表示是系统消息
                  hasAction: true,
                  showSubtitles: true, // 标记显示字幕编辑界面
                  actionType: "extract",
                };
                setChatMessages((prev) => [...prev, confirmMessage]);
              } else {
                // 系统响应并@用户确认
                const confirmMessage: ChatMessage = {
                  id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  sender: "system",
                  content: `@用户 ${currentStep.title}已完成字幕提取工作。请审核这些提取的字幕内容，满意后请确认继续。`,
                  timestamp: new Date(),
                  type: "info",
                  relatedStep: "system", // 这里改为system，表示是系统消息
                  hasAction: true,
                  showSubtitles: true, // 标记显示字幕编辑界面
                  actionType: "extract",
                };
                setChatMessages((prev) => [...prev, confirmMessage]);
              }
            } else {
              if (analyzeResult.hasEmptyFiles) {
                autoRun = false;
                // 提取的原字幕存在空文件
                // 系统响应并@用户确认
                const confirmMessage: ChatMessage = {
                  id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  sender: "system",
                  content: `@用户 ${currentStep.title}已完成字幕提取工作。${analyzeResult.emptyFileMessages}，请确认继续。`,
                  timestamp: new Date(),
                  type: "error",
                  relatedStep: "system", // 这里改为system，表示是系统消息
                  hasAction: true,
                  showSubtitles: true, // 标记显示字幕编辑界面
                  actionType: "extract",
                };
                setChatMessages((prev) => [...prev, confirmMessage]);
              }
            }

            // 先更新字幕数据到字幕提取步骤，保存所有字幕集
            setSteps((prev) => {
              // 创建更新后的步骤数组
              const updatedSteps = prev.map((step) =>
                step.id === "extract_srt" ? { ...step, subtitleSets } : step
              );

              // 从更新后的步骤中获取字幕集合
              const updatedStep = updatedSteps.find(
                (s) => s.id === "extract_srt"
              );
              const currentStepSubtitleSets = updatedStep?.subtitleSets || [];
              console.log("更新后的字幕集合:", currentStepSubtitleSets);

              // 如果有字幕集合，使用第一个字幕集作为初始显示
              const initialSubtitleSet =
                currentStepSubtitleSets.length > 0
                  ? currentStepSubtitleSets[0]
                  : null;
              const initialSubtitles = initialSubtitleSet
                ? initialSubtitleSet.subtitles
                : [];
              // 创建一个空的字幕数组变量，防止未定义错误
              const subtitles = initialSubtitles;

              // 准备字幕编辑数据，但不自动打开弹窗
              setSubtitleEditorData({
                isOpen: false, // 不自动打开
                subtitles: initialSubtitles,
                subtitleSets: currentStepSubtitleSets,
                currentSetId: initialSubtitleSet?.id || null,
                relatedStep: "extract_srt",
              });

              // 打印调试信息
              console.log("设置字幕编辑数据:", {
                subtitles: initialSubtitles,
                subtitleSets: currentStepSubtitleSets,
                currentSetId: initialSubtitleSet?.id || null,
                relatedStep: "extract_srt",
              });

              // 添加一条消息，提示用户可以编辑字幕
              const messageId = addSystemMessage(
                '字幕提取已完成，您可以点击"编辑字幕"按钮进行编辑。',
                "info",
                true, // 有操作按钮
                true, // 显示字幕编辑按钮
                false, // 不显示本土化数据
                false, // 不显示翻译结果
                false // 不显示视频下载
              );

              return updatedSteps;
            });

            // 注意：这部分代码已经移动到上面的setSteps回调函数中
            // 这里不需要重复执行

            // 更新字幕提取步骤状态为已完成
            // 注意：这里不需要再设置 subtitles，因为已经在上面的setSteps中设置了subtitleSets
            setSteps((prev) =>
              prev.map((step) =>
                step.id === "extract_srt"
                  ? {
                      ...step,
                      status: "completed",
                      progress: 100,
                    }
                  : step
              )
            );

            // rory 字幕提取已完成
            // 更新当前步骤为已完成//
            const localizeTermsFlow = taskData.task_flows?.find(
              (flow) => flow.flow_type === "localize_terms"
            );
            console.log(
              "字幕提取已完成，此时本土文化君工作流状态:",
              localizeTermsFlow
            );
            //   processStep("extract_srt");
            if (localizeTermsFlow.status != "0") {
              const currentStep = steps[currentStepIndex];
              if (currentStep) {
                setSteps((prev) =>
                  prev.map((step) =>
                    step.id === currentStep.id
                      ? { ...step, status: "completed" as const }
                      : step
                  )
                );

                // 添加用户消息
                if (!autoRun) {
                  setChatMessages((prev) => [
                    ...prev,
                    {
                      id: `user-${Date.now()}-${Math.floor(
                        Math.random() * 1000
                      )}`,
                      sender: "user",
                      content: `我已确认「${currentStep.title}」的结果，请继续下一步`,
                      timestamp: new Date(),
                      type: "info",
                    },
                  ]);
                }

                // 系统提醒本土化君，开始工作
                const confirmMessage: ChatMessage = {
                  id: `welcome-${Date.now()}-4`,
                  sender: "system",
                  content: autoRun
                    ? `@本土君 字幕君已完成，请开始执行任务`
                    : `@本土君 用户已确认，请开始执行任务`,
                  timestamp: new Date(),
                  type: "info",
                  relatedStep: "system", // 这里改为system，表示是系统消息
                };
                setChatMessages((prev) => [...prev, confirmMessage]);
                // 本土君---1
                const confirmMessage1: ChatMessage = {
                  id: `welcome-${Date.now()}-5`,
                  sender: "system",
                  content: `别催，我已经在处理...`,
                  timestamp: new Date(),
                  type: "info",
                  relatedStep: "localize_terms", // 这里改为system，表示是系统消息
                };
                setChatMessages((prev) => [...prev, confirmMessage1]);

                // 自动进入下一步骤处理
                const nextStepIndex = currentStepIndex + 1;
                if (nextStepIndex < steps.length) {
                  // 更新当前步骤索引
                  setCurrentStepIndex(nextStepIndex);
                  // 获取下一步骤信息
                  const nextStep = steps[nextStepIndex];
                  // 添加引导消息
                  addSystemMessage(
                    `现在开始「${nextStep.title}」。${nextStep.description}`,
                    "info"
                  );
                  console.log(
                    `现在开始「${nextStep.title}」。${nextStep.description}`,
                    "info"
                  );
                  // 自动开始处理下一步骤
                  // setTimeout(() => {
                  processStep(nextStep.id);
                  // }, 1000);
                } else {
                  // 所有步骤已完成
                  addSystemMessage("所有处理步骤已完成！", "info");
                }
              }
            }
            // rory 字幕提取已完成
          }
          // 字幕提取进行中（status=1）
          else if (extractSrtFlow.status === 1) {
            console.log("字幕提取进行中...");

            // 创建一个空的字幕数组，防止未定义错误
            const emptySubtitles: Subtitle[] = [];

            // 更新字幕提取步骤状态为进行中
            setSteps((prev) =>
              prev.map((step) =>
                step.id === "extract_srt"
                  ? {
                      ...step,
                      subtitles: emptySubtitles,
                      status: "in-progress",
                      progress: 50, // 设置一个中间进度值
                    }
                  : step
              )
            );

            // 添加一条消息，提示字幕提取进行中
            addSystemMessage(
              "字幕提取正在进行中，请稍候...",
              "status",
              false, // 无操作按钮
              false, // 不显示字幕编辑按钮
              false, // 不显示本土化数据
              false, // 不显示翻译结果
              false // 不显示视频下载
            );
          }
          // 字幕提取未开始（status=0）
          else if (extractSrtFlow.status === 0) {
            console.log("字幕提取未开始");

            // 更新字幕提取步骤状态为未开始
            setSteps((prev) =>
              prev.map((step) =>
                step.id === "extract_srt"
                  ? {
                      ...step,
                      status: "not-started",
                      progress: 0,
                    }
                  : step
              )
            );

            // 添加一条消息，提示字幕提取未开始
            addSystemMessage(
              "字幕提取尚未开始。",
              "info",
              false, // 无操作按钮
              false, // 不显示字幕编辑按钮
              false, // 不显示本土化数据
              false, // 不显示翻译结果
              false // 不显示视频下载
            );
          }
        } else {
          console.log("未找到字幕提取流程");

          // 如果没有找到字幕提取流程，检查是否有字幕数据
          // 先获取当前的OCR提取步骤
          const ocrStep = steps.find((step) => step.id === "extract_srt");
          const existingSubtitles = ocrStep?.subtitles || [];

          // 如果有字幕数据，允许编辑
          if (existingSubtitles.length > 0) {
            setSubtitleEditorData({
              isOpen: false,
              subtitles: existingSubtitles,
              relatedStep: "extract_srt",
            });

            // 添加一条消息，提示可以编辑字幕
            addSystemMessage(
              '检测到字幕数据，您可以点击"编辑字幕"按钮进行编辑。',
              "info",
              true, // 有操作按钮
              true, // 显示字幕编辑按钮
              false, // 不显示本土化数据
              false, // 不显示翻译结果
              false // 不显示视频下载
            );
          }
        }
      } else if (currentStep.title.includes("本土文化君")) {
        // 检查task_flows中的本土文化君状态
        // 注意：这里将本土文化君状态检查移到了origin_srts条件块外部
        // 确保无论是否有字幕数据，都会执行本土文化君的状态检查
        // let taskData = localStorage.getItem('currentTaskData');
        // taskData = taskData ? JSON.parse(taskData) : {};
        const localizeTermsFlow = taskData?.task_flows?.find(
          (flow: any) => flow.flow_type === "localize_terms"
        );
        console.log("本土文化君工作流状态:", localizeTermsFlow);

        // 获取当前步骤的本土化数据
        const currentLocalizationData = steps.find(
          (s) => s.id === "localize_terms"
        )?.localizationData;

        // 更新步骤状态
        setSteps((prev) =>
          prev.map((step) =>
            step.id === stepId
              ? {
                  ...step,
                  status: "completed" as const,
                  // 使用已存在的本土化数据（如果有），否则才使用示例数据
                  localizationData:
                    currentLocalizationData || generateSampleLocalizationData(),
                  progress: 100,
                }
              : step
          )
        );

        console.log(
          "处理本土文化君步骤，使用的数据:",
          currentLocalizationData || "示例数据"
        );

        // 添加结果消息 - 角色向系统汇报
        addSystemMessage(
          `@系统 ${currentStep.title}汇报：已完成所有文本的本土化分析，文化元素已准备就绪。`,
          "result",
          currentStep.id
        );

        console.log("taskType：", taskType);
        if (taskType === "srt_translation") {
          // welcome---1
          const confirmMessage0: ChatMessage = {
            id: `welcome-${Date.now()}`,
            sender: "system",
            content: `欢迎使用Narrator助手，我将开始为您工作。`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "system", // 这里改为system，表示是系统消息
          };
          setChatMessages((prev) => [...prev, confirmMessage0]);
          // 本土君---1
          const confirmMessage1: ChatMessage = {
            id: `welcome-${Date.now()}-12`,
            sender: "system",
            content: `@本土君 请开始执行任务，处理相关内容。`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "system", // 这里改为system，表示是系统消息
          };
          setChatMessages((prev) => [...prev, confirmMessage1]);
          // 本土君---2
          const confirmMessage2: ChatMessage = {
            id: `welcome-${Date.now()}-13`,
            sender: "system",
            content: `别催，我已经在处理...`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "localize_terms", // 这里改为system，表示是系统消息
          };
          setChatMessages((prev) => [...prev, confirmMessage2]);
        }

        if (localizeTermsFlow.status === 3) {
          // 本土化---3 失败
          // 系统响应
          const confirmMessage: ChatMessage = {
            id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sender: "system",
            content: `哎呀，发生了一点小错误，任务失败，如需帮助，联系我们`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "system",
            hasAction: true,
            showContactUs: true, // 联系我们组件
            actionType: "null",
          };
          setChatMessages((prev) => [...prev, confirmMessage]);
          // 3=失败
          // 更新本土化步骤的数据
          setSteps((prev) =>
            prev.map((step) =>
              step.id === "localize_terms"
                ? {
                    ...step,
                    status: "error",
                    progress: 0,
                  }
                : step
            )
          );
        }

        if (localizeTermsFlow.status === 2) {
          // 本土君---2
          const confirmMessage2: ChatMessage = {
            id: `welcome-${Date.now()}-6`,
            sender: "system",
            content: `@系统 成功获得术语清单，并匹配最新词库。`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "localize_terms", // 这里改为system，表示是系统消息
          };
          setChatMessages((prev) => [...prev, confirmMessage2]);
          if (!autoRun) {
            // 系统响应并@用户确认
            const confirmMessage: ChatMessage = {
              id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              sender: "system",
              content: `@用户 ${currentStep.title}已完成本土化清单准备。请审核这些本土化内容，满意后请确认继续。`,
              timestamp: new Date(),
              type: "info",
              relatedStep: "system",
              hasAction: true,
              showLocalizationData: true, // 标记显示本土化数据编辑界面
              actionType: "localize",
            };
            setChatMessages((prev) => [...prev, confirmMessage]);
          }
        }
        // else if (localizeTermsFlow.status === 1) {
        //   const confirmMessage: ChatMessage = {
        //     id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        //     sender: "system",
        //     content: `@用户 ${currentStep.title}正在解析本土化清单。请耐心等候...`,
        //     timestamp: new Date(),
        //     type: "info",
        //     relatedStep: "system",
        //     hasAction: true,
        //     showLocalizationData: false, // 标记显示本土化数据编辑界面
        //   };
        //   setChatMessages((prev) => [...prev, confirmMessage]);
        // }

        if (localizeTermsFlow) {
          console.log(
            "本土文化君工作流status类型:",
            typeof localizeTermsFlow.status
          );
          console.log("本土文化君工作流status值:", localizeTermsFlow.status);

          // 根据本土文化君工作流状态更新本土文化君步骤
          // status: 0=未开始，1=进行中，2=已完成
          if (localizeTermsFlow.status == 2) {
            // 已完成
            console.log("本土文化君工作流已完成");

            // 如果有本土化数据，更新本土化内容
            if (taskData.localized_map) {
              try {
                // 尝试解析本土化数据
                // 解析本土化数据，localized_map结构是按语言分类的对象
                const rawData =
                  typeof taskData.localized_map === "string"
                    ? JSON.parse(taskData.localized_map)
                    : taskData.localized_map;

                console.log("原始本土化数据结构:", rawData);

                // 检查rawData是否是有效对象
                if (rawData && typeof rawData === "object") {
                  // 获取所有可用语言
                  // localized_map格式: { "语言": { "角色": {...}, "地名": [...], ... } }
                  const availableLanguages = Object.keys(rawData);

                  if (availableLanguages.length > 0) {
                    const firstLanguage = availableLanguages[0];
                    const localizationData = rawData[firstLanguage];

                    // 检查本土化数据结构
                    if (
                      localizationData &&
                      typeof localizationData === "object"
                    ) {
                      // 确保数据结构完整
                      const validateData = (data: any): LocalizationData => {
                        const validData: LocalizationData = {
                          角色: data.角色 || {},
                          地名: Array.isArray(data.地名) ? data.地名 : [],
                          组织名: Array.isArray(data.组织名) ? data.组织名 : [],
                          文化相关: Array.isArray(data.文化相关)
                            ? data.文化相关
                            : [],
                        };
                        return validData;
                      };

                      // 创建所有语言的本土化数据映射
                      const allLanguagesData: Record<string, LocalizationData> =
                        {};
                      availableLanguages.forEach((lang) => {
                        if (
                          rawData[lang] &&
                          typeof rawData[lang] === "object"
                        ) {
                          allLanguagesData[lang] = validateData(rawData[lang]);
                        }
                      });

                      // 验证结构化后的本土化数据
                      const validLocalizationData =
                        validateData(localizationData);

                      console.log("可用语言列表:", availableLanguages);
                      console.log("默认使用语言:", firstLanguage);
                      console.log("验证后的本土化数据:", validLocalizationData);
                      console.log("所有语言的本土化数据:", allLanguagesData);

                      // 更新本土化步骤的数据
                      setSteps((prev) =>
                        prev.map((step) =>
                          step.id === "localize_terms"
                            ? {
                                ...step,
                                localizationData: validLocalizationData,
                                allLanguagesData, // 存储所有语言的数据
                                availableLanguages, // 可用的语言列表
                                status: "completed",
                                progress: 100,
                              }
                            : step
                        )
                      );
                      console.log("更新本土化数据:", validLocalizationData);

                      // 设置本土化编辑器数据，包括多语言支持
                      setLocalizationEditorData({
                        isOpen: false,
                        data: validLocalizationData,
                        allLanguagesData,
                        availableLanguages,
                        currentLanguage: firstLanguage,
                        relatedStep: "localize_terms",
                      });

                      // 添加一条消息，提示本土化已完成
                      addSystemMessage(
                        `本土文化元素识别已完成，共支持 ${availableLanguages.length} 种语言，您可以查看本土化数据。`,
                        "info",
                        true, // 有操作按钮
                        false, // 不显示字幕编辑按钮
                        true, // 显示本土化数据
                        false, // 不显示翻译结果
                        false // 不显示视频下载
                      );
                    }
                  }
                }
              } catch (error) {
                console.error("解析本土化数据失败:", error);

                // 添加一条错误消息
                addSystemMessage(
                  "解析本土化数据失败，请检查数据格式。",
                  "error",
                  false, // 无操作按钮
                  false, // 不显示字幕编辑按钮
                  false, // 不显示本土化数据
                  false, // 不显示翻译结果
                  false // 不显示视频下载
                );
              }
            } else {
              console.log("未找到本土化数据");

              // 更新本土化步骤状态为已完成，但没有数据
              setSteps((prev) =>
                prev.map((step) =>
                  step.id === "localize_terms"
                    ? {
                        ...step,
                        status: "completed",
                        progress: 100,
                      }
                    : step
                )
              );

              // 添加一条消息，提示本土化已完成但没有数据
              addSystemMessage(
                "本土文化元素识别已完成，但未找到本土化数据。",
                "info",
                false, // 无操作按钮
                false, // 不显示字幕编辑按钮
                false, // 不显示本土化数据
                false, // 不显示翻译结果
                false // 不显示视频下载
              );
            }

            // rory 本土化已完成
            // 更新当前步骤为已完成
            const translateSubtitleFlow = taskData.task_flows?.find(
              (flow) => flow.flow_type === "translate_subtitle"
            );
            console.log("翻译君工作流状态:", translateSubtitleFlow);
            // const currentStep = steps[currentStepIndex];
            if (translateSubtitleFlow.status != "0") {
              if (currentStep) {
                setSteps((prev) =>
                  prev.map((step) =>
                    step.id === currentStep.id
                      ? { ...step, status: "completed" as const }
                      : step
                  )
                );

                // 添加用户消息
                if (!autoRun) {
                  setChatMessages((prev) => [
                    ...prev,
                    {
                      id: `user-${Date.now()}-${Math.floor(
                        Math.random() * 1000
                      )}`,
                      sender: "user",
                      content: `我已确认「${currentStep.title}」的结果，请继续下一步`,
                      timestamp: new Date(),
                      type: "info",
                    },
                  ]);
                }

                // 系统提醒翻译君，开始工作
                const confirmMessage: ChatMessage = {
                  id: `welcome-${Date.now()}-4`,
                  sender: "system",
                  content: autoRun
                    ? `@翻译君 本土君已完成，请开始执行任务`
                    : `@翻译君 用户已确认，请开始执行任务`,
                  timestamp: new Date(),
                  type: "info",
                  relatedStep: "system", // 这里改为system，表示是系统消息
                };
                setChatMessages((prev) => [...prev, confirmMessage]);
                // 翻译君---1
                const confirmMessage1: ChatMessage = {
                  id: `welcome-${Date.now()}-5`,
                  sender: "system",
                  content: `okay，已经在查字典了...`,
                  timestamp: new Date(),
                  type: "info",
                  relatedStep: "translate_subtitle", // 这里改为system，表示是系统消息
                };
                setChatMessages((prev) => [...prev, confirmMessage1]);

                // 自动进入下一步骤处理
                const nextStepIndex = taskType === "video_translation" ? 2 : 2;
                console.log(
                  "下一步骤索引---:",
                  nextStepIndex,
                  steps.length,
                  steps
                );
                if (nextStepIndex < steps.length) {
                  // 更新当前步骤索引
                  setCurrentStepIndex(nextStepIndex);

                  // 获取下一步骤信息
                  const nextStep = steps[nextStepIndex];

                  // 添加引导消息
                  addSystemMessage(
                    `现在开始「${nextStep.title}」。${nextStep.description}`,
                    "info"
                  );

                  // 自动开始处理下一步骤
                  //   setTimeout(() => {
                  processStep(nextStep.id);
                  //   }, 1000);
                } else {
                  // 所有步骤已完成
                  addSystemMessage("所有处理步骤已完成！", "info");
                }
              }
            }
            // rory 本土化已完成
          } else if (localizeTermsFlow.status == 1) {
            // 进行中
            console.log("本土文化君工作流进行中...");

            // 更新本土化步骤状态为进行中
            setSteps((prev) =>
              prev.map((step) =>
                step.id === "localize_terms"
                  ? {
                      ...step,
                      status: "in-progress",
                      progress: 50, // 设置一个中间进度值
                    }
                  : step
              )
            );

            // 添加一条消息，提示本土化进行中
            addSystemMessage(
              "本土文化元素识别正在进行中，请稍候...",
              "status",
              false, // 无操作按钮
              false, // 不显示字幕编辑按钮
              false, // 不显示本土化数据
              false, // 不显示翻译结果
              false // 不显示视频下载
            );
          } else if (localizeTermsFlow.status == 0) {
            // 未开始
            console.log("本土文化君工作流未开始");

            // 更新本土化步骤状态为未开始
            setSteps((prev) =>
              prev.map((step) =>
                step.id === "localize_terms"
                  ? {
                      ...step,
                      status: "not-started",
                      progress: 0,
                    }
                  : step
              )
            );

            // 添加一条消息，提示本土化未开始
            addSystemMessage(
              "本土文化元素识别尚未开始。",
              "info",
              false, // 无操作按钮
              false, // 不显示字幕编辑按钮
              false, // 不显示本土化数据
              false, // 不显示翻译结果
              false // 不显示视频下载
            );
          }
        }
      } else if (currentStep.title.includes("翻译君")) {
        // 更新步骤状态
        setSteps((prev) =>
          prev.map((step) =>
            step.id === stepId
              ? {
                  ...step,
                  status: "completed" as const,
                  translationResults: generateFakeTranslationResults(
                    10,
                    stepId
                  ),
                  progress: 100,
                }
              : step
          )
        );

        // 添加结果消息 - 角色向系统汇报
        addSystemMessage(
          `@系统 ${currentStep.title}汇报：翻译工作已完成，所有译文都经过精心打磨。`,
          "result",
          currentStep.id
        );

        // 检查task_flows中的翻译君状态
        // let taskData = localStorage.getItem('currentTaskData');
        // taskData = taskData ? JSON.parse(taskData) : {};
        const translateSubtitleFlow = taskData.task_flows?.find(
          (flow) => flow.flow_type === "translate_subtitle"
        );
        console.log(
          "翻译君工作流状态:",
          translateSubtitleFlow,
          autoRun,
          taskType
        );

        if (translateSubtitleFlow.status === 3) {
          // 翻译君---3 失败
          // 系统响应
          const confirmMessage: ChatMessage = {
            id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sender: "system",
            content: `哎呀，发生了一点小错误，任务失败，如需帮助，联系我们`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "system",
            hasAction: true,
            showContactUs: true, // 联系我们组件
            actionType: "null",
          };
          setChatMessages((prev) => [...prev, confirmMessage]);
        }

        if (translateSubtitleFlow.status === 2) {
          // 翻译君---2
          const confirmMessage2: ChatMessage = {
            id: `welcome-${Date.now()}-7`,
            sender: "system",
            content: `@系统 已成功翻译。`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "translate_subtitle", // 这里改为system，表示是系统消息
          };
          setChatMessages((prev) => [...prev, confirmMessage2]);
          if (!autoRun) {
            if (taskType === "video_translation") {
              // console.log('analyzeSrtList---- ', analyzeSrtList(taskData?.srt_list))
              let analyzeSrtListResult = workflowTool.analyzeSrtList(taskData?.srt_list);
              if (analyzeSrtListResult.hasEmptyFiles) {
                autoRun = false;
                const confirmMessage: ChatMessage = {
                  id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  sender: "system",
                  content: `@用户 ${currentStep.title}已完成翻译工作。${analyzeSrtListResult.emptyFileMessages}，请确认继续。`,
                  timestamp: new Date(),
                  type: "error",
                  relatedStep: "system",
                  hasAction: true,
                  showTranslationResults: true, // 标记显示翻译结果编辑界面
                  actionType: "translate",
                };
                setChatMessages((prev) => [...prev, confirmMessage]);
              } else {
                const confirmMessage: ChatMessage = {
                  id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  sender: "system",
                  content: `@用户 ${currentStep.title}已完成翻译工作。请审核这些翻译结果，满意后请确认继续。`,
                  timestamp: new Date(),
                  type: "info",
                  relatedStep: "system",
                  hasAction: true,
                  showTranslationResults: true, // 标记显示翻译结果编辑界面
                  actionType: "translate",
                };
                setChatMessages((prev) => [...prev, confirmMessage]);
              }
            } else {
              // 系统响应并@用户
              const confirmMessage: ChatMessage = {
                id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                sender: "system",
                content: `@用户 ${currentStep.title}已完成翻译工作。您现在可以下载成品视频，或者开始新的翻译工作。请及时下载成品，成品将在14天后失效。`,
                timestamp: new Date(),
                type: "info",
                relatedStep: "system",
                hasAction: true,
                showVideoDownload: true, // 标记显示视频下载组件
                actionType: "localize",
              };
              setChatMessages((prev) => [...prev, confirmMessage]);
            }
          } else {
            if (taskType === "srt_translation") {
              // 系统响应并@用户
              const confirmMessage: ChatMessage = {
                id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                sender: "system",
                content: `@用户 ${currentStep.title}已完成翻译工作。您现在可以下载成品文件，或者开始新的翻译工作。请及时下载成品，成品将在14天后失效。`,
                timestamp: new Date(),
                type: "info",
                relatedStep: "system",
                hasAction: true,
                showVideoDownload: true, // 标记显示文件下载组件
                actionType: "localize",
              };
              setChatMessages((prev) => [...prev, confirmMessage]);
            }
          }
        }

        if (translateSubtitleFlow) {
          console.log(
            "翻译君工作流status类型:",
            typeof translateSubtitleFlow.status
          );
          console.log("翻译君工作流status值:", translateSubtitleFlow.status);

          // 根据本土文化君工作流状态更新本土文化君步骤
          if (translateSubtitleFlow.status == 3) {
            // 3=失败
            // status: 0=未开始，1=进行中，2=已完成
            // 更新翻译君步骤的数据
            setSteps((prev) =>
              prev.map((step) =>
                step.id === "translate_subtitle"
                  ? {
                      ...step,
                      status: "error",
                      progress: 0,
                    }
                  : step
              )
            );
          } else if (translateSubtitleFlow.status == 2) {
            // 已完成
            console.log("翻译君工作流已完成");

            // 更新翻译君步骤的数据
            setSteps((prev) =>
              prev.map((step) =>
                step.id === "translate_subtitle"
                  ? {
                      ...step,
                      status: "completed",
                      progress: 100,
                    }
                  : step
              )
            );
            // rory 翻译已完成
            // 更新当前步骤为已完成
            const videoRenderingFlow = taskData.task_flows?.find(
              (flow) => flow.flow_type === "video_rendering"
            );
            // const currentStep = steps[currentStepIndex];
            if (videoRenderingFlow.status != "0") {
              if (currentStep) {
                setSteps((prev) =>
                  prev.map((step) =>
                    step.id === currentStep.id
                      ? { ...step, status: "completed" as const }
                      : step
                  )
                );

                // 添加用户消息
                if (!autoRun) {
                  setChatMessages((prev) => [
                    ...prev,
                    {
                      id: `user-${Date.now()}-${Math.floor(
                        Math.random() * 1000
                      )}`,
                      sender: "user",
                      content: `我已确认「${currentStep.title}」的结果，请继续下一步`,
                      timestamp: new Date(),
                      type: "info",
                    },
                  ]);
                }

                // 系统提醒剪辑，开始工作
                const confirmMessage: ChatMessage = {
                  id: `welcome-${Date.now()}-8`,
                  sender: "system",
                  content: autoRun
                    ? `@剪辑君 翻译君已完成工作，请开始压制最终成品。`
                    : `@剪辑君 用户已确认，请开始压制最终成品。`,
                  timestamp: new Date(),
                  type: "info",
                  relatedStep: "system", // 这里改为system，表示是系统消息
                };
                setChatMessages((prev) => [...prev, confirmMessage]);
                // 剪辑师---1
                const confirmMessage1: ChatMessage = {
                  id: `welcome-${Date.now()}-9`,
                  sender: "system",
                  content: `正在压制，生成成品...`,
                  timestamp: new Date(),
                  type: "info",
                  relatedStep: "video_rendering", // 这里改为system，表示是系统消息
                };
                setChatMessages((prev) => [...prev, confirmMessage1]);

                // 自动进入下一步骤处理
                const nextStepIndex = 3;
                if (nextStepIndex < steps.length) {
                  // 更新当前步骤索引
                  setCurrentStepIndex(nextStepIndex);

                  // 获取下一步骤信息
                  const nextStep = steps[nextStepIndex];

                  // 添加引导消息
                  addSystemMessage(
                    `现在开始「${nextStep.title}」。${nextStep.description}`,
                    "info"
                  );

                  // 自动开始处理下一步骤
                  //   setTimeout(() => {
                  processStep(nextStep.id);
                  //   }, 1000);
                } else {
                  // 所有步骤已完成
                  addSystemMessage("所有处理步骤已完成！", "info");
                }
              }
            }
            // rory 翻译已完成
          } else if (translateSubtitleFlow.status == 1) {
            // 进行中
            console.log("翻译君工作流进行中...");

            // 更新本土化步骤状态为进行中
            setSteps((prev) =>
              prev.map((step) =>
                step.id === "translate_subtitle"
                  ? {
                      ...step,
                      status: "in-progress",
                      progress: 50, // 设置一个中间进度值
                    }
                  : step
              )
            );

            // 添加一条消息，提示本土化进行中
            addSystemMessage(
              "本土文化元素识别正在进行中，请稍候...",
              "status",
              false, // 无操作按钮
              false, // 不显示字幕编辑按钮
              false, // 不显示本土化数据
              false, // 不显示翻译结果
              false // 不显示视频下载
            );
          } else if (translateSubtitleFlow.status == 0) {
            // 未开始
            console.log("本土文化君工作流未开始");

            // 更新本土化步骤状态为未开始
            setSteps((prev) =>
              prev.map((step) =>
                step.id === "translate_subtitle"
                  ? {
                      ...step,
                      status: "not-started",
                      progress: 0,
                    }
                  : step
              )
            );

            // 添加一条消息，提示本土化未开始
            addSystemMessage(
              "本土文化元素识别尚未开始。",
              "info",
              false, // 无操作按钮
              false, // 不显示字幕编辑按钮
              false, // 不显示本土化数据
              false, // 不显示翻译结果
              false // 不显示视频下载
            );
          }
        }
      } else if (currentStep.title.includes("剪辑师废弃")) {
        const videoRenderingFlow = taskData.task_flows?.find(
          (flow) => flow.flow_type === "video_rendering"
        );

        if (videoRenderingFlow.status === 2) {
          // 更新步骤状态
          setSteps((prev) =>
            prev.map((step) =>
              step.id === stepId
                ? {
                    ...step,
                    status: "completed" as const,
                    result: generateFakeResult(step.title),
                    progress: 100,
                  }
                : step
            )
          );

          // 添加工作状态 - 角色向系统汇报进度
          addSystemMessage(
            `@系统 ${currentStep.title}汇报：正在将字幕与视频进行融合...`,
            "status",
            currentStep.id
          );

          // 添加结果消息 - 角色向系统汇报完成
          addSystemMessage(
            `@系统 ${currentStep.title}汇报：视频压制已完成，字幕与视频已完美融合。`,
            "result",
            currentStep.id
          );

          // 系统调度下一步
          const confirmMessage: ChatMessage = {
            id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sender: "system",
            content: `@${nextStep?.title} 系统指令：请开始准备收纳最终成品，视频压制环节已完成。`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "system",
            showVideoProcessing: false, // 标记显示视频压制组件
          };
          setChatMessages((prev) => [...prev, confirmMessage]);

          // 2秒后自动进入下一步
          //   setTimeout(() => {
          if (currentIndex < steps.length - 1) {
            // 寻找下载步骤
            const downloadStepId = "remove_srt";
            processStep(downloadStepId);
          }
          //   }, 2000);
        } else if (videoRenderingFlow.status === 1) {
          // 更新步骤状态
          setSteps((prev) =>
            prev.map((step) =>
              step.id === stepId
                ? {
                    ...step,
                    status: "completed" as const,
                    result: generateFakeResult(step.title),
                    progress: 50,
                  }
                : step
            )
          );

          // 添加工作状态 - 角色向系统汇报进度
          addSystemMessage(
            `@系统 ${currentStep.title}汇报：正在将字幕与视频进行融合...`,
            "status",
            currentStep.id
          );

          // 添加结果消息 - 角色向系统汇报完成
          addSystemMessage(
            `@系统 ${currentStep.title}汇报：视频压制中~。`,
            "result",
            currentStep.id
          );

          // 系统调度下一步
          // 系统响应并@用户确认
          const confirmMessage: ChatMessage = {
            id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sender: "system",
            content: `@用户 ${currentStep.title}正在爆肝，请多给他一点时间~`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "system",
            showVideoProcessing: false, // 标记显示翻译结果编辑界面
          };
          setChatMessages((prev) => [...prev, confirmMessage]);
        } else {
          console.log("视频压制流程未开始");
        }
      } else if (currentStep.title.includes("剪辑师")) {
        // 添加结果消息 - 角色向系统汇报
        addSystemMessage(
          `@系统 ${currentStep.title}汇报：所有成品已安全打包完毕，文件已准备就绪可供下载。`,
          "result",
          currentStep.id
        );

        const videoRenderingFlow = taskData.task_flows?.find(
          (flow) => flow.flow_type === "video_rendering"
        );

        if (videoRenderingFlow.status === 3) {
          // 剪辑师---3 失败
          // 系统响应
          const confirmMessage: ChatMessage = {
            id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sender: "system",
            content: `哎呀，发生了一点小错误，任务失败，如需帮助，联系我们`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "system",
            hasAction: true,
            showContactUs: true, // 联系我们组件
            actionType: "null",
          };
          setChatMessages((prev) => [...prev, confirmMessage]);
          // 3=失败
          // 更新剪辑师步骤的数据
          setSteps((prev) =>
            prev.map((step) =>
              step.id === "video_rendering"
                ? {
                    ...step,
                    status: "error",
                    progress: 0,
                  }
                : step
            )
          );
        }

        if (videoRenderingFlow && videoRenderingFlow.status === 2) {
          // 更新步骤状态
          setSteps((prev) =>
            prev.map((step) =>
              step.id === stepId
                ? {
                    ...step,
                    status: "completed" as const,
                    result: generateFakeResult(step.title),
                    progress: 100,
                  }
                : step
            )
          );
          // 剪辑师---2
          const confirmMessage2: ChatMessage = {
            id: `welcome-${Date.now()}-11`,
            sender: "system",
            content: `@系统 已成功压制。`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "video_rendering", // 这里改为system，表示是系统消息
          };
          setChatMessages((prev) => [...prev, confirmMessage2]);
          // 系统向用户发送最终通知
          const finalMessage: ChatMessage = {
            id: `final-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sender: "system",
            content: `@用户 工作流程已全部完成！所有角色均已圆满完成各自任务。您现在可以下载成品视频，或者开始新的翻译工作。请及时下载成品，成品将在14天后失效。`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "system",
            showVideoDownload: true, // 标记显示视频下载组件
          };
          setChatMessages((prev) => [...prev, finalMessage]);
        } else if (videoRenderingFlow && videoRenderingFlow.status === 1) {
          // 更新步骤状态
          setSteps((prev) =>
            prev.map((step) =>
              step.id === stepId
                ? {
                    ...step,
                    status: "in-progress" as const,
                    result: generateFakeResult(step.title),
                    progress: 50,
                  }
                : step
            )
          );
        } else {
          // 更新步骤状态
          setSteps((prev) =>
            prev.map((step) =>
              step.id === stepId
                ? {
                    ...step,
                    status: "not-started" as const,
                    result: generateFakeResult(step.title),
                    progress: 0,
                  }
                : step
            )
          );
        }
      } else {
        // 通用步骤处理逻辑
        setSteps((prev) =>
          prev.map((step) =>
            step.id === stepId
              ? {
                  ...step,
                  status: "completed" as const,
                  result: generateFakeResult(step.title),
                  progress: 100,
                }
              : step
          )
        );

        // 添加结果消息 - 角色向系统汇报
        addSystemMessage(
          `@系统 ${currentStep.title}汇报：任务已完成。${generateFakeResult(
            currentStep.title
          )}`,
          "result",
          currentStep.id
        );

        if (currentIndex < steps.length - 1) {
          const nextStepId = steps[currentIndex + 1].id;
          const nextStepTitle = steps[currentIndex + 1].title;

          // 系统调度下一个角色
          const confirmMessage: ChatMessage = {
            id: `confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sender: "system",
            content: `@${nextStepTitle} 系统指令：请开始下一阶段工作。`,
            timestamp: new Date(),
            type: "info",
            relatedStep: "system",
            hasAction: true,
          };
          setChatMessages((prev) => [...prev, confirmMessage]);
        }
      }
    };

    // 模拟执行命令和进度更新
    const executeNextCommand = () => {
      if (commandIndex < totalCommands) {
        const command = executionCommands[commandIndex];
        const progress = Math.min(
          Math.round(((commandIndex + 1) / totalCommands) * 100),
          95
        ); // 保留最后5%给结果生成

        // 添加执行日志
        addExecutionLog(stepId, command, "command", progress);

        // 更新步骤进度
        updateStepProgress(stepId, progress);

        commandIndex++;

        // 继续执行下一条命令
        setTimeout(executeNextCommand, 10); // 随机延迟200-500ms
      } else {
        // 所有命令执行完毕，完成处理
        finishStepProcessing();
      }
    };

    // 开始执行命令
    setTimeout(executeNextCommand, 10);

    // 完成步骤处理
  };

  // 视频压制处理组件
  const VideoProcessingComponent = ({
    stepId,
    onComplete,
  }: {
    stepId: string;
    onComplete: () => void;
  }) => {
    const [processingState, setProcessingState] = useState<
      "waiting" | "processing" | "completed"
    >("waiting");
    const [processProgress, setProcessProgress] = useState(0);
    const [processLogMessages, setProcessLogMessages] = useState<string[]>([]);

    // 模拟视频压制过程
    useEffect(() => {
      if (processingState === "waiting") {
        setProcessingState("processing");
        setProcessLogMessages((prev) => [...prev, "开始视频压制过程..."]);

        // 添加模拟日志
        const languages = ["英语", "日语", "法语", "德语"];
        const logInterval = setInterval(() => {
          const randomLanguage =
            languages[Math.floor(Math.random() * languages.length)];
          setProcessLogMessages((prev) => [
            ...prev,
            `处理${randomLanguage}字幕中...`,
          ]);
        }, 1500);

        // 模拟进度更新
        const progressInterval = setInterval(() => {
          setProcessProgress((prev) => {
            const newProgress = prev + Math.random() * 10;
            if (newProgress >= 100) {
              clearInterval(progressInterval);
              clearInterval(logInterval);
              setProcessingState("completed");
              setProcessLogMessages((prev) => [...prev, "视频压制完成！"]);
              //   setTimeout(() => {
              onComplete();
              //   }, 1000);
              return 100;
            }
            return newProgress;
          });
        }, 800);

        return () => {
          clearInterval(progressInterval);
          clearInterval(logInterval);
        };
      }
    }, [processingState, onComplete]);

    return (
      <div className="space-y-4">
        <div className="bg-secondary/50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">视频压制进度</h3>

          {/* 进度条 */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-1">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${processProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(processProgress)}%</span>
              <span>
                {processingState === "completed" ? "完成" : "处理中..."}
              </span>
            </div>
          </div>

          {/* 处理日志 */}
          <div className="bg-black/90 text-green-400 p-2 rounded font-mono text-xs h-48 overflow-y-auto">
            {processLogMessages.map((log, i) => (
              <div key={`process-log-${i}`} className="mb-1">
                <span className="opacity-50">
                  [{new Date().toLocaleTimeString()}]
                </span>{" "}
                {log}
              </div>
            ))}
            {processingState === "processing" && (
              <div className="inline-block animate-pulse">_</div>
            )}
          </div>

          {/* 状态图标 */}
          <div className="flex justify-center mt-4">
            {processingState === "processing" ? (
              <div className="flex items-center gap-2 text-sm text-blue-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>正在处理，请稍候...</span>
              </div>
            ) : processingState === "completed" ? (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <Check className="h-4 w-4" />
                <span>处理完成！</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  // 文件下载组件
  const VideoDownloadComponent = ({ stepId }: { stepId: string }) => {
    // 从localStorage获取taskData
    const taskDataStr = localStorage.getItem("currentTaskData");
    const taskData = taskDataStr ? JSON.parse(taskDataStr) : {};
    const taskName = taskData.name || "任务";
    // 在组件开头的状态定义部分添加以下状态
    const [selectedLanguage, setSelectedLanguage] = useState<string>("all"); // 默认选择所有语言
    const [selectedFileType, setSelectedFileType] = useState<string>("all"); // 默认选择所有文件类型

    // 从taskData中获取video_urls对象，如果不存在则使用空对象
    const videoUrlsData = taskData.video_urls || {}; // 新结构是对象    

    // const [videoUrlsAnalysisResult, setVideoUrlsAnalysisResult] = useState({ hasFailedFiles: false, failedFileMessages: "" });

    // 在useEffect中更新
    // // useEffect(() => {
    //   const result = workflowTool.analyzeVideoUrls(videoUrlsData);
    //   console.log('----------------------', result);
    //   setVideoUrlsAnalysisResult(result);
    // // }, [videoUrlsData]);

    // console.log('----------------------', workflowTool.analyzeVideoUrls(videoUrlsData))
    // videoUrlsAnalysisResult = workflowTool.analyzeVideoUrls(videoUrlsData);
    // videoUrlsAnalysisResult.hasFailedFiles = true;
    // videoUrlsAnalysisResult.failedFileMessages = "假数据测试：存在压制失败文件：英文，第1集";

    // 从taskData中获取srt_list对象，如果不存在则使用空对象
    const srtList = taskData.srt_list || {};

    // 创建工程文件下载链接数组
    const zipDownloadLinks: {
      id: string;
      type: string;
      language: string; // 新增语言字段
      title: string;
      url: string;
      filename: string;
    }[] = []; // 初始化空数组

    // 创建视频下载链接数组
    const videoDownloadLinks: {
      id: string;
      type: string;
      language: string; // 新增语言字段
      title: string;
      url: string;
      filename: string;
    }[] = []; // 初始化空数组

    // 遍历 videoUrlsData 对象中的每个语言
    Object.entries(videoUrlsData).forEach(
      ([language, videos]: [string, any[]]) => {
        // 遍历该语言下的视频数组
        videos.forEach((videoItem, index) => {
          // 确保 videoItem 和 video_url 存在且不为空
          if (
            videoItem &&
            videoItem.video_url &&
            videoItem.video_url.trim() !== ""
          ) {
            const playletNum = videoItem.playlet_num || index + 1; // 使用 playlet_num 或索引
            videoDownloadLinks.push({
              id: `video-${language}-${playletNum}`, // 包含语言和编号的唯一ID
              type: "视频",
              language: language, // 添加语言信息
              title: `视频 ${playletNum}`, // 标题包含编号和语言
              url: videoItem.video_url, // 视频URL
              filename: `${taskName}_${language}_视频_${playletNum}.mp4`, // 文件名包含任务名、语言和编号
            });
            zipDownloadLinks.push({
              id: `video-${language}-${playletNum}-zip`, // 包含语言和编号的唯一ID
              type: "工程文件",
              language: language, // 添加语言信息
              title: `工程文件 ${playletNum}`, // 标题包含编号和语言
              url: videoItem.project_url, // 视频URL
              filename: `${taskName}_${language}_视频_${playletNum}.mp4`, // 文件名包含任务名、语言和编号
            });
          }
        });
      }
    );

    // 创建SRT下载链接数组
    const srtDownloadLinks: any[] = [];

    // 遍历srt_list对象，获取所有SRT文件链接
    Object.entries(srtList).forEach(([language, episodes]: [string, any]) => {
      if (Array.isArray(episodes)) {
        episodes.forEach((episode: any) => {
          if (episode.file && episode.playlet_num) {
            srtDownloadLinks.push({
              id: `srt-${language}-${episode.playlet_num}`,
              type: "字幕",
              language: language, // 语言
              episode: episode.playlet_num, // 集数
              title: `第${episode.playlet_num}集`,
              url: episode.file,
              filename: `${taskName}_${language}_${episode.playlet_num}.srt`,
            });
          }
        });
      }
    });

    console.log(srtDownloadLinks);

    // 合并所有下载链接
    const allDownloadLinks = [
      ...videoDownloadLinks,
      ...zipDownloadLinks,
      ...srtDownloadLinks,
    ];

    // 在 allDownloadLinks 合并后，添加以下代码获取所有可选的语言和文件类型
    // 获取所有唯一的语言选项
    const languageOptions = [
      "all",
      ...new Set(allDownloadLinks.map((link) => link.language)),
    ];

    // 获取所有唯一的文件类型选项
    const fileTypeOptions = [
      "all",
      ...new Set(allDownloadLinks.map((link) => link.type)),
    ];

    // 根据筛选条件过滤下载链接
    const filteredDownloadLinks = allDownloadLinks.filter((link) => {
      const matchLanguage =
        selectedLanguage === "all" || link.language === selectedLanguage;
      const matchFileType =
        selectedFileType === "all" || link.type === selectedFileType;
      return matchLanguage && matchFileType;
    });

    // 如果没有下载链接，显示一条提示信息
    if (allDownloadLinks.length === 0) {
      console.log("没有可用的下载链接");
    }

    // 添加选中文件状态管理
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // 处理单个文件选择
    const toggleFileSelection = (fileId: string) => {
      setSelectedFiles((prev) => {
        if (prev.includes(fileId)) {
          // 如果已选中，则取消选中
          setSelectAll(false);
          return prev.filter((id) => id !== fileId);
        } else {
          // 如果未选中，则添加到选中列表
          const newSelected = [...prev, fileId];
          // 如果所有文件都被选中，设置全选状态为true
          if (newSelected.length === allDownloadLinks.length) {
            setSelectAll(true);
          }
          return newSelected;
        }
      });
    };

    // 处理全选/取消全选
    const toggleSelectAll = () => {
      if (selectAll) {
        // 如果当前是全选状态，取消所有选择
        setSelectedFiles([]);
        setSelectAll(false);
      } else {
        // 如果当前不是全选状态，选择所有文件
        setSelectedFiles(allDownloadLinks.map((link) => link.id));
        setSelectAll(true);
      }
    };

    // 一键下载所有文件的函数
    const downloadAllFiles = async () => {
      if (allDownloadLinks.length === 0) {
        toast.warning("没有可下载的文件");
        return;
      }

      // 显示下载开始提示，并保存引用以便后续关闭
      const loadingToast = toast.loading(
        `开始下载全部文件（共 ${allDownloadLinks.length} 个）...`
      );

      // 因为浏览器安全限制，无法直接批量下载，需要模拟点击下载每个文件
      // 为了避免浏览器拦截，我们需要依次下载每个文件，并添加一些延迟
      for (let i = 0; i < allDownloadLinks.length; i++) {
        const link = allDownloadLinks[i];
        try {
          // 创建一个隐藏的a标签
          const a = document.createElement("a");
          a.href = link.url;
          a.download = link.filename; // 设置下载文件名
          a.style.display = "none";
          document.body.appendChild(a);

          // 模拟点击下载
          a.click();

          // 移除临时标签
          document.body.removeChild(a);

          // 添加延迟，避免浏览器拦截
          if (i < allDownloadLinks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        } catch (error) {
          console.error(`下载文件 ${link.filename} 失败:`, error);
          toast.error(`下载文件 ${link.filename} 失败`);
        }
      }

      // 关闭加载提示
      toast.dismiss(loadingToast);

      // 下载完成提示
      toast.success(`全部 ${allDownloadLinks.length} 个文件下载完成！`);
    };

    // 下载选中文件的函数
    const downloadSelectedFiles = async () => {
      if (selectedFiles.length === 0) {
        toast.warning("请至少选择一个文件进行下载");
        return;
      }

      // 获取选中的文件信息
      const filesToDownload = allDownloadLinks.filter((link) =>
        selectedFiles.includes(link.id)
      );

      // 显示下载开始提示
      const loadingToast = toast.loading(
        `开始下载选中文件（共 ${filesToDownload.length} 个）...`
      );

      for (let i = 0; i < filesToDownload.length; i++) {
        const link = filesToDownload[i];
        try {
          // 创建一个隐藏的a标签
          const a = document.createElement("a");
          a.href = link.url;
          a.download = link.filename; // 设置下载文件名
          a.style.display = "none";
          document.body.appendChild(a);

          // 模拟点击下载
          a.click();

          // 移除临时标签
          document.body.removeChild(a);

          // 添加延迟，避免浏览器拦截
          if (i < filesToDownload.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        } catch (error) {
          console.error(`下载文件 ${link.filename} 失败:`, error);
          toast.error(`下载文件 ${link.filename} 失败`);
        }
      }

      // 关闭加载提示
      toast.dismiss(loadingToast);

      // 下载完成提示
      toast.success(`已完成 ${filesToDownload.length} 个文件的下载！`);
    };

    return (
      <div className="space-y-4">        
        {videoUrlsAnalysisResult.hasFailedFiles && (<div className="text-red-600">{videoUrlsAnalysisResult.failedFileMessages}</div>)
              }
        <div className="bg-secondary/50 p-4 rounded-md">
          <div className="flex justify-start items-center mb-4">
            <div className="text-lg font-medium">下载成品文件</div>

            <div className="flex items-center gap-2 justify-between flex-1">
              {/* 筛选控件 */}
              <div className="flex items-center justify-end ml-10">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="language-filter"
                      className="text-sm font-medium"
                    >
                      语言:
                    </label>
                    <select
                      id="language-filter"
                      value={selectedLanguage}
                      onChange={(e) => {
                        setSelectedLanguage(e.target.value);
                        setSelectedFiles([]);
                      }}
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    >
                      {languageOptions.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang === "all" ? "全部语言" : lang}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="file-type-filter"
                      className="text-sm font-medium"
                    >
                      文件类型:
                    </label>
                    <select
                      id="file-type-filter"
                      value={selectedFileType}
                      onChange={(e) => {
                        setSelectedFileType(e.target.value);
                        setSelectedFiles([]);
                      }}
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    >
                      {fileTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type === "all" ? "全部类型" : type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* {allDownloadLinks.length > 0 && selectedFiles.length > 0 && (
                <Button 
                  onClick={downloadSelectedFiles}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载选中的文件({selectedFiles.length})
                </Button>
              )} */}
              <Button
                onClick={downloadSelectedFiles}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed" // 添加了 disabled 样式
                size="sm"
                disabled={selectedFiles.length === 0} // 添加 disabled 属性
              >
                <Download className="h-4 w-4 mr-2" />
                下载选中的文件({selectedFiles.length})
              </Button>

              {/* {allDownloadLinks.length > 0 && (
                <Button 
                  onClick={downloadAllFiles}
                  className="bg-slate-600 hover:bg-slate-700 text-white"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  一键下载全部
                </Button>
              )} */}
            </div>
          </div>

          {allDownloadLinks.length > 0 ? (
            <div className="overflow-hidden border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"
                    >
                      <Checkbox
                        id="select-all-files"
                        // checked 状态：当 filteredDownloadLinks 不为空，且其中所有项的 id 都包含在 selectedFiles 中时，为 true
                        checked={
                          filteredDownloadLinks.length > 0 &&
                          filteredDownloadLinks.every((link) =>
                            selectedFiles.includes(link.id)
                          )
                        }
                        // indeterminate 状态：当 selectedFiles 不为空，但并非所有 filteredDownloadLinks 中的项都被选中时，为 true
                        // 使用 Shadcn Checkbox 的 indeterminate 属性可能需要特定方式，或者手动管理视觉状态。
                        // 如果 Shadcn Checkbox 直接支持 indeterminate prop，则添加:
                        // indeterminate={
                        //   selectedFiles.length > 0 &&
                        //   !filteredDownloadLinks.every(link => selectedFiles.includes(link.id))
                        // }
                        // 注意：Shadcn UI 的 Checkbox 可能没有直接的 indeterminate prop。
                        // 如果没有，可以省略 indeterminate，或者根据文档实现视觉上的 indeterminate 状态。
                        onCheckedChange={(isChecked) => {
                          if (isChecked) {
                            // 如果勾选，将所有 filteredDownloadLinks 的 id 添加到 selectedFiles
                            setSelectedFiles((prev) => [
                              ...prev,
                              ...filteredDownloadLinks
                                .map((link) => link.id)
                                .filter((id) => !prev.includes(id)), // 只添加尚未选择的
                            ]);
                          } else {
                            // 如果取消勾选，从 selectedFiles 中移除所有 filteredDownloadLinks 的 id
                            const filteredIds = filteredDownloadLinks.map(
                              (link) => link.id
                            );
                            setSelectedFiles((prev) =>
                              prev.filter((id) => !filteredIds.includes(id))
                            );
                          }
                        }}
                        aria-label="选择所有当前可见文件"
                      />
                    </th>
                    {/* <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"
                    >
                      <div className="flex items-center">
                        <Checkbox 
                          checked={selectAll}
                          onCheckedChange={toggleSelectAll}
                          id="select-all-files" 
                          aria-label="全选或取消全选"
                        />
                      </div>
                    </th> */}
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      名称
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      语言
                    </th>
                    {/* <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      地址
                    </th> */}
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      类型
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDownloadLinks.map((link, index) => (
                    <tr
                      key={`download-link-${index}`}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="pl-4 py-4 whitespace-nowrap text-sm">
                        <Checkbox
                          checked={selectedFiles.includes(link.id)}
                          onCheckedChange={() => toggleFileSelection(link.id)}
                          id={`file-select-${link.id}`}
                          aria-label={`选择${link.title || link.filename}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {link.title || link.filename}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {link.language}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {link.url}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {link.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={link.url}
                          download={link.filename}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            下载
                          </Button>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center border rounded-md bg-white">
              <div className="flex flex-col items-center justify-center gap-2">
                <Database className="h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium">暂无可下载文件</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  当前任务暂无处理完成的视频可供下载。视频处理完成后将自动更新可下载列表。
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              提示：下载完成后，可以使用各种视频播放器播放观看。如需修改字幕，可以使用专业的字幕编辑软件。
            </p>
          </div>
        </div>
      </div>
    );
  };

  // 字幕编辑器组件
  const SubtitleEditor = ({
    subtitles: initialSubtitles,
    onSave,
  }: {
    subtitles: Subtitle[];
    onSave: (subtitles: Subtitle[]) => void;
  }) => {
    // 打印详细的参数信息
    console.log("字幕编辑器组件被调用，参数详情：", {
      initialSubtitles: initialSubtitles,
      isArray: Array.isArray(initialSubtitles),
      length: initialSubtitles
        ? Array.isArray(initialSubtitles)
          ? initialSubtitles.length
          : "非数组"
        : "未定义",
      type: initialSubtitles ? typeof initialSubtitles : "未定义",
      sample:
        initialSubtitles &&
        Array.isArray(initialSubtitles) &&
        initialSubtitles.length > 0
          ? initialSubtitles[0]
          : null,
    });

    // 确保初始化的字幕数据非空
    const validInitialSubtitles =
      Array.isArray(initialSubtitles) && initialSubtitles.length > 0
        ? initialSubtitles
        : [];

    console.log("字幕编辑器收到的字幕数据:", validInitialSubtitles);

    const [subtitles, setSubtitles] = useState<Subtitle[]>(
      validInitialSubtitles
    );

    // 更新字幕
    const updateSubtitle = (
      id: string,
      field: "startTime" | "endTime" | "text",
      value: string
    ) => {
      setSubtitles((prev) =>
        prev.map((subtitle) =>
          subtitle.id === id ? { ...subtitle, [field]: value } : subtitle
        )
      );
    };

    // 删除字幕
    const deleteSubtitle = (id: string) => {
      setSubtitles((prev) => prev.filter((subtitle) => subtitle.id !== id));
    };

    // 添加字幕（可在指定位置插入）
    const addSubtitle = (index = subtitles.length) => {
      const newSubtitle: Subtitle = {
        id: `subtitle-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        startTime: "00:00:00,000",
        endTime: "00:00:00,000",
        text: "",
      };

      setSubtitles((prev) => [
        ...prev.slice(0, index),
        newSubtitle,
        ...prev.slice(index),
      ]);
    };

    // 保存所有字幕
    const handleSave = () => {
      console.log("字幕编辑器准备保存字幕:", {
        subtitles: subtitles,
        count: subtitles.length,
        sampleItem: subtitles.length > 0 ? subtitles[0] : "无字幕",
      });
      try {
        onSave(subtitles);
        console.log("字幕编辑器保存完成");
      } catch (error) {
        console.error("字幕编辑器保存时出错:", error);
      }
    };

    return (
      <div className="space-y-4 p-4">
        {subtitles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            没有字幕数据，点击下方"添加字幕"按钮创建
            <div className="mt-4">
              <Button onClick={() => addSubtitle()} variant="outline" size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                添加字幕
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {subtitles.map((subtitle, index) => (
              <div key={subtitle.id || `subtitle-editor-${index}`}>
                {/* 字幕条目 */}
                <div className="p-3 border rounded-md relative group mb-1">
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      onClick={() => deleteSubtitle(subtitle.id)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      <span className="sr-only">删除</span>
                    </Button>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="font-medium text-sm text-muted-foreground pt-2 w-10">
                      #{index + 1}
                    </div>
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-36">
                        <div className="text-xs text-muted-foreground mb-1">
                          开始时间
                        </div>
                        <Input
                          value={subtitle.startTime}
                          onChange={(e) =>
                            updateSubtitle(
                              subtitle.id,
                              "startTime",
                              e.target.value
                            )
                          }
                          placeholder="00:00:00,000"
                          className="text-sm"
                        />
                      </div>
                      <div className="w-36">
                        <div className="text-xs text-muted-foreground mb-1">
                          结束时间
                        </div>
                        <Input
                          value={subtitle.endTime}
                          onChange={(e) =>
                            updateSubtitle(
                              subtitle.id,
                              "endTime",
                              e.target.value
                            )
                          }
                          placeholder="00:00:00,000"
                          className="text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          字幕内容
                        </div>
                        <Textarea
                          value={subtitle.text}
                          onChange={(e) =>
                            updateSubtitle(subtitle.id, "text", e.target.value)
                          }
                          placeholder="输入字幕文本..."
                          className="min-h-[80px] text-sm resize-y"
                          style={{ height: "auto" }}
                          onInput={(e) => {
                            // 自动调整高度
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = "auto";
                            target.style.height = `${target.scrollHeight}px`;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 字幕之间的插入按钮 */}
                <div className="h-4 relative group">
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      onClick={() => addSubtitle(index + 1)}
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full bg-white shadow-sm border-dashed"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span className="sr-only">在此处插入字幕</span>
                    </Button>
                  </div>
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-gray-200 group-hover:border-gray-400 transition-colors"></div>
                </div>
              </div>
            ))}

            {/* 添加字幕按钮（仅在有字幕时显示在底部） */}
            <div className="mt-4 flex justify-center">
              <Button onClick={() => addSubtitle()} variant="outline" size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                添加字幕
              </Button>
            </div>
          </div>
        )}

        {/* 隐藏的保存按钮，由弹窗底部按钮触发 */}
        <div className="hidden">
          <Button onClick={handleSave} id="subtitle-editor-save">
            保存
          </Button>
        </div>
      </div>
    );
  };

  // 每次保存用户修改后，刷新编辑器数据
  const refreshEditorData = async () => {
    // const result = await taskService.getTask(taskId);
    // console.log("[刷新本土化编辑器数据] 接口响应:", result);
    // localStorage.setItem("currentTaskData", JSON.stringify(result.data));
    // 定义刷新函数
    const refreshTaskData = async () => {
      console.log("定时器触发，刷新任务数据: ", taskId);
      if (!taskId) return;

      try {
        // 使用任务服务获取最新数据
        const response = await taskService.getTask(taskId);
        console.log("定时器获取数据响应:", response);

        if (response && response.success) {
          // 触发任务状态更新事件
          const taskStatusEvent = new CustomEvent("taskStatusUpdated", {
            detail: {
              taskId,
              taskData: response.data,
            },
          });
          window.dispatchEvent(taskStatusEvent);
        }
      } catch (error) {
        console.error("定时刷新任务数据失败:", error);
      }
    };
    refreshTaskData();
  };

  // 本土化清单编辑器组件
  const LocalizationEditor = ({
    data: initialData,
    allLanguagesData = {}, // 所有语言的本土化数据
    availableLanguages = [], // 可用的语言列表
    currentLanguage = "", // 当前选择的语言
    onSave,
    onLanguageChange, // 新增语言变更回调
    taskId,
  }: {
    data: LocalizationData;
    allLanguagesData?: Record<string, LocalizationData>;
    availableLanguages?: string[];
    currentLanguage?: string;
    onSave: (data: LocalizationData, language?: string) => void;
    onLanguageChange?: (language: string) => void; // 新增语言变更回调类型定义
    taskId: string;
  }) => {
    // 确保使用深拷贝的数据，避免引用原始数据
    const deepCopyInitialData = useMemo(() => {
      // 创建一个全新深拷贝，确保所有嵌套对象都是新实例
      return JSON.parse(JSON.stringify(initialData));
    }, [initialData]);

    const [data, setData] = useState<LocalizationData>(deepCopyInitialData);
    const [activeTab, setActiveTab] = useState<
      "角色" | "地名" | "组织名" | "文化相关"
    >("角色");
    const [activeCharacter, setActiveCharacter] = useState<string | null>(
      Object.keys(deepCopyInitialData.角色).length > 0
        ? Object.keys(deepCopyInitialData.角色)[0]
        : null
    );

    // 语言选择状态
    const [selectedLanguage, setSelectedLanguage] = useState<string>(
      currentLanguage ||
        (availableLanguages.length > 0 ? availableLanguages[0] : "")
    );

    // 当语言切换时，更新数据
    useEffect(() => {
      if (
        selectedLanguage &&
        allLanguagesData &&
        allLanguagesData[selectedLanguage]
      ) {
        const newData = JSON.parse(
          JSON.stringify(allLanguagesData[selectedLanguage])
        );
        setData(newData);

        // 重置活动角色，选择第一个可用的角色（如果有）
        const firstCharacter =
          Object.keys(newData.角色).length > 0
            ? Object.keys(newData.角色)[0]
            : null;
        setActiveCharacter(firstCharacter);

        console.log(`切换到语言: ${selectedLanguage}，数据:`, newData);
      }
    }, [selectedLanguage, allLanguagesData]);

    // 在组件初始化时记录每个实体的数据，便于调试
    useEffect(() => {
      console.log(
        "本土化编辑器初始化，数据:",
        JSON.stringify(deepCopyInitialData)
      );
      // 检查所有实体ID，确保唯一性
      const allIds = new Set<string>();
      let duplicateFound = false;

      // 检查角色相关实体
      Object.keys(deepCopyInitialData.角色).forEach((character) => {
        deepCopyInitialData.角色[character].forEach((entity) => {
          if (allIds.has(entity.id)) {
            console.error(`发现重复ID: ${entity.id}, 实体:`, entity);
            duplicateFound = true;
          }
          allIds.add(entity.id);
        });
      });

      // 检查其他类别实体
      ["地名", "组织名", "文化相关"].forEach((category) => {
        deepCopyInitialData[category].forEach((entity) => {
          if (allIds.has(entity.id)) {
            console.error(`发现重复ID: ${entity.id}, 实体:`, entity);
            duplicateFound = true;
          }
          allIds.add(entity.id);
        });
      });

      if (duplicateFound) {
        console.warn("发现重复ID，这可能导致编辑一条内容时多条同时变动");
      } else {
        console.log("所有实体ID检查通过，共有", allIds.size, "个唯一ID");
      }
    }, [deepCopyInitialData]);

    // 获取当前选项卡的数据
    const getCurrentData = (): LocalizationEntity[] => {
      if (activeTab === "角色") {
        if (!activeCharacter) return [];
        return data.角色[activeCharacter] || [];
      } else if (activeTab === "地名") {
        return data.地名 || [];
      } else if (activeTab === "组织名") {
        return data.组织名 || [];
      } else if (activeTab === "文化相关") {
        return data.文化相关 || [];
      }
      return [];
    };

    // 添加新条目
    const addNewEntity = () => {
      // 生成真正唯一的 ID，加入随机数和时间戳
      const newId = `${activeTab}-${Date.now()}-${Math.floor(
        Math.random() * 1000000
      )}`;
      const newEntity: LocalizationEntity = {
        id: newId,
        原文: "",
        本土化: "",
        注释: "",
      };

      console.log(`创建新条目: ID=${newId}, 类型=${activeTab}`);

      if (activeTab === "角色") {
        if (!activeCharacter) {
          // 如果没有选择角色，先创建一个新角色
          const newCharacterName = `新角色_${Date.now()}`;

          // 创建新数据对象，确保深拷贝
          const newData = {
            ...JSON.parse(JSON.stringify(data)),
            角色: {
              ...JSON.parse(JSON.stringify(data.角色)),
              [newCharacterName]: [newEntity],
            },
          };

          setData(newData);
          setActiveCharacter(newCharacterName);
        } else {
          // 添加到现有角色
          const currentCharacterEntities = Array.isArray(
            data.角色[activeCharacter]
          )
            ? [...data.角色[activeCharacter]] // 创建数组的副本
            : [];

          // 创建新数据对象，确保深拷贝
          const newData = {
            ...JSON.parse(JSON.stringify(data)),
            角色: {
              ...JSON.parse(JSON.stringify(data.角色)),
              [activeCharacter]: [...currentCharacterEntities, newEntity],
            },
          };

          setData(newData);
        }
      } else if (activeTab === "地名") {
        const currentPlaces = Array.isArray(data.地名) ? [...data.地名] : [];

        // 创建新数据对象，确保深拷贝
        const newData = {
          ...JSON.parse(JSON.stringify(data)),
          地名: [...currentPlaces, newEntity],
        };

        setData(newData);
      } else if (activeTab === "组织名") {
        const currentOrgs = Array.isArray(data.组织名) ? [...data.组织名] : [];

        // 创建新数据对象，确保深拷贝
        const newData = {
          ...JSON.parse(JSON.stringify(data)),
          组织名: [...currentOrgs, newEntity],
        };

        setData(newData);
      } else if (activeTab === "文化相关") {
        const currentCulturalItems = Array.isArray(data.文化相关)
          ? [...data.文化相关]
          : [];

        // 创建新数据对象，确保深拷贝
        const newData = {
          ...JSON.parse(JSON.stringify(data)),
          文化相关: [...currentCulturalItems, newEntity],
        };

        setData(newData);
      }
    };

    // 添加新角色
    const addNewCharacter = () => {
      // 使用时间戳和随机数创建唯一角色名
      const newCharacterName = `新角色_${Date.now()}_${Math.floor(
        Math.random() * 10000
      )}`;
      const newEntity: LocalizationEntity = {
        id: `角色-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        原文: "",
        本土化: "",
        注释: "",
      };

      console.log(
        `创建新角色: ${newCharacterName}，初始条目ID: ${newEntity.id}`
      );

      // 创建新数据对象，确保深拷贝
      const newData = {
        ...JSON.parse(JSON.stringify(data)),
        角色: {
          ...JSON.parse(JSON.stringify(data.角色)),
          [newCharacterName]: [newEntity],
        },
      };

      setData(newData);
      setActiveCharacter(newCharacterName);
    };

    // 处理实体更新
    const handleEntityChange = (
      id: string,
      field: "原文" | "本土化" | "注释",
      value: string
    ) => {
      console.log(`更新实体: ID=${id}, 字段=${field}, 值=${value}`);

      // 深拷贝当前数据状态
      const currentData = JSON.parse(JSON.stringify(data));

      if (activeTab === "角色" && activeCharacter) {
        // 检查角色是否存在并找到实体索引
        if (!currentData.角色[activeCharacter]) {
          console.error(`角色 ${activeCharacter} 不存在`);
          return;
        }

        const entityIndex = currentData.角色[activeCharacter].findIndex(
          (entity: LocalizationEntity) => entity.id === id
        );
        if (entityIndex === -1) {
          console.error(`无法找到ID为${id}的实体`);
          return;
        }

        // 为目标角色创建一个全新的实体数组
        const updatedEntities = [...currentData.角色[activeCharacter]];
        // 只更新特定位置的实体
        updatedEntities[entityIndex] = {
          ...updatedEntities[entityIndex],
          [field]: value,
        };

        // 创建新的角色对象，包含更新后的实体数组
        const newData = {
          ...currentData,
          角色: {
            ...currentData.角色, // 保留其他角色
            [activeCharacter]: updatedEntities, // 替换当前角色的实体数组
          },
        };

        console.log(`角色实体更新完成: ID=${id}, 字段=${field}`);
        setData(newData);
      } else if (activeTab === "地名") {
        // 找到对应实体的索引
        const entityIndex = currentData.地名?.findIndex(
          (entity: LocalizationEntity) => entity.id === id
        );
        if (entityIndex === -1 || entityIndex === undefined) return;

        // 创建新的地名数组
        const updatedPlaces = [...currentData.地名];
        // 只更新指定的实体
        updatedPlaces[entityIndex] = {
          ...updatedPlaces[entityIndex],
          [field]: value,
        };

        // 设置新的数据对象
        const newData = {
          ...currentData,
          地名: updatedPlaces,
        };

        console.log(`地名实体更新完成: ID=${id}, 字段=${field}`);
        setData(newData);
      } else if (activeTab === "组织名") {
        // 找到对应实体的索引
        const entityIndex = currentData.组织名?.findIndex(
          (entity: LocalizationEntity) => entity.id === id
        );
        if (entityIndex === -1 || entityIndex === undefined) return;

        // 创建新的组织名数组
        const updatedOrgs = [...currentData.组织名];
        // 只更新指定的实体
        updatedOrgs[entityIndex] = {
          ...updatedOrgs[entityIndex],
          [field]: value,
        };

        // 设置新的数据对象
        const newData = {
          ...currentData,
          组织名: updatedOrgs,
        };

        console.log(`组织名实体更新完成: ID=${id}, 字段=${field}`);
        setData(newData);
      } else if (activeTab === "文化相关") {
        // 找到对应实体的索引
        const entityIndex = currentData.文化相关?.findIndex(
          (entity: LocalizationEntity) => entity.id === id
        );
        if (entityIndex === -1 || entityIndex === undefined) return;

        // 创建新的文化相关数组
        const updatedCulturalItems = [...currentData.文化相关];
        // 只更新指定的实体
        updatedCulturalItems[entityIndex] = {
          ...updatedCulturalItems[entityIndex],
          [field]: value,
        };

        // 设置新的数据对象
        const newData = {
          ...currentData,
          文化相关: updatedCulturalItems,
        };

        console.log(`文化相关实体更新完成: ID=${id}, 字段=${field}`);
        setData(newData);
      }
    };

    // 修改角色名
    const handleCharacterNameChange = (oldName: string, newName: string) => {
      if (!oldName || oldName === newName) return;

      console.log(`修改角色名: 从 ${oldName} 到 ${newName}`);

      // 深拷贝当前数据状态
      const currentData = JSON.parse(JSON.stringify(data));

      // 获取原角色的实体
      const entities = currentData.角色[oldName];
      // 移除原角色
      const { [oldName]: _, ...restCharacters } = currentData.角色;

      // 创建新的数据对象
      const newData = {
        ...currentData,
        角色: {
          ...restCharacters,
          [newName]: entities,
        },
      };

      setData(newData);
      setActiveCharacter(newName);

      console.log(`角色名称修改完成: ${oldName} -> ${newName}`);
    };

    // 删除条目
    const deleteEntity = (id: string) => {
      console.log(`删除实体: ID=${id}, 类型=${activeTab}`);

      // 深拷贝当前数据状态
      const currentData = JSON.parse(JSON.stringify(data));

      if (activeTab === "角色" && activeCharacter) {
        // 过滤出非目标 ID 的实体
        const updatedEntities = currentData.角色[activeCharacter].filter(
          (entity: LocalizationEntity) => entity.id !== id
        );

        // 如果删除后没有条目，可以选择删除整个角色
        if (updatedEntities.length === 0) {
          const { [activeCharacter]: _, ...restCharacters } = currentData.角色;

          const newData = {
            ...currentData,
            角色: restCharacters,
          };

          setData(newData);

          // 如果还有其他角色，选择第一个角色
          const remainingCharacters = Object.keys(restCharacters);
          if (remainingCharacters.length > 0) {
            setActiveCharacter(remainingCharacters[0]);
          } else {
            setActiveCharacter(null);
          }
        } else {
          // 如果还有其他条目，只更新该角色的实体列表
          const newData = {
            ...currentData,
            角色: {
              ...currentData.角色,
              [activeCharacter]: updatedEntities,
            },
          };

          setData(newData);
        }

        console.log(`角色实体删除完成: ID=${id}`);
      } else if (activeTab === "地名") {
        // 删除地名实体
        const newData = {
          ...currentData,
          地名: currentData.地名.filter(
            (entity: LocalizationEntity) => entity.id !== id
          ),
        };

        setData(newData);
        console.log(`地名实体删除完成: ID=${id}`);
      } else if (activeTab === "组织名") {
        // 删除组织名实体
        const newData = {
          ...currentData,
          组织名: currentData.组织名.filter(
            (entity: LocalizationEntity) => entity.id !== id
          ),
        };

        setData(newData);
        console.log(`组织名实体删除完成: ID=${id}`);
      } else if (activeTab === "文化相关") {
        // 删除文化相关实体
        const newData = {
          ...currentData,
          文化相关: currentData.文化相关.filter(
            (entity: LocalizationEntity) => entity.id !== id
          ),
        };

        setData(newData);
        console.log(`文化相关实体删除完成: ID=${id}`);
      }
    };

    // 删除角色
    const deleteCharacter = (characterName: string) => {
      if (!characterName) return;

      console.log(`删除角色: ${characterName}`);

      // 深拷贝当前数据状态
      const currentData = JSON.parse(JSON.stringify(data));

      // 移除角色
      const { [characterName]: _, ...restCharacters } = currentData.角色;

      const newData = {
        ...currentData,
        角色: restCharacters,
      };

      setData(newData);

      // 如果还有其他角色，选择第一个角色
      const remainingCharacters = Object.keys(restCharacters);
      if (remainingCharacters.length > 0) {
        setActiveCharacter(remainingCharacters[0]);
      } else {
        setActiveCharacter(null);
      }

      console.log(`角色删除完成: ${characterName}`);
    };

    // 保存所有更改
    const handleSaveAll = async () => {
      // 打印保存前的最终数据
      // console.log("[本土化清单] 保存前的数据:", JSON.stringify(data, null, 2));
      console.log("[本土化清单] 角色数量:", Object.keys(data.角色).length);
      console.log("[本土化清单] 当前选择的语言:", selectedLanguage);

      // 统计每种类型的条目数
      const roleCount = Object.values(data.角色).reduce(
        (count, items) => count + items.length,
        0
      );
      const placeCount = data.地名.length;
      const orgCount = data.组织名.length;
      const cultureCount = data.文化相关.length;
      const totalCount = roleCount + placeCount + orgCount + cultureCount;

      console.log(
        `[本土化清单] 总计条目数: ${totalCount} (角色: ${roleCount}, 地名: ${placeCount}, 组织名: ${orgCount}, 文化相关: ${cultureCount})`
      );

      try {
        // 显示加载提示
        const toastId = toast.loading("正在保存本土化数据...");

        // 使用当前选择的语言作为目标语言
        let targetLanguage = selectedLanguage;

        // 如果没有指定目标语言，尝试从 localized_map 获取
        if (!targetLanguage && taskData?.localized_map) {
          try {
            const rawData =
              typeof taskData.localized_map === "string"
                ? JSON.parse(taskData.localized_map)
                : taskData.localized_map;

            // 获取第一个语言的键名
            targetLanguage = Object.keys(rawData)[0] || "";
          } catch (err) {
            console.error("[本土化清单] 解析 localized_map 错误:", err);
          }
        }

        console.log(`[本土化清单] 目标语言: ${targetLanguage}`);

        // 构造与原始 localized_map 相同的数据结构
        // 原始格式: { "<语言>": { 角色, 地名, 组织名, 文化相关 } }
        let updatedContent;

        // 如果有所有语言的数据，我们需要保留其他语言的数据（仅在本地状态中）
        if (allLanguagesData && Object.keys(allLanguagesData).length > 0) {
          // 创建一个深拷贝，避免修改原始数据
          updatedContent = JSON.parse(JSON.stringify(allLanguagesData));
          // 更新当前语言的数据
          updatedContent[targetLanguage] = data;
        } else {
          // 只有当前语言的数据
          updatedContent = {
            [targetLanguage]: data,
          };
        }

        console.log(
          "[本土化清单] 已重新构造本地状态数据格式:",
          JSON.stringify(updatedContent)
        );

        // 使用 taskService.updateTaskContent 方法更新数据
        // 注意: content 只需要传递当前语言的数据，target_lang已经指定了目标语言
        const params = {
          playlet_num: "1", // 默认集数
          type: "localized", // 类型为本土化数据
          content: JSON.stringify(data), // 只传递当前语言的数据，不需要包含所有语言数据
          target_lang: targetLanguage, // 使用当前选择的语言作为目标语言
        };

        console.log(`[本土化清单] 调用updateTaskContent, taskId: ${taskId}`);
        console.log("[本土化清单] 请求参数:", JSON.stringify(params));

        const result = await taskService.updateTaskContent(taskId, params);
        console.log("[本土化清单] 接口响应:", result);

        // 关闭加载提示
        toast.dismiss(toastId);

        if (result && result.success) {
          // 显示成功提示
          toast.success("本土化数据已成功保存!");

          // 执行原来的保存回调，传递当前语言
          onSave(data, selectedLanguage);
          console.log("[本土化清单] 数据已成功保存并更新到服务器");

          // 本土化更新成功后，需要刷新当前编辑器的数据
          refreshEditorData();
        } else {
          // 显示错误提示
          toast.error(`保存失败: ${result?.message || "未知错误"}`);
          console.error("[本土化清单] 保存失败:", result);
        }
      } catch (error) {
        // 处理异常
        console.error("[本土化清单] 保存过程发生错误:", error);
        toast.error(
          `保存时发生错误: ${
            error instanceof Error ? error.message : "未知错误"
          }`
        );
      }
    };

    return (
      <div className="w-full">
        {/* 语言选择器 */}
        {availableLanguages && availableLanguages.length > 1 && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">语言:</label>
              <Select
                value={selectedLanguage}
                onValueChange={(value) => {
                  setSelectedLanguage(value);
                  // 通知父组件语言已变更
                  console.log(`通知父组件语言变更为: ${value}`);
                  if (onLanguageChange) {
                    onLanguageChange(value);
                  }
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="选择语言" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* 标签页导航 */}
        <div className="flex border-b mb-4">
          {(["角色", "地名", "组织名", "文化相关"] as const).map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 font-medium ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "角色" && Object.keys(data.角色).length > 0) {
                  setActiveCharacter(Object.keys(data.角色)[0]);
                }
              }}
            >
              {tab} (
              {tab === "角色"
                ? Object.values(data.角色).reduce(
                    (count, items) => count + items.length,
                    0
                  )
                : tab === "地名"
                ? data.地名.length
                : tab === "组织名"
                ? data.组织名.length
                : data.文化相关.length}
              )
            </button>
          ))}
        </div>

        {/* 角色选择器（仅当选择"角色"标签时显示） */}
        {activeTab === "角色" && (
          <div className="mb-4">
            <div className="flex justify-between items-end">
              <label className="block text-sm font-medium">选择角色</label>
              <Button
                onClick={addNewCharacter}
                variant="outline"
                size="sm"
                className="h-8 mb-2 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                添加新角色
              </Button>
            </div>

            {Object.keys(data.角色).length > 0 ? (
              <div className="flex items-center space-x-2">
                <Select
                  value={activeCharacter || undefined}
                  onValueChange={(value) => setActiveCharacter(value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(data.角色).map((charName) => (
                      <SelectItem key={charName} value={charName}>
                        {charName} ({data.角色[charName].length}个相关名词)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeCharacter && (
                  <div className="flex items-center space-x-1">
                    <Input
                      value={activeCharacter}
                      onChange={(e) =>
                        handleCharacterNameChange(
                          activeCharacter,
                          e.target.value
                        )
                      }
                      placeholder="角色名称"
                      className="w-40"
                    />
                    <Button
                      onClick={() => deleteCharacter(activeCharacter)}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      <span className="sr-only">删除角色</span>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed rounded-md mb-4">
                <p className="text-muted-foreground">
                  暂无角色数据，请点击"添加新角色"按钮添加
                </p>
              </div>
            )}
          </div>
        )}

        {/* 添加新条目按钮 */}
        <div className="mb-4">
          <Button
            onClick={addNewEntity}
            variant="outline"
            size="sm"
            className="flex items-center"
            disabled={activeTab === "角色" && !activeCharacter}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            添加新
            {activeTab === "角色"
              ? "相关名词"
              : activeTab === "地名"
              ? "地点"
              : activeTab === "组织名"
              ? "组织"
              : "文化词条"}
          </Button>
        </div>

        {/* 编辑表格 */}
        {(activeTab !== "角色" || activeCharacter) &&
        getCurrentData().length > 0 ? (
          <div className="rounded-md overflow-hidden border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th
                    className="p-2 text-left font-medium text-sm"
                    style={{ width: "5%" }}
                  >
                    #
                  </th>
                  <th
                    className="p-2 text-left font-medium text-sm"
                    style={{ width: "25%" }}
                  >
                    原文
                  </th>
                  <th
                    className="p-2 text-left font-medium text-sm"
                    style={{ width: "25%" }}
                  >
                    本土化
                  </th>
                  <th
                    className="p-2 text-left font-medium text-sm"
                    style={{ width: "40%" }}
                  >
                    注释
                  </th>
                  <th
                    className="p-2 text-center font-medium text-sm"
                    style={{ width: "5%" }}
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {getCurrentData().map(
                  (entity: LocalizationEntity, index: number) => (
                    <tr
                      key={entity.id}
                      className="border-t"
                      data-entity-id={entity.id}
                    >
                      <td className="p-2 text-sm">{index + 1}</td>
                      <td className="p-2">
                        <Input
                          value={entity.原文}
                          onChange={(e) =>
                            handleEntityChange(
                              entity.id,
                              "原文",
                              e.target.value
                            )
                          }
                          className="w-full text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={entity.本土化}
                          onChange={(e) =>
                            handleEntityChange(
                              entity.id,
                              "本土化",
                              e.target.value
                            )
                          }
                          className="w-full text-sm"
                        />
                      </td>
                      <td className="p-2">
                        <Textarea
                          value={entity.注释}
                          onChange={(e) =>
                            handleEntityChange(
                              entity.id,
                              "注释",
                              e.target.value
                            )
                          }
                          className="text-sm w-full"
                          rows={2}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          onClick={() => deleteEntity(entity.id)}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          <span className="sr-only">删除</span>
                        </Button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed rounded-md">
            <p className="text-muted-foreground">
              {activeTab === "角色" && !activeCharacter
                ? "请先选择或添加一个角色"
                : `暂无${
                    activeTab === "角色"
                      ? "相关名词"
                      : activeTab === "地名"
                      ? "地点"
                      : activeTab === "组织名"
                      ? "组织"
                      : "文化词条"
                  }数据，请点击上方按钮添加`}
            </p>
          </div>
        )}

        {/* 隐藏的保存按钮，供弹窗底部的固定按钮触发 */}
        <Button
          onClick={handleSaveAll}
          className="localization-editor-save-button hidden"
        >
          保存本土化清单
        </Button>
      </div>
    );
  };

  // 翻译结果编辑器组件
  const TranslationEditor = ({
    translationResults,
    onSave,
    taskData, // 添加taskData参数
    onSelectionChange, // 添加选择变化回调
    initialLanguage, // 初始设置的语言
    initialEpisode, // 初始设置的集数
  }: {
    translationResults: TranslationResult[];
    onSave: (results: TranslationResult[]) => void;
    taskData?: any; // 任务数据，可能包含srt_list
    onSelectionChange?: (language: string, episode: number | null) => void; // 当用户选择不同语言或集数时的回调
    initialLanguage?: string; // 初始设置的语言
    initialEpisode?: number | null; // 初始设置的集数
  }) => {
    const [results, setResults] = useState<TranslationResult[]>([]);

    // 筛选状态 - 使用外部传入的初始值（如果有）
    const [selectedLanguage, setSelectedLanguage] = useState<string>(
      initialLanguage || ""
    );
    const [selectedEpisode, setSelectedEpisode] = useState<number | null>(
      initialEpisode !== undefined ? initialEpisode : null
    );

    // 使用ref跟踪是否已经初始化过
    const initializedRef = useRef(false);
    // 跟踪上次选择的值，避免重复调用回调
    const lastSelectionRef = useRef<{
      language: string | null;
      episode: number | null;
    }>({ language: null, episode: null });

    // 创建一个简单的函数来通知父组件选择变化
    const notifySelectionChange = useCallback(
      (language: string, episode: number | null) => {
        if (onSelectionChange) {
          console.log(`选择变化通知: 语言=${language}, 集数=${episode}`);
          // 更新上次选择跟踪
          lastSelectionRef.current = { language, episode };
          // 调用回调通知父组件
          onSelectionChange(language, episode);
        }
      },
      [onSelectionChange]
    );

    // 在组件挂载时初始化数据
    useEffect(() => {
      // 优先使用传入的翻译结果，如果没有则尝试从taskData.srt_list解析
      if (translationResults && translationResults.length > 0) {
        setResults(translationResults);
        console.log("使用传入的翻译结果数据:", translationResults.length);
      } else if (taskData?.srt_list && Array.isArray(taskData.srt_list)) {
        // 从taskData.srt_list解析字幕内容
        try {
          console.log(
            "从taskData.srt_list解析字幕内容:",
            taskData.srt_list.length
          );

          const parsedResults: TranslationResult[] = [];

          // 遍历srt_list数组，提取字幕内容
          taskData.srt_list.forEach((srtItem: any, index: number) => {
            // 确保srtItem包含必要的字段
            if (srtItem && typeof srtItem === "object") {
              // 提取语言信息（可能是target_lang或language字段）
              const language =
                srtItem.target_lang || srtItem.language || "未知语言";

              // 提取集数信息（playlet_num或episode字段）
              const episode = parseInt(
                srtItem.playlet_num || srtItem.episode || "1",
                10
              );

              // 解析内容
              const content = srtItem.content || srtItem.srt_content || "";

              // 解析SRT内容，提取字幕项
              const srtEntries = parseSrtContent(content);

              // 将每个字幕项转换为翻译结果
              srtEntries.forEach((entry, entryIndex) => {
                parsedResults.push({
                  id: `srt-${language}-${episode}-${entryIndex}`,
                  startTime: entry.startTime,
                  endTime: entry.endTime,
                  originalText: entry.originalText || "",
                  translatedText:
                    entry.translatedText || entry.originalText || "",
                  language,
                  episode,
                });
              });
            }
          });

          if (parsedResults.length > 0) {
            setResults(parsedResults);
            console.log(
              "成功解析字幕内容，共生成翻译结果:",
              parsedResults.length
            );
          } else {
            console.log("未能从srt_list中解析出有效字幕内容");
            // 如果没有解析出数据，使用传入的翻译结果（即使为空）
            setResults(translationResults);
          }
        } catch (error) {
          console.error("解析srt_list时出错:", error);
          // 出错时使用传入的翻译结果
          setResults(translationResults);
        }
      } else {
        // 如果没有srt_list，直接使用传入的翻译结果
        setResults(translationResults);
      }
    }, [translationResults, taskData]);

    // 解析SRT内容的辅助函数
    const parseSrtContent = (
      srtString: string
    ): Array<{
      startTime: string;
      endTime: string;
      originalText?: string;
      translatedText?: string;
    }> => {
      if (!srtString || typeof srtString !== "string") {
        return [];
      }

      const entries: Array<{
        startTime: string;
        endTime: string;
        originalText?: string;
        translatedText?: string;
      }> = [];

      try {
        // 按双空行分割SRT内容获取每个字幕条目
        const srtBlocks = srtString
          .split(/\n\s*\n/)
          .filter((block) => block.trim());

        srtBlocks.forEach((block) => {
          const lines = block.split("\n").filter((line) => line.trim());

          // SRT格式通常是：序号、时间码、内容(可能多行)
          if (lines.length >= 2) {
            // 跳过第一行（序号）
            // 解析时间码行
            const timeCodeLine = lines[1];
            const timeCodeMatch = timeCodeLine.match(
              /([\d:,]+)\s*-->\s*([\d:,]+)/
            );

            if (timeCodeMatch) {
              const startTime = timeCodeMatch[1];
              const endTime = timeCodeMatch[2];

              // 提取文本内容（可能有多行）
              const contentLines = lines.slice(2);
              const text = contentLines.join("\n");

              entries.push({
                startTime,
                endTime,
                originalText: text, // 原始文本
                translatedText: text, // 初始时翻译文本与原文相同
              });
            }
          }
        });
      } catch (error) {
        console.error("解析SRT内容时出错:", error);
      }

      return entries;
    };

    // 获取所有可用的语言和集数
    const availableLanguages = useMemo(() => {
      const languages = new Set(results.map((result) => result.language));
      return Array.from(languages).sort();
    }, [results]);

    const availableEpisodes = useMemo(() => {
      const episodes = new Set(results.map((result) => result.episode));
      return Array.from(episodes).sort((a, b) => a - b);
    }, [results]);

    // 单一初始化逻辑，只在组件首次加载时设置初始值
    useEffect(() => {
      // 如果已经初始化过，直接返回
      if (initializedRef.current) return;

      // 确保我们有可用数据
      if (availableLanguages.length > 0 && availableEpisodes.length > 0) {
        let needInitLanguage = false;
        let needInitEpisode = false;

        // 只有在没有初始设置增语言时才自动选择
        const firstLanguage = availableLanguages[0];
        if (selectedLanguage === "" && !initialLanguage) {
          needInitLanguage = true;
          setSelectedLanguage(firstLanguage);
          console.log("初始化 - 设置第一个可用语言:", firstLanguage);
        }

        // 只有在没有初始设置集数时才自动选择
        const firstEpisode = availableEpisodes[0];
        if (selectedEpisode === null && initialEpisode === undefined) {
          needInitEpisode = true;
          setSelectedEpisode(firstEpisode);
          console.log("初始化 - 设置第一个可用集数:", firstEpisode);
        }

        // setTranslationEditorData((prev) => ({
        //   ...prev,
        //   selectedLanguage: firstLanguage,
        //   selectedEpisode: firstEpisode
        // }));

        // 标记初始化完成
        initializedRef.current = true;

        // 如果我们初始化了某一个选项，将其设置为上次选择的值，避免触发回调
        if (needInitLanguage || needInitEpisode) {
          const language = needInitLanguage
            ? availableLanguages[0]
            : selectedLanguage;
          const episode = needInitEpisode
            ? availableEpisodes[0]
            : selectedEpisode;
          lastSelectionRef.current = { language, episode };
        }
      }
    }, [
      availableLanguages,
      availableEpisodes,
      selectedLanguage,
      selectedEpisode,
      initialLanguage,
      initialEpisode,
    ]);

    // 筛选后的结果 - 必须在useEffect之前定义
    const filteredResults = useMemo(() => {
      return results.filter((result) => {
        // 如果未选择语言或集数，则不进行筛选
        if (!selectedLanguage || selectedEpisode === null) return true;

        const languageMatch = result.language === selectedLanguage;
        const episodeMatch = result.episode === selectedEpisode;
        return languageMatch && episodeMatch;
      });
    }, [results, selectedLanguage, selectedEpisode]);

    // 语言或集数变更时显示提示信息并通知父组件
    useEffect(() => {
      // 如果没有选择或没有初始化完成，则跳过
      if (
        !selectedLanguage ||
        selectedEpisode === null ||
        !initializedRef.current
      )
        return;

      // 在控制台显示筛选信息
      const filteredCount = filteredResults.length;
      console.log(
        `当前筛选: 语言=${selectedLanguage}, 集数=${selectedEpisode}, 找到${filteredCount}条翻译结果`
      );

      // 只在选择真正变化时才通知父组件
      const lastSelection = lastSelectionRef.current;
      if (
        onSelectionChange &&
        (lastSelection.language !== selectedLanguage ||
          lastSelection.episode !== selectedEpisode)
      ) {
        // 使用简单的函数而不是防抖函数，避免复杂度
        notifySelectionChange(selectedLanguage, selectedEpisode);
      }
    }, [
      selectedLanguage,
      selectedEpisode,
      filteredResults,
      notifySelectionChange,
    ]);

    // 更新翻译结果属性
    const updateResult = (
      id: string,
      field: keyof TranslationResult,
      value: any
    ) => {
      const updatedResults = results.map((result) =>
        result.id === id ? { ...result, [field]: value } : result
      );
      setResults(updatedResults);

      // 将更新后的结果立即同步到父组件
      onSave(updatedResults);
      console.log(`更新翻译结果 ${id} 的 ${field} 字段，新值:`, value);
    };

    // 删除翻译结果
    const deleteResult = (id: string) => {
      const updatedResults = results.filter((result) => result.id !== id);
      setResults(updatedResults);

      // 将更新后的结果立即同步到父组件
      onSave(updatedResults);
      console.log(`删除翻译结果: ${id}`);
    };

    // 添加翻译结果（可在指定位置插入）
    const addResult = (index = results.length) => {
      // 确定新结果的位置索引
      const insertIndex = index;

      // 创建新的翻译结果
      const newResult: TranslationResult = {
        id: `translation-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        startTime: "00:00:00,000",
        endTime: "00:00:00,000",
        originalText: "请输入原文...",
        translatedText: "请输入翻译...",
        language:
          selectedLanguage ||
          (availableLanguages.length > 0 ? availableLanguages[0] : "英语"), // 使用当前选中的语言或第一个可用语言
        episode:
          selectedEpisode !== null
            ? selectedEpisode
            : availableEpisodes.length > 0
            ? availableEpisodes[0]
            : 1, // 使用当前选中的集数或第一个可用集数
      };

      // 创建更新后的结果数组
      const updatedResults = [
        ...results.slice(0, insertIndex),
        newResult,
        ...results.slice(insertIndex),
      ];

      // 更新本地状态
      setResults(updatedResults);

      // 将更新后的结果立即同步到父组件
      onSave(updatedResults);

      console.log(
        `已添加新的翻译结果，语言: ${newResult.language}, 集数: ${
          newResult.episode
        }, 位置: ${insertIndex + 1}/${results.length + 1}`
      );
    };

    // 保存所有翻译结果
    const handleSave = () => {
      onSave(results);
    };

    // 导出为SRT文件
    const exportSRT = () => {
      // 获取选中的语言和集数，或使用默认值
      const langToUse =
        selectedLanguage ||
        (availableLanguages.length > 0 ? availableLanguages[0] : "");
      const episodeToUse =
        selectedEpisode !== null
          ? selectedEpisode
          : availableEpisodes.length > 0
          ? availableEpisodes[0]
          : null;

      // 确保有语言和集数可用
      if (!langToUse || episodeToUse === null) {
        toast.error("没有可用的语言或集数");
        return;
      }

      // 筛选当前语言和集数的结果
      const filteredSRTResults = results.filter((result) => {
        return result.language === langToUse && result.episode === episodeToUse;
      });

      // 检查是否有筛选后的结果
      if (filteredSRTResults.length === 0) {
        toast.error(
          `当前语言(${langToUse})和集数(${episodeToUse})下没有可导出的结果`
        );
        return;
      }

      try {
        // 生成SRT内容
        let srtContent = "";

        // 对结果按照开始时间排序
        const sortedResults = [...filteredSRTResults].sort((a, b) => {
          return a.startTime.localeCompare(b.startTime);
        });

        // 生成SRT格式内容
        sortedResults.forEach((result, index) => {
          // SRT序号
          srtContent += `${index + 1}\n`;
          // 时间码
          srtContent += `${result.startTime.replace(
            ",",
            "."
          )} --> ${result.endTime.replace(",", ".")}\n`;
          // 翻译内容
          srtContent += `${result.translatedText}\n\n`;
        });

        // 创建Blob对象
        const blob = new Blob([srtContent], {
          type: "text/plain;charset=utf-8",
        });

        let currentTaskData = localStorage.getItem("currentTaskData");
        if (currentTaskData) {
          currentTaskData = JSON.parse(currentTaskData);
        }
        let taskName =
          currentTaskData?.resources?.file_set_name || "未命名任务";

        // 创建临时下载链接
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${taskName}_${langToUse}_第${episodeToUse}集_字幕.srt`;

        // 模拟点击下载
        document.body.appendChild(a);
        a.click();

        // 清理
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);

        toast.success(
          `已导出 ${selectedLanguage} 第${selectedEpisode}集 的字幕文件`
        );
      } catch (error) {
        console.error("导出SRT文件失败:", error);
        toast.error("导出SRT文件失败");
      }
    };

    // 导入SRT文件
    const importSRT = () => {
      // 创建文件输入元素
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".srt";

      // 处理文件选择
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
              try {
                // 解析SRT内容
                const srtEntries = parseSrtContent(content);

                if (srtEntries.length > 0) {
                  // 弹出语言和集数选择对话框
                  const language = prompt(
                    "请输入字幕语言 (例如: 英语, 日语, 法语)",
                    selectedLanguage || "英语"
                  );
                  if (!language) return; // 用户取消

                  const episodeInput = prompt(
                    "请输入集数 (数字)",
                    selectedEpisode?.toString() || "1"
                  );
                  if (!episodeInput) return; // 用户取消

                  const episode = parseInt(episodeInput, 10);
                  if (isNaN(episode)) {
                    toast.error("请输入有效的集数");
                    return;
                  }

                  // 创建新的翻译结果
                  const newResults: TranslationResult[] = [];

                  // 将解析的SRT条目转换为翻译结果
                  srtEntries.forEach((entry, index) => {
                    newResults.push({
                      id: `imported-${Date.now()}-${index}`,
                      startTime: entry.startTime,
                      endTime: entry.endTime,
                      originalText: "", // 导入的SRT没有原文
                      translatedText: entry.originalText || "",
                      language: language,
                      episode: episode,
                    });
                  });

                  // 获取原有的当前语言和集数的数据，以便保留原文内容
                  const originalItems = results.filter(
                    (item) =>
                      item.language === language && item.episode === episode
                  );

                  // 创建一个映射来快速查找相同时间戳的原文内容
                  const originalTextsMap = new Map();
                  originalItems.forEach((item) => {
                    // 使用时间戳作为键
                    const timeKey = `${item.startTime}-${item.endTime}`;
                    originalTextsMap.set(timeKey, item.originalText);
                  });

                  // 使用原文内容更新新导入的结果
                  const updatedNewResults = newResults.map((item) => {
                    const timeKey = `${item.startTime}-${item.endTime}`;
                    const originalText =
                      originalTextsMap.get(timeKey) || item.originalText;
                    return { ...item, originalText };
                  });

                  // 过滤掉原数据中与新导入数据相同语言和集数的部分
                  const filteredResults = results.filter(
                    (item) =>
                      !(item.language === language && item.episode === episode)
                  );

                  // 然后，将新数据与过滤后的原数据合并
                  const updatedResults = [
                    ...filteredResults,
                    ...updatedNewResults,
                  ];
                  setResults(updatedResults);

                  // 更新选择
                  setSelectedLanguage(language);
                  setSelectedEpisode(episode);

                  // 通知父组件
                  onSave(updatedResults);

                  toast.success(`成功导入 ${newResults.length} 条翻译结果`);
                } else {
                  toast.error("未能从SRT文件中解析到有效内容");
                }
              } catch (error) {
                console.error("导入SRT文件解析失败:", error);
                toast.error("SRT文件解析失败");
              }
            }
          };
          reader.readAsText(file, "UTF-8");
        }
      };
      input.click();
    };

    return (
      <div className="space-y-4 p-4">
        {results.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            没有翻译结果数据，点击下方"添加翻译"按钮创建
            <div className="mt-4">
              <Button onClick={() => addResult()} variant="outline" size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                添加翻译
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium">语言:</label>
                <Select
                  value={selectedLanguage}
                  onValueChange={(value) => {
                    // 只在值变化时才更新
                    if (value !== selectedLanguage) {
                      setSelectedLanguage(value);
                      // 注意: 不需要在这里直接通知父组件
                      // 我们在useEffect中统一处理选择变化通知
                    }
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="选择语言" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium">集数:</label>
                <Select
                  value={selectedEpisode?.toString() || ""}
                  onValueChange={(value) => {
                    // 先解析值
                    if (value) {
                      const numValue = parseInt(value);
                      if (!isNaN(numValue) && numValue !== selectedEpisode) {
                        setSelectedEpisode(numValue);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="选择集数" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEpisodes.map((episode) => (
                      <SelectItem key={episode} value={episode.toString()}>
                        第{episode}集
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredResults.map((result, index) => (
              <div key={result.id || `translate_subtitle-${index}`}>
                {/* 翻译结果条目 */}
                <div className="p-3 border rounded-md relative group mb-1">
                  {/* 删除按钮 */}
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => deleteResult(result.id)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      <span className="sr-only">删除</span>
                    </Button>
                  </div>

                  {/* 单行展示：序号、时间信息、原文和翻译内容 */}
                  <div className="flex flex-col md:flex-row items-start gap-3">
                    <div className="font-medium text-sm text-muted-foreground w-8">
                      #{index + 1}
                    </div>
                    <div className="flex-1 flex flex-col md:flex-row items-start gap-4 w-full">
                      {/* 时间信息 */}
                      <div className="flex items-center gap-2 min-w-[240px]">
                        <div className="w-[115px]">
                          <div className="text-xs text-muted-foreground">
                            开始时间
                          </div>
                          <Input
                            // value={result.startTime}
                            // onChange={(e) =>
                            //   updateResult(
                            //     result.id,
                            //     "startTime",
                            //     e.target.value
                            //   )
                            // }
                            id={`translation-${result.id || index}`}
                            // defaultValue 用于非受控模式，避免输入时卡顿
                            defaultValue={result.startTime.replace(
                              /\\n/g,
                              "\n"
                            )}
                            // 移除 onChange
                            onBlur={
                              (
                                e // <--- 修改为 onBlur
                              ) =>
                                updateResult(
                                  result.id,
                                  "startTime",
                                  e.target.value.replace(/\n/g, "\\n")
                                ) // 保存时转换回\\n
                            }
                            placeholder="00:00:00,000"
                            className="text-sm h-8"
                          />
                        </div>
                        <div className="w-[115px]">
                          <div className="text-xs text-muted-foreground">
                            结束时间
                          </div>
                          <Input
                            // value={result.endTime}
                            // onChange={(e) =>
                            //   updateResult(result.id, "endTime", e.target.value)
                            // }
                            id={`translation-${result.id || index}`}
                            // defaultValue 用于非受控模式，避免输入时卡顿
                            defaultValue={result.endTime.replace(/\\n/g, "\n")}
                            // 移除 onChange
                            onBlur={
                              (
                                e // <--- 修改为 onBlur
                              ) =>
                                updateResult(
                                  result.id,
                                  "endTime",
                                  e.target.value.replace(/\n/g, "\\n")
                                ) // 保存时转换回\\n
                            }
                            placeholder="00:00:00,000"
                            className="text-sm h-8"
                          />
                        </div>
                      </div>

                      {/* 原文和翻译内容 */}
                      <div className="flex flex-col md:flex-row gap-4 w-full">
                        {/* 原文内容 */}
                        <div className="flex-1 min-w-[200px] w-full">
                          <div className="text-xs text-muted-foreground mb-1 font-medium">
                            原文内容
                          </div>
                          <div className="p-2 bg-gray-50 rounded border text-sm whitespace-pre-wrap">
                            {result.originalText}
                          </div>
                        </div>

                        {/* 翻译内容 */}
                        <div className="flex-1 min-w-[200px] w-full">
                          <div className="text-xs text-muted-foreground mb-1 font-medium">
                            翻译内容
                          </div>
                          <Textarea
                            // value={result.translatedText}
                            // onChange={(e) =>
                            //   updateResult(
                            //     result.id,
                            //     "translatedText",
                            //     e.target.value
                            //   )
                            // }
                            id={`translation-${result.id || index}`}
                            // defaultValue 用于非受控模式，避免输入时卡顿
                            defaultValue={result.translatedText.replace(
                              /\\n/g,
                              "\n"
                            )}
                            // 移除 onChange
                            onBlur={
                              (
                                e // <--- 修改为 onBlur
                              ) =>
                                updateResult(
                                  result.id,
                                  "translatedText",
                                  e.target.value.replace(/\n/g, "\\n")
                                ) // 保存时转换回\\n
                            }
                            placeholder="输入翻译内容..."
                            className="text-sm w-full resize-y"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 翻译结果之间的插入按钮 */}
                <div className="h-4 relative group">
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      onClick={() => addResult(index + 1)}
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 rounded-full bg-white shadow-sm border-dashed"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      <span className="sr-only">在此处插入翻译结果</span>
                    </Button>
                  </div>
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-gray-200 group-hover:border-gray-400 transition-colors"></div>
                </div>
              </div>
            ))}

            {/* 添加翻译按钮（在底部） */}
            <div className="mt-4 flex justify-center">
              <Button onClick={() => addResult()} variant="outline" size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                添加翻译
              </Button>
            </div>
          </div>
        )}

        {/* 隐藏的保存按钮，由弹窗底部按钮触发 */}
        <div className="hidden">
          <Button
            onClick={handleSave}
            id="translation-editor-save"
            className="translation-editor-save-button"
          >
            保存
          </Button>
        </div>

        {/* 底部工具栏与状态信息 */}
        <div className="border-t mt-8 pt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            当前语言:{" "}
            <span className="font-medium">{selectedLanguage || "所有"}</span> |
            当前集数:{" "}
            <span className="font-medium">
              {selectedEpisode !== null ? `第${selectedEpisode}集` : "所有"}
            </span>{" "}
            | 显示:{" "}
            <span className="font-medium">{filteredResults.length}</span> /{" "}
            <span className="text-muted-foreground">{results.length}</span>
          </div>
          <Button
            onClick={() => addResult()}
            variant="outline"
            size="sm"
            className="ml-auto mr-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            添加翻译
          </Button>
        </div>
      </div>
    );
  };

  // 使用防抖函数处理确认操作，避免重复触发
  const debouncedConfirm = debounce(async (taskId) => {
    console.log(`调用确认接口，任务ID: ${taskId}, ${confirmActionType}`);
    if (!taskId) {
      console.warn("无法确认工作流步骤: 缺少任务ID");
      return false; // 返回操作结果
    }

    try {
      // 显示加载提示
      const loadingToast = toast.loading("正在提交确认信息...");

      let taskData = localStorage.getItem("currentTaskData");
      taskData = taskData ? JSON.parse(taskData) : {};

      // 引入工作流服务
      const workflowService = (await import("@/services/workflow-service"))
        .default;

      let flowId = null;
      if (confirmActionType === "extract") {
        flowId = taskData?.task_flows?.[2]?.id;
      } else if (confirmActionType === "localize") {
        if (taskType === "srt_translation") {
          flowId = taskData?.task_flows?.[1]?.id;
        } else {
          flowId = taskData?.task_flows?.[3]?.id;
        }
      } else if (confirmActionType === "translate") {
        flowId = taskData?.task_flows?.[4]?.id;
      }

      console.log(`调用确认接口，任务ID: ${taskId}, ${flowId}`);
      // 调用确认接口
      const response = await workflowService.confirmWorkflowStep(
        taskId,
        flowId
      );
      console.log("确认接口响应:", response);

      // 关闭加载提示
      toast.dismiss(loadingToast);

      // 检查响应状态
      if (response && response.success) {
        toast.success("确认成功");
        return true; // 操作成功
      } else {
        // 如果接口调用失败，显示错误提示
        toast.error(`确认接口调用失败: ${response?.error || "未知错误"}`);
        return false; // 操作失败
      }
    } catch (error) {
      console.error("确认接口调用错误:", error);
      toast.error(
        `确认接口调用出错: ${
          error instanceof Error ? error.message : "未知错误"
        }`
      );
      return false; // 操作失败
    }
  }, 500);

  // 确认并进入下一步
  const confirmAndContinue = async () => {
    // 关闭确认对话框
    setShowConfirmDialog(false);

    console.log(
      `执行确认操作: 步骤ID ${confirmStepId}, 操作类型 ${confirmActionType}`
    );

    // 定义刷新函数
    const refreshTaskData = async () => {
      console.log("确认并继续 刷新: ", taskId);
      if (!taskId) return;

      try {
        // 使用任务服务获取最新数据
        const response = await taskService.getTask(taskId);
        console.log("定确认并继续 刷新数据响应:", response);

        if (response && response.success) {
          // 触发任务状态更新事件
          const taskStatusEvent = new CustomEvent("taskStatusUpdated", {
            detail: {
              taskId,
              taskData: response.data,
            },
          });
          window.dispatchEvent(taskStatusEvent);
        }
      } catch (error) {
        console.error("定时刷新任务数据失败:", error);
      }
    };
    setTimeout(refreshTaskData, 1000);

    // 单独处理 字幕擦除 确认操作
    if (confirmActionType === "removesrt") {
      let taskData = localStorage.getItem("currentTaskData");
      taskData = taskData ? JSON.parse(taskData) : {};
      console.log('taskData:', taskData)
      let confirmStepId = taskData?.task_flows[0].id || null;
      const confirmRemoveSrtResponse = await workflowService.confirmRemoveSrt(confirmStepId);
      removeSrtConfirm = true;
      // refreshTaskData();
      // processStep("extract_srt");
      return
    }

    // 根据确认的步骤ID判断是否需要确认特定步骤
    // 如果有确认步骤ID，使用步骤ID，否则使用当前任务ID
    const idToConfirm = taskId || confirmStepId;

    // 使用防抖处理的确认函数
    const confirmSuccess = await debouncedConfirm(idToConfirm);

    // 根据步骤ID找到相应的步骤
    const stepToConfirm = confirmStepId
      ? steps.find((step) => step.id === confirmStepId)
      : steps[currentStepIndex];

    // 如果没有找到步骤，使用当前步骤
    const currentStep = stepToConfirm || steps[currentStepIndex];
    if (!currentStep) return;

    // 无论接口成功与否，都继续流程 - 但记录步骤确认状态
    console.log(
      `步骤「${currentStep.title}」确认${
        confirmSuccess ? "成功" : "失败但继续流程"
      }`
    );

    // // 更新当前步骤为已完成
    // setSteps((prev) =>
    //   prev.map((step) =>
    //     step.id === currentStep.id
    //       ? { ...step, status: "completed" as const }
    //       : step
    //   )
    // );

    // // 添加用户消息
    // setChatMessages((prev) => [
    //   ...prev,
    //   {
    //     id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    //     sender: "user",
    //     content: `我已确认「${currentStep.title}」的结果，请继续下一步`,
    //     timestamp: new Date(),
    //     type: "info",
    //   },
    // ]);

    // // 检查步骤是否已经存在，避免重复添加
    // const isStepExists = (stepId) => {
    //   return steps.some(
    //     (step) => step.id === stepId && step.status !== "not-started"
    //   );
    // };

    // // 自动进入下一步骤处理
    // const nextStepIndex = currentStepIndex + 1;
    // if (nextStepIndex < steps.length) {
    //   // 获取下一步骤信息
    //   const nextStep = steps[nextStepIndex];

    //   // 检查步骤是否已存在，避免重复显示
    //   if (isStepExists(nextStep.id)) {
    //     console.log(`步骤「${nextStep.title}」已存在，跳过重复添加`);
    //     // 继续处理下一个步骤
    //     if (nextStepIndex + 1 < steps.length) {
    //       // 更新当前步骤索引到下下个步骤
    //       setCurrentStepIndex(nextStepIndex + 1);
    //       const skipToStep = steps[nextStepIndex + 1];
    //       // 继续处理
    //       addSystemMessage(
    //         `步骤「${nextStep.title}」已处理，继续「${skipToStep.title}」。${skipToStep.description}`,
    //         "info"
    //       );
    //       setTimeout(() => processStep(skipToStep.id), 10);
    //     } else {
    //       // 所有步骤已完成
    //       addSystemMessage("所有处理步骤已完成！", "info");
    //     }
    //     return;
    //   }

    //   // 更新当前步骤索引
    //   setCurrentStepIndex(nextStepIndex);

    //   // 添加引导消息
    //   addSystemMessage(
    //     `现在开始「${nextStep.title}」。${nextStep.description}`,
    //     "info"
    //   );

    //   // 自动开始处理下一步骤 - 增加延迟，确保UI更新完成
    //   //   setTimeout(() => {
    //   processStep(nextStep.id);
    //   //   }, 1500);
    // } else {
    //   // 所有步骤已完成
    //   addSystemMessage("所有处理步骤已完成！", "info");
    // }
  };

  // 开始处理当前步骤
  const startCurrentStep = () => {
    const currentStep = steps[currentStepIndex];
    if (currentStep && currentStep.status !== "completed") {
      console.log(`开始处理步骤「${currentStep.title}」`);
      processStep(currentStep.id);
    }
  };

  // 处理步骤确认并继续下一步
  const handleConfirmStep = (messageId: string) => {
    // 找到对应的消息和相关步骤
    const message = chatMessages.find((msg) => msg.id === messageId);
    if (!message || !message.relatedStep) return;

    const stepId = message.relatedStep;
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentStep = steps[stepIndex];

    if (!currentStep) return;

    // 标记步骤为已完成
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status: "completed" as const } : step
      )
    );

    // 更新消息
    setChatMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, hasAction: false } : msg
      )
    );

    // 添加确认消息
    setChatMessages((prev) => [
      ...prev,
      {
        id: `user-confirm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sender: "user",
        content: `我已确认「${currentStep.title}」的结果，继续下一步`,
        timestamp: new Date(),
        type: "info",
      },
    ]);

    // 自动进入下一步骤处理
    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex < steps.length) {
      // 更新当前步骤索引
      setCurrentStepIndex(nextStepIndex);

      // 获取下一步骤信息
      const nextStep = steps[nextStepIndex];

      // 添加引导消息
      addSystemMessage(
        `现在开始「${nextStep.title}」。${nextStep.description}`,
        "info"
      );

      // 自动开始处理下一步骤
      //   setTimeout(() => {
      console.log(`开始处理步骤----------1-----------「${nextStep.title}」`);
      processStep(nextStep.id);
      //   }, 1000);
    }
  };

  // 添加执行日志和更新进度的辅助函数
  let logCounter = 0; // 用于生成唯一ID的计数器
  let messageCounter = 0; // 用于生成唯一消息ID的计数器

  const addExecutionLog = (
    stepId: string,
    message: string,
    type: ExecutionLogItem["type"],
    progress?: number
  ) => {
    const logItem: ExecutionLogItem = {
      id: `log-${Date.now()}-${logCounter++}`,
      stepId,
      timestamp: new Date(),
      message,
      type,
      progress,
    };

    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? {
              ...step,
              executionLogs: [...(step.executionLogs || []), logItem],
              progress: progress !== undefined ? progress : step.progress,
            }
          : step
      )
    );

    return logItem.id;
  };

  // 更新进度
  const updateStepProgress = (stepId: string, progress: number) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, progress } : step))
    );
  };

  // 生成步骤执行指令模拟函数
  const generateExecutionCommands = (stepId: string): string[] => {
    const commandSets: Record<string, string[]> = {
      extract_srt: [
        "正在加载视频文件...",
        "初始化OCR引擎，加载模型...",
        "分析视频帧率和时长...",
        "提取关键帧进行OCR处理...",
        "应用文本识别算法...",
        "整合时间码信息...",
        "生成SRT格式字幕...",
        "执行字幕时间校准...",
        "清理识别结果中的噪声...",
        "保存字幕文件...",
      ],
      localize_terms: [
        "载入字幕文件...",
        "分析文本语言特性...",
        "识别固有名词和专有名词...",
        "提取文化特定元素...",
        "建立本土化清单...",
        "关联文化背景知识...",
        "生成本土化指南...",
        "标记需要特殊处理的字符...",
        "检查本土化冲突...",
        "保存本土化清单...",
      ],
      translate_subtitle: [
        "载入本土化清单和原始字幕...",
        "应用多语言翻译模型...",
        "处理专有名词和特殊术语...",
        "维持原文格式和结构...",
        "调整翻译后文本长度...",
        "优化译文表达流畅度...",
        "应用语境相关的语气调整...",
        "添加必要的翻译注释...",
        "执行双语对照检查...",
        "生成最终翻译结果...",
      ],
      video_rendering: [
        "载入原始视频文件...",
        "加载字幕和翻译文件...",
        "计算字幕显示位置...",
        "调整字幕样式和大小...",
        "处理特效字幕...",
        "同步音频和字幕时间...",
        "渲染字幕到视频帧...",
        "应用视频压缩算法...",
        "输出多格式视频文件...",
        "执行质量控制检查...",
      ],
      remove_srt: [
        "准备下载文件元数据...",
        "创建下载包...",
        "打包字幕和视频文件...",
        "生成校验和...",
        "应用压缩算法减小文件大小...",
        "创建多语言版本下载链接...",
        "测试下载链接有效性...",
        "计算预计下载时间...",
        "配置下载授权...",
        "生成下载报告...",
      ],
    };

    return commandSets[stepId] || ["处理中...", "执行任务...", "完成处理..."];
  };

  // 在组件挂载后自动开始第一个步骤
  useEffect(() => {
    // 延迟一小段时间后开始第一个步骤(字幕提取)
    // const timer = setTimeout(() => {
    //   processStep("extract_srt");
    // }, 1000);
    // 清除定时器
    // return () => clearTimeout(timer);
  }, []);

  // 每分钟自动刷新工作流数据
  useEffect(() => {
    // 如果没有任务ID或者还未加载数据，不启动定时器
    if (!taskId) return;

    console.log("启动自动刷新定时器，每分钟刷新一次工作流数据");

    // 定义刷新函数
    const refreshTaskData = async () => {
      console.log("定时器触发，刷新任务数据: ", taskId);
      if (!taskId) return;

      try {
        // 使用任务服务获取最新数据
        const response = await taskService.getTask(taskId);
        console.log("定时器获取数据响应:", response);

        if (response && response.success) {
          // 触发任务状态更新事件
          const taskStatusEvent = new CustomEvent("taskStatusUpdated", {
            detail: {
              taskId,
              taskData: response.data,
            },
          });
          window.dispatchEvent(taskStatusEvent);
        }
      } catch (error) {
        console.error("定时刷新任务数据失败:", error);
      }
    };

    // 启动定时器，每180秒执行一次
    refreshTaskDataInterval = setInterval(refreshTaskData, 180000); // 180000毫秒 = 3分钟
    console.log("定时器已创建:", refreshTaskDataInterval);

    // 组件卸载时清除定时器
    return () => {
      console.log("清除自动刷新定时器");
      if (refreshTaskDataInterval) {
        clearInterval(refreshTaskDataInterval);
        refreshTaskDataInterval = null;
      }
    };
  }, [taskId]); // 仅在taskId变化时重新设置定时器

  // 显示确认对话框 - 增强版，支持传入步骤ID和操作类型
  const showConfirmationDialog = (stepId: string, actionType?: string) => {
    console.log(
      `显示确认对话框: 步骤 ${stepId}, 操作类型 ${actionType || "未指定"}`
    );

    // 保存步骤ID和操作类型
    setConfirmStepId(stepId);
    setConfirmActionType(actionType || "");

    // 显示确认对话框
    setShowConfirmDialog(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部信息 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold mb-2">任务详情</h2>
        {/* 联系我们组件 */}
        <div className="mt-4">
          <Button
            onClick={() => {
              console.log('taskData', taskData)
              let contactUrl = `https://ceex7z9m67.feishu.cn/share/base/form/shrcnlfrSbRqiveMohh1bJxNOgc??prefill_id=${taskData?.task_uuid}&hide_id=1`
              window.open(contactUrl);
            }}
            className="w-100px text-black"
            variant="outline"
          >
            联系我们
          </Button>
        </div>
        </div>

        <div className="flex space-x-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
              )}
              <div
                className={`
                flex items-center px-3 py-1 rounded-full text-sm
                ${
                  currentStepIndex === index
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : step.status === "completed"
                    ? "bg-green-100 dark:bg-green-900 border-l-4 border-green-500"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                }
              `}
              >
                {step.icon}
                <span className="ml-1">{step.title}</span>
                {step.status === "completed" && (
                  <Check className="h-4 w-4 ml-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 主内容 - 使用flex布局 */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* 左侧消息区域 */}
          <div className="flex-1 overflow-y-auto p-2 border-r border-gray-200">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                } mb-4`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${
                    message.sender === "system"
                      ? "flex-row"
                      : "flex-row-reverse"
                  }`}
                >
                  {/* 头像 */}
                  <Avatar className="w-7 h-7">
                    {message.sender === "system" ? (
                      <>
                        {/* 根据关联的步骤显示不同的头像 */}
                        {message.relatedStep ? (
                          <AvatarFallback
                            className={`
                            ${
                              message.relatedStep === "system"
                                ? "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                : ""
                            }
                            ${
                              message.relatedStep === "extract_srt"
                                ? "bg-blue-100 text-blue-600"
                                : ""
                            }
                            ${
                              message.relatedStep === "localize_terms"
                                ? "bg-purple-100 text-purple-600"
                                : ""
                            }
                            ${
                              message.relatedStep === "translate_subtitle"
                                ? "bg-green-100 text-green-600"
                                : ""
                            }
                            ${
                              message.relatedStep === "video_rendering"
                                ? "bg-orange-100 text-orange-600"
                                : ""
                            }
                            ${
                              message.relatedStep === "remove_srt"
                                ? "bg-blue-100 text-blue-600"
                                : ""
                            }
                          `}
                          >
                            {message.relatedStep === "system" && "系"}
                            {message.relatedStep === "extract_srt" && "字"}
                            {message.relatedStep === "localize_terms" && "本"}
                            {message.relatedStep === "translate_subtitle" &&
                              "译"}
                            {message.relatedStep === "video_rendering" && "剪"}
                            {message.relatedStep === "remove_srt" && "机"}
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback>系</AvatarFallback>
                        )}
                      </>
                    ) : (
                      <AvatarFallback>您</AvatarFallback>
                    )}
                  </Avatar>

                  {/* 消息气泡 */}
                  <div
                    className={`
                    p-2 rounded-lg text-sm
                    ${
                      message.sender === "system"
                        ? message.type === "error"
                          ? "bg-destructive/10 text-destructive"
                          : message.type === "result"
                          ? "bg-green-100 dark:bg-green-900 border-l-4 border-green-500"
                          : message.type === "status"
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "bg-secondary"
                        : "bg-primary text-primary-foreground"
                    }
                    ${message.loading ? "animate-pulse" : ""}
                  `}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      {/* <span className="text-[10px] opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span> */}
                      {message.type === "status" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1"
                        >
                          状态更新
                        </Badge>
                      )}
                      {message.type === "result" && (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-[10px] py-0 px-1"
                        >
                          处理结果
                        </Badge>
                      )}
                    </div>
                    <div className="whitespace-pre-line">{message.content}</div>
                    {message.loading && (
                      <div className="mt-1 flex items-center">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        <span className="text-[10px]">处理中...</span>
                      </div>
                    )}

                    {/* 字幕编辑界面 */}
                    {message.showSubtitles && message.relatedStep && (
                      <div className="mt-4">
                        <Button
                          onClick={() => {
                            // 找到当前步骤的字幕集合
                            console.log(
                              "找到当前步骤的字幕集合 ",
                              steps,
                              message
                            );
                            const step = steps.find(
                              (s) => s.id === "extract_srt"
                            );
                            const stepSubtitleSets = step?.subtitleSets || [];
                            console.log(
                              "点击按钮打开字幕编辑器，字幕集合:",
                              stepSubtitleSets
                            );

                            // 确保字幕集合非空
                            if (stepSubtitleSets.length === 0) {
                              toast.error("没有找到字幕数据，请稍后再试");
                              return;
                            }

                            // 默认选择第一个字幕集
                            const initialSet = stepSubtitleSets[0];
                            console.log("选中的字幕集:", initialSet);

                            // 确保字幕数据存在
                            if (
                              !initialSet.subtitles
                            ) {
                              toast.error("选中的字幕集没有字幕数据");
                              return;
                            }

                            setEditorData({
                              isOpen: true,
                              subtitles: [...initialSet.subtitles],
                              subtitleSets: stepSubtitleSets,
                              currentSetId: initialSet.id,
                              relatedStep: message.relatedStep || null,
                            });

                            console.log("设置字幕编辑器数据:", {
                              subtitles: [...initialSet.subtitles],
                              subtitleSets: stepSubtitleSets,
                              currentSetId: initialSet.id,
                            });
                          }}
                          className="w-full text-black"
                          variant="outline"
                        >
                          编辑字幕 (
                          {steps.find((s) => s.id === "extract_srt")
                            ?.subtitleSets?.length || 0}
                          集)
                        </Button>
                      </div>
                    )}

                    {/* 本土化数据编辑界面 */}
                    {message.showLocalizationData && message.relatedStep && (
                      <div className="mt-4">
                        <Button
                          onClick={() => {
                            let currentTaskData =
                              localStorage.getItem("currentTaskData");
                            if (currentTaskData) {
                              currentTaskData = JSON.parse(currentTaskData);
                              taskType = currentTaskData?.task_type;
                            }
                            console.log(
                              "找到当前步骤的本土化数据",
                              currentStepIndex,
                              currentTaskData,
                              steps,
                              taskType
                            );
                            // 更新当前步骤的本土化数据
                            const localizationStep = steps.find(
                              (s) => s.id === "localize_terms"
                            );
                            const stepLocalizationData =
                              localizationStep?.localizationData || {
                                角色: {},
                                地名: [],
                                组织名: [],
                                文化相关: [],
                              };

                            // 获取多语言数据
                            const allLanguagesData =
                              localizationStep?.allLanguagesData || {};
                            const availableLanguages =
                              localizationStep?.availableLanguages || [];
                            const currentLanguage =
                              availableLanguages.length > 0
                                ? availableLanguages[0]
                                : "";

                            console.log(
                              "打开本土化编辑器，步骤ID:",
                              message.relatedStep
                            );
                            console.log(
                              "步骤本土化数据:",
                              stepLocalizationData
                            );
                            console.log("可用语言:", availableLanguages);
                            console.log("当前选择语言:", currentLanguage);
                            console.log("所有语言数据:", allLanguagesData);

                            // 确保数据是完整的LocalizationData结构，并创建完全独立的深拷贝
                            // 为每个实体重新生成唯一ID，避免ID冲突导致同时编辑多条
                            const deepCloneWithNewIds = (
                              entities: LocalizationEntity[]
                            ): LocalizationEntity[] => {
                              return entities.map((entity) => ({
                                ...JSON.parse(JSON.stringify(entity)),
                                // 确保每个实体都有一个真正唯一的ID
                                id: `entity-${Date.now()}-${Math.floor(
                                  Math.random() * 1000000
                                )}`,
                              }));
                            };

                            // 深度克隆角色数据，为每个角色的每个实体生成新ID
                            const clonedRoles: Record<
                              string,
                              LocalizationEntity[]
                            > = {};
                            Object.keys(
                              stepLocalizationData.角色 || {}
                            ).forEach((roleName) => {
                              clonedRoles[roleName] = deepCloneWithNewIds(
                                stepLocalizationData.角色[roleName] || []
                              );
                            });

                            const safeData = {
                              角色: clonedRoles,
                              地名: deepCloneWithNewIds(
                                stepLocalizationData.地名 || []
                              ),
                              组织名: deepCloneWithNewIds(
                                stepLocalizationData.组织名 || []
                              ),
                              文化相关: deepCloneWithNewIds(
                                stepLocalizationData.文化相关 || []
                              ),
                            };

                            console.log(
                              "处理后的本土化数据（已深度克隆并重新生成ID）:",
                              safeData
                            );

                            // 创建所有语言的安全数据
                            const safeAllLanguagesData: Record<
                              string,
                              LocalizationData
                            > = {};

                            // 如果存在多语言数据，为每种语言生成安全数据
                            if (Object.keys(allLanguagesData).length > 0) {
                              Object.keys(allLanguagesData).forEach((lang) => {
                                const langData = allLanguagesData[lang];

                                // 深度克隆角色数据，为每个角色的每个实体生成新ID
                                const clonedRoles: Record<
                                  string,
                                  LocalizationEntity[]
                                > = {};
                                Object.keys(langData.角色 || {}).forEach(
                                  (roleName) => {
                                    clonedRoles[roleName] = deepCloneWithNewIds(
                                      langData.角色[roleName] || []
                                    );
                                  }
                                );

                                safeAllLanguagesData[lang] = {
                                  角色: clonedRoles,
                                  地名: deepCloneWithNewIds(
                                    langData.地名 || []
                                  ),
                                  组织名: deepCloneWithNewIds(
                                    langData.组织名 || []
                                  ),
                                  文化相关: deepCloneWithNewIds(
                                    langData.文化相关 || []
                                  ),
                                };
                              });
                            } else {
                              // 如果没有多语言数据，至少保证当前语言有数据
                              safeAllLanguagesData[
                                currentLanguage || "默认语言"
                              ] = safeData;
                            }

                            setLocalizationEditorData({
                              isOpen: true,
                              data: safeData,
                              allLanguagesData: safeAllLanguagesData,
                              availableLanguages:
                                availableLanguages.length > 0
                                  ? availableLanguages
                                  : [currentLanguage || "默认语言"],
                              currentLanguage: currentLanguage || "默认语言",
                              relatedStep: message.relatedStep || null,
                            });

                            console.log("设置后的localizationEditorData:", {
                              isOpen: true,
                              data: safeData,
                              allLanguagesData: safeAllLanguagesData,
                              availableLanguages:
                                availableLanguages.length > 0
                                  ? availableLanguages
                                  : [currentLanguage || "默认语言"],
                              currentLanguage: currentLanguage || "默认语言",
                              relatedStep: message.relatedStep || null,
                            });
                          }}
                          className="w-full"
                          variant="outline"
                        >
                          编辑本土化清单
                        </Button>
                      </div>
                    )}

                    {/* 翻译结果编辑界面 */}
                    {message.showTranslationResults && message.relatedStep && (
                      <div className="mt-4">
                        <Button
                          onClick={() => {
                            // 不再使用steps中的数据，始终从taskData中重新解析最新的翻译数据
                            console.log(
                              "编辑翻译结果 - 检查taskData:",
                              taskData
                            );

                            let translationResults = [];

                            // 准备原文字幕数据
                            let originSrts = [];
                            if (taskData?.origin_srts) {
                              console.log(
                                "处理原文字幕数据, 类型:",
                                typeof taskData.origin_srts
                              );

                              if (typeof taskData.origin_srts === "string") {
                                try {
                                  originSrts = JSON.parse(taskData.origin_srts);
                                  console.log(
                                    "成功解析origin_srts字符串为数组:",
                                    originSrts
                                  );
                                } catch (error) {
                                  console.error(
                                    "解析origin_srts字符串失败:",
                                    error
                                  );
                                  // 如果无法解析为JSON，尝试将其包装为数组项
                                  originSrts = [
                                    {
                                      num: "1",
                                      srt_content: taskData.origin_srts,
                                    },
                                  ];
                                }
                              } else if (Array.isArray(taskData.origin_srts)) {
                                originSrts = taskData.origin_srts;
                                console.log(
                                  "使用现有的origin_srts数组:",
                                  originSrts
                                );
                              } else if (
                                typeof taskData.origin_srts === "object" &&
                                taskData.origin_srts !== null
                              ) {
                                // 如果是对象，转换为数组
                                try {
                                  const keys = Object.keys(
                                    taskData.origin_srts
                                  );
                                  originSrts = keys.map((key) => ({
                                    num: key,
                                    srt_content: taskData.origin_srts[key],
                                  }));
                                  console.log(
                                    "将origin_srts对象转换为数组:",
                                    originSrts
                                  );
                                } catch (error) {
                                  console.error(
                                    "转换origin_srts对象失败:",
                                    error
                                  );
                                }
                              }
                            }

                            // 如果taskData中有srt_list数据，始终优先使用它
                            if (
                              taskData?.srt_list &&
                              typeof taskData.srt_list === "object" &&
                              Object.keys(taskData.srt_list).length > 0
                            ) {
                              console.log(
                                "从taskData.srt_list重新解析翻译结果，并关联原文字幕"
                              );
                              translationResults =
                                parseTranslationResultsFromSrtList(
                                  taskData.srt_list,
                                  originSrts
                                );
                              console.log(
                                `从taskData.srt_list解析出${translationResults.length}条翻译结果`
                              );
                            } else {
                              // 如果没有taskData.srt_list，才尝试使用steps中的数据
                              console.log(
                                "未找到taskData.srt_list，尝试使用steps中的数据"
                              );
                              const translationStep = steps.find(
                                (s) => s.id === "translate_subtitle"
                              );
                              const stepTranslationResults =
                                translationStep?.translationResults || [];
                              console.log(
                                `从步骤中获取到${stepTranslationResults.length}条翻译结果`
                              );
                              translationResults = stepTranslationResults;
                            }

                            // 设置编辑器数据
                            setTranslationEditorData({
                              isOpen: true,
                              translationResults: [...translationResults],
                              relatedStep: message.relatedStep || null,
                            });

                            console.log(
                              `最终传递给编辑器${translationResults.length}条翻译结果数据`
                            );
                          }}
                          className="w-full text-black"
                          variant="outline"
                        >
                          编辑翻译结果
                        </Button>
                      </div>
                    )}

                    {/* 视频压制组件 */}
                    {message.showVideoProcessing && message.relatedStep && (
                      <div className="mt-4">
                        <Button
                          onClick={() => {
                            setVideoProcessingData({
                              isOpen: true,
                              stepId: message.relatedStep || null,
                            });
                          }}
                          className="w-full"
                          variant="outline"
                        >
                          视频压制
                        </Button>
                      </div>
                    )}

                    {/* 视频下载组件 */}
                    {message.showVideoDownload && message.relatedStep && (
                      <div className="mt-4">
                        <Button
                          onClick={() => {
                            setVideoDownloadData({
                              isOpen: true,
                              stepId: message.relatedStep || null,
                            });
                            const videoUrlsData = taskData.video_urls || {}; // 新结构是对象  
                            const result = workflowTool.analyzeVideoUrls(videoUrlsData);
                            setVideoUrlsAnalysisResult(result);
                          }}
                          className="w-full"
                          variant="outline"
                        >
                          下载文件
                        </Button>
                      </div>
                    )}

                    {/* 联系我们组件 */}
                    {message.showContactUs && message.relatedStep && (
                      <div className="mt-4">
                        <Button
                          onClick={() => {
                            window.open(
                              "https://ceex7z9m67.feishu.cn/share/base/form/shrcnmSHfAbYrFLsSeIrktEuYGf"
                            );
                          }}
                          className="w-full text-black"
                          variant="outline"
                        >
                          联系我们
                        </Button>
                      </div>
                    )}

                    {/* 添加确认按钮到消息内部 - 根据上下文区分不同操作类型 */}
                    {message.hasAction && (
                      <div className="mt-4 flex justify-end gap-2">
                        {/* 根据当前步骤和操作类型判断是否显示确认按钮 */}
                        {((currentStepIndex === 0 &&
                          message.actionType === "extract") || (currentStepIndex === 0 &&
                            message.actionType === "removesrt") ||
                          (currentStepIndex === 0 &&
                            message.actionType === "localize") ||
                          (currentStepIndex === 1 &&
                            message.actionType === "localize") ||
                          (currentStepIndex === 2 &&
                            message.actionType === "translate")) && (
                          <Button
                            onClick={() =>
                              showConfirmationDialog(
                                message.relatedStep || "",
                                message.actionType
                              )
                            }
                            variant="default"
                            className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1"
                            data-step-id={message.relatedStep || ""}
                            data-action-type={message.actionType || ""}
                          >
                            {message.actionType === "translate" &&
                              currentStepIndex === 2 && (
                                <>
                                  <Languages className="h-4 w-4" />
                                  确认翻译并继续
                                </>
                              )}
                              {message.actionType === "removesrt" &&
                                currentStepIndex === 0 && (
                                  <>
                                    <FileText className="h-4 w-4" />
                                    确认擦除字幕并继续
                                  </>
                                )}
                            {message.actionType === "extract" &&
                              currentStepIndex === 0 && (
                                <>
                                  <FileText className="h-4 w-4" />
                                  确认提取结果并继续
                                </>
                              )}
                            {message.actionType === "localize" &&
                              currentStepIndex === 1 && (
                                <>
                                  <Globe className="h-4 w-4" />
                                  确认本土化内容并继续
                                </>
                              )}
                            {message.actionType === "localize" &&
                              currentStepIndex === 0 && (
                                <>
                                  <Globe className="h-4 w-4" />
                                  确认本土化内容并继续
                                </>
                              )}
                            {!message.actionType && (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                确认并继续
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 右侧执行链路区域 */}
          <div className="w-96">
            <ExecutionLogs steps={steps} />
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="p-4 border-t">
        <div className="flex justify-between">
          <div>
            <span className="text-sm text-gray-500">
              当前步骤:{" "}
              {currentStepIndex + 1 <= steps.length
                ? currentStepIndex + 1
                : steps.length}
              /{steps.length}
            </span>
          </div>
          <div>
            {/* 隐藏"开始提取"按钮 */}
            {/* 
            <Button 
              onClick={startCurrentStep}
              disabled={steps[currentStepIndex]?.status === 'completed'}
              className="ml-2"
            >
              {currentStepIndex === 0 ? '开始提取' : '处理当前步骤'}
            </Button>
            */}
          </div>
        </div>
      </div>

      {/* 确认对话框 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmActionType === "translate" && (
                <Languages className="h-5 w-5 text-blue-500" />
              )}
              {confirmActionType === "extract" && (
                <FileText className="h-5 w-5 text-green-500" />
              )}
              {confirmActionType === "localize" && (
                <Globe className="h-5 w-5 text-purple-500" />
              )}
              {!confirmActionType && (
                <CheckCircle className="h-5 w-5 text-blue-500" />
              )}
              <span>
                {confirmActionType === "translate"
                  ? "确认翻译结果"
                  : confirmActionType === "extract"
                  ? "确认提取结果"
                  : confirmActionType === "localize"
                  ? "确认本土化内容"
                  : "确认操作"}
              </span>
            </DialogTitle>
            <DialogDescription>
              {confirmActionType === "translate"
                ? "确认当前翻译结果并继续下一步操作？"
                : confirmActionType === "extract"
                ? "确认当前提取的字幕内容并继续下一步操作？"
                : confirmActionType === "localize"
                ? "确认当前本土化内容并继续下一步操作？"
                : "您确定要确认当前操作并继续下一步吗？"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              取消
            </Button>
            <Button
              onClick={confirmAndContinue}
              className="bg-blue-500 hover:bg-blue-600"
            >
              确认并继续
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 在字幕编辑器的工具栏或其他合适位置添加 */}
      <Dialog open={isExportModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="sm:max-w-[625px]">
          <Tabs defaultValue="export" className="w-full">
            {" "}
            {/* Tabs 组件包裹 */}
            <TabsList className="grid w-full grid-cols-2 mt-4 mb-4">
              {" "}
              {/* 选项卡列表 */}
              <TabsTrigger value="export">导出原始字幕</TabsTrigger>
              <TabsTrigger value="import">导入本地字幕</TabsTrigger>
            </TabsList>
            {/* 导出选项卡内容 */}
            <TabsContent value="export">
              <DialogHeader>
                <DialogTitle>导出原始字幕文件</DialogTitle>
                <DialogDescription>
                  选择需要导出的字幕文件。点击【导出选择的文件】将下载所有选中的文件。
                </DialogDescription>
              </DialogHeader>
              {/* 保持现有的导出 UI 结构 */}
              <ScrollArea className="h-[350px] w-full rounded-md border p-4 mt-4">
                <Table>
                  {/* 表头 */}
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          id="select-all"
                          checked={
                            originSrts.length > 0 &&
                            selectedSrtIds.length === originSrts.length
                              ? true
                              : selectedSrtIds.length > 0
                              ? "indeterminate"
                              : false
                          }
                          onCheckedChange={handleSelectAllSrts}
                        />
                      </TableHead>
                      <TableHead className="w-[80px]">集数</TableHead>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>文件 (点击下载)</TableHead>
                    </TableRow>
                  </TableHeader>
                  {/* 表格内容 */}
                  <TableBody>
                    {originSrts.length > 0 ? (
                      originSrts.map((srt) => (
                        <TableRow key={srt.id}>
                          <TableCell>
                            <Checkbox
                              id={`select-${srt.id}`}
                              checked={selectedSrtIds.includes(srt.id)}
                              onCheckedChange={(checked) =>
                                handleSelectSrt(srt.id, checked)
                              }
                            />
                          </TableCell>
                          <TableCell>{srt.num ?? "-"}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {srt.id}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-left"
                              onClick={() =>
                                triggerDownload(
                                  srt.real_url,
                                  srt.url,
                                  srt.oss_key,
                                  srt.episode_num,
                                  srt.id
                                )
                              }
                              title={`点击下载: ${formatSrtFilename(
                                srt.oss_key,
                                srt.episode_num,
                                srt.id
                              )}`}
                            >
                              {formatSrtFilename(
                                srt.url,
                                srt.episode_num,
                                srt.id
                              )}
                              {/* <Download className="ml-2 h-3 w-3 inline-block" /> */}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          没有找到原始字幕文件。
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              {/* 导出页脚 */}
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    取消
                  </Button>
                </DialogClose>
                <Button
                  type="button"
                  onClick={handleExportSelectedSrts}
                  disabled={selectedSrtIds.length === 0}
                >
                  导出选择的文件 ({selectedSrtIds.length})
                </Button>
              </DialogFooter>
            </TabsContent>
            {/* 导入选项卡内容 */}
            <TabsContent value="import">
              <DialogHeader>
                <DialogTitle>导入本地 SRT 字幕文件</DialogTitle>
                <DialogDescription>
                  选择一个或多个本地 .srt
                  文件进行导入。导入会覆盖现有的对应字幕。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {" "}
                {/* 导入表单区域 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="srt-files" className="text-right">
                    选择文件
                  </Label>
                  <Input
                    id="srt-files"
                    type="file" // 文件输入类型
                    className="col-span-3"
                    accept=".srt" // 限制文件类型为 .srt
                    multiple // 允许选择多个文件
                    onChange={handleFileSelect} // 绑定文件选择处理函数
                  />
                </div>
                {/* 如果有选中的文件，则显示文件列表 */}
                {filesToImport && filesToImport.length > 0 && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">已选文件</Label>
                    <ScrollArea className="col-span-3 h-[200px] w-full rounded-md border p-2">
                      {" "}
                      {/* 滚动区域显示文件列表 */}
                      <ul className="text-sm">
                        {Array.from(filesToImport).map((file, index) => (
                          <li
                            key={index}
                            className="flex items-center space-x-2 truncate py-1"
                          >
                            {" "}
                            {/* 截断长文件名 */}
                            <List className="h-3 w-3 flex-shrink-0" />{" "}
                            {/* 文件列表图标 */}
                            <span title={file.name}>{file.name}</span>{" "}
                            {/* 显示文件名，鼠标悬停显示完整名称 */}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}
              </div>
              {/* 导入页脚 */}
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    取消
                  </Button>
                </DialogClose>
                {currentStepIndex === 0 && (
                  <Button
                    type="button"
                    onClick={handleImportSrts} // 绑定导入处理函数
                    disabled={!filesToImport || filesToImport.length === 0} // 没有文件时禁用
                  >
                    导入并更新 ({filesToImport?.length ?? 0}){" "}
                    {/* 显示选中文件数量 */}
                  </Button>
                )}
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 字幕编辑器 */}
      {editorData.isOpen && (
        <Dialog
          open={editorData.isOpen}
          onOpenChange={(open) => {
            // 关闭弹窗时打印日志
            if (!open) {
              console.log("关闭字幕编辑器弹窗");
            }
            setEditorData((prev) => ({ ...prev, isOpen: open }));
          }}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>批量字幕编辑</DialogTitle>
              <DialogDescription>
                您可以编辑下方所有字幕，完成后点击保存按钮提交所有修改。
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4">
              <SubtitleEditor
                subtitles={editorData.subtitles}
                onSave={(subtitles) => {
                  console.log("保存字幕编辑结果 onsave:", subtitles, taskData);

                  // 更新当前选中的字幕集中的字幕数据
                  if (editorData.currentSetId && editorData.subtitleSets) {
                    // 获取当前字幕集
                    const currentSet = editorData.subtitleSets.find(
                      (set) => set.id === editorData.currentSetId
                    );

                    if (currentSet && currentSet.origin_id) {
                      // 将字幕转换为SRT格式的字符串
                      const srtContent = convertSubtitlesToSrt(subtitles);
                      console.log("调用API更新字幕内容:", {
                        srt_id: currentSet.origin_id,
                        content: srtContent,
                        task_id: taskData?.id,
                      });

                      // 调用API更新字幕内容
                      workflowService
                        .updateSubtitleContent(currentSet.origin_id, srtContent, taskData?.id)
                        .then((response) => {
                          console.log("更新字幕内容成功:", response);
                          toast.success("字幕内容已成功保存到服务器");
                          refreshEditorData();
                        })
                        .catch((error) => {
                          console.error("更新字幕内容失败:", error);
                          toast.error("保存字幕内容到服务器失败");
                        });
                    }

                    // 创建更新后的字幕集合
                    const updatedSubtitleSets = editorData.subtitleSets.map(
                      (set) =>
                        set.id === editorData.currentSetId
                          ? { ...set, subtitles }
                          : set
                    );

                    // 更新步骤中的字幕集合
                    setSteps((prev) =>
                      prev.map((step) =>
                        step.id === editorData.relatedStep
                          ? { ...step, subtitleSets: updatedSubtitleSets }
                          : step
                      )
                    );
                  }

                  // 关闭字幕编辑器
                  setEditorData((prev) => ({ ...prev, isOpen: false }));
                  // 添加成功消息
                  addSystemMessage("字幕已成功保存！", "info");
                }}
              />
            </div>

            {/* 固定在底部的保存按钮 */}
            <div className="sticky bottom-0 left-0 right-0 py-3 px-4 bg-background border-t mt-2 flex justify-between items-center">
              <div className="w-64">
                <Select
                  value={editorData.currentSetId || undefined}
                  onValueChange={(value) => {
                    // 查找选择的字幕集
                    const selectedSet = editorData.subtitleSets?.find(
                      (set) => set.id === value
                    );
                    if (selectedSet) {
                      console.log("切换到字幕集:", selectedSet);
                      setEditorData((prev) => ({
                        ...prev,
                        subtitles: [...(selectedSet.subtitles || [])],
                        currentSetId: value,
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择字幕集" />
                  </SelectTrigger>
                  <SelectContent>
                    {editorData.subtitleSets?.map((set) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name} ({set.subtitles.length}条字幕)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                {/* 导出SRT按钮 */}
                {/* <Button
                  onClick={() => {
                    if (
                      editorData.subtitles &&
                      editorData.subtitles.length > 0
                    ) {
                      let currentTaskData =
                        localStorage.getItem("currentTaskData");
                      if (currentTaskData) {
                        currentTaskData = JSON.parse(currentTaskData);
                      }
                      let taskName =
                        currentTaskData?.resources?.file_set_name ||
                        "未命名任务";
                      // 将字幕转换为SRT格式
                      const srtContent = convertSubtitlesToSrt(
                        editorData.subtitles
                      );
                      // 创建Blob对象
                      const blob = new Blob([srtContent], {
                        type: "text/plain;charset=utf-8",
                      });
                      // 获取当前选择的字幕集名称
                      let fileName = "subtitles";
                      if (editorData.currentSetId && editorData.subtitleSets) {
                        const currentSet = editorData.subtitleSets.find(
                          (set) => set.id === editorData.currentSetId
                        );
                        if (currentSet && currentSet.name) {
                          fileName = currentSet.name;
                        }
                      }

                      // 创建下载链接
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${taskName}-${fileName}.srt`;
                      document.body.appendChild(a);
                      a.click();
                      // 清理
                      setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }, 100);
                      toast.success("字幕导出成功");
                    } else {
                      toast.error("没有可导出的字幕");
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs px-2"
                >
                  导出SRT
                </Button> */}

                {/* 导入SRT按钮 */}
                {/* <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".srt";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const content = e.target?.result as string;
                          if (content) {
                            try {
                              // 解析SRT内容
                              const parsedSubtitles = parseSrtContent(content);

                              // 转换为应用中使用的Subtitle格式
                              const formattedSubtitles = parsedSubtitles.map(
                                (item, index) => ({
                                  id: `subtitle-${Date.now()}-${index}`,
                                  startTime: item.startTime,
                                  endTime: item.endTime,
                                  text: item.text || "",
                                })
                              );

                              // 更新字幕编辑器中的字幕
                              setEditorData((prev) => ({
                                ...prev,
                                subtitles: formattedSubtitles,
                              }));

                              toast.success(
                                `成功导入${formattedSubtitles.length}条字幕`
                              );
                            } catch (error) {
                              console.error("导入SRT文件解析失败:", error);
                              toast.error("SRT文件解析失败");
                            }
                          }
                        };
                        reader.readAsText(file, "UTF-8");
                      }
                    };
                    input.click();
                  }}
                >
                  导入SRT
                </Button> */}

                <Button
                  onClick={() => {
                    setIsExportModalOpen(true);
                  }}
                  type="button"
                  variant="outline"
                >
                  导入/导出SRT
                </Button>

                {currentStepIndex === 0 && (
                  <Button
                    onClick={() => {
                      // 触发当前编辑器的保存操作
                      const editorSaveButton = document.querySelector(
                        "#subtitle-editor-save"
                      ) as HTMLButtonElement;
                      if (editorSaveButton) {
                        editorSaveButton.click();
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium ml-2"
                  >
                    保存当集字幕
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 本土化数据编辑器 */}
      {localizationEditorData.isOpen && (
        <Dialog
          open={localizationEditorData.isOpen}
          onOpenChange={(open) =>
            setLocalizationEditorData((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>批量本土化清单编辑</DialogTitle>
              </div>
              <DialogDescription>
                您可以编辑下方所有本土化清单，完成后点击保存按钮提交所有修改。可以使用导入/导出Excel功能批量处理数据。
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <div className="w-full flex items-center justify-end gap-2 mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    try {
                      // 获取当前语言
                      const currentLanguage =
                        localizationEditorData.currentLanguage;

                      // 获取当前选择语言的数据
                      const currentData =
                        localizationEditorData.allLanguagesData[
                          currentLanguage
                        ] || localizationEditorData.data;

                      console.log(`正在导出 ${currentLanguage} 语言的数据`);

                      // 创建工作簿
                      const wb = XLSX.utils.book_new();

                      // 设置所有工作表的列宽
                      const columnWidths = [
                        { wch: 15 }, // 角色名称/序号
                        { wch: 10 }, // 序号/原文
                        { wch: 25 }, // 原文/本土化
                        { wch: 25 }, // 本土化/注释
                        { wch: 30 }, // 注释
                      ];

                      // 对各个类别创建独立的工作表

                      // 1. 角色数据
                      const characterData = [];
                      Object.entries(currentData.角色).forEach(
                        ([character, entities]) => {
                          if (Array.isArray(entities)) {
                            entities.forEach((entity) => {
                              characterData.push({
                                角色名称: character,
                                序号: characterData.length + 1,
                                原文: entity.原文,
                                本土化: entity.本土化,
                                注释: entity.注释,
                                _id: entity.id, // 隐藏ID字段，用于导入时匹配
                              });
                            });
                          }
                        }
                      );

                      if (characterData.length > 0) {
                        const characterSheet =
                          XLSX.utils.json_to_sheet(characterData);
                        characterSheet["!cols"] = columnWidths;
                        XLSX.utils.book_append_sheet(
                          wb,
                          characterSheet,
                          "角色"
                        );
                      }

                      // 2. 地名数据
                      const placeData = [];
                      if (Array.isArray(currentData.地名)) {
                        currentData.地名.forEach((entity, index) => {
                          placeData.push({
                            序号: index + 1,
                            原文: entity.原文,
                            本土化: entity.本土化,
                            注释: entity.注释,
                            _id: entity.id,
                          });
                        });
                      }

                      if (placeData.length > 0) {
                        const placeSheet = XLSX.utils.json_to_sheet(placeData);
                        placeSheet["!cols"] = columnWidths;
                        XLSX.utils.book_append_sheet(wb, placeSheet, "地名");
                      }

                      // 3. 组织名数据
                      const organizationData = [];
                      if (Array.isArray(currentData.组织名)) {
                        currentData.组织名.forEach((entity, index) => {
                          organizationData.push({
                            序号: index + 1,
                            原文: entity.原文,
                            本土化: entity.本土化,
                            注释: entity.注释,
                            _id: entity.id,
                          });
                        });
                      }

                      if (organizationData.length > 0) {
                        const organizationSheet =
                          XLSX.utils.json_to_sheet(organizationData);
                        organizationSheet["!cols"] = columnWidths;
                        XLSX.utils.book_append_sheet(
                          wb,
                          organizationSheet,
                          "组织名"
                        );
                      }

                      // 4. 文化相关数据
                      const cultureData = [];
                      if (Array.isArray(currentData.文化相关)) {
                        currentData.文化相关.forEach((entity, index) => {
                          cultureData.push({
                            序号: index + 1,
                            原文: entity.原文,
                            本土化: entity.本土化,
                            注释: entity.注释,
                            _id: entity.id,
                          });
                        });
                      }

                      if (cultureData.length > 0) {
                        const cultureSheet =
                          XLSX.utils.json_to_sheet(cultureData);
                        cultureSheet["!cols"] = columnWidths;
                        XLSX.utils.book_append_sheet(
                          wb,
                          cultureSheet,
                          "文化相关"
                        );
                      }

                      // 检查是否有数据可导出
                      if (wb.SheetNames.length === 0) {
                        toast.error("没有可导出的数据");
                        return;
                      }

                      // 生成文件名
                      const fileName = `本土化数据_${
                        currentLanguage || "默认"
                      }_${new Date().toISOString().split("T")[0]}.xlsx`;

                      // 导出Excel文件
                      XLSX.writeFile(wb, fileName);
                      toast.success("导出所有本土化数据成功");
                    } catch (error) {
                      console.error("导出Excel失败:", error);
                      toast.error("导出失败，请重试");
                    }
                  }}
                  className="flex items-center gap-1 h-8 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出Excel</span>
                </Button>

                <input
                  type="file"
                  id="localization-excel-import"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (e) => {
                      try {
                        const data = new Uint8Array(
                          e.target?.result as ArrayBuffer
                        );
                        const workbook = XLSX.read(data, { type: "array" });

                        // 获取当前的语言和数据副本
                        const currentLanguage =
                          localizationEditorData.currentLanguage;
                        const newData = JSON.parse(
                          JSON.stringify(localizationEditorData.data)
                        );

                        // 记录是否导入了数据
                        let dataImported = false;

                        // 遍历所有工作表处理不同类别的数据
                        workbook.SheetNames.forEach((sheetName) => {
                          const worksheet = workbook.Sheets[sheetName];
                          // 将表格数据转换为JSON
                          const jsonData =
                            XLSX.utils.sheet_to_json<any>(worksheet);

                          if (jsonData.length === 0) return; // 跳过空工作表

                          dataImported = true;

                          // 根据工作表名称和数据格式判断类别
                          if (
                            sheetName === "角色" ||
                            "角色名称" in jsonData[0]
                          ) {
                            // 处理角色数据 - 创建新的角色数据对象而不是保留现有数据
                            const charactersData = {};

                            // 首先从Excel收集所有要导入的数据
                            jsonData.forEach((row) => {
                              const character = row["角色名称"] || "未分类";
                              if (!charactersData[character]) {
                                charactersData[character] = [];
                              }

                              // 创建实体对象
                              const entity = {
                                id:
                                  row["_id"] ||
                                  `entity-${Date.now()}-${Math.floor(
                                    Math.random() * 1000
                                  )}`,
                                原文: row["原文"] || "",
                                本土化: row["本土化"] || "",
                                注释: row["注释"] || "",
                              };

                              // 检查是否有相同原文的实体，避免重复
                              const existingEntity = charactersData[
                                character
                              ].find((item) => item.原文 === entity.原文);

                              if (!existingEntity) {
                                // 没有相同原文的实体，添加新实体
                                charactersData[character].push(entity);
                              }
                            });

                            // 更新角色数据 - 完全替换现有数据
                            newData.角色 = charactersData;
                            console.log("导入角色数据成功 - 避免重复");
                          } else if (sheetName === "地名") {
                            // 处理地名数据 - 只添加不重复的数据
                            const entities = [];

                            // 处理Excel文件中的每一行数据
                            jsonData.forEach((row) => {
                              const entity = {
                                id:
                                  row["_id"] ||
                                  `entity-${Date.now()}-${Math.floor(
                                    Math.random() * 1000
                                  )}`,
                                原文: row["原文"] || "",
                                本土化: row["本土化"] || "",
                                注释: row["注释"] || "",
                              };

                              // 检查是否已经有相同原文的实体
                              const existing = entities.find(
                                (item) => item.原文 === entity.原文
                              );
                              if (!existing) {
                                entities.push(entity);
                              }
                            });

                            // 更新地名数据 - 完全替换现有数据
                            newData.地名 = entities;
                            console.log("导入地名数据成功 - 避免重复");
                          } else if (sheetName === "组织名") {
                            // 处理组织名数据 - 避免重复
                            const entities = [];

                            // 处理Excel文件中的每一行数据
                            jsonData.forEach((row) => {
                              const entity = {
                                id:
                                  row["_id"] ||
                                  `entity-${Date.now()}-${Math.floor(
                                    Math.random() * 1000
                                  )}`,
                                原文: row["原文"] || "",
                                本土化: row["本土化"] || "",
                                注释: row["注释"] || "",
                              };

                              // 检查是否已经有相同原文的实体
                              const existing = entities.find(
                                (item) => item.原文 === entity.原文
                              );
                              if (!existing) {
                                entities.push(entity);
                              }
                            });

                            // 更新组织名数据 - 完全替换原有数据
                            newData.组织名 = entities;
                            console.log("导入组织名数据成功 - 避免重复");
                          } else if (sheetName === "文化相关") {
                            // 处理文化相关数据 - 避免重复
                            const entities = [];

                            // 处理Excel文件中的每一行数据
                            jsonData.forEach((row) => {
                              const entity = {
                                id:
                                  row["_id"] ||
                                  `entity-${Date.now()}-${Math.floor(
                                    Math.random() * 1000
                                  )}`,
                                原文: row["原文"] || "",
                                本土化: row["本土化"] || "",
                                注释: row["注释"] || "",
                              };

                              // 检查是否已经有相同原文的实体
                              const existing = entities.find(
                                (item) => item.原文 === entity.原文
                              );
                              if (!existing) {
                                entities.push(entity);
                              }
                            });

                            // 更新文化相关数据 - 完全替换原有数据
                            newData.文化相关 = entities;
                            console.log("导入文化相关数据成功 - 避免重复");
                          } else {
                            // 处理其他未知工作表
                            // 查找当前活动的标签页作为默认导入类别
                            const tabs =
                              document.querySelectorAll('[role="tab"]');
                            let categoryName = "角色";

                            for (const tab of tabs) {
                              if (
                                tab.getAttribute("aria-selected") === "true"
                              ) {
                                const text = tab.textContent || "";
                                if (text.includes("地名"))
                                  categoryName = "地名";
                                else if (text.includes("组织名"))
                                  categoryName = "组织名";
                                else if (text.includes("文化相关"))
                                  categoryName = "文化相关";
                                break;
                              }
                            }

                            // 如果工作表名称不是标准类别，则根据当前活动的标签页导入
                            console.log(
                              `使用当前活动标签页(${categoryName})导入非标准工作表: ${sheetName}`
                            );

                            if ("角色名称" in jsonData[0]) {
                              // 如果有角色名称字段，还是当作角色数据处理
                              const charactersData = { ...newData.角色 }; // 保留现有角色数据

                              jsonData.forEach((row) => {
                                const character = row["角色名称"] || "未分类";
                                if (!charactersData[character]) {
                                  charactersData[character] = [];
                                }

                                const entity = {
                                  id:
                                    row["_id"] ||
                                    `entity-${Date.now()}-${Math.floor(
                                      Math.random() * 1000
                                    )}`,
                                  原文: row["原文"] || "",
                                  本土化: row["本土化"] || "",
                                  注释: row["注释"] || "",
                                };

                                charactersData[character].push(entity);
                              });

                              newData.角色 = charactersData;
                            } else {
                              // 否则使用当前激活标签页确定类别
                              const entities = jsonData.map((row) => ({
                                id:
                                  row["_id"] ||
                                  `entity-${Date.now()}-${Math.floor(
                                    Math.random() * 1000
                                  )}`,
                                原文: row["原文"] || "",
                                本土化: row["本土化"] || "",
                                注释: row["注释"] || "",
                              }));

                              newData[categoryName] = entities;
                            }
                          }
                        });

                        if (!dataImported) {
                          toast.error("Excel文件无法识别或不包含有效数据");
                          return;
                        }

                        // 更新所有语言数据中的当前语言数据
                        const updatedAllLanguagesData = {
                          ...localizationEditorData.allLanguagesData,
                          [currentLanguage]: newData,
                        };

                        // 更新编辑器数据状态
                        setLocalizationEditorData((prev) => ({
                          ...prev,
                          data: newData,
                          allLanguagesData: updatedAllLanguagesData,
                        }));

                        // 更新步骤中的本土化数据
                        setSteps((prev) =>
                          prev.map((step) =>
                            step.id === localizationEditorData.relatedStep
                              ? {
                                  ...step,
                                  localizationData: newData,
                                  allLanguagesData: updatedAllLanguagesData,
                                }
                              : step
                          )
                        );

                        toast.success("导入成功");
                      } catch (error) {
                        console.error("导入Excel失败:", error);
                        toast.error("导入失败，请检查文件格式");
                      }
                    };

                    // 读取文件内容
                    reader.readAsArrayBuffer(file);

                    // 清空文件输入框，确保可以再次导入同一个文件
                    e.target.value = "";
                  }}
                  accept=".xlsx, .xls"
                  className="hidden"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const fileInput = document.getElementById(
                      "localization-excel-import"
                    );
                    if (fileInput) fileInput.click();
                  }}
                  className="flex items-center gap-1 h-8 text-xs"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>导入Excel</span>
                </Button>
              </div>
              <LocalizationEditor
                data={localizationEditorData.data}
                allLanguagesData={localizationEditorData.allLanguagesData}
                availableLanguages={localizationEditorData.availableLanguages}
                currentLanguage={localizationEditorData.currentLanguage}
                taskId={taskId || ""}
                onLanguageChange={(language) => {
                  console.log(`LocalizationEditor中切换语言到: ${language}`);
                  // 更新当前选择的语言
                  setLocalizationEditorData((prev) => ({
                    ...prev,
                    currentLanguage: language,
                  }));
                }}
                onSave={(data, language) => {
                  // 获取当前选择的语言
                  const currentLanguage =
                    language || localizationEditorData.currentLanguage;

                  // 更新所有语言数据中的当前语言数据
                  const updatedAllLanguagesData = {
                    ...localizationEditorData.allLanguagesData,
                    [currentLanguage]: data,
                  };

                  console.log(`正在保存语言 ${currentLanguage} 的本土化数据`);

                  // 更新本土化数据
                  setSteps((prev) =>
                    prev.map((step) =>
                      step.id === localizationEditorData.relatedStep
                        ? {
                            ...step,
                            localizationData: data,
                            allLanguagesData: updatedAllLanguagesData,
                          }
                        : step
                    )
                  );

                  // 关闭本土化数据编辑器
                  setLocalizationEditorData((prev) => ({
                    ...prev,
                    isOpen: false,
                  }));

                  // 添加成功消息
                  addSystemMessage(
                    `${currentLanguage} 的本土化清单已成功保存！`,
                    "info"
                  );

                  console.log(
                    `${currentLanguage} 的本土化数据已保存并提交到服务器，taskId: ${taskId}`
                  );
                }}
              />
            </div>

            {/* 固定在底部的保存按钮 */}
            <div className="sticky bottom-0 left-0 right-0 py-3 px-4 bg-background border-t mt-2 flex justify-between items-center">
              {(currentStepIndex === 1 ||
                (currentStepIndex === 0 && taskType === "srt_translation")) && (
                <Button
                  onClick={() => {
                    // 触发当前编辑器的保存操作
                    const editorSaveButton = document.querySelector(
                      ".localization-editor-save-button"
                    ) as HTMLButtonElement;
                    if (editorSaveButton) {
                      editorSaveButton.click();
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  保存本土化
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 翻译结果编辑器 */}
      {translationEditorData.isOpen && (
        <Dialog
          open={translationEditorData.isOpen}
          onOpenChange={(open) =>
            setTranslationEditorData((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>翻译结果编辑</DialogTitle>
              <DialogDescription>
                您可以编辑和管理翻译结果。编辑的内容会自动同步，完成后请点击保存按钮提交到服务器。
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4">
              <TranslationEditor
                translationResults={translationEditorData.translationResults}
                // 传递初始的语言和集数值，避免子组件自动初始化
                initialLanguage={translationEditorData.selectedLanguage}
                initialEpisode={translationEditorData.selectedEpisode}
                // 添加选择变化回调，使用条件检查避免循环
                onSelectionChange={(language, episode) => {
                  // 仅在选择真正变化时更新父组件状态
                  if (
                    language !== translationEditorData.selectedLanguage ||
                    episode !== translationEditorData.selectedEpisode
                  ) {
                    console.log(
                      `翻译编辑器选择变化: 语言=${language}, 集数=${episode}`
                    );
                    setTranslationEditorData((prev) => ({
                      ...prev,
                      selectedLanguage: language,
                      selectedEpisode: episode,
                    }));
                  }
                }}
                onSave={(updatedResults) => {
                  console.log("翻译编辑器更新结果:", updatedResults.length);
                  // 更新翻译结果
                  setTranslationEditorData((prev) => ({
                    ...prev,
                    translationResults: updatedResults,
                  }));

                  // 同时更新步骤中的翻译结果数据
                  if (translationEditorData.relatedStep) {
                    setSteps((prev) =>
                      prev.map((step) =>
                        step.id === translationEditorData.relatedStep
                          ? { ...step, translationResults: updatedResults }
                          : step
                      )
                    );
                    console.log(
                      `已更新步骤 ${translationEditorData.relatedStep} 的翻译结果数据`
                    );
                  }
                }}
                // 传递taskData以便解析SRT内容
                taskData={translationEditorData.taskData || {}}
              />
            </div>

            {/* 固定在底部的保存按钮 */}
            <div className="sticky bottom-0 left-0 right-0 py-3 px-4 bg-background border-t mt-2 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                共{" "}
                <span className="font-medium">
                  {translationEditorData.translationResults.length}
                </span>{" "}
                条翻译内容
              </div>
              <div className="flex space-x-2">
                {/* 导入SRT按钮 */}
                {/* <Button
                  variant="outline"
                  onClick={() => {
                    // 获取TranslationEditor组件的引用
                    const editorRef =
                      document.getElementById("translation-editor");
                    if (
                      editorRef &&
                      typeof (editorRef as any).importSRT === "function"
                    ) {
                      (editorRef as any).importSRT();
                    } else {
                      // 没有找到组件引用，直接创建导入功能
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".srt";
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            try {
                              // 解析SRT内容的逻辑
                              const lines = content.split(/\r?\n/);
                              const results: TranslationResult[] = [];
                              let id = 0;
                              let startTime = "";
                              let endTime = "";
                              let text = "";
                              let phase = 0;

                              for (let i = 0; i < lines.length; i++) {
                                const line = lines[i].trim();
                                if (line === "") {
                                  if (
                                    phase === 3 &&
                                    startTime &&
                                    endTime &&
                                    text
                                  ) {
                                    // 创建一个新条目
                                    const language =
                                      translationEditorData.selectedLanguage ||
                                      "英语";
                                    const episode =
                                      translationEditorData.selectedEpisode ||
                                      1;

                                    results.push({
                                      id: `imported-${Date.now()}-${id++}`,
                                      startTime: startTime.replace(".", ","),
                                      endTime: endTime.replace(".", ","),
                                      originalText: "", // 导入的SRT没有原文
                                      translatedText: text,
                                      language,
                                      episode,
                                    });
                                  }
                                  // 重置为新条目
                                  phase = 0;
                                  startTime = "";
                                  endTime = "";
                                  text = "";
                                } else if (phase === 0) {
                                  // 序号行，跳过
                                  phase = 1;
                                } else if (phase === 1) {
                                  // 时间行
                                  const times = line.split(" --> ");
                                  if (times.length === 2) {
                                    startTime = times[0];
                                    endTime = times[1];
                                  }
                                  phase = 2;
                                } else if (phase >= 2) {
                                  // 文本行
                                  if (text) text += "\n";
                                  text += line;
                                  phase = 3;
                                }
                              }

                              // 处理最后一个条目
                              if (phase === 3 && startTime && endTime && text) {
                                const language =
                                  translationEditorData.selectedLanguage ||
                                  "英语";
                                const episode =
                                  translationEditorData.selectedEpisode || 1;

                                results.push({
                                  id: `imported-${Date.now()}-${id++}`,
                                  startTime: startTime.replace(".", ","),
                                  endTime: endTime.replace(".", ","),
                                  originalText: "", // 导入的SRT没有原文
                                  translatedText: text,
                                  language,
                                  episode,
                                });
                              }

                              if (results.length > 0) {
                                // 获取语言和集数
                                const language =
                                  translationEditorData.selectedLanguage ||
                                  "英语";
                                const episode =
                                  translationEditorData.selectedEpisode || 1;

                                // 获取原有的当前语言和集数的数据，以便保留原文内容
                                const originalItems =
                                  translationEditorData.translationResults.filter(
                                    (item) =>
                                      item.language === language &&
                                      item.episode === episode
                                  );

                                // 创建一个映射来快速查找相同时间戳的原文内容
                                const originalTextsMap = new Map();
                                originalItems.forEach((item) => {
                                  // 使用时间戳作为键
                                  const timeKey = `${item.startTime}-${item.endTime}`;
                                  originalTextsMap.set(
                                    timeKey,
                                    item.originalText
                                  );
                                });

                                // 使用原文内容更新新导入的结果
                                const updatedNewResults = results.map(
                                  (item) => {
                                    const timeKey = `${item.startTime}-${item.endTime}`;
                                    const originalText =
                                      originalTextsMap.get(timeKey) ||
                                      item.originalText;
                                    return { ...item, originalText };
                                  }
                                );

                                // 过滤掉相同语言和集数的数据
                                const filteredResults =
                                  translationEditorData.translationResults.filter(
                                    (item) =>
                                      !(
                                        item.language === language &&
                                        item.episode === episode
                                      )
                                  );

                                // 更新编辑器数据，用新数据替换原有数据
                                const updatedResults = [
                                  ...filteredResults,
                                  ...updatedNewResults,
                                ];

                                setTranslationEditorData((prev) => ({
                                  ...prev,
                                  translationResults: updatedResults,
                                }));

                                // 如果有关联的步骤，也更新步骤数据
                                if (translationEditorData.relatedStep) {
                                  setSteps((prev) =>
                                    prev.map((step) =>
                                      step.id ===
                                      translationEditorData.relatedStep
                                        ? {
                                            ...step,
                                            translationResults: updatedResults,
                                          }
                                        : step
                                    )
                                  );
                                }

                                toast.success(
                                  `成功导入 ${results.length} 条翻译结果`
                                );
                              } else {
                                toast.error("未能从SRT文件中解析到有效内容");
                              }
                            } catch (error) {
                              console.error("解析SRT文件失败:", error);
                              toast.error("SRT文件解析失败");
                            }
                          };
                          reader.readAsText(file, "UTF-8");
                        }
                      };
                      input.click();
                    }
                  }}
                >
                  <Download className="mr-1 h-4 w-4" />
                  导入SRT
                </Button> */}

                {/* 导出SRT按钮 */}
                {/* <Button
                  variant="outline"
                  onClick={() => {
                    // 获取选中的语言和集数，或使用可用的第一个语言和集数
                    // 首先获取可用的语言和集数
                    const availableLangs = [
                      ...new Set(
                        translationEditorData.translationResults.map(
                          (r) => r.language
                        )
                      ),
                    ];
                    const availableEps = [
                      ...new Set(
                        translationEditorData.translationResults.map(
                          (r) => r.episode
                        )
                      ),
                    ];

                    let language =
                      translationEditorData.selectedLanguage ||
                      (availableLangs.length > 0 ? availableLangs[0] : "");
                    let episode =
                      translationEditorData.selectedEpisode !== null
                        ? translationEditorData.selectedEpisode
                        : availableEps.length > 0
                        ? availableEps[0]
                        : null;

                    if (!language || episode === null) {
                      toast.error("没有可用的语言或集数");
                      return;
                    }

                    console.log(translationEditorData);

                    // 筛选当前语言和集数的结果
                    let filteredResults =
                      translationEditorData.translationResults.filter(
                        (result) =>
                          result.language === language &&
                          result.episode === episode
                      );

                    if (filteredResults.length === 0) {
                      // toast.error("当前选择的语言和集数下没有翻译结果");
                      console.log(
                        initTranslationLanguage,
                        initTranslationEpisode
                      );
                      if (initTranslationLanguage && initTranslationEpisode) {
                        language = initTranslationLanguage;
                        episode = initTranslationEpisode;
                        filteredResults =
                          translationEditorData.translationResults.filter(
                            (result) =>
                              result.language === language &&
                              result.episode === episode
                          );
                      } else {
                        return;
                      }
                    }

                    try {
                      // 按时间排序
                      const sortedResults = [...filteredResults].sort((a, b) =>
                        a.startTime.localeCompare(b.startTime)
                      );

                      // 生成SRT内容
                      let srtContent = "";
                      sortedResults.forEach((result, index) => {
                        srtContent += `${index + 1}\n`;
                        srtContent += `${result.startTime.replace(
                          ",",
                          "."
                        )} --> ${result.endTime.replace(",", ".")}\n`;
                        srtContent += `${result.translatedText}\n\n`;
                      });

                      let currentTaskData =
                        localStorage.getItem("currentTaskData");
                      if (currentTaskData) {
                        currentTaskData = JSON.parse(currentTaskData);
                      }
                      let taskName =
                        currentTaskData?.resources?.file_set_name ||
                        "未命名任务";

                      // 创建下载
                      const blob = new Blob([srtContent], {
                        type: "text/plain;charset=utf-8",
                      });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `${taskName}_${language}_${episode}.srt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(a.href);

                      toast.success(
                        `已导出 ${language} 第${episode}集 的字幕文件`
                      );
                    } catch (error) {
                      console.error("导出SRT文件失败:", error);
                      toast.error("导出SRT文件失败");
                    }
                  }}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  导出SRT
                </Button> */}

                <Button
                  onClick={() => {
                    setIsTranslationSrtModalOpen(true);
                  }}
                  type="button"
                  variant="outline"
                >
                  导入/导出SRT
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    setTranslationEditorData((prev) => ({
                      ...prev,
                      isOpen: false,
                    }))
                  }
                >
                  取消
                </Button>
                {currentStepIndex === 2 && (
                  <Button
                    onClick={handleSaveTranslations}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    保存
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 视频压制组件 */}
      {videoProcessingData.isOpen && (
        <Dialog
          open={videoProcessingData.isOpen}
          onOpenChange={(open) =>
            setVideoProcessingData((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>视频压制</DialogTitle>
              <DialogDescription>
                系统正在进行视频压制，请稍候...
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4">
              <VideoProcessingComponent
                stepId={videoProcessingData.stepId || ""}
                onComplete={() => {
                  // 关闭视频压制组件
                  setVideoProcessingData((prev) => ({
                    ...prev,
                    isOpen: false,
                  }));
                  // 添加成功消息
                  addSystemMessage("视频压制完成！", "info");
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 字幕编辑对话框 */}
      {subtitleEditorData.isOpen && (
        <Dialog
          open={subtitleEditorData.isOpen}
          onOpenChange={(open) =>
            setSubtitleEditorData((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>批量字幕编辑</DialogTitle>
              <DialogDescription>
                您可以编辑下方所有字幕，完成后点击保存按钮提交所有修改。
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4">
              <SubtitleEditor
                subtitles={subtitleEditorData.subtitles}
                onSave={(updatedSubtitles) => {
                  // 更新字幕数据
                  setSteps((prev) =>
                    prev.map((step) =>
                      step.id === subtitleEditorData.relatedStep
                        ? { ...step, subtitles: updatedSubtitles }
                        : step
                    )
                  );
                  // 关闭字幕编辑器
                  setSubtitleEditorData((prev) => ({ ...prev, isOpen: false }));
                  // 添加成功消息
                  toast.success("字幕已成功保存！");
                }}
              />
            </div>

            {/* 固定在底部的保存按钮 */}
            <div className="sticky bottom-0 left-0 right-0 py-3 px-4 bg-background border-t mt-2 flex justify-between items-center">
              <Button
                onClick={() => {
                  // 触发当前编辑器的保存操作
                  const editorSaveButton = document.querySelector(
                    ".subtitle-editor-save-button"
                  ) as HTMLButtonElement;
                  if (editorSaveButton) {
                    editorSaveButton.click();
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                保存所有修改
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 视频下载组件 */}
      {videoDownloadData.isOpen && (
        <Dialog
          open={videoDownloadData.isOpen}
          onOpenChange={(open) =>
            setVideoDownloadData((prev) => ({ ...prev, isOpen: open }))
          }
        >
          <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>下载文件</DialogTitle>
              <DialogDescription>请选择您要下载的文件。</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              <VideoDownloadComponent stepId={videoDownloadData.stepId || ""} />
            </div>
             {/* START: 新增的生成网盘链接区域 */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  将全部翻译文件打包生成百度网盘链接，方便分享和批量下载
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateNetdiskLink}
                >
                  <Cloud className="mr-2 h-4 w-4" />
                  生成网盘链接
                </Button>
              </div>
            {/* END: 新增的生成网盘链接区域 */}
          </DialogContent>
        </Dialog>
      )}

      <TranslationSrtModal
        isOpen={isTranslationSrtModalOpen}
        onOpenChange={setIsTranslationSrtModalOpen}
        taskData={taskData} // 确保 taskData 在此作用域可用
        onUpdateTask={onTaskUpdate} // 或者你用于更新任务数据的函数
      />
    </div>
  );
}

export default WorkflowSteps;
