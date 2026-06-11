import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Icons } from '../../assets/icons';



import { Button } from '@/components/ui/Button';
import type { TiptapEditorProps } from '../../types/components.interface';
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 border-b border-[#dfe1e6] p-1 px-2 bg-background/50 flex-wrap text-[#42526e]">
      <Button 
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-serif font-bold text-xs ${editor.isActive('heading', { level: 1 }) ? 'bg-[#091e4214] text-primary' : ''}`}
        title="Heading 1"
      >
        H1
      </Button>
      <Button 
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-serif font-bold text-xs ${editor.isActive('heading', { level: 2 }) ? 'bg-[#091e4214] text-primary' : ''}`}
        title="Heading 2"
      >
        H2
      </Button>
      <div className="w-px h-4 bg-accent mx-1"></div>
      <Button 
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-serif font-bold text-sm ${editor.isActive('bold') ? 'bg-[#091e4214] text-primary' : ''}`}
        title="Bold"
      >
        B
      </Button>
      <Button 
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-serif italic text-sm ${editor.isActive('italic') ? 'bg-[#091e4214] text-primary' : ''}`}
        title="Italic"
      >
        I
      </Button>
      <Button 
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-serif text-sm line-through ${editor.isActive('strike') ? 'bg-[#091e4214] text-primary' : ''}`}
        title="Strikethrough"
      >
        S
      </Button>
      <div className="w-px h-4 bg-accent mx-1"></div>
      
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
      <Button 
        onClick={() => editor.chain().focus().unsetColor().run()}
        className="p-1.5 rounded hover:bg-[#091e4214] text-xs font-medium"
        title="Reset Color"
      >
        <Icons.refreshCw size={12} />
      </Button>

      <div className="w-px h-4 bg-accent mx-1"></div>
      <Button 
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] ${editor.isActive('bulletList') ? 'bg-[#091e4214] text-primary' : ''}`}
        title="Bullet List"
      >
        <Icons.listTodo size={14} />
      </Button>
      <Button 
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-bold text-xs ${editor.isActive('orderedList') ? 'bg-[#091e4214] text-primary' : ''}`}
        title="Ordered List"
      >
        1.
      </Button>
      <Button 
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] font-serif font-bold text-sm ${editor.isActive('blockquote') ? 'bg-[#091e4214] text-primary' : ''}`}
        title="Quote"
      >
        "
      </Button>
      <Button 
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded hover:bg-[#091e4214] ${editor.isActive('codeBlock') ? 'bg-[#091e4214] text-primary' : ''}`}
        title="Code Block"
      >
        <Icons.code size={14} />
      </Button>
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
    <div className="flex flex-col border border-[#dfe1e6] rounded focus-within:border-[#4c9aff] focus-within:shadow-[0_0_0_1px_#4c9aff] transition-all bg-card overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="tiptap-editor-content" />
      
      <div className="flex items-center gap-2 p-2 border-t border-border bg-background/50">
        <Button 
          onClick={onSave}
          className="px-3 py-1.5 bg-[#0052cc] hover:bg-[#0047b3] text-white font-medium text-[13px] rounded-[3px] transition-colors"
        >
          Save
        </Button>
        <Button 
          onClick={onCancel}
          className="px-3 py-1.5 text-[#42526e] hover:bg-[#091e420f] font-medium text-[13px] rounded-[3px] transition-colors"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
