"use client";

import React, { useState, useEffect } from "react";
import { ForwardRefEditor } from "./ForwardRefEditor";
import "@mdxeditor/editor/style.css";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({ value, onChange, placeholder, minHeight = "400px" }: MarkdownEditorProps) {
  const [editorKey, setEditorKey] = useState("initial");
  const [initialValue] = useState(value);

  // Synchronisation dynamique si le document initial était vide mais a fini de charger depuis Firebase
  useEffect(() => {
    if (value && initialValue === "" && editorKey === "initial") {
      setEditorKey("loaded");
    }
  }, [value, initialValue, editorKey]);

  return (
    <div className="w-full min-h-[400px]">
      <ForwardRefEditor
        key={editorKey}
        markdown={value}
        onChange={onChange}
        placeholder={placeholder || "Écrivez ici..."}
        contentEditableClassName="prose prose-blue dark:prose-invert max-w-none focus:outline-none min-h-[400px]"
      />
    </div>
  );
}
