"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { filterOptions, moveActive } from "@/features/application/combobox-logic";
import styles from "./application.module.css";

export type ComboOption = {
  readonly key: string;
  readonly label: string;
  readonly flag?: string;
};

type Props = {
  readonly id: string;
  readonly label: string;
  /** Visually hide the label (the control still has an accessible name). */
  readonly labelHidden?: boolean;
  readonly options: readonly ComboOption[];
  /** The `key` of the selected option, or an empty string. */
  readonly selectedKey: string;
  readonly onSelect: (option: ComboOption) => void;
  readonly placeholder: string;
  /** What the closed input shows for the selection (defaults to the label). */
  readonly displayFor?: (option: ComboOption) => string;
  readonly invalid?: boolean;
  readonly describedBy?: string;
  readonly onBlur?: () => void;
};

/**
 * Searchable select following the ARIA combobox pattern (a text input that controls a listbox), so the long
 * country and calling-code lists stay usable on a phone and with a keyboard or screen reader. Type to filter,
 * arrow keys to move, Enter to choose, Escape to close.
 */
export function Combobox({ id, label, labelHidden, options, selectedKey, onSelect, placeholder, displayFor, invalid, describedBy, onBlur }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = useMemo(() => options.find((o) => o.key === selectedKey), [options, selectedKey]);
  const results = useMemo(() => filterOptions(options, query ?? ""), [options, query]);
  const listId = `${id}-list`;
  const optionId = (index: number) => `${id}-opt-${index}`;
  const display = selected ? (displayFor ? displayFor(selected) : selected.label) : "";

  useEffect(() => {
    if (open && active >= 0) listRef.current?.querySelector(`#${CSS.escape(optionId(active))}`)?.scrollIntoView({ block: "nearest" });
    // optionId is stable for a given id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open]);

  const close = () => {
    setOpen(false);
    setQuery(null);
    setActive(-1);
  };

  const choose = (option: ComboOption) => {
    onSelect(option);
    close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      if (!open) {
        setOpen(true);
        setActive(delta === 1 ? 0 : results.length - 1);
        return;
      }
      setActive((current) => moveActive(current, delta, results.length));
    } else if (event.key === "Enter" && open && active >= 0 && results[active]) {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
  };

  return (
    <>
      <label htmlFor={id} className={labelHidden ? "sr-only" : styles.label}>
        {label}
      </label>
      <div className={styles.combo}>
        {selected?.flag && query === null ? (
          <span className={styles.comboFlag} aria-hidden="true">
            {selected.flag}
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          className={`${styles.comboInput} ${invalid ? styles.invalid : ""}`}
          placeholder={placeholder}
          value={query ?? display}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          onFocus={(event) => {
            setOpen(true);
            event.currentTarget.select();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            close();
            onBlur?.();
          }}
        />
        {open ? (
          <ul id={listId} role="listbox" aria-label={label} ref={listRef} className={styles.comboPanel}>
            {results.length === 0 ? (
              <li className={styles.comboEmpty} role="presentation">
                No matches
              </li>
            ) : (
              results.map((option, index) => (
                <li
                  key={option.key}
                  id={optionId(index)}
                  role="option"
                  aria-selected={option.key === selectedKey}
                  className={[
                    styles.comboOption,
                    index === active ? styles.comboOptionActive : "",
                    option.key === selectedKey ? styles.comboOptionSelected : "",
                  ].join(" ")}
                  // mousedown (not click) so the input keeps focus and its blur does not close the list first
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(option);
                  }}
                  onMouseEnter={() => setActive(index)}
                >
                  {option.flag ? <span aria-hidden="true">{option.flag}</span> : null}
                  <span>{option.label}</span>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </>
  );
}
