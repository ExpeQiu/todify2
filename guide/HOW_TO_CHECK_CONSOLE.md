# 如何检查浏览器控制台

## 📋 步骤说明

### 1️⃣ 打开页面
在浏览器地址栏输入：**http://localhost:3001**

### 2️⃣ 打开开发者工具（三种方法任选其一）

#### 方法A：快捷键（推荐）
- **Mac**: 按 `Cmd + Option + I`
- **Windows/Linux**: 按 `F12`

#### 方法B：右键菜单
- 在页面任意位置 **右键点击**
- 选择 **"检查"** 或 **"Inspect"** 或 **"检查元素"**

#### 方法C：浏览器菜单
- 点击浏览器右上角的 **菜单** 或 **设置**
- 选择 **"更多工具"** → **"开发者工具"**

### 3️⃣ 找到Console标签
开发者工具打开后，会看到多个标签页：
- **Elements** (元素)
- **Console** (控制台) ⬅️ **就是这个！**
- **Network** (网络)
- **Sources** (源代码)

点击 **Console** 标签

### 4️⃣ 清空控制台（可选）
点击控制台左上角的 **🚫** (清空) 按钮，或按 `Cmd+K` (Mac) / `Ctrl+L` (Windows)

### 5️⃣ 粘贴诊断代码

将下面的代码**完整复制**，然后**粘贴到控制台**，最后按 **回车(Enter)**：

```javascript
console.log('=== 开始诊断 ===');
const editor = document.getElementById('standalone-document-editor');
console.log('1. StandaloneDocumentEditor存在:', !!editor);
if (editor) {
  const style = window.getComputedStyle(editor);
  console.log('2. 背景色:', style.backgroundColor);
  console.log('3. 文字颜色:', style.color);
}
const markdownPreview = document.getElementById('standalone-markdown-preview');
console.log('4. Markdown预览区域存在:', !!markdownPreview);
if (markdownPreview) {
  const previewStyle = window.getComputedStyle(markdownPreview);
  console.log('5. 预览背景色:', previewStyle.backgroundColor);
  console.log('6. 预览文字颜色:', previewStyle.color);
  const h1Elements = markdownPreview.querySelectorAll('h1, h2, h3');
  console.log('7. 渲染的标题数量:', h1Elements.length);
}
console.log('8. HTML theme:', document.documentElement.getAttribute('data-theme'));
console.log('9. 系统暗色模式:', window.matchMedia('(prefers-color-scheme: dark)').matches);
console.log('=== 诊断完成 ===');
```

### 6️⃣ 查看输出结果

诊断完成后，控制台会显示类似这样的输出：

```
=== 开始诊断 ===
1. StandaloneDocumentEditor存在: true
2. 背景色: rgb(255, 255, 255)
3. 文字颜色: rgb(31, 41, 55)
4. Markdown预览区域存在: true
5. 预览背景色: rgb(255, 255, 255)
6. 预览文字颜色: rgb(31, 41, 55)
7. 渲染的标题数量: 3
8. HTML theme: null
9. 系统暗色模式: false
=== 诊断完成 ===
```

## 📸 如何截图

### Windows
- 按 `Win + Shift + S` 打开截图工具
- 或按 `Print Screen` 全屏截图

### Mac
- 按 `Cmd + Shift + 3` 全屏截图
- 或按 `Cmd + Shift + 4` 选择区域截图

### 移动设备
- 同时按下 **电源键 + 音量减小键** (Android)
- 同时按下 **电源键 + Home键** (iPhone 8及以下)
- 同时按下 **电源键 + 音量增大键** (iPhone X及以上)

## ❓ 如果看不到控制台

1. **确认开发者工具已打开**
   - 屏幕下方或右侧应该有一个面板
   - 如果没看到，重新按 `F12` 或 `Cmd + Option + I`

2. **检查是否在正确的浏览器**
   - Chrome/Edge: ✅ 推荐
   - Firefox: ✅ 可用
   - Safari: ⚠️ 需要启用开发者菜单
   - 其他浏览器: ⚠️ 不保证支持

3. **检查控制台是否被隐藏**
   - 查看控制台右上角是否有 ⇕ 符号
   - 点击可以调整控制台的大小

4. **尝试硬刷新**
   - 按 `Cmd + Shift + R` (Mac) 或 `Ctrl + Shift + R` (Windows)
   - 这会清除缓存并重新加载页面

## 🆘 仍然有问题？

如果按照以上步骤操作后还是看不到控制台输出，请提供以下信息：

1. **浏览器类型和版本**（例如：Chrome 120, Firefox 121）
2. **操作系统**（例如：macOS 14, Windows 11）
3. **页面是否正常显示**（能否看到页面内容）
4. **是否有任何错误信息**（红色文字）
5. **截图**（如果可能）

然后我会提供更具体的帮助！

