import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Download, FileText, FolderOpen } from 'lucide-react';

interface WritableTextFile {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}

interface TextFileHandle {
  createWritable(): Promise<WritableTextFile>;
}

interface TextDirectoryHandle {
  name: string;
  getFileHandle(name: string, options: { create: true }): Promise<TextFileHandle>;
  requestPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
}

declare global {
  interface Window {
    showDirectoryPicker?: (options: { mode: 'readwrite' }) => Promise<TextDirectoryHandle>;
  }
}

const FOLDER_DATABASE = 'palettelab-text-writer';
const FOLDER_STORE = 'settings';
const FOLDER_KEY = 'download-folder';

function openFolderDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FOLDER_DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(FOLDER_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open browser storage.'));
    request.onblocked = () => reject(new Error('Browser storage is blocked by another tab.'));
  });
}

function isTextDirectoryHandle(value: unknown): value is TextDirectoryHandle {
  if (!value || typeof value !== 'object') return false;
  const handle = value as Partial<TextDirectoryHandle>;
  return (
    typeof handle.name === 'string' &&
    typeof handle.getFileHandle === 'function' &&
    typeof handle.requestPermission === 'function'
  );
}

async function saveFolderHandle(folder: TextDirectoryHandle): Promise<void> {
  const database = await openFolderDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(FOLDER_STORE, 'readwrite');
    transaction.objectStore(FOLDER_STORE).put(folder, FOLDER_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save the selected folder.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Saving the selected folder was cancelled.'));
  }).finally(() => database.close());
}

async function loadFolderHandle(): Promise<TextDirectoryHandle | null> {
  const database = await openFolderDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(FOLDER_STORE, 'readonly');
    const request = transaction.objectStore(FOLDER_STORE).get(FOLDER_KEY);
    let storedValue: unknown;
    request.onsuccess = () => {
      storedValue = request.result;
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(isTextDirectoryHandle(storedValue) ? storedValue : null);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('Could not restore the selected folder.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('Restoring the selected folder was cancelled.'));
    };
  });
}

async function clearFolderHandle(): Promise<void> {
  const database = await openFolderDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(FOLDER_STORE, 'readwrite');
    transaction.objectStore(FOLDER_STORE).delete(FOLDER_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not clear the selected folder.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Clearing the selected folder was cancelled.'));
  }).finally(() => database.close());
}

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
const WRITER_SETTINGS_KEY = 'palettelab_text_writer_settings';

interface TextWriterSettings {
  text: string;
  prefix: string;
  customPrefix: string;
}

function isTextWriterSettings(value: unknown): value is TextWriterSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Partial<TextWriterSettings>;

  return (
    typeof settings.text === 'string' &&
    typeof settings.prefix === 'string' &&
    (PREFIX_OPTIONS.includes(settings.prefix as (typeof PREFIX_OPTIONS)[number]) ||
      settings.prefix === CUSTOM_PREFIX) &&
    typeof settings.customPrefix === 'string'
  );
}

function readTextWriterSettings(): { settings: TextWriterSettings; message: string } {
  try {
    const saved = localStorage.getItem(WRITER_SETTINGS_KEY);
    if (!saved) {
      return { settings: { text: '', prefix: '1st', customPrefix: '' }, message: '' };
    }

    const parsed: unknown = JSON.parse(saved);
    if (!isTextWriterSettings(parsed)) throw new Error('Saved Text Writer settings are invalid.');
    return { settings: parsed, message: '' };
  } catch (error) {
    return {
      settings: { text: '', prefix: '1st', customPrefix: '' },
      message: error instanceof Error
        ? `Could not restore Text Writer settings: ${error.message}`
        : 'Could not restore Text Writer settings due to an unknown error.',
    };
  }
}

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
  const [initialSettings] = useState(readTextWriterSettings);
  const [text, setText] = useState(initialSettings.settings.text);
  const [prefix, setPrefix] = useState<string>(initialSettings.settings.prefix);
  const [customPrefix, setCustomPrefix] = useState(initialSettings.settings.customPrefix);
  const [downloadFolder, setDownloadFolder] = useState<TextDirectoryHandle | null>(null);
  const [downloadMessage, setDownloadMessage] = useState(initialSettings.message);
  const firstLine = text.split(/\r?\n/, 1)[0];
  const title = firstLine.replace(/^\s*topic\s*:\s*/i, '').trim();
  const selectedPrefix = prefix === CUSTOM_PREFIX ? customPrefix.trim() : prefix;
  const canDownload = Boolean(text.trim() && sanitizeFileNamePart(selectedPrefix));
  const supportsFolderSelection = typeof window.showDirectoryPicker === 'function';

  useEffect(() => {
    try {
      localStorage.setItem(WRITER_SETTINGS_KEY, JSON.stringify({ text, prefix, customPrefix }));
    } catch (error) {
      setDownloadMessage(
        error instanceof Error
          ? `Could not save Text Writer settings: ${error.message}`
          : 'Could not save Text Writer settings due to an unknown error.'
      );
    }
  }, [text, prefix, customPrefix]);

  useEffect(() => {
    let isCurrent = true;
    void loadFolderHandle()
      .then((folder) => {
        if (!isCurrent || !folder) return;
        setDownloadFolder(folder);
        setDownloadMessage('Restored your saved folder. Chrome may ask you to allow access again.');
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setDownloadMessage(
          error instanceof Error
            ? `Could not restore the saved folder: ${error.message}`
            : 'Could not restore the saved folder due to an unknown error.'
        );
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleChooseFolder = async () => {
    if (!supportsFolderSelection) return;

    try {
      if (!window.showDirectoryPicker) return;
      const folder = await window.showDirectoryPicker({ mode: 'readwrite' });
      setDownloadFolder(folder);
      try {
        await saveFolderHandle(folder);
        setDownloadMessage(`Saved ${folder.name} as your download folder preference.`);
      } catch (error) {
        setDownloadMessage(
          error instanceof Error
            ? `Folder selected, but could not remember it: ${error.message}`
            : 'Folder selected, but could not remember it due to an unknown error.'
        );
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setDownloadMessage(
        error instanceof Error
          ? `Could not select that folder: ${error.message}`
          : 'Could not select that folder due to an unknown error.'
      );
    }
  };

  const handleDownload = async () => {
    if (!canDownload) return;

    const body = text.replace(/^[^\r\n]*(?:\r?\n|$)/, '');
    const file = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const fileName = getFileName(selectedPrefix, title);

    if (downloadFolder) {
      try {
        const permission = await downloadFolder.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          setDownloadMessage('Folder access was not granted. Choose the folder again to allow saving.');
          return;
        }
        const destination = await downloadFolder.getFileHandle(fileName, { create: true });
        const writable = await destination.createWritable();
        await writable.write(file);
        await writable.close();
        setDownloadMessage(`Saved ${fileName} to ${downloadFolder.name}.`);
      } catch (error) {
        setDownloadMessage(
          error instanceof Error
            ? `Could not save to the selected folder: ${error.message}`
            : 'Could not save to the selected folder due to an unknown error.'
        );
      }
      return;
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloadMessage('Download started. Check your browser Downloads folder.');
  };

  const stepPrefix = (direction: -1 | 1) => {
    const currentIndex = PREFIX_OPTIONS.indexOf(
      prefix === CUSTOM_PREFIX ? '1st' : prefix as (typeof PREFIX_OPTIONS)[number]
    );
    const nextIndex = (currentIndex + direction + PREFIX_OPTIONS.length) % PREFIX_OPTIONS.length;
    setPrefix(PREFIX_OPTIONS[nextIndex]);
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
          <div className="grid items-stretch gap-3 md:grid-cols-2">
            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="text-file-prefix" className="text-xs font-semibold text-gray-700">
                  File name prefix
                </label>
                <div className="flex items-stretch gap-2">
                  <select
                    id="text-file-prefix"
                    value={prefix}
                    onChange={(event) => setPrefix(event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {PREFIX_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                    <option value={CUSTOM_PREFIX}>Custom</option>
                  </select>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      aria-label="Previous file name prefix"
                      onClick={() => stepPrefix(-1)}
                      className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white px-2 text-gray-600 transition hover:bg-gray-50 hover:text-blue-700"
                    >
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next file name prefix"
                      onClick={() => stepPrefix(1)}
                      className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white px-2 text-gray-600 transition hover:bg-gray-50 hover:text-blue-700"
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {prefix === CUSTOM_PREFIX && (
                  <>
                    <label htmlFor="text-file-custom-prefix" className="text-xs font-semibold text-gray-700">
                      Custom prefix
                    </label>
                    <input
                      id="text-file-custom-prefix"
                      value={customPrefix}
                      onChange={(event) => setCustomPrefix(event.target.value)}
                      placeholder="Enter a prefix"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </>
                )}
                <p className="text-xs text-gray-500">Choose an ordinal or enter a custom prefix.</p>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <p className="shrink-0 text-xs font-semibold text-gray-700">Download location</p>
                <p
                  className="min-w-0 truncate text-right text-xs font-medium text-gray-600"
                  title={downloadFolder?.name ?? 'Browser Downloads (default)'}
                >
                  {downloadFolder?.name ?? 'Browser Downloads (default)'}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleChooseFolder}
                  disabled={!supportsFolderSelection}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FolderOpen className="h-4 w-4" aria-hidden="true" />
                  Choose folder
                </button>
                {downloadFolder && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await clearFolderHandle();
                        setDownloadFolder(null);
                        setDownloadMessage('Using browser Downloads. The saved folder preference was cleared.');
                      } catch (error) {
                        setDownloadMessage(
                          error instanceof Error
                            ? `Could not clear the saved folder: ${error.message}`
                            : 'Could not clear the saved folder due to an unknown error.'
                        );
                      }
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Use browser Downloads
                  </button>
                )}
              </div>
              {downloadMessage && (
                <p className="mt-1 line-clamp-1 text-[11px] text-gray-500" role="status" title={downloadMessage}>{downloadMessage}</p>
              )}
              {!supportsFolderSelection && (
                <p className="mt-1 text-[11px] text-gray-500">Folder selection is unavailable; using browser Downloads.</p>
              )}
            </section>
          </div>

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
