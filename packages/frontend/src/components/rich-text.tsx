import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { RichText as RichTextValue } from "@victoria-portfolio/content-schema/types";

const components: Partial<PortableTextComponents> = {
  marks: {
    link: ({ value, children }) => {
      const href = typeof value?.href === "string" ? value.href : undefined;
      return (
        <a
          href={href}
          target={href?.startsWith("https:") ? "_blank" : undefined}
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },
  },
};

export function RichText({ value }: { value: RichTextValue }) {
  return (
    <div className="rich-text">
      <PortableText value={value} components={components} />
    </div>
  );
}
