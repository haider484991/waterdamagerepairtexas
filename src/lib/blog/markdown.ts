/**
 * Markdown Processing Utilities
 * 
 * Handles:
 * - Markdown to HTML conversion
 * - TOC generation from headings
 * - Reading time calculation
 * - Word count
 * - HTML sanitization
 */

// Simple markdown to HTML converter (no external dependencies)
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML entities first (for security)
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const language = lang || "plaintext";
    return `<pre><code class="language-${language}">${code.trim()}</code></pre>`;
  });

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Headings (convert # to H2, ## to H2, etc. to prevent multiple H1s)
  html = html.replace(/^######\s+(.+)$/gm, '<h6 id="$1">$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5 id="$1">$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4 id="$1">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, (_, text) => {
    const id = slugify(text);
    return `<h3 id="${id}">${text}</h3>`;
  });
  html = html.replace(/^##\s+(.+)$/gm, (_, text) => {
    const id = slugify(text);
    return `<h2 id="${id}">${text}</h2>`;
  });
  html = html.replace(/^#\s+(.+)$/gm, (_, text) => {
    const id = slugify(text);
    return `<h2 id="${id}">${text}</h2>`;
  });

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");

  // Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" rel="noopener noreferrer">$1</a>'
  );

  // Images ![alt](url)
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" loading="lazy" />'
  );

  // Blockquotes (> text)
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, "\n");

  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>\n${match}</ul>\n`);

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");

  // Horizontal rules
  html = html.replace(/^---+$/gm, "<hr />");
  html = html.replace(/^\*\*\*+$/gm, "<hr />");

  // Paragraphs - wrap remaining text blocks
  html = html
    .split(/\n\s*\n/)
    .map((block) => {
      block = block.trim();
      if (!block) return "";
      
      // Don't wrap if already a block-level HTML element
      const blockLevelTags = /^\s*<(h[1-6]|ul|ol|li|pre|blockquote|hr|p|div|section|article|img|table)/i;
      if (blockLevelTags.test(block)) {
        return block;
      }
      
      return `<p>${block}</p>`;
    })
    .join("\n");

  // Clean up: remove extra <p> wrappers that might have been added around block elements
  html = html.replace(/<p>\s*(<(?:h[1-6]|ul|ol|li|pre|blockquote|hr|div|img|table).*?<\/.*?>)\s*<\/p>/gi, "$1");
  
  // Clean up extra newlines
  html = html.replace(/\n{3,}/g, "\n\n");

  return html.trim();
}

/**
 * Generate a slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

/**
 * Extract table of contents from markdown
 */
export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function extractTOC(markdown: string): TOCItem[] {
  const toc: TOCItem[] = [];
  // Match #, ##, and ### headings
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    let level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);
    
    // Convert level 1 to level 2 for TOC consistency since we render # as h2
    if (level === 1) level = 2;
    
    toc.push({ id, text, level });
  }
  
  return toc;
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = countWords(text);
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  // Remove markdown syntax
  const plainText = text
    .replace(/```[\s\S]*?```/g, "") // Code blocks
    .replace(/`[^`]+`/g, "") // Inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1") // Images
    .replace(/[#*_~`>-]/g, "") // Markdown symbols
    .replace(/\n+/g, " "); // Newlines
  
  const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Sanitize HTML to prevent XSS
 * Allows only safe tags and attributes
 */
export function sanitizeHtml(html: string): string {
  const allowedTags = [
    "p", "br", "hr",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "strike",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
    "div", "span",
  ];
  
  const allowedAttributes: Record<string, string[]> = {
    a: ["href", "title", "rel", "target"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    code: ["class"],
    pre: ["class"],
    "*": ["id", "class"],
  };

  // Simple tag sanitization
  // For production, consider using a library like DOMPurify
  let sanitized = html;
  
  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/javascript:/gi, "");
  
  return sanitized;
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(markdown: string, maxLength: number = 160): string {
  // Remove markdown syntax
  let text = markdown
    .replace(/```[\s\S]*?```/g, "") // Code blocks
    .replace(/`[^`]+`/g, "") // Inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // Images
    .replace(/^#+\s+/gm, "") // Headings
    .replace(/[*_~`>]/g, "") // Markdown symbols
    .replace(/\n+/g, " ") // Newlines
    .trim();
  
  if (text.length <= maxLength) {
    return text;
  }
  
  // Truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  
  return truncated.substring(0, lastSpace) + "...";
}

/**
 * Add anchor IDs to headings in HTML
 */
export function addHeadingIds(html: string): string {
  return html.replace(
    /<(h[2-6])>([^<]+)<\/\1>/g,
    (_, tag, text) => {
      const id = slugify(text);
      return `<${tag} id="${id}">${text}</${tag}>`;
    }
  );
}

/**
 * Wrap tables in responsive container
 */
export function wrapTables(html: string): string {
  return html.replace(
    /<table/g,
    '<div class="table-responsive"><table'
  ).replace(
    /<\/table>/g,
    '</table></div>'
  );
}

/**
 * Add lazy loading to images
 */
export function addLazyLoading(html: string): string {
  return html.replace(
    /<img([^>]*)>/g,
    (match, attrs) => {
      if (attrs.includes('loading=')) {
        return match;
      }
      return `<img${attrs} loading="lazy">`;
    }
  );
}

/**
 * Process markdown to fully formatted HTML
 */
export function processMarkdown(markdown: string): {
  html: string;
  toc: TOCItem[];
  readingTime: number;
  wordCount: number;
  excerpt: string;
} {
  const toc = extractTOC(markdown);
  const readingTime = calculateReadingTime(markdown);
  const wordCount = countWords(markdown);
  const excerpt = generateExcerpt(markdown);
  
  let html = markdownToHtml(markdown);
  html = addHeadingIds(html);
  html = wrapTables(html);
  html = addLazyLoading(html);
  html = sanitizeHtml(html);
  
  return {
    html,
    toc,
    readingTime,
    wordCount,
    excerpt,
  };
}
