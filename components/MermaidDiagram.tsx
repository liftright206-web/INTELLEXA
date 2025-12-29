
import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    mermaid: any;
  }
}

interface MermaidDiagramProps {
  chart: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: true,
        theme: 'dark',
        securityLevel: 'loose',
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
        themeVariables: {
          primaryColor: '#27272a',
          primaryTextColor: '#f4f4f5',
          primaryBorderColor: '#52525b',
          lineColor: '#71717a',
          secondaryColor: '#18181b',
          tertiaryColor: '#09090b'
        }
      });
      
      const renderDiagram = async () => {
        try {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await window.mermaid.render(id, chart);
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        } catch (err) {
          console.error('Mermaid rendering failed:', err);
          if (ref.current) {
            ref.current.innerHTML = '<p class="text-zinc-500 text-xs">Failed to render diagram. Check Mermaid syntax.</p>';
          }
        }
      };

      renderDiagram();
    }
  }, [chart]);

  return (
    <div className="w-full bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 my-3 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
          <i className="fas fa-project-diagram"></i>
          Visualized Concept
        </span>
        <button 
           onClick={() => {
              const svg = ref.current?.querySelector('svg');
              if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'intellexa-diagram.svg';
                link.click();
              }
           }}
           className="text-[10px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 px-2 py-1 rounded transition-colors"
        >
          <i className="fas fa-download mr-1"></i> Save
        </button>
      </div>
      <div ref={ref} className="mermaid flex justify-center" />
    </div>
  );
};

export default MermaidDiagram;