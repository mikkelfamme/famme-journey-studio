export type DesktopShortcutResult = 'saved' | 'downloaded' | 'cancelled';

interface SaveFilePickerOptionsLite {
  suggestedName?: string;
  types?: Array<{ description?: string; accept: Record<string, string[]> }>;
}

interface FileSystemWritableFileStreamLite {
  write(data: Blob | string): Promise<void>;
  close(): Promise<void>;
}

interface FileSystemFileHandleLite {
  createWritable(): Promise<FileSystemWritableFileStreamLite>;
}

type ShowSaveFilePickerLite = (options?: SaveFilePickerOptionsLite) => Promise<FileSystemFileHandleLite>;

function shortcutContents() {
  const appUrl = new URL('./', document.baseURI).href;
  const iconUrl = new URL('journey-studio-js-512.png', document.baseURI).href;
  return `[InternetShortcut]\r\nURL=${appUrl}\r\nIconFile=${iconUrl}\r\nIconIndex=0\r\n`;
}

export async function saveDesktopShortcut(): Promise<DesktopShortcutResult> {
  const fileName = 'Journey Studio.url';
  const contents = shortcutContents();
  const picker = (window as Window & { showSaveFilePicker?: ShowSaveFilePickerLite }).showSaveFilePicker;

  if (picker) {
    try {
      const handle = await picker.call(window, {
        suggestedName: fileName,
        types: [{ description: 'Windows internet shortcut', accept: { 'text/plain': ['.url'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(contents);
      await writable.close();
      return 'saved';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Fall through to a normal download if the browser exposes the API but blocks it.
    }
  }

  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
  return 'downloaded';
}
