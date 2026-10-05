import React, { useState, useRef, useEffect, useCallback, DragEvent } from 'react';
import {
  Upload,
  Pipette,
  Image as ImageIcon,
  Wand2,
  Bookmark,
  Copy,
  Check,
  RefreshCw,
  Download,
  Link as LinkIcon,
  Eye,
  SlidersHorizontal,
  ClipboardPaste,
  Trash2,
  Minus,
  Plus,
} from 'lucide-react';
import { Palette } from '../types';
import {
  extractColorsFromImage,
  buildPaletteColor,
  isLightColor,
  rgbToHex,
  generateSvgDataUrl,
} from '../utils/colorUtils';

interface ImageColorPickerProps {
  onOpenInGenerator: (palette: Palette) => void;
  onOpenInVisualizer: (palette: Palette) => void;
  onOpenSaveModal: (palette: Palette) => void;
  onOpenInContrast?: (palette: Palette) => void;
  onToast: (msg: string) => void;
}

const CURATED_SAMPLES = [
  {
    name: 'Kyoto Bamboo & Moss',
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Santorini Sunset',
    url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Nordic Minimal Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Retro Citrus & Flora',
    url: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=800&auto=format&fit=crop&q=80',
  },
];

const IMAGE_PICKER_DB = 'palettelab-image-picker';
const IMAGE_PICKER_STORE = 'image-state';
const IMAGE_PICKER_IMAGE_KEY = 'current-image';
const IMAGE_PICKER_COLORS_KEY = 'current-colors';
const IMAGE_PICKER_COUNT_KEY = 'target-color-count';

const openImagePickerDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_PICKER_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IMAGE_PICKER_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const loadSavedImage = async (): Promise<string | null> => {
  const database = await openImagePickerDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IMAGE_PICKER_STORE, 'readonly');
    const request = transaction.objectStore(IMAGE_PICKER_STORE).get(IMAGE_PICKER_IMAGE_KEY);
    request.onsuccess = () => {
      database.close();
      resolve(typeof request.result === 'string' ? request.result : null);
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
};

const saveImage = async (image: string): Promise<void> => {
  const database = await openImagePickerDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(IMAGE_PICKER_STORE, 'readwrite');
    transaction.objectStore(IMAGE_PICKER_STORE).put(image, IMAGE_PICKER_IMAGE_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error);
    };
  });
};

export const ImageColorPicker: React.FC<ImageColorPickerProps> = ({
  onOpenInGenerator,
  onOpenInVisualizer,
  onOpenSaveModal,
  onOpenInContrast,
  onToast,
}) => {
  const [imageUrl, setImageUrl] = useState<string>(CURATED_SAMPLES[0].url);
  const [urlInput, setUrlInput] = useState('');
  const [extractedHexes, setExtractedHexes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(IMAGE_PICKER_COLORS_KEY);
      const colors: unknown = saved ? JSON.parse(saved) : [];
      return Array.isArray(colors)
        ? colors.filter((color): color is string =>
            typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)
          )
        : [];
    } catch {
      return [];
    }
  });
  const [targetColorCount, setTargetColorCount] = useState(() => {
    try {
      const saved = localStorage.getItem(IMAGE_PICKER_COUNT_KEY);
      if (saved === null) return 6;
      const count = Number(saved);
      return Number.isInteger(count) ? Math.min(10, Math.max(1, count)) : 6;
    } catch {
      return 6;
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [imageRestored, setImageRestored] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hadSavedColors = useRef(extractedHexes.length > 0);
  const shouldExtractOnLoad = useRef(false);

  const processImage = (count = targetColorCount) => {
    if (!imageRef.current) return;
    setIsProcessing(true);
    try {
      const colors = extractColorsFromImage(imageRef.current, count);
      if (colors && colors.length > 0) {
        setExtractedHexes(colors);
      }
    } catch (err) {
      console.warn('Canvas extraction constrained:', err);
      onToast('Sampling image... If restricted by CORS, upload a local image file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageLoad = () => {
    if (shouldExtractOnLoad.current) {
      shouldExtractOnLoad.current = false;
      processImage();
    }
  };

  const loadImageUrl = (url: string) => {
    shouldExtractOnLoad.current = true;
    setImageUrl(url);
    if (imageRef.current?.src === url && imageRef.current.complete) {
      processImage();
      shouldExtractOnLoad.current = false;
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadSavedImage()
      .then((savedImage) => {
        if (cancelled) return;
        shouldExtractOnLoad.current = !hadSavedColors.current;
        if (savedImage) setImageUrl(savedImage);
        setImageRestored(true);
      })
      .catch((error: unknown) => {
        console.error('Unable to restore the saved image:', error);
        if (!cancelled) {
          onToast('Could not restore the saved image from this browser.');
          shouldExtractOnLoad.current = !hadSavedColors.current;
          setImageRestored(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!imageRestored) return;
    saveImage(imageUrl).catch((error: unknown) => {
      console.error('Unable to save the image:', error);
      onToast('Could not save this image in browser storage.');
    });
  }, [imageUrl, imageRestored]);

  useEffect(() => {
    try {
      localStorage.setItem(IMAGE_PICKER_COLORS_KEY, JSON.stringify(extractedHexes));
      hadSavedColors.current = extractedHexes.length > 0;
    } catch (error) {
      console.error('Unable to save extracted colors:', error);
      onToast('Could not save the palette in browser storage.');
    }
  }, [extractedHexes]);

  useEffect(() => {
    try {
      localStorage.setItem(IMAGE_PICKER_COUNT_KEY, String(targetColorCount));
    } catch (error) {
      console.error('Unable to save target color count:', error);
      onToast('Could not save the color count in browser storage.');
    }
  }, [targetColorCount]);

  useEffect(() => {
    if (imageRestored && shouldExtractOnLoad.current && imageRef.current?.complete && imageRef.current.naturalWidth) {
      handleImageLoad();
    }
  }, [imageRestored, imageUrl]);

  const updateTargetColorCount = (count: number) => {
    const nextCount = Math.min(10, Math.max(1, count));
    setTargetColorCount(nextCount);
    if (imageRef.current?.complete && imageRef.current.naturalWidth) {
      processImage(nextCount);
    }
  };

  const removeColor = (colorIndex: number) => {
    setExtractedHexes((colors) => colors.filter((_, index) => index !== colorIndex));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          loadImageUrl(event.target.result as string);
          onToast('Image loaded! Extracting color palette...');
        }
      };
      reader.readAsDataURL(file);
    } else {
      const text =
        e.dataTransfer.getData('text/uri-list') ||
        e.dataTransfer.getData('text/plain');
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        loadImageUrl(text);
        onToast('Image URL loaded!');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      e.currentTarget.value = '';
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          loadImageUrl(event.target.result as string);
          onToast('Image uploaded! Quantizing palette...');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      loadImageUrl(urlInput.trim());
      setUrlInput('');
      onToast('Loading image from URL...');
    }
  };

  const loadImageBlob = useCallback((blob: Blob, sourceLabel = 'clipboard') => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        loadImageUrl(event.target.result as string);
        onToast(`Image pasted from ${sourceLabel}! Extracting color palette...`);
      }
    };
    reader.readAsDataURL(blob);
  }, [loadImageUrl, onToast]);

  const handlePasteEvent = useCallback((e: ClipboardEvent) => {
    const target = e.target as HTMLElement;
    const isTextInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

    // Check items for image blobs (screenshots, copied image files)
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            loadImageBlob(file, 'clipboard');
            return;
          }
        }
      }
    }

    // Check files directly
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      for (let i = 0; i < e.clipboardData.files.length; i++) {
        const file = e.clipboardData.files[i];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          loadImageBlob(file, 'clipboard');
          return;
        }
      }
    }

    // If not in a text input and pasted text is an image link or data URL
    if (!isTextInput) {
      const text = e.clipboardData?.getData('text');
      if (text) {
        const trimmed = text.trim();
        if (trimmed.startsWith('data:image/') || /\.(jpeg|jpg|png|webp|gif|svg)(\?.*)?$/i.test(trimmed)) {
          e.preventDefault();
          loadImageUrl(trimmed);
          onToast('Pasted image link loaded! Extracting color palette...');
        }
      }
    }
  }, [loadImageBlob, loadImageUrl, onToast]);

  useEffect(() => {
    window.addEventListener('paste', handlePasteEvent);
    return () => window.removeEventListener('paste', handlePasteEvent);
  }, [handlePasteEvent]);

  const handlePasteButtonClick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            loadImageBlob(blob, 'clipboard');
            return;
          }
        }
      }

      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const trimmed = text.trim();
          if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            loadImageUrl(trimmed);
            onToast('Image loaded from clipboard! Extracting color palette...');
            return;
          }
        }
      }

      onToast('No image in clipboard. Copy an image or take a screenshot, then click here or press Ctrl+V / Cmd+V.');
    } catch (err) {
      console.warn('Clipboard read error or permission denied:', err);
      onToast('Press Ctrl+V (or Cmd+V) to paste your copied image directly.');
    }
  };

  const handleCanvasSample = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imageRef.current;
    if (!img) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      const rect = img.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

      const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

      setExtractedHexes((prev) =>
        prev.includes(hex) ? prev : [hex, ...prev.slice(0, targetColorCount - 1)]
      );
      onToast(`Sampled color: ${hex}`);
    } catch {
      onToast('Interactive eyedropper requires uploading a local file.');
    }
  };

  const handleCopySingle = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    onToast(`${hex} copied to clipboard!`);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const handleCopyAll = () => {
    const hexList = extractedHexes.join(', ');
    navigator.clipboard.writeText(hexList);
    setCopiedAll(true);
    onToast(`Copied ${extractedHexes.length} colors: ${hexList}`);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const buildCurrentPalette = (): Palette => {
    return {
      id: `img-pal-${Date.now()}`,
      name: 'Extracted Photo Palette',
      colors: extractedHexes.map((hex) => buildPaletteColor(hex)),
      tags: ['Image Extract', 'Dominant Tones'],
      styles: [`${extractedHexes.length} Colors`],
      topics: ['Nature'],
      creator: {
        id: 'me',
        name: 'You',
        avatar:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      },
      likes: 1,
      views: 1,
      createdAt: new Date().toISOString(),
      isPublic: false,
    };
  };

  const handleDownloadSvg = () => {
    const pal = buildCurrentPalette();
    const dataUrl = generateSvgDataUrl(pal.colors);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `extracted-palette-${Date.now()}.svg`;
    a.click();
    onToast('SVG palette downloaded!');
  };

  const handleDownloadPng = () => {
    const pal = buildCurrentPalette();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barWidth = canvas.width / pal.colors.length;
    pal.colors.forEach((c, i) => {
      ctx.fillStyle = c.hex;
      ctx.fillRect(i * barWidth, 0, barWidth, canvas.height);

      ctx.fillStyle = isLightColor(c.hex) ? '#111827' : '#FFFFFF';
      ctx.font = 'bold 24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(c.hex, i * barWidth + barWidth / 2, canvas.height - 40);
    });

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `extracted-palette-${Date.now()}.png`;
    a.click();
    onToast('PNG palette image downloaded!');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 select-none">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
          <ImageIcon className="w-4 h-4" />
          <span>Image Palette Studio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Extract Dominant Colors from Any Image
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload image files, paste images or screenshots directly (Ctrl+V / Cmd+V), paste web URLs, or sample curated photography to generate accessible palettes.
        </p>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs mb-8 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Image</span>
            </button>

            <button
              onClick={handlePasteButtonClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
              title="Paste image directly from clipboard (or press Ctrl+V / Cmd+V)"
            >
              <ClipboardPaste className="w-4 h-4 text-indigo-600" />
              <span>Paste Image (Ctrl+V)</span>
            </button>
          </div>

          <form
            onSubmit={handleUrlSubmit}
            className="flex-1 max-w-md flex items-center gap-2"
          >
            <div className="relative flex-1">
              <LinkIcon className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="Or paste image URL (https://...)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-blue-500 bg-gray-50/50"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors cursor-pointer shrink-0"
            >
              Load
            </button>
          </form>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] text-gray-400 font-semibold shrink-0 mr-1">
              Samples:
            </span>
            {CURATED_SAMPLES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => loadImageUrl(sample.url)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-colors shrink-0 cursor-pointer ${
                  imageUrl === sample.url
                    ? 'bg-gray-900 text-white border-gray-900 font-bold'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`lg:col-span-7 bg-white p-4 rounded-3xl border-2 transition-all shadow-xs overflow-hidden ${
            isDragging
              ? 'border-dashed border-blue-500 bg-blue-50/30 scale-[1.01]'
              : 'border-gray-200'
          }`}
        >
          <div className="relative group rounded-2xl overflow-hidden bg-gray-100 min-h-[300px] h-[min(70vh,600px)] flex items-center justify-center">
            <img
              ref={imageRef}
              src={imageUrl}
              crossOrigin="anonymous"
              alt="Source"
              onLoad={handleImageLoad}
              onClick={handleCanvasSample}
              className="max-w-full max-h-full w-auto h-auto object-contain cursor-crosshair"
            />

            <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 z-10">
              <div className="bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs text-white flex items-center gap-2 pointer-events-none shadow-md">
                <Pipette className="w-3.5 h-3.5 text-amber-400" />
                <span>Click anywhere to sample color</span>
              </div>
              <button
                type="button"
                onClick={handlePasteButtonClick}
                className="bg-white/90 hover:bg-white backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-800 flex items-center gap-1.5 shadow-md border border-gray-100 transition-colors cursor-pointer"
                title="Paste image directly from clipboard (or press Ctrl+V / Cmd+V)"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-indigo-600" />
                <span>Paste Image (Ctrl+V)</span>
              </button>
            </div>

            {isDragging && (
              <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-xs flex items-center justify-center pointer-events-none z-20">
                <div className="bg-white px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-blue-700">
                  Drop image to extract colors
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Identified Dominant Colors
                </h3>
                <p className="text-xs text-gray-500">
                  {extractedHexes.length} colors in palette · Target {targetColorCount}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-600 mr-1">Palette size</span>
                <button
                  type="button"
                  onClick={() => updateTargetColorCount(targetColorCount - 1)}
                  disabled={targetColorCount <= 1 || isProcessing}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Extract fewer colors"
                  aria-label="Decrease number of colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="min-w-6 text-center text-sm font-bold text-gray-900" aria-live="polite">
                  {targetColorCount}
                </span>
                <button
                  type="button"
                  onClick={() => updateTargetColorCount(targetColorCount + 1)}
                  disabled={targetColorCount >= 10 || isProcessing}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Extract more colors"
                  aria-label="Increase number of colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => processImage()}
                  disabled={isProcessing}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                  title="Resample palette"
                  aria-label="Resample colors from image"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="h-12 w-full flex rounded-2xl overflow-hidden shadow-xs border border-gray-200">
              {extractedHexes.map((hex, i) => (
                <div
                  key={i}
                  style={{ backgroundColor: hex }}
                  onClick={() => handleCopySingle(hex)}
                  className="flex-1 h-full cursor-pointer hover:flex-[1.5] transition-all"
                  title={`Click to copy ${hex}`}
                />
              ))}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
              {extractedHexes.map((hex, i) => {
                const colorObj = buildPaletteColor(hex);
                const isLight = isLightColor(hex);

                return (
                  <div
                    key={i}
                    style={{ backgroundColor: hex }}
                    onClick={() => handleCopySingle(hex)}
                    className="h-12 rounded-xl flex items-center justify-between px-4 cursor-pointer hover:scale-[1.01] transition-transform shadow-2xs group"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-bold ${
                          isLight ? 'text-gray-900' : 'text-white'
                        }`}
                      >
                        {hex}
                      </span>
                      <span
                        className={`text-[10px] font-sans opacity-75 truncate max-w-[120px] ${
                          isLight ? 'text-gray-800' : 'text-white'
                        }`}
                      >
                        · {colorObj.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${
                          isLight ? 'text-gray-900' : 'text-white'
                        }`}
                      >
                        {copiedHex === hex ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeColor(i);
                        }}
                        disabled={extractedHexes.length <= 1}
                        className={`p-1.5 rounded-lg opacity-70 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${
                          isLight ? 'text-gray-900 hover:bg-black/10' : 'text-white hover:bg-white/20'
                        }`}
                        title={extractedHexes.length <= 1 ? 'Keep at least one color' : `Remove ${hex}`}
                        aria-label={`Remove ${hex} from palette`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenInVisualizer(buildCurrentPalette())}
                  className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>Visualizer</span>
                </button>

                {onOpenInContrast && (
                  <button
                    onClick={() => onOpenInContrast(buildCurrentPalette())}
                    className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Check color contrast accessibility (WCAG AA/AAA)"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    <span>Contrast</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenInGenerator(buildCurrentPalette())}
                  className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Studio</span>
                </button>
              </div>

              <button
                onClick={() => onOpenSaveModal(buildCurrentPalette())}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
                <span>Save Palette to Collection</span>
              </button>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={handleCopyAll}
                  className="py-2 px-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedAll ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                  )}
                  <span>Copy Values</span>
                </button>

                <button
                  onClick={handleDownloadSvg}
                  className="py-2 px-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-purple-600" />
                  <span>Download SVG</span>
                </button>

                <button
                  onClick={handleDownloadPng}
                  className="py-2 px-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  <span>Download PNG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
