---
title: NarratorAI（解说大师）开放接口
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# NarratorAI（解说大师）开放接口

Base URLs:

# Authentication

# 翻译功能接口/文件夹管理

## POST 创建文件夹

POST /api/narrator/ai/v1/fileSets

创建一个新的文件夹

> Body 请求参数

```json
{
  "name": "voluptas"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|app-key|header|string| 否 |none|
|body|body|object| 否 |none|
|» name|body|string| 是 |文件夹名称，最大长度255个字符|

> 返回示例

> 200 Response

```json
{
  "code": 10000,
  "message": "创建文件夹成功",
  "data": {
    "id": 203,
    "name": "某某剧场短剧文件夹",
    "createTime": "2025-03-28T16:14:07+08:00"
  },
  "trace": {
    "request_id": "0195dbd0-c79f-72cd-88f3-2c36ed2426a6",
    "timestamp": 1743149647,
    "take_time": 0
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|integer|true|none||none|
|»» name|string|true|none||none|
|»» createTime|string|true|none||none|
|» trace|object|true|none||none|
|»» request_id|string|true|none||none|
|»» timestamp|integer|true|none||none|
|»» take_time|integer|true|none||none|

## GET 获取文件夹列表

GET /api/narrator/ai/v1/fileSets

获取当前用户所有可用的文件夹列表，支持分页和排序

> Body 请求参数

```json
{
  "name": "ab",
  "limit": 71
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|folder_name|query|string| 否 |可选，文件夹名称，用于筛选特定名称的文件夹|
|page|query|integer| 否 |可选，当前页码，默认为1|
|limit|query|integer| 否 |可选，每页数量，默认为10，最大100|
|orderBy|query|string| 否 |可选，排序字段，可选值：createTime(创建时间),name(名称)，默认为createTime|
|order|query|string| 否 |可选，排序方式，可选值：asc(升序),desc(降序)，默认为desc|
|app-key|header|string| 否 |none|
|body|body|object| 否 |none|
|» name|body|string| 否 |文件夹名称|
|» limit|body|integer| 否 |Must be at least 1.|

> 返回示例

> 200 Response

```json
{
  "code": 10000,
  "message": "success",
  "data": [
    {
      "id": 204,
      "name": "朕乃千古一帝",
      "created_at": "2025-03-31 09:58:13",
      "files": []
    }
  ],
  "total": 9,
  "limit": 1,
  "page": 1,
  "trace": {
    "request_id": "0195ea0e-579f-71b6-8412-6e817cb717d1",
    "timestamp": 1743388563,
    "take_time": 0
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» message|string|true|none||none|
|» data|[object]|true|none||none|
|»» id|integer|false|none||none|
|»» name|string|false|none||none|
|»» created_at|string|false|none||none|
|»» files|[string]|false|none||none|
|» total|integer|true|none||none|
|» limit|integer|true|none||none|
|» page|integer|true|none||none|
|» trace|object|true|none||none|
|»» request_id|string|true|none||none|
|»» timestamp|integer|true|none||none|
|»» take_time|integer|true|none||none|

# 翻译功能接口/文件管理

## POST 上传文件

POST /api/narrator/ai/v1/files/upload

通过此接口上传文件，如视频或字幕文件到指定文件夹内。需注意：
1.上传视频或字幕文件到指定文件夹中。系统支持直接上传文件。支持批量上传多个。
2.上传的资源将保存 30 天，过期后会自动删除。
3.上传的视频需确保为竖屏视频，mp4格式，否则会上传失败。
4.上传的字幕文件需为srt文件。
5.若是连续剧集，视频和字幕文件命名必须包含序号（顺序命名，如短剧名1.mp4、短剧名2.mp4、短剧名1.srt、短剧名2.srt；），确保系统能正确识别剧集顺序。

> Body 请求参数

```yaml
file_set_id: 17
"files[]": ""

```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|app-key|header|string| 否 |none|
|body|body|object| 否 |none|
|» file_set_id|body|integer| 是 |文件夹ID，指定上传文件的文件夹|
|» files[]|body|string(binary)| 否 |文件内容数组，支持的文件格式：视频（mp4）、字幕（srt）|

> 返回示例

> 200 Response

```json
{
  "code": 10000,
  "message": "文件上传成功，资源将在30天内保存",
  "data": {
    "files": [
      {
        "file_id": "uuid-string",
        "file_name": "文件名.mp4",
        "file_type": "video"
      }
    ],
    "file_set_id": 1,
    "file_set_name": "我的文件集"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## POST 重命名文件

POST /api/narrator/ai/v1/files/rename

修改已上传文件的名称。新名称不能与同一文件夹中的其他文件重名，且必须保持原有文件扩展名不变。

> Body 请求参数

```json
{
  "file_id": "officiis",
  "new_file_name": "corporis"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|app-key|header|string| 否 |none|
|body|body|object| 否 |none|
|» file_id|body|string| 是 |文件ID|
|» new_file_name|body|string| 是 |新文件名，最大长度255个字符|

> 返回示例

> 200 Response

```json
{
  "code": 10000,
  "message": "文件重命名成功",
  "data": {
    "file_id": "uuid-string",
    "original_name": "原文件名.mp4",
    "new_name": "新文件名.mp4"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## GET 获取文件详情

GET /api/narrator/ai/v1/files/file/{fileId}

获取指定文件的详细信息

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|fileId|path|string| 是 |none|
|app-key|header|string| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": 10000,
  "message": "获取文件详情成功",
  "data": {
    "file_id": "uuid-string",
    "file_name": "示例文件.mp4",
    "original_name": "示例文件.mp4",
    "file_type": "video",
    "file_set_id": 1,
    "file_set_name": "我的文件集",
    "file_url": "https://example.com/file.mp4",
    "file_path": "/storage/narrator-ai/1/uuid.mp4",
    "duration": 120,
    "subtitle_lines": null,
    "episode": "01",
    "upload_time": "2023-01-01T00:00:00+00:00",
    "expiry_time": "2023-01-08T00:00:00+00:00"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## DELETE 删除文件

DELETE /api/narrator/ai/v1/files/file/{fileId}

删除指定的文件，如果存在物理文件也会一并删除

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|fileId|path|string| 是 |none|
|app-key|header|string| 否 |none|

> 返回示例

> 200 Response

```json
{
  "code": 10000,
  "message": "文件删除成功",
  "data": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

# 翻译功能接口/视频翻译任务

## POST 创建视频翻译任务

POST /api/narrator/ai/v1/videoTasks

> Body 请求参数

```json
{
  "task_type": "video_translation",
  "original_language": "中文",
  "target_languages": [
    {
      "language": "英语",
      "area": "英国"
    }
  ],
  "video_erase_mode": "normal",
  "auto_run": 1,
  "style_prompt": "要求翻译使用意译风格，口语化，投流在抖音平台",
  "resources": [],
  "subtitle_style": {
    "font_size": 12
  }
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|app-key|header|string| 否 ||none|
|body|body|object| 否 ||none|
|» task_type|body|string| 是 ||任务类型，例如：video_translation（视频翻译） / srt_translation （字幕翻译）/ video_erasure （视频擦除）/ video_extraction（字幕提取） / video_merging（视频压制）|
|» original_language|body|string| 是 | 中文|原始语言，video_translation仅支持"中文"、"英语"，srt_translation支持自定义输入语言|
|» target_languages|body|[string]| 是 | 英文|目标语言列表|
|» video_erase_mode|body|string| 否 ||视频擦除模式，仅 video_translation 或 video_erasure 有效（"advanced" 或 "normal"）|
|» auto_run|body|number| 否 ||是否全流程自动执行（0：关键节点暂停等待用户确认）|
|» style_prompt|body|string| 否 ||用户翻译要求|
|» resources|body|object| 是 ||资源信息|
|»» file_set_name|body|string| 否 ||或指定使用的文件集名称|
|» subtitle_style|body|object| 否 ||自定义字幕样式配置|
|»» font_size|body|integer| 否 ||字号大小|
|»» primary_colour|body|string| 否 ||字幕主色（ABGR格式，&H开头）|
|»» outline_colour|body|string| 否 ||字幕边框色|
|»» back_colour|body|string| 否 ||字幕阴影色|
|»» border_style|body|integer| 否 ||边框样式：1-笔画加边+投影；3-方形纯色盒子|
|»» outline|body|integer| 否 ||笔画边粗细（像素），支持0-4|
|»» shadow|body|integer| 否 ||投影深度（像素），支持0-4|
|»» alignment|body|integer| 否 ||字幕对齐位置，1-9对应数字键盘位置，2为中下位|
|»» margin_l|body|integer| 否 ||左边距|
|»» margin_r|body|integer| 否 ||右边距|
|»» margin_v|body|integer| 否 ||纵向边距|
|»» wrap_style|body|integer| 否 ||换行方式：0-默认自动换行；1-自动行尾换行；2-不自动换行；3-自动换行上短下长|

#### 详细说明

**» auto_run**: 是否全流程自动执行（0：关键节点暂停等待用户确认）
1: 全流程自动

> 返回示例

> 200 Response

```json
{
  "code": 10000,
  "message": "success",
  "data": {
    "id": 1,
    "task_type": "video_translation",
    "status": 1,
    "original_language": "中文",
    "target_languages": [
      {
        "language": "英语",
        "area": "英国"
      }
    ],
    "created_at": "2025-03-17T10:30:00+08:00"
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|
|»» id|integer|false|none||none|
|»» task_type|string|false|none||none|
|»» status|integer|false|none||none|
|»» original_language|string|false|none||none|
|»» target_languages|[object]|false|none||none|
|»»» language|string|false|none||none|
|»»» area|string|false|none||none|
|»» created_at|string|false|none||none|

## GET 获取视频翻译任务列表

GET /api/narrator/ai/v1/videoTasks

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|page|query|integer| 否 ||页码，默认1|
|limit|query|integer| 否 ||每页数量，默认10|
|task_type|query|string| 否 ||任务类型，例如：video_translation（视频翻译） / srt_translation （字幕翻译）/ video_erasure （视频擦除）/ video_extraction（字幕提取） / video_merging（视频压制） |
|status|query|integer| 否 ||任务状态，1=未开始,2=进行中,3=成功,4=出错,5=失败|
|app-key|header|string| 否 ||none|

> 返回示例

> 200 Response

```json
{
  "code": 10000,
  "message": "success",
  "data": [
    {
      "id": 117,
      "task_uuid": "",
      "task_type": "srt_translation",
      "status": 3,
      "original_language": "中文",
      "target_languages": [
        {
          "area": "美国",
          "language": "英文"
        }
      ],
      "started_at": "2025-03-28 11:11:50",
      "completed_at": "2025-03-28 14:10:46",
      "created_at": "2025-03-28 11:11:49"
    }
  ],
  "total": 8,
  "limit": 1,
  "page": 2,
  "trace": {
    "request_id": "0195dbbc-039a-701b-989d-cc764fe40128",
    "timestamp": 1743148287,
    "take_time": 1
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» message|string|true|none||none|
|» data|[object]|true|none||none|
|»» id|integer|false|none||ID|
|»» task_uuid|string|false|none||task uuid|
|»» task_type|string|false|none||task类型，创建任务的类型|
|»» status|integer|false|none||状态|
|»» original_language|string|false|none||原语言|
|»» target_languages|[object]|false|none||目标语言|
|»»» area|string|false|none||地区|
|»»» language|string|false|none||语言|
|»» started_at|string|false|none||开始时间|
|»» completed_at|string|false|none||完成时间|
|»» created_at|string|false|none||创建时间|
|» total|integer|true|none||总数|
|» limit|integer|true|none||每页数量|
|» page|integer|true|none||页码|
|» trace|object|true|none||none|
|»» request_id|string|true|none||none|
|»» timestamp|integer|true|none||none|
|»» take_time|integer|true|none||none|

## POST 任务确认

POST /api/narrator/ai/v1/confirm/task/flow/{taskId}

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|taskId|path|string| 是 ||none|
|app-key|header|string| 否 ||none|

> 返回示例

> 200 Response

```json
{}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## POST 更新本土化映射/翻译字幕

POST /api/narrator/ai/v1/videoTasks/update/{task_id}/srt/content

> Body 请求参数

```yaml
playlet_num: ""
type: ""
content: ""
target_lang: ""

```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|task_id|path|string| 是 ||none|
|app-key|header|string| 否 ||none|
|body|body|object| 否 ||none|
|» playlet_num|body|string| 是 ||集数|
|» type|body|string| 是 ||查询类型(可选):srt=翻译字幕，localized=本土化信息|
|» content|body|string| 是 ||内容|
|» target_lang|body|string| 是 ||目标语言|

> 返回示例

> 200 Response

```json
{}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## POST 更新任务的原字幕内容

POST /api/narrator/ai/v1/videoTasks/update/{srt_id}/originSrt/content

> Body 请求参数

```yaml
content: ""

```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|srt_id|path|string| 是 ||none|
|app-key|header|string| 否 ||none|
|body|body|object| 否 ||none|
|» content|body|string| 否 ||字幕内容|

> 返回示例

> 200 Response

```json
{}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

## GET 获取视频翻译任务详情

GET /api/narrator/ai/v1/videoTasks/{id}

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|id|path|string| 是 ||none|
|app-key|header|string| 否 ||none|

> 返回示例

> 200 Response

```json
{
  "code": 10000,
  "message": "success",
  "data": {
    "id": 118,
    "task_uuid": "",
    "task_order_num": "4dce2b51e1068bd64df6b7b024fbb685",
    "task_type": "video_translation",
    "status": 2,
    "original_language": "中文",
    "target_languages": [
      {
        "area": "美国",
        "language": "英文"
      }
    ],
    "started_at": "2025-03-28 14:22:25",
    "completed_at": null,
    "created_at": "2025-03-28 14:22:25",
    "file_set_id": 202,
    "auto_run": true,
    "translation_style": "",
    "style_prompt": "要求翻译使用意译风格，口语化，投流在抖音平台",
    "resources": {
      "file_set_name": "拉瓦要我跑视频"
    },
    "subtitle_style": {
      "font_size": 80
    },
    "consumed_points": 480,
    "task_flows": [
      {
        "flow_type": "remove_srt",
        "video_task_id": 118,
        "id": 368,
        "status": 2,
        "error_message": null,
        "started_at": "2025-03-28T14:22:33.000000Z",
        "finished_at": "2025-03-28T14:40:42.000000Z",
        "created_at": "2025-03-28T14:22:25.000000Z"
      },
      {
        "flow_type": "extract_srt",
        "video_task_id": 118,
        "id": 369,
        "status": 2,
        "error_message": null,
        "started_at": "2025-03-28T14:22:25.000000Z",
        "finished_at": "2025-03-28T14:28:47.000000Z",
        "created_at": "2025-03-28T14:22:25.000000Z"
      },
      {
        "flow_type": "localize_terms",
        "video_task_id": 118,
        "id": 370,
        "status": 0,
        "error_message": null,
        "started_at": null,
        "finished_at": null,
        "created_at": "2025-03-28T14:22:25.000000Z"
      },
      {
        "flow_type": "translate_subtitle",
        "video_task_id": 118,
        "id": 371,
        "status": 0,
        "error_message": null,
        "started_at": null,
        "finished_at": null,
        "created_at": "2025-03-28T14:22:25.000000Z"
      },
      {
        "flow_type": "video_rendering",
        "video_task_id": 118,
        "id": 372,
        "status": 0,
        "error_message": null,
        "started_at": null,
        "finished_at": null,
        "created_at": "2025-03-28T14:22:25.000000Z"
      }
    ],
    "result": true,
    "message": "成功",
    "srt_list": [
      {
        "playlet_num": "1",
        "content": "video-clips-data/20250328/t_19199_HzmMmg_stylized_srt/1.英文.srt"
      },
      {
        "playlet_num": "2",
        "content": "video-clips-data/20250328/t_19200_fkiWfu_stylized_srt/2.英文.srt"
      },
      {
        "playlet_num": "3",
        "content": "video-clips-data/20250328/t_19201_WjcSrp_stylized_srt/3.英文.srt"
      }
    ],
    "localized_map": {
      "英文": {
        "角色": {
          "许功": [
            {
              "原文": "许功",
              "本土化": "Alex Parker",
              "注释": "男性，中国人，是许阳的儿子，大学即将毕业，正在为父亲筹钱治病"
            },
            {
              "原文": "小功",
              "本土化": "Little Alex",
              "注释": "许功的昵称，父母和长辈对他的称呼"
            }
          ],
          "许阳": [
            {
              "原文": "许阳",
              "本土化": "Robert Parker",
              "注释": "男性，中国人，许功的父亲，患有肺癌晚期，需要钱做手术"
            },
            {
              "原文": "老公",
              "本土化": "Husband",
              "注释": "妻子对许阳的称呼"
            },
            {
              "原文": "爸",
              "本土化": "Dad",
              "注释": "儿子许功对他的称呼"
            }
          ],
          "老三": [
            {
              "原文": "老三",
              "本土化": "Charlie Parker",
              "注释": "男性，中国人，许阳的三弟，被称为三叔，从城里回来，被许功一家借钱"
            },
            {
              "原文": "三叔",
              "本土化": "Uncle Charlie",
              "注释": "许功对他的称呼，表示亲属关系"
            }
          ],
          "三婶": [
            {
              "原文": "三婶",
              "本土化": "Aunt Olivia",
              "注释": "女性，中国人，老三的妻子，许功的三婶"
            }
          ],
          "老二": [
            {
              "原文": "老二",
              "本土化": "Thomas Parker",
              "注释": "男性，中国人，许阳的二弟，被称为二叔，曾向许阳借钱翻新小院但不愿归还"
            },
            {
              "原文": "二叔",
              "本土化": "Uncle Thomas",
              "注释": "许功对他的称呼，表示亲属关系"
            }
          ],
          "孙叔": [
            {
              "原文": "孙叔",
              "本土化": "Uncle Wilson",
              "注释": "男性，中国人，曾向许阳家借钱，最近刚装修完家，拒绝归还借款"
            }
          ],
          "老徐": [
            {
              "原文": "老徐",
              "本土化": "Old Frank",
              "注释": "男性，中国人，可能是许阳的朋友或亲戚"
            }
          ]
        },
        "地名": [],
        "组织名": [],
        "文化相关": []
      }
    },
    "origin_srts": [
      {
        "id": 14918,
        "role_srt": "1\n00:00:00,360 --> 00:00:01,080\n三叔\n\n2\n00:00:01,320 --> 00:00:02,280\n我爸肺癌晚期了\n\n3\n00:00:02,400 --> 00:00:03,000\n求求你\n\n4\n00:00:03,120 --> 00:00:04,320\n把欠我们家的钱还了吧\n\n5\n00:00:04,440 --> 00:00:05,160\n你开开门啊\n\n6\n00:00:05,280 --> 00:00:05,880\n三叔\n\n7\n00:00:07,080 --> 00:00:09,120\n老三求求你\n\n8\n00:00:09,240 --> 00:00:10,200\n快开门吧\n\n9\n00:00:10,440 --> 00:00:10,920\n小功\n\n10\n00:00:12,000 --> 00:00:12,720\n爸\n\n11\n00:00:12,960 --> 00:00:13,560\n算了\n\n12\n00:00:13,800 --> 00:00:16,080\n你三叔可能不在家吧\n\n13\n00:00:17,400 --> 00:00:18,000\n老徐\n\n14\n00:00:18,120 --> 00:00:18,960\n爸你坚持住\n\n15\n00:00:19,080 --> 00:00:20,400\n我一定筹到钱救你\n\n16\n00:00:21,000 --> 00:00:21,480\n走\n\n17\n00:00:26,760 --> 00:00:28,080\n孙叔孙叔\n\n18\n00:00:28,200 --> 00:00:29,400\n我爸急需用钱治病\n\n19\n00:00:29,520 --> 00:00:31,320\n你看能不能先把钱还了\n\n20\n00:00:31,440 --> 00:00:31,680\n哎呦\n\n21\n00:00:31,800 --> 00:00:32,520\n小功呀\n\n22\n00:00:32,640 --> 00:00:33,840\n不是我们不帮\n\n23\n00:00:34,080 --> 00:00:36,120\n实在是家里没有余粮呀\n\n24\n00:00:36,240 --> 00:00:36,840\n可是\n\n25\n00:00:36,960 --> 00:00:38,160\n你们不是刚装修吗\n\n26\n00:00:38,280 --> 00:00:39,720\n你也说了刚刚装修完\n\n27\n00:00:39,840 --> 00:00:41,160\n我这手里哪还有钱呀\n\n28\n00:00:41,280 --> 00:00:42,720\n你再找找别人要吧啊\n\n29\n00:00:42,960 --> 00:00:43,800\n孙叔孙叔\n\n30\n00:00:45,120 --> 00:00:45,840\n滚滚滚\n\n31\n00:00:46,080 --> 00:00:46,800\n把一个病秧子\n\n32\n00:00:46,920 --> 00:00:47,520\n拖到我家门口\n\n33\n00:00:47,640 --> 00:00:48,720\n算怎么回事啊\n\n34\n00:00:48,840 --> 00:00:49,920\n敢死在我家门口\n\n35\n00:00:50,040 --> 00:00:51,720\n信不信我报警抓你们啊\n\n36\n00:00:52,800 --> 00:00:52,920\n滚\n\n37\n00:00:53,040 --> 00:00:53,160\n漆\n\n38\n00:00:53,880 --> 00:00:54,840\n当初借钱的时候\n\n39\n00:00:54,960 --> 00:00:56,280\n你们家可不是这么说的\n\n40\n00:01:00,840 --> 00:01:01,560\n爸\n\n41\n00:01:02,040 --> 00:01:03,360\n这是最后一家了\n\n42\n00:01:03,840 --> 00:01:04,800\n从小到大\n\n43\n00:01:05,040 --> 00:01:06,960\n我和你二叔关系最好\n\n44\n00:01:07,440 --> 00:01:10,080\n他一定不会见死不救的\n\n45\n00:01:27,120 --> 00:01:27,480\n哎呀\n\n46\n00:01:27,600 --> 00:01:28,680\n这不是许功嘛\n\n47\n00:01:29,280 --> 00:01:30,720\n你们这拖家带口的\n\n48\n00:01:31,560 --> 00:01:32,400\n你这是来\n\n49\n00:01:32,880 --> 00:01:33,600\n二叔\n\n50\n00:01:33,840 --> 00:01:35,280\n我爸着急用钱做手术\n\n51\n00:01:35,400 --> 00:01:37,680\n前些年你们家小院翻新\n\n52\n00:01:37,800 --> 00:01:39,240\n我爸给你拿了不少钱\n\n53\n00:01:39,360 --> 00:01:40,320\n你看能不能\n\n54\n00:01:40,440 --> 00:01:41,880\n把当时的钱先还了\n\n55\n00:01:42,360 --> 00:01:43,320\n你没有看到我跟我爸\n\n56\n00:01:43,440 --> 00:01:44,520\n在这打麻将的吗\n\n57\n00:01:44,640 --> 00:01:45,720\n这个时候来要钱\n\n58\n00:01:46,080 --> 00:01:47,160\n晦气死了\n\n59\n00:01:47,400 --> 00:01:47,880\n许阳\n\n60\n00:01:48,000 --> 00:01:48,960\n你这是什么意思\n\n61\n00:01:49,080 --> 00:01:49,920\n你们家借钱的时候\n\n62\n00:01:50,040 --> 00:01:51,120\n可不是这个态度\n\n63\n00:01:52,200 --> 00:01:53,280\n要我说呀\n\n64\n00:01:54,120 --> 00:01:56,520\n你爸已经活得够久了\n\n65\n00:01:56,640 --> 00:01:58,920\n要死那也是他的命啊\n\n66\n00:02:00,240 --> 00:02:00,960\n胡了\n\n67\n00:02:02,280 --> 00:02:03,000\n让你打\n\n68\n00:02:05,520 --> 00:02:06,240\n就问一句\n\n69\n00:02:06,360 --> 00:02:07,680\n今天这钱还是不还\n\n70\n00:02:07,920 --> 00:02:08,760\n哎看到没有\n\n71\n00:02:08,880 --> 00:02:11,520\n我大哥要打我呀\n\n72\n00:02:11,640 --> 00:02:12,240\n来\n\n73\n00:02:13,560 --> 00:02:14,760\n朝着打啊\n\n74\n00:02:14,880 --> 00:02:15,600\n打呀\n\n75\n00:02:20,400 --> 00:02:23,040\n别打别打了\n\n76\n00:02:26,040 --> 00:02:26,760\n行了\n\n77\n00:02:27,240 --> 00:02:28,920\n别打了别打了\n\n78\n00:02:37,800 --> 00:02:38,520\n二叔\n\n79\n00:02:39,000 --> 00:02:39,960\n我求求你\n\n80\n00:02:40,080 --> 00:02:40,920\n救救我爸\n\n81\n00:02:41,760 --> 00:02:42,720\n我求求你\n\n82\n00:02:42,840 --> 00:02:43,680\n要怪啊\n\n83\n00:02:43,920 --> 00:02:46,080\n就只能怪你爸他自己蠢\n\n84\n00:02:46,200 --> 00:02:47,160\n钱是什么\n\n85\n00:02:47,400 --> 00:02:48,600\n钱是命啊\n\n86\n00:02:48,960 --> 00:02:51,120\n你爸自己往外借钱\n\n87\n00:02:51,600 --> 00:02:52,680\n借条都不打\n\n88\n00:02:52,800 --> 00:02:55,200\n要怪只能怪他自己啊\n\n89\n00:02:55,320 --> 00:02:56,160\n老二\n\n90\n00:02:59,880 --> 00:03:01,680\n爸\n\n91\n00:03:01,800 --> 00:03:02,520\n老公\n\n92\n00:03:03,000 --> 00:03:03,600\n爸\n\n93\n00:03:03,960 --> 00:03:04,680\n老公\n\n94\n00:03:05,760 --> 00:03:06,480\n爸\n\n95\n00:03:31,920 --> 00:03:34,920\n妈\n\n96\n00:03:40,440 --> 00:03:42,240\n妈爸\n\n97\n00:03:43,680 --> 00:03:44,640\n是我不好\n\n98\n00:03:45,600 --> 00:03:47,160\n我没有照顾好你们\n\n99\n00:03:48,480 --> 00:03:49,680\n如果有下辈子\n\n100\n00:03:51,240 --> 00:03:53,040\n我一定不会让这些发生\n\n101\n00:04:12,360 --> 00:04:13,320\n我还活着\n",
        "num": 1
      },
      {
        "id": 14919,
        "role_srt": "1\n00:00:05,760 --> 00:00:06,960\n我穿越了\n\n2\n00:00:07,200 --> 00:00:08,640\n而且回到了我家拆迁的\n\n3\n00:00:08,760 --> 00:00:09,600\n前三天\n\n4\n00:00:09,840 --> 00:00:10,440\n太好了\n\n5\n00:00:13,800 --> 00:00:15,960\n妈爸你们还活着\n\n6\n00:00:16,560 --> 00:00:17,280\n太好了\n\n7\n00:00:17,640 --> 00:00:18,600\n怎么了这是\n\n8\n00:00:18,720 --> 00:00:20,040\n大白天的说胡话\n\n9\n00:00:20,280 --> 00:00:20,760\n没事\n\n10\n00:00:20,880 --> 00:00:22,200\n我就是太想你们\n\n11\n00:00:22,560 --> 00:00:23,040\n我看你是\n\n12\n00:00:23,160 --> 00:00:24,480\n睡觉睡糊涂了吧\n\n13\n00:00:25,320 --> 00:00:26,640\n快见见你三叔三婶\n\n14\n00:00:27,960 --> 00:00:29,640\n三叔三婶\n\n15\n00:00:30,240 --> 00:00:30,960\n是啊\n\n16\n00:00:31,080 --> 00:00:31,800\n他一家呀\n\n17\n00:00:31,920 --> 00:00:32,760\n刚从城里回来\n\n18\n00:00:32,880 --> 00:00:33,720\n打个招呼吧\n\n19\n00:00:35,160 --> 00:00:35,400\n前世\n\n20\n00:00:35,520 --> 00:00:36,720\n三叔一家问我家\n\n21\n00:00:36,840 --> 00:00:37,440\n借了二十万\n\n22\n00:00:37,560 --> 00:00:38,640\n拖了十年没还\n\n23\n00:00:38,760 --> 00:00:39,720\n人善被人欺\n\n24\n00:00:39,840 --> 00:00:41,040\n马善被人骑\n\n25\n00:00:41,400 --> 00:00:41,880\n这一世\n\n26\n00:00:42,000 --> 00:00:43,200\n我要改变这一切\n\n27\n00:00:44,880 --> 00:00:46,440\n三叔三婶好\n\n28\n00:00:49,320 --> 00:00:50,160\n几年没见\n\n29\n00:00:50,760 --> 00:00:52,800\n小功都长大了\n\n30\n00:00:54,240 --> 00:00:54,840\n快吃饭\n\n31\n00:00:54,960 --> 00:00:55,800\n菜都凉了\n\n32\n00:00:59,280 --> 00:00:59,880\n这个这个\n\n33\n00:01:00,000 --> 00:01:02,640\n最近啊我在城里买了房\n\n34\n00:01:02,880 --> 00:01:03,840\n花了不少钱\n\n35\n00:01:04,320 --> 00:01:05,040\n那什么\n\n36\n00:01:05,280 --> 00:01:06,000\n能不能\n\n37\n00:01:06,600 --> 00:01:07,680\n又想借钱\n\n38\n00:01:08,160 --> 00:01:09,120\n门都没有\n\n39\n00:01:11,880 --> 00:01:13,080\n三叔啊\n\n40\n00:01:13,320 --> 00:01:14,880\n你帮帮我们家吧\n",
        "num": 2
      },
      {
        "id": 14920,
        "role_srt": "1\n00:00:00,120 --> 00:00:01,560\n三叔三婶\n\n2\n00:00:01,680 --> 00:00:02,880\n帮帮我们家吧\n\n3\n00:00:03,000 --> 00:00:04,560\n我马上大学毕业了\n\n4\n00:00:04,680 --> 00:00:06,120\n找工作娶媳妇\n\n5\n00:00:06,240 --> 00:00:07,680\n正是花钱的时候呀\n\n6\n00:00:07,800 --> 00:00:08,880\n三叔你就帮帮我\n\n7\n00:00:09,000 --> 00:00:10,440\n这这是怎么回事\n\n8\n00:00:10,560 --> 00:00:11,880\n小功娶媳妇的钱\n\n9\n00:00:12,240 --> 00:00:14,040\n你们两口子没给攒吗\n\n10\n00:00:14,160 --> 00:00:14,760\n是啊\n\n11\n00:00:14,880 --> 00:00:17,760\n这现在娶媳妇彩礼多高啊\n\n12\n00:00:17,880 --> 00:00:18,120\n我们家\n\n13\n00:00:18,240 --> 00:00:20,040\n砸锅卖铁都凑不上啊\n\n14\n00:00:20,880 --> 00:00:21,600\n三婶\n\n15\n00:00:21,840 --> 00:00:22,560\n你不会眼睁睁的\n\n16\n00:00:22,680 --> 00:00:23,280\n看着你侄子\n\n17\n00:00:23,400 --> 00:00:24,960\n亲侄子打光棍吧\n\n18\n00:00:25,080 --> 00:00:25,920\n小兔崽子\n\n19\n00:00:26,160 --> 00:00:27,120\n你瞎说什么呢\n\n20\n00:00:27,480 --> 00:00:29,160\n谁说咱家娶不起媳妇了\n\n21\n00:00:30,000 --> 00:00:31,200\n爸你就别骗我\n\n22\n00:00:31,320 --> 00:00:32,400\n我都听到你和妈说\n\n23\n00:00:32,520 --> 00:00:33,360\n咱家破产\n\n24\n00:00:33,480 --> 00:00:35,520\n现在连买菜的钱都没有了\n\n25\n00:00:35,880 --> 00:00:37,920\n那这这菜啊\n\n26\n00:00:38,280 --> 00:00:40,320\n一大早上去菜市场捡的\n\n27\n00:00:40,440 --> 00:00:41,160\n还有这鸡蛋\n\n28\n00:00:41,280 --> 00:00:42,720\n是从邻居家里掏的\n\n29\n00:00:42,840 --> 00:00:44,520\n这玉米都是地里偷的\n\n30\n00:00:44,760 --> 00:00:45,840\n就连这炒菜的油\n\n31\n00:00:46,320 --> 00:00:47,880\n都是从地沟捞的啊\n\n32\n00:00:49,080 --> 00:00:50,160\n那那那这肉呢\n\n33\n00:00:50,280 --> 00:00:50,880\n这肉\n\n34\n00:00:51,000 --> 00:00:51,480\n三叔\n\n35\n00:00:51,600 --> 00:00:53,280\n你不知道天上龙肉\n\n36\n00:00:53,400 --> 00:00:54,720\n地上鼠肉吗\n\n37\n00:00:54,840 --> 00:00:55,680\n这是老鼠肉\n\n38\n00:00:55,800 --> 00:00:56,400\n对啊\n\n39\n00:00:58,200 --> 00:00:59,160\n三叔三婶\n\n40\n00:00:59,280 --> 00:01:00,240\n你们一定要帮帮我\n\n41\n00:01:00,360 --> 00:01:00,960\n你们放心\n\n42\n00:01:01,080 --> 00:01:02,280\n等我找到好的工作\n\n43\n00:01:02,400 --> 00:01:03,360\n娶到好的媳妇\n\n44\n00:01:03,480 --> 00:01:04,560\n我一定还你们\n\n45\n00:01:05,280 --> 00:01:06,840\n兔崽子闹够了没有\n\n46\n00:01:07,680 --> 00:01:08,760\n给我滚回房间去\n\n47\n00:01:09,360 --> 00:01:10,200\n三叔三婶\n\n48\n00:01:10,800 --> 00:01:12,480\n你就帮帮我这个风华正茂\n\n49\n00:01:12,600 --> 00:01:14,280\n的五好青年吧\n\n50\n00:01:18,000 --> 00:01:18,720\n老三\n\n51\n00:01:19,080 --> 00:01:20,640\n你刚想说什么来着\n\n52\n00:01:22,560 --> 00:01:24,000\n我没没想说什么啊\n\n53\n00:01:24,120 --> 00:01:24,600\n大哥\n\n54\n00:01:24,720 --> 00:01:25,440\n我突然想起来\n\n55\n00:01:25,560 --> 00:01:26,520\n我们家煤气没关\n\n56\n00:01:27,120 --> 00:01:27,720\n我们先走了\n\n57\n00:01:27,840 --> 00:01:28,920\n我们关煤气\n\n58\n00:01:30,840 --> 00:01:32,040\n怎么就走了呢\n\n59\n00:01:32,160 --> 00:01:33,600\n这一桌子菜还没吃呢\n\n60\n00:01:36,600 --> 00:01:37,320\n走啦\n\n61\n00:01:38,040 --> 00:01:38,760\n吃饭\n\n62\n00:01:40,800 --> 00:01:41,760\n你还有脸吃饭\n\n63\n00:01:42,120 --> 00:01:42,840\n给我跪下\n",
        "num": 3
      }
    ],
    "video_urls": [
      "https://oss.jufenqian.top/video-clips-data/20250328/t_19199_144854_t64t/白日灼心-译制剧1.mp4",
      "https://oss.jufenqian.top/video-clips-data/20250328/t_19200_144528_1ELb/白日灼心-译制剧2.mp4",
      "https://oss.jufenqian.top/video-clips-data/20250328/t_19201_144628_23Y3/白日灼心-译制剧3.mp4"
    ]
  },
  "trace": {
    "request_id": "0195dbb6-2ae9-70f0-b481-87fafa928a01",
    "timestamp": 1743147904,
    "take_time": 1
  }
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

状态码 **200**

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» code|integer|true|none||none|
|» message|string|true|none||none|
|» data|object|true|none||none|
|»» id|integer|true|none||任务ID|
|»» task_uuid|string|true|none||任务 UUId|
|»» task_order_num|string|true|none||none|
|»» task_type|string|true|none||任务类型，对应创建任务的类型|
|»» status|integer|true|none||任务状态|
|»» original_language|string|true|none||原语言|
|»» target_languages|[object]|true|none||目标语言，数组|
|»»» area|string|false|none||的确|
|»»» language|string|false|none||语言|
|»» started_at|string|true|none||开始时间|
|»» completed_at|null|true|none||完成时间|
|»» created_at|string|true|none||创建时间|
|»» file_set_id|integer|true|none||文件夹ID|
|»» auto_run|boolean|true|none||是否自动|
|»» translation_style|string|true|none||翻译|
|»» style_prompt|string|true|none||自定义 prompt|
|»» resources|object|true|none||创建任务，选择的数据|
|»»» file_set_name|string|true|none||none|
|»» subtitle_style|object|true|none||none|
|»»» font_size|integer|true|none||none|
|»» consumed_points|integer|true|none||消耗的点数|
|»» task_flows|[object]|true|none||任务的 flow|
|»»» flow_type|string|true|none||flow 类型|
|»»» video_task_id|integer|true|none||task id|
|»»» id|integer|true|none||id|
|»»» status|integer|true|none||状态|
|»»» error_message|null|true|none||错误信息|
|»»» started_at|string¦null|true|none||开始时间|
|»»» finished_at|string¦null|true|none||结束时间|
|»»» created_at|string|true|none||创建时间|
|»» result|boolean|true|none||结果|
|»» message|string|true|none||信息|
|»» srt_list|[object]|true|none||字幕翻译|
|»»» playlet_num|string|true|none||集数|
|»»» content|string|true|none||内容|
|»» localized_map|object|true|none||本土化翻译|
|»»» 英文|object|true|none||none|
|»»»» 角色|object|true|none||none|
|»»»»» 许功|[object]|true|none||none|
|»»»»»» 原文|string|true|none||none|
|»»»»»» 本土化|string|true|none||none|
|»»»»»» 注释|string|true|none||none|
|»»»»» 许阳|[object]|true|none||none|
|»»»»»» 原文|string|true|none||none|
|»»»»»» 本土化|string|true|none||none|
|»»»»»» 注释|string|true|none||none|
|»»»»» 老三|[object]|true|none||none|
|»»»»»» 原文|string|true|none||none|
|»»»»»» 本土化|string|true|none||none|
|»»»»»» 注释|string|true|none||none|
|»»»»» 三婶|[object]|true|none||none|
|»»»»»» 原文|string|false|none||none|
|»»»»»» 本土化|string|false|none||none|
|»»»»»» 注释|string|false|none||none|
|»»»»» 老二|[object]|true|none||none|
|»»»»»» 原文|string|true|none||none|
|»»»»»» 本土化|string|true|none||none|
|»»»»»» 注释|string|true|none||none|
|»»»»» 孙叔|[object]|true|none||none|
|»»»»»» 原文|string|false|none||none|
|»»»»»» 本土化|string|false|none||none|
|»»»»»» 注释|string|false|none||none|
|»»»»» 老徐|[object]|true|none||none|
|»»»»»» 原文|string|false|none||none|
|»»»»»» 本土化|string|false|none||none|
|»»»»»» 注释|string|false|none||none|
|»»»» 地名|[string]|true|none||none|
|»»»» 组织名|[string]|true|none||none|
|»»»» 文化相关|[string]|true|none||none|
|»» origin_srts|[object]|true|none||原字幕|
|»»» id|integer|true|none||id|
|»»» role_srt|string|true|none||字幕内容|
|»»» num|integer|true|none||集数|
|»» video_urls|[string]|true|none||最终输出的视频链接|
|» trace|object|true|none||none|
|»» request_id|string|true|none||none|
|»» timestamp|integer|true|none||none|
|»» take_time|integer|true|none||none|

# 数据模型

