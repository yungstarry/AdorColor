import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { formatCSSBezier } from './utils/bezierMath';
import type { BezierPoints } from './types';

export function CurveHeader({ bezier, onToast }: { bezier: BezierPoints; onToast: (message: string) => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatCSSBezier(bezier));
      setCopied(true);
      onToast('CSS timing function copied.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      onToast('Could not access the clipboard. Use the Code Exporter to select and copy it.');
    }
  };

  return (
    <header className="curve-craft-header">
      <a href="#graphs" className="curve-craft-wordmark">CurveCraft <span>Animation Curve Converter</span></a>
      <nav aria-label="Curve converter sections">
        <a href="#graphs">Dual Graphs</a>
        <a href="#velocity">After Effects Velocity</a>
        <a href="#preview">Motion Sandbox</a>
      </nav>
      <button type="button" onClick={() => void copy()} className="curve-copy-css">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied Bezier!' : 'Copy CSS'}
      </button>
    </header>
  );
}
