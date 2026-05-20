"use client";

import { useAuth } from "@/context/AuthContext";
import { uploadFile } from "@/lib/firebase/services/files";

import "@mdxeditor/editor/style.css";
import type { ForwardedRef } from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  markdownShortcutPlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  StrikeThroughSupSubToggles,
  ListsToggle,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertCodeBlock,
  Separator,
  toolbarPlugin as toolbar,
  type MDXEditorMethods,
  type MDXEditorProps
} from "@mdxeditor/editor";

export default function InitializedMDXEditor({
  editorRef,
  markdown,
  onChange,
  placeholder,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  const { user } = useAuth();

  const handleImageUpload = async (image: File) => {
    if (!user) throw new Error("Vous devez être connecté pour uploader une image.");
    try {
      const fileData = await uploadFile(image, user.uid, null);
      return fileData.url;
    } catch (error) {
      console.error("Erreur lors de l'upload de l'image:", error);
      throw error;
    }
  };

  return (
    <div className="w-full text-gray-800 dark:text-gray-150">
      <MDXEditor
        ref={editorRef}
        markdown={markdown || "# Nouvelle note"}
        onChange={onChange}
        placeholder={placeholder}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin({
            imageUploadHandler: handleImageUpload
          }),
          tablePlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "js" }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              js: "JavaScript",
              jsx: "JSX",
              ts: "TypeScript",
              tsx: "TSX",
              html: "HTML",
              css: "CSS",
              json: "JSON"
            }
          }),
          toolbar({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <CodeToggle />
                <StrikeThroughSupSubToggles />
                <Separator />
                <ListsToggle />
                <BlockTypeSelect />
                <Separator />
                <CreateLink />
                <InsertImage />
                <InsertTable />
                <InsertCodeBlock />
              </>
            )
          })
        ]}
        {...props}
      />
    </div>
  );
}
