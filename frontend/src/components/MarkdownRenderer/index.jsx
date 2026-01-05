import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.css';

/**
 * Markdown 渲染组件
 * 支持 GFM (GitHub Flavored Markdown)
 */
const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content) {
    return <span style={{ color: '#999' }}>暂无描述</span>;
  }

  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
