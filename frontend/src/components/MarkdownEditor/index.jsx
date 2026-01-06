import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';
import uploadService from '../../services/uploadService';
import './index.css';

const RichTextEditor = ({ value, onChange, height = 300, placeholder, onSubmit }) => {
  const handleImageUpload = async (file) => {
    try {
      const result = await uploadService.uploadImage(file);
      return result.url;
    } catch (error) {
      console.error('图片上传失败:', error);
      return null;
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || '支持 Markdown 快捷键，可粘贴图片...',
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              handleImageUpload(file).then((url) => {
                if (url && view.state.selection) {
                  const { tr } = view.state;
                  const node = view.state.schema.nodes.image.create({ src: url });
                  view.dispatch(tr.replaceSelectionWith(node));
                }
              });
            }
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const file = files[0];
        if (file.type.startsWith('image/')) {
          event.preventDefault();
          handleImageUpload(file).then((url) => {
            if (url) {
              const { tr } = view.state;
              const node = view.state.schema.nodes.image.create({ src: url });
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (pos) {
                view.dispatch(tr.insert(pos.pos, node));
              }
            }
          });
          return true;
        }
        return false;
      },
      handleKeyDown: (view, event) => {
        // Cmd+Enter (Mac) or Ctrl+Enter (Windows) to submit
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault();
          onSubmit?.();
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  return (
    <div className="tiptap-wrapper" style={{ minHeight: height }}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
