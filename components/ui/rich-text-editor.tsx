"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

const TinyMCEEditor = dynamic(
  async () => (await import("@tinymce/tinymce-react")).Editor,
  { ssr: false }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DEFAULT_TINYMCE_KEY = "u922y2yqcb65w58kc713pml3qlshlx8di4ufxbwb80t8wuwu";

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const licenseKey =
    process.env.NEXT_PUBLIC_TINYMCE_API_KEY || DEFAULT_TINYMCE_KEY;

  const init = useMemo(
    () => ({
      height: 520,
      menubar: true,
      plugins: [
        "anchor",
        "autolink",
        "charmap",
        "codesample",
        "emoticons",
        "link",
        "lists",
        "media",
        "searchreplace",
        "table",
        "visualblocks",
        "wordcount",
        "checklist",
        "mediaembed",
        "casechange",
        "formatpainter",
        "pageembed",
        "a11ychecker",
        "tinymcespellchecker",
        "permanentpen",
        "powerpaste",
        "advtable",
        "advcode",
        "advtemplate",
        "ai",
        "mentions",
        "tinycomments",
        "tableofcontents",
        "footnotes",
        "mergetags",
        "autocorrect",
        "typography",
      ],
      toolbar:
        "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat",
      tinycomments_mode: "embedded",
      tinycomments_author: "Agreement Author",
      mergetags_list: [
        { value: "vehicle.make", title: "Vehicle Make" },
        { value: "vehicle.model", title: "Vehicle Model" },
        { value: "vehicle.year", title: "Vehicle Year" },
        { value: "inspection.date", title: "Inspection Date" },
        { value: "organisation.name", title: "Organisation" },
      ],
      ai_request: (_request: unknown, respondWith: any) =>
        respondWith.string(() =>
          Promise.reject("AI Assistant not configured in this environment")
        ),
      uploadcare_public_key: "7b0f7d9160a79444453a",
      placeholder,
      branding: false,
      promotion: false,
      content_style:
        "body { font-family: 'Inter', sans-serif; font-size:14px; color:#111827; }",
    }),
    [placeholder]
  );

  const tinymceScriptSrc = useMemo(
    () =>
      `https://cdn.tiny.cloud/1/${licenseKey}/tinymce/6/tinymce.min.js`,
    [licenseKey]
  );

  return (
    <div className="rich-text-wrapper">
      <TinyMCEEditor
        value={value}
        init={init}
        licenseKey={licenseKey}
        tinymceScriptSrc={tinymceScriptSrc}
        onEditorChange={(content) => onChange(content)}
        textareaName="agreement-template"
        aria-label="Agreement template editor"
      />
    </div>
  );
}
