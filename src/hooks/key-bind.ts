'use client';

import { useEffect, useEffectEvent, useMemo } from 'react';

export type KeyBindAction = (event: KeyboardEvent) => void;

export type UseKeyBindProps = {
  /**
   * キーバインド
   *
   * 修飾キーは alt, ctrl, meta, shift の順に記述する。
   *
   * @example 'ctrl+shift+z'
   */
  keys: string;

  action: KeyBindAction;

  disabled?: boolean;
};

const MODIFIER_KEYS = new Set(['alt', 'control', 'meta', 'shift']);

const serializeKeyboardEvent = (event: KeyboardEvent): string => {
  const keys: string[] = [];

  // 修飾キーを追加
  if (event.altKey) keys.push('alt');
  if (event.ctrlKey) keys.push('ctrl');
  if (event.metaKey) keys.push('meta');
  if (event.shiftKey) keys.push('shift');

  // NOTE: Chromeにおいて、オートコンプリートから入力された場合、keyがundefinedになる。
  // https://github.com/microsoft/TypeScript/issues/59631
  let key = event.key as string | undefined;

  // 修飾キー以外を追加
  if (key) {
    key = key.toLowerCase();
    if (!MODIFIER_KEYS.has(key)) {
      keys.push(key);
    }
  }

  return keys.join('+');
};

/**
 * 複数のキーバインドを単一のリスナーで管理するクラス。
 */
class KeyBindRegistry {
  private readonly mapping = new Map<string, Set<KeyBindAction>>();
  private isListening = false;

  private readonly globalEventListener = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) return;

    const keys = serializeKeyboardEvent(event);
    const actions = this.mapping.get(keys);

    if (!actions?.size) return;

    event.preventDefault();
    for (const action of actions) {
      action(event);
    }
  };

  public register(keys: string, action: KeyBindAction): void {
    const actions = this.mapping.getOrInsertComputed(keys, () => new Set());
    actions.add(action);

    if (!this.isListening) {
      document.addEventListener('keydown', this.globalEventListener);
      this.isListening = true;
    }
  }

  public unregister(keys: string, action: KeyBindAction): void {
    const actions = this.mapping.get(keys);

    if (actions) {
      actions.delete(action);
      if (!actions.size) {
        this.mapping.delete(keys);
      }
    }

    if (!this.mapping.size) {
      document.removeEventListener('keydown', this.globalEventListener);
      this.isListening = false;
    }
  }
}

const KEY_BIND_REGISTRY = new KeyBindRegistry();

export const useKeyBind = ({ keys, action, disabled = false }: UseKeyBindProps) => {
  const lowerKeys = useMemo(() => keys.toLowerCase(), [keys]);

  const handleAction = useEffectEvent((event: KeyboardEvent) => action(event));

  useEffect(() => {
    if (disabled) return;

    KEY_BIND_REGISTRY.register(lowerKeys, handleAction);

    return () => {
      KEY_BIND_REGISTRY.unregister(lowerKeys, handleAction);
    };
  }, [lowerKeys, disabled]);
};
