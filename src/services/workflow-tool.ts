interface VideoUrlItem {
    playlet_num: string;
    video_url: string;
    project_url: string;
    status: number;
}

interface VideoUrls {
    [language: string]: VideoUrlItem[];
}

interface VideoUrlsAnalysisResult {
    totalFiles: number;
    languages: string[];
    hasFailedFiles: boolean;
    failedFiles: string[]; // 存储失败文件的描述，例如 "英文, 第4集"
    failedFileMessages: string; // 组装好的失败文件信息字符串
}

interface OriginSrtItem {
    id: number;
    role_srt: string;
    num: number;
    oss_key: string;
    url: string;
}

interface SrtAnalysisResult {
    totalFiles: number;
    hasEmptyFiles: boolean;
    emptyFiles: string[]; // 存储空文件的 oss_key 或文件名
    emptyFileMessages: string; // 组装好的空文件信息字符串
}
interface SrtItem {
    playlet_num: string;
    content: string;
    file: string; // URL ending with filename
    status: number;
}

interface SrtList {
    [language: string]: SrtItem[];
}

interface SrtListAnalysisResult {
    totalFiles: number;
    languages: string[];
    hasEmptyFiles: boolean;
    emptyFiles: string[]; // 存储空文件的描述，例如 "英文, 4.srt"
    emptyFileMessages: string; // 组装好的空文件信息字符串
}

const workflowTool = {

    analyzeOriginSrts(origin_srts: OriginSrtItem[] | null | undefined): SrtAnalysisResult {
        const result: SrtAnalysisResult = {
            totalFiles: 0,
            hasEmptyFiles: false,
            emptyFiles: [],
            emptyFileMessages: ""
        };

        if (!origin_srts || origin_srts.length === 0) {
            return result; // 如果输入为空或无效，返回默认结果
        }

        result.totalFiles = origin_srts.length;
        const emptyFileNames: string[] = [];

        origin_srts.forEach(item => {
            // 检查 role_srt 是否为空字符串或仅包含空白字符
            if (!item.role_srt || item.role_srt.trim() === "") {
                result.emptyFiles.push(item.url); // 记录原始 url
                const parts = item.url.split('/');
                emptyFileNames.push(parts[parts.length - 1]); // 提取文件名
            }
        });

        result.hasEmptyFiles = result.emptyFiles.length > 0;

        if (result.hasEmptyFiles) {
            result.emptyFileMessages = `存在 ${result.emptyFiles.length} 个空文件 (${emptyFileNames.join('、')})`;
        }


        return result;
    },

    analyzeSrtList(srt_list: SrtList | null | undefined): SrtListAnalysisResult {
        const result: SrtListAnalysisResult = {
            totalFiles: 0,
            languages: [],
            hasEmptyFiles: false,
            emptyFiles: [],
            emptyFileMessages: "",
        };

        if (!srt_list || Object.keys(srt_list).length === 0) {
            return result; // 如果输入为空或无效，返回默认结果
        }

        result.languages = Object.keys(srt_list); // 获取所有语言的列表

        for (const language of result.languages) {
            const items = srt_list[language];
            if (items && items.length > 0) {
                result.totalFiles += items.length; // 累加文件总数

                items.forEach(item => {
                    // 检查 content 是否为空或仅包含空白字符，并且 status 是否为 -9
                    const isContentEmpty = !item.content || item.content.trim() === "";
                    const isEmptyStatus = item.status === -9; // 增加对状态的判断

                    if (isContentEmpty && isEmptyStatus) {
                        result.hasEmptyFiles = true;
                        try {
                            // 从 URL 中提取文件名
                            const urlParts = item.file.split('/');
                            const filename = urlParts[urlParts.length - 1];
                            // 格式化空文件描述 `${language}, ${filename}`
                            result.emptyFiles.push(`${filename}`);
                        } catch (e) {
                            // 如果URL解析失败，记录一个通用错误
                            result.emptyFiles.push(`${language}, (文件名解析失败)`);
                            console.error("Error parsing filename from URL:", item.file, e);
                        }
                    }
                });
            }
        }

        // 格式化空文件信息
        if (result.hasEmptyFiles) {
            result.emptyFileMessages = `存在空文件: ${result.emptyFiles.join('; ')}`;
        }

        return result;
    },

    analyzeVideoUrls(video_urls: VideoUrls | null | undefined): VideoUrlsAnalysisResult {
        const result: VideoUrlsAnalysisResult = {
            totalFiles: 0,
            languages: [],
            hasFailedFiles: false,
            failedFiles: [],
            failedFileMessages: "",
        };

        if (!video_urls || Object.keys(video_urls).length === 0) {
            return result; // 如果输入为空或无效，返回默认结果
        }

        result.languages = Object.keys(video_urls); // 获取所有语言的列表

        for (const language of result.languages) {
            const items = video_urls[language];
            if (items && items.length > 0) {
                result.totalFiles += items.length; // 累加文件总数

                items.forEach(item => {
                    // 检查 status 是否为 -9
                    if (item.status === -9) {
                        result.hasFailedFiles = true;
                        result.failedFiles.push(`${language}, 第${item.playlet_num}集`);
                    }
                });
            }
        }

        // 格式化失败文件信息
        if (result.hasFailedFiles) {
            result.failedFileMessages = `存在压制失败文件: ${result.failedFiles.join('; ')}`;
        }

        return result;
    },

    /**
     * 从SRT字符串创建并下载SRT文件
     * @param srtContent SRT格式的字幕内容
     * @param filename 要保存的文件名，默认为subtitle.srt
     */
    downloadSrtFile(srtContent: string, filename: string = 'subtitle.srt'): void {
        // 确保文件名以.srt结尾
        if (!filename.toLowerCase().endsWith('.srt')) {
            filename = `${filename}.srt`;
        }

        // 创建Blob对象
        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        
        // 添加到DOM，触发下载，然后移除
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },

    /**
     * 从SRT字符串创建SRT文件并返回其URL，不触发下载
     * @param srtContent SRT格式的字幕内容
     * @returns 返回创建的文件URL
     */
    createSrtFileUrl(srtContent: string): string {
        // 创建Blob对象
        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        
        // 创建并返回URL
        return URL.createObjectURL(blob);
    }
}

export default workflowTool;