import { useState } from 'react';
import { Download, FileText } from 'lucide-react';

const PREFIX_OPTIONS = [
  '1st',
  '2nd',
  '3rd',
  '4th',
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
] as const;

const CUSTOM_PREFIX = 'custom';

function sanitizeFileNamePart(value: string): string {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .trim()
    .replace(/[. ]+$/g, '');
}

function getFileName(prefix: string, title: string): string {
  const safePrefix = sanitizeFileNamePart(prefix);
  const safeTitle = sanitizeFileNamePart(title);

  return `${safePrefix}_${safeTitle || 'Untitled'}.txt`;
}

export function TextFileWriter() {
  const [text, setText] = useState('');
  const [prefix, setPrefix] = useState<string>('1st');
  const [customPrefix, setCustomPrefix] = useState('');
  const firstLine = text.split(/\r?\n/, 1)[0];
  const title = firstLine.replace(/^\s*topic\s*:\s*/i, '').trim();
  const selectedPrefix = prefix === CUSTOM_PREFIX ? customPrefix.trim() : prefix;
  const canDownload = Boolean(text.trim() && sanitizeFileNamePart(selectedPrefix));

  const handleDownload = () => {
    if (!canDownload) return;

    const body = text.replace(/^[^\r\n]*(?:\r?\n|$)/, '');
    const file = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFileName(selectedPrefix, title);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-5 md:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Text Writer</h1>
              <p className="text-sm text-gray-500">Write text and download it as a .txt file.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5 md:p-7">
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <label htmlFor="text-file-prefix" className="text-sm font-semibold text-gray-700">
              File name prefix
            </label>
            <select
              id="text-file-prefix"
              value={prefix}
              onChange={(event) => setPrefix(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {PREFIX_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
              <option value={CUSTOM_PREFIX}>Custom</option>
            </select>
          </div>
          {prefix === CUSTOM_PREFIX && (
            <div className="flex flex-col gap-2 sm:max-w-xs">
              <label htmlFor="text-file-custom-prefix" className="text-sm font-semibold text-gray-700">
                Custom prefix
              </label>
              <input
                id="text-file-custom-prefix"
                value={customPrefix}
                onChange={(event) => setCustomPrefix(event.target.value)}
                placeholder="Enter a prefix"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          )}

          <label htmlFor="text-file-content" className="block text-sm font-semibold text-gray-700">
            Text
          </label>
          <textarea
            id="text-file-content"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={'Start with a title on the first line…\nWrite your text here.'}
            className="min-h-[320px] w-full resize-y rounded-xl border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm text-gray-500">
              File name:{' '}
              {sanitizeFileNamePart(selectedPrefix) ? (
                <span className="font-medium text-gray-700">{getFileName(selectedPrefix, title)}</span>
              ) : (
                <span className="font-medium text-gray-700">Enter a custom prefix</span>
              )}
              <span className="ml-1">— based on the first line</span>
            </p>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!canDownload}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download .txt
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
