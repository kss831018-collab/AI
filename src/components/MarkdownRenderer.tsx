import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");
  let listItems: string[] = [];
  let tableRows: string[][] = [];
  const renderedElements: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`ul-${key}`} className="list-disc pl-6 mb-5 space-y-2 text-slate-300 leading-relaxed text-xs">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const flushTable = (key: string) => {
    if (tableRows.length > 0) {
      renderedElements.push(
        <div key={`table-wrapper-${key}`} className="overflow-x-auto my-6 border border-slate-800/80 rounded-xl shadow-2xl bg-slate-950/40">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-900/90 text-slate-200">
              <tr>
                {tableRows[0].map((cell, idx) => (
                  <th key={`th-${idx}`} className="px-4 py-3 text-left font-bold text-slate-200 tracking-wider border-b border-slate-800 bg-slate-900/80">
                    <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(cell.trim()) }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tableRows.slice(1).map((row, rowIdx) => (
                <tr key={`tr-${rowIdx}`} className={rowIdx % 2 === 1 ? "bg-slate-900/20" : "bg-slate-950/20"}>
                  {row.map((cell, cellIdx) => (
                    <td key={`td-${cellIdx}`} className="px-4 py-3 text-slate-300 border-b border-slate-800/40 max-w-[200px] break-words">
                      <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(cell.trim()) }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
  };

  const parseInlineMarkdown = (text: string): string => {
    // Bold (**text** 또는 __text__)
    let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-teal-400'>$1</strong>");
    formatted = formatted.replace(/__(.*?)__/g, "<strong class='font-bold text-teal-400'>$1</strong>");
    
    // Highlight / Code (`code`)
    formatted = formatted.replace(/`(.*?)`/g, "<code class='bg-slate-950 text-teal-300 border border-slate-800/80 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold'>$1</code>");
    
    // Links ([text](url))
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-teal-400 hover:text-teal-300 hover:underline font-semibold transition-colors'>$1</a>");
    
    return formatted;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 테이블 행 감지 (| cell | cell |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushList(`line-${i}`);
      if (line.includes("---")) {
        continue;
      }
      const cells = line.split("|").slice(1, -1);
      tableRows.push(cells);
      continue;
    } else {
      flushTable(`line-${i}`);
    }

    // 헤더 감지 (#, ##, ###, ####)
    if (line.startsWith("#### ")) {
      flushList(`line-${i}`);
      renderedElements.push(
        <h5 key={i} className="text-xs font-bold text-slate-300 mt-4 mb-2 tracking-tight flex items-center gap-1.5">
          <span className="w-1 h-1 bg-teal-500 rounded-full"></span>
          {line.replace("#### ", "")}
        </h5>
      );
    } else if (line.startsWith("### ")) {
      flushList(`line-${i}`);
      renderedElements.push(
        <h4 key={i} className="text-sm font-bold text-slate-100 mt-6 mb-3 border-l-2 border-teal-500 pl-2.5 tracking-tight">
          {line.replace("### ", "")}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      flushList(`line-${i}`);
      renderedElements.push(
        <h3 key={i} className="text-base font-bold text-teal-400 mt-8 mb-4 border-b border-slate-800/80 pb-2 tracking-tight">
          {line.replace("## ", "")}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      flushList(`line-${i}`);
      renderedElements.push(
        <h2 key={i} className="text-lg font-extrabold text-white mt-10 mb-5 tracking-tight bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          {line.replace("# ", "")}
        </h2>
      );
    }
    // 리스트 감지 (*, -, +)
    else if (line.trim().startsWith("- ") || line.trim().startsWith("* ") || line.trim().startsWith("+ ")) {
      const content = line.trim().substring(2);
      listItems.push(content);
    } 
    // 숫자형 리스트
    else if (/^\d+\.\s/.test(line.trim())) {
      flushList(`line-${i}`);
      renderedElements.push(
        <div key={i} className="flex items-start gap-2.5 mb-3 leading-relaxed text-xs text-slate-300 pl-1">
          <span className="font-bold text-teal-400 shrink-0 select-none min-w-[20px] bg-teal-950/40 border border-teal-900/50 rounded text-center px-1">
            {line.match(/^\d+/)![0]}
          </span>
          <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(line.replace(/^\d+\.\s/, "")) }} />
        </div>
      );
    }
    // 빈 줄 감지
    else if (line.trim() === "") {
      flushList(`line-${i}`);
    }
    // 일반 텍스트 문단
    else {
      flushList(`line-${i}`);
      renderedElements.push(
        <p key={i} className="text-xs text-slate-300 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(line) }} />
      );
    }
  }

  flushList("end");
  flushTable("end");

  return <div className="markdown-body text-slate-300 space-y-1 font-sans">{renderedElements}</div>;
}
