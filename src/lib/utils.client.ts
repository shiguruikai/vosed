import 'client-only';

export function openFileDialog(multiple: false, accept?: string): Promise<File | null>;
export function openFileDialog(multiple: true, accept?: string): Promise<File[] | null>;
export function openFileDialog(multiple: boolean, accept = ''): Promise<any> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    input.accept = accept;

    input.addEventListener('cancel', () => resolve(null), { once: true });

    input.addEventListener('change', () => {
      const files = input.files;
      if (files?.length) {
        resolve(multiple ? Array.from(files) : files[0]);
      } else {
        resolve(null);
      }
    },
    { once: true });

    input.click();
  });
}

export function openYamlFileDialog(): Promise<File | null> {
  return openFileDialog(false, '.yaml,.yml');
}

export function saveAsFile(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function saveAsYamlFile(content: BlobPart, filename: string) {
  return saveAsFile(content, filename, 'text/yaml;charset=utf-8;');
}
