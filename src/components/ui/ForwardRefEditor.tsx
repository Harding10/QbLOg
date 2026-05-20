"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import { type MDXEditorMethods, type MDXEditorProps } from "@mdxeditor/editor";

// Importation dynamique avec SSR désactivé pour éviter les erreurs d'hydratation côté serveur
const Editor = dynamic(() => import("./InitializedMDXEditor"), {
  ssr: false
});

export const ForwardRefEditor = forwardRef<MDXEditorMethods, MDXEditorProps>((props, ref) => (
  <Editor {...props} editorRef={ref} />
));

ForwardRefEditor.displayName = "ForwardRefEditor";
