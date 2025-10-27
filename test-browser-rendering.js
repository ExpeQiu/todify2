// 浏览器诊断脚本
// 在浏览器控制台运行此脚本以诊断渲染问题

console.log('=== Markdown渲染诊断开始 ===');

// 1. 检查StandaloneDocumentEditor是否存在
const editor = document.getElementById('standalone-document-editor');
console.log('1. StandaloneDocumentEditor存在:', !!editor);

if (editor) {
  const style = window.getComputedStyle(editor);
  console.log('2. 实际背景色:', style.backgroundColor);
  console.log('3. 实际文字颜色:', style.color);
  console.log('4. 实际显示模式:', style.display);
  
  // 检查是否有内联样式
  const inlineStyle = editor.getAttribute('style');
  console.log('5. 内联样式:', inlineStyle);
  
  // 检查内联的style标签
  const styleTag = document.querySelector('#standalone-document-editor style');
  if (styleTag) {
    console.log('6. Style标签内容:', styleTag.textContent.substring(0, 200));
  } else {
    console.log('6. ❌ 未找到style标签');
  }
}

// 2. 检查Markdown预览区域
const markdownPreview = document.getElementById('standalone-markdown-preview');
console.log('\n7. Markdown预览区域存在:', !!markdownPreview);

if (markdownPreview) {
  const previewStyle = window.getComputedStyle(markdownPreview);
  console.log('8. 预览背景色:', previewStyle.backgroundColor);
  console.log('9. 预览文字颜色:', previewStyle.color);
  
  // 检查实际渲染的HTML
  console.log('10. 渲染的HTML内容:', markdownPreview.innerHTML.substring(0, 500));
  
  // 检查是否包含Markdown符号
  const hasMarkdownSymbols = markdownPreview.textContent.includes('##') || 
                              markdownPreview.textContent.includes('**');
  console.log('11. 是否仍有Markdown符号:', hasMarkdownSymbols);
}

// 3. 检查Dark Mode
const htmlTheme = document.documentElement.getAttribute('data-theme');
console.log('\n12. HTML theme属性:', htmlTheme || '未设置');

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
console.log('13. 系统暗色模式偏好:', prefersDark);

// 4. 检查CSS变量
const bgPrimary = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary');
const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
console.log('\n14. CSS变量 --bg-primary:', bgPrimary);
console.log('15. CSS变量 --text-primary:', textPrimary);

// 5. 检查WorkflowPage.css是否加载
const hasWorkflowPageCSS = Array.from(document.styleSheets).some(sheet => {
  try {
    return sheet.href && sheet.href.includes('WorkflowPage.css');
  } catch(e) {
    return false;
  }
});
console.log('\n16. WorkflowPage.css已加载:', hasWorkflowPageCSS);

// 6. 检查StandaloneDocumentEditor的props
console.log('\n17. 查看组件props（需要React DevTools）');

// 7. 检查markdown渲染结果
if (markdownPreview) {
  const h1Elements = markdownPreview.querySelectorAll('h1, h2, h3');
  console.log('\n18. 渲染的标题数量:', h1Elements.length);
  h1Elements.forEach((el, idx) => {
    const computedStyle = window.getComputedStyle(el);
    console.log(`   H${idx + 1}: 标签=${el.tagName}, 背景=${computedStyle.backgroundColor}, 颜色=${computedStyle.color}, 内容="${el.textContent.substring(0, 50)}"`);
  });
}

console.log('\n=== 诊断完成 ===');

