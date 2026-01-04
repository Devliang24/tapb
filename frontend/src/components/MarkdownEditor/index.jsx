import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { message } from 'antd';
import uploadService from '../../services/uploadService';

// 导入 TinyMCE 自托管文件
import 'tinymce/tinymce';
import 'tinymce/models/dom';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/table';
import 'tinymce/plugins/code';
import 'tinymce/plugins/codesample';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/autoresize';

const RichTextEditor = ({ value, onChange, height = 300, placeholder }) => {
  const editorRef = useRef(null);

  // 图片上传处理
  const handleImageUpload = async (blobInfo) => {
    const hide = message.loading('图片上传中...', 0);
    try {
      const file = blobInfo.blob();
      const result = await uploadService.uploadImage(file);
      hide();
      message.success('图片上传成功！');
      return `http://localhost:8000${result.url}`;
    } catch (error) {
      hide();
      message.error('图片上传失败');
      throw error;
    }
  };

  return (
    <Editor
      onInit={(evt, editor) => editorRef.current = editor}
      value={value}
      onEditorChange={(content) => onChange(content)}
      init={{
        height,
        menubar: false,
        placeholder: placeholder || '请输入内容，支持粘贴图片...',
        plugins: [
          'lists', 'link', 'image', 'table', 'code', 'codesample', 'fullscreen', 'autolink', 'autoresize'
        ],
        toolbar: 'undo redo | bold italic underline strikethrough | ' +
          'forecolor backcolor | bullist numlist | ' +
          'link image table codesample | code fullscreen',
        content_style: `
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            font-size: 14px; 
            line-height: 1.6;
            padding: 8px;
          }
          img { max-width: 100%; height: auto; }
          pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; }
          code { background: #f5f5f5; padding: 2px 4px; border-radius: 2px; }
        `,
        block_formats: 'Paragraph=p;',
        formats: {
          p: { block: 'p' }
        },
        images_upload_handler: handleImageUpload,
        paste_data_images: true,
        automatic_uploads: true,
        file_picker_types: 'image',
        branding: false,
        promotion: false,
        license_key: 'gpl',
        skin: 'oxide',
        skin_url: '/tinymce/skins/ui/oxide',
        content_css: '/tinymce/skins/content/default/content.min.css',
        statusbar: false,
        min_height: 200,
        max_height: 600,
      }}
    />
  );
};

export default RichTextEditor;
