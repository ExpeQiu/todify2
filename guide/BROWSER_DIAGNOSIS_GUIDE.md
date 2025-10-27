# 浏览器诊断指南

## 快速诊断步骤

### 1. 访问页面

打开浏览器访问：http://localhost:3001

### 2. 打开开发者工具

- Chrome: `F12` 或 `Cmd+Option+I` (Mac)
- Firefox: `F12` 或 `Cmd+Option+K` (Mac)

### 3. 在控制台运行以下命令

```javascript
// === 完整诊断脚本 ===

// 1. 检查StandaloneDocumentEditor
const editor = document.getElementById('standalone-document-editor');
console.log('✓ StandaloneDocumentEditor存在:', !!editor);

if (editor) {
  const style = window.getComputedStyle(editor);
  console.log('背景色:', style.backgroundColor);
  console.log('文字颜色:', style.color);
}

// 2. 检查Markdown预览区域
const markdownPreview = document.getElementById('standalone-markdown-preview');
console.log('✓ Markdown预览区域存在:', !!markdownPreview);

if (markdownPreview) {
  const previewStyle = window.getComputedStyle(markdownPreview);
  console.log('预览背景色:', previewStyle.backgroundColor);
  console.log('预览文字颜色:', previewStyle.color);
  
  // 检查是否仍有Markdown符号
  const text = markdownPreview.textContent;
  const hasSymbols = text.includes('##') || text.includes('**');
  console.log('是否仍有Markdown符号:', hasSymbols);
  
  // 检查渲染的标题
  const h1Elements = markdownPreview.querySelectorAll('h1, h2, h3');
  console.log('渲染的标题数量:', h1Elements.length);
  h1Elements.forEach((el, idx) => {
    const computedStyle = window.getComputedStyle(el);
    console.log(`H${idx + 1} (${el.tagName}): 颜色=${computedStyle.color}, 内容="${el.textContent.substring(0, 50)}"`);
  });
}

// 3. 检查Dark Mode
console.log('HTML theme:', document.documentElement.getAttribute('data-theme'));
console.log('系统暗色模式:', window.matchMedia('(prefers-color-scheme: dark)').matches);

// 4. 检查CSS变量
const bgPrimary = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary');
const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
console.log('CSS变量 --bg-primary:', bgPrimary);
console.log('CSS变量 --text-primary:', textPrimary);
```

### 4. 预期结果

**正常情况：**
- ✓ `StandaloneDocumentEditor存在: true`
- ✓ `Markdown预览区域存在: true`
- ✓ 背景色为: `rgb(255, 255, 255)`
- ✓ 文字颜色为: `rgb(31, 41, 55)` 或 `rgb(51, 51, 51)`
- ✓ `是否仍有Markdown符号: false`
- ✓ `渲染的标题数量: > 0`

**异常情况：**
- ❌ `StandaloneDocumentEditor存在: false` → 组件未使用
- ❌ 背景色为深色（如`rgb(15, 23, 42)`）→ CSS被覆盖
- ❌ 文字颜色为白色 → 深色模式激活
- ❌ `是否仍有Markdown符号: true` → ReactMarkdown未工作
- ❌ `渲染的标题数量: 0` → HTML未正确渲染

### 5. 截图保存证据

按以下步骤截图保存：

1. 整个页面截图
2. 控制台的诊断结果
3. Elements面板中`#standalone-markdown-preview`的样式

### 6. 常见问题解决方案

#### 问题A：组件不存在
```
解决方案：检查WorkflowPage.tsx是否正确导入和使用了StandaloneDocumentEditor
```

#### 问题B：深色背景
```
可能原因：
1. 系统暗色模式偏好
2. data-theme="dark"被设置
3. CSS变量被覆盖

解决方案：
1. 在控制台运行：document.documentElement.setAttribute('data-theme', 'light');
2. 检查是否有其他CSS规则覆盖
```

#### 问题C：Markdown不渲染
```
可能原因：
1. ReactMarkdown未正确渲染
2. CSS选择器不匹配

解决方案：
1. 检查markdown预览的innerHTML是否包含<h1>, <p>等标签
2. 检查.standalone-markdown-preview的样式是否正确应用
```

## 完整诊断报告模板

请复制以下内容并填写结果：

```markdown
## 诊断报告

**时间：** YYYY-MM-DD HH:MM
**浏览器：** Chrome/Firefox/Safari
**URL：** http://localhost:3001

### 1. 组件检查
- [ ] StandaloneDocumentEditor存在: true/false
- [ ] 背景色: ___________
- [ ] 文字颜色: ___________

### 2. Markdown渲染检查
- [ ] Markdown预览区域存在: true/false
- [ ] 是否仍有Markdown符号: true/false
- [ ] 渲染的标题数量: ___________

### 3. 环境检查
- [ ] HTML theme: ___________
- [ ] 系统暗色模式: true/false
- [ ] CSS变量 --bg-primary: ___________
- [ ] CSS变量 --text-primary: ___________

### 4. 截图
[在此插入截图]

### 5. 问题描述
[描述具体看到的问题]
```

## 下一步行动

1. **运行诊断** - 访问页面并在控制台运行诊断脚本
2. **保存结果** - 截图和诊断结果
3. **提供报告** - 将结果发送给我进行分析
4. **根据结果修复** - 我会根据诊断结果提供针对性的修复方案

