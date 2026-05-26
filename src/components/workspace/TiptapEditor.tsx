import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Icons } from '../../assets/icons';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 border-b border-[#dfe1e6] p-1 px-2 bg-slate-50/50 flex-wrap text-[#42526e]">
      <button 
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-serif font-bold text-xs ${editor.isActive('heading', { level: 1 }) ? 'bg-[#091e4214] text-blue-600' : ''}`}
        title="Heading 1"
      >
        H1
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-serif font-bold text-xs ${editor.isActive('heading', { level: 2 }) ? 'bg-[#091e4214] text-blue-600' : ''}`}
        title="Heading 2"
      >
        H2
      </button>
      <div className="w-px h-4 bg-slate-300 mx-1"></div>
      <button 
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-serif font-bold text-sm ${editor.isActive('bold') ? 'bg-[#091e4214] text-blue-600' : ''}`}
        title="Bold"
      >
        B
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-serif italic text-sm ${editor.isActive('italic') ? 'bg-[#091e4214] text-blue-600' : ''}`}
        title="Italic"
      >
        I
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-serif text-sm line-through ${editor.isActive('strike') ? 'bg-[#091e4214] text-blue-600' : ''}`}
        title="Strikethrough"
      >
        S
      </button>
      <div className="w-px h-4 bg-slate-300 mx-1"></div>
      
      {/* Color Picker */}
      <div className="relative flex items-center group">
        <input
          type="color"
          onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
          value={editor.getAttributes('textStyle').color || '#172b4d'}
          className="w-6 h-6 p-0 border-0 rounded cursor-pointer overflow-hidden bg-transparent"
          title="Text Color"
        />
      </div>
      <button 
        onClick={() => editor.chain().focus().unsetColor().run()}
        className="p-1.5 rounded hover:bg-[#091e4214] text-xs font-medium"
        title="Reset Color"
      >
        <Icons.refreshCw size={12} />
      </button>

      <div className="w-px h-4 bg-slate-300 mx-1"></div>
      <button 
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] ${editor.isActive('bulletList') ? 'bg-[#091e4214] text-blue-600' : ''}`}
        title="Bullet List"
      >
        <Icons.listTodo size={14} />
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-bold text-xs ${editor.isActive('orderedList') ? 'bg-[#091e4214] text-blue-600' : ''}`}
        title="Ordered List"
      >
        1.
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-serif font-bold text-sm ${editor.isActive('blockquote') ? 'bg-[#091e4214] text-blue-600' : ''}`}
        title="Quote"
      >
        "
      </button>
      <button 
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] ${editor.isActive('codeBlock') ? 'bg-[#091e4214] text-blue-600' : ''}`}
        title="Code Block"
      >
        <Icons.code size={14} />
      </button>
    </div>
  );
};

export default function TiptapEditor({ content, onChange, onSave, onCancel }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: 'Add a description...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[120px] p-4 text-[14px] text-[#172b4d]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="flex flex-col border border-[#dfe1e6] rounded focus-within:border-[#4c9aff] focus-within:shadow-[0_0_0_1px_#4c9aff] transition-all bg-white overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="tiptap-editor-content" />
      
      <div className="flex items-center gap-2 p-2 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={onSave}
          className="px-3 py-1.5 bg-[#0052cc] hover:bg-[#0047b3] text-white font-medium text-[13px] rounded-[3px] transition-colors"
        >
          Save
        </button>
        <button 
          onClick={onCancel}
          className="px-3 py-1.5 text-[#42526e] hover:bg-[#091e420f] font-medium text-[13px] rounded-[3px] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
