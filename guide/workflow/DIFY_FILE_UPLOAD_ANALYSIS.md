# Dify 文件上传与传递分析

根据 Dify 对话 API 文档，分析文件传递的正确方式。

## 📋 API 文档关键信息

### 1. 文件上传接口 (POST /files/upload)

**请求格式：**
- Content-Type: `multipart/form-data`
- 参数：
  - `file`: 要上传的文件
  - `user`: 用户标识（必须和发送消息接口的 user 一致）

**响应格式：**
```json
{
  "id": "72fa9618-8f89-4a37-9b33-7e1178a24a67",
  "name": "example.png",
  "size": 1024,
  "extension": "png",
  "mime_type": "image/png",
  "created_by": 123,
  "created_at": 1577836800
}
```

### 2. 发送消息接口 (POST /chat-messages)

**文件字段格式：**

`files` 字段应该是**对象数组**，每个对象包含：

```typescript
{
  type: string;              // 文件类型：document | image | audio | video | custom
  transfer_method: string;   // 传递方式：local_file | remote_url
  upload_file_id?: string;   // 文件 ID（仅当 transfer_method 为 local_file 时）
  url?: string;              // 文件 URL（仅当 transfer_method 为 remote_url 时）
}
```

**文件类型支持：**
- `document`: TXT, MD, MARKDOWN, PDF, HTML, XLSX, XLS, DOCX, CSV, EML, MSG, PPTX, PPT, XML, EPUB
- `image`: JPG, JPEG, PNG, GIF, WEBP, SVG
- `audio`: MP3, M4A, WAV, WEBM, AMR
- `video`: MP4, MOV, MPEG, MPGA
- `custom`: 其他文件类型

**示例请求：**
```json
{
  "query": "What are the specs of the iPhone 13 Pro Max?",
  "inputs": {},
  "response_mode": "blocking",
  "conversation_id": "",
  "user": "abc-123",
  "files": [
    {
      "type": "image",
      "transfer_method": "remote_url",
      "url": "https://cloud.dify.ai/logo/logo-site.png"
    },
    {
      "type": "document",
      "transfer_method": "local_file",
      "upload_file_id": "72fa9618-8f89-4a37-9b33-7e1178a24a67"
    }
  ]
}
```

## 🔧 当前实现分析

### ✅ 正确的部分

1. **文件上传流程正确**：
   - 通过 `/files/upload` 接口上传文件
   - 获取文件 ID (uuid)
   - 用户标识一致

2. **文件传递位置正确**：
   - 在 `files` 字段中传递

### ❌ 需要修正的部分

**问题：当前只传递文件 ID 数组，而不是文件对象数组**

当前代码：
```typescript
files: fileIds.length > 0 ? fileIds : undefined  // ❌ 错误：直接传递 ID 数组
```

应该改为：
```typescript
files: fileIds.length > 0 ? fileIds.map(fileId => ({
  type: detectFileType(fileId),      // 需要根据文件 ID 或文件信息判断类型
  transfer_method: 'local_file',
  upload_file_id: fileId
})) : undefined  // ✅ 正确：传递文件对象数组
```

## 📝 修正方案

### 1. 需要添加文件类型检测

根据文件的 MIME type 或扩展名判断文件类型：

```typescript
function detectFileTypeFromMime(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.includes('pdf') || 
      mimeType.includes('document') || 
      mimeType.includes('word') ||
      mimeType.includes('excel') ||
      mimeType.includes('text') ||
      mimeType.includes('markdown')) return 'document';
  return 'custom';
}
```

### 2. 保存文件信息以便后续使用

在上传文件时，需要保存文件的类型信息，以便后续构造正确的 files 数组。

### 3. 修正 executeChat 方法

将文件 ID 数组转换为文件对象数组：

```typescript
// 需要在上传文件时保存文件类型信息
const fileObjects = fileIds.map((fileId, index) => {
  const fileInfo = uploadedFileInfos[index]; // 需要保存上传时的文件信息
  return {
    type: detectFileTypeFromMime(fileInfo.mimeType),
    transfer_method: 'local_file',
    upload_file_id: fileId
  };
});

const requestBody = {
  query: input.query,
  conversation_id: input.conversationId,
  inputs: cleanInputs,
  response_mode: 'blocking',
  user: userId,
  files: fileObjects.length > 0 ? fileObjects : undefined,
};
```

## 🎯 实现步骤

1. 修改 `uploadFileToDify` 方法，返回文件信息（包括类型）
2. 在 `executeChat` 中保存上传的文件信息
3. 构造正确的文件对象数组传递给 Dify API

## ⚠️ 注意事项

1. **用户标识必须一致**：上传文件和发送消息时的 `user` 参数必须相同
2. **文件类型判断**：必须根据实际文件类型设置 `type` 字段
3. **传递方式**：使用 `local_file` 时必须有 `upload_file_id`，使用 `remote_url` 时必须有 `url`
4. **Vision 模型支持**：文件上传仅当模型支持 Vision 能力时可用

