import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "../styles/markdown.css";

const MarkdownTest: React.FC = () => {
  const testMarkdown = `# 测试标题

## 二级标题

**这是粗体文本**

- 列表项目1
- 列表项目2

---

> 这是一个引用

\`\`\`javascript
console.log("代码块测试");
\`\`\``;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Markdown测试</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">原始Markdown:</h3>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
          {testMarkdown}
        </pre>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">渲染结果:</h3>
        <div className="border border-gray-300 p-4 rounded markdown-preview prose prose-sm max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {testMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MarkdownTest;
