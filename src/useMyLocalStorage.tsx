import { useState } from "react";

// https://github.com/mantinedev/mantine/issues/3099
// The official hook has a bug: import { useLocalStorage } from "@mantine/hooks";
// It loads default and few ms later the local storage value. No way.


export function useMyLocalStorage<T>({
  key,
  defaultValue,
}: {
  key: string;
  defaultValue: T;
}) {
  const [value, setValue] = useState<T>(() => readMyLocalStorage({ key, defaultValue }));

  const setItem = (newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setItem] as const;
}

export function readMyLocalStorage<T>({
  key,
  defaultValue,
}: {
  key: string;
  defaultValue: T;
}) {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
}

export function rwLocalStorage<T>(key: string, defaultValue: T): [() => T, (value: T) => T] {
  function read(): T {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }
  function write(value: T): T {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }
  return [read, write];
}

export function useMyLocalStorage2<T>(key: string, defaultValue: T) {
  const [read, write] = rwLocalStorage(key, defaultValue);
  const [value, _setValue] = useState(read());
  const setItem = (value: T) => { _setValue(write(value)); }
  return [value, setItem] as const;
}