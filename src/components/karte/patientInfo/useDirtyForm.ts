import { useEffect, useState } from 'react';

export interface DirtyFormApi<T> {
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  isDirty: boolean;
  save: () => void;
  cancel: () => void;
}

export function useDirtyForm<T>(
  initial: T,
  onDirtyChange: (dirty: boolean) => void,
  discardSignal: number,
): DirtyFormApi<T> {
  const [form, setForm] = useState<T>(initial);
  const [pristine, setPristine] = useState<T>(initial);

  const isDirty = JSON.stringify(form) !== JSON.stringify(pristine);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // 親（KartePage 経由）から「破棄して進む」が確定したとき、初期値に戻す
  useEffect(() => {
    if (discardSignal === 0) return;
    setForm(initial);
    setPristine(initial);
    // initial は固定参照を渡す前提
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discardSignal]);

  return {
    form,
    setForm,
    isDirty,
    save: () => setPristine(form),
    cancel: () => setForm(pristine),
  };
}
