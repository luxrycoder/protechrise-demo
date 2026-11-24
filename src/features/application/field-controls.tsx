import type { ReactNode } from "react";
import styles from "./application.module.css";

/** `aria-*` attributes that tie a control to its hint and its error message. */
export function fieldAria(id: string, error: string | undefined, hasHint: boolean) {
  const describedBy = [error ? `${id}-error` : "", hasHint ? `${id}-hint` : ""].filter(Boolean).join(" ");
  return { "aria-invalid": error ? (true as const) : undefined, "aria-describedby": describedBy || undefined };
}

type FieldShellProps = {
  readonly id: string;
  readonly label?: string;
  readonly error?: string;
  readonly hint?: ReactNode;
  readonly full?: boolean;
  readonly children: ReactNode;
};

/** Label, control, hint and error, laid out the same way for every field. */
export function FieldShell({ id, label, error, hint, full, children }: FieldShellProps) {
  return (
    <div className={`${styles.field} ${full ? styles.full : ""}`}>
      {label ? (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      ) : null}
      {children}
      {hint ? (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type Option = string | { readonly value: string; readonly label: string };

type SelectProps = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur: () => void;
  readonly placeholder: string;
  readonly options?: readonly Option[];
  /** Grouped options (for the track list). */
  readonly groups?: ReadonlyArray<{ readonly label: string; readonly options: readonly string[] }>;
  readonly error?: string;
  readonly hint?: ReactNode;
  readonly disabled?: boolean;
  readonly full?: boolean;
};

export function SelectField({ id, label, value, onChange, onBlur, placeholder, options = [], groups, error, hint, disabled, full }: SelectProps) {
  const asOption = (o: Option) => (typeof o === "string" ? { value: o, label: o } : o);
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} full={full}>
      <select
        id={id}
        className={`${styles.select} ${error ? styles.invalid : ""}`}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        {...fieldAria(id, error, Boolean(hint))}
      >
        <option value="">{placeholder}</option>
        {options.map(asOption).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {groups?.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </FieldShell>
  );
}

type TextProps = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur: () => void;
  readonly error?: string;
  readonly hint?: ReactNode;
  readonly full?: boolean;
  readonly type?: "text" | "email";
  readonly maxLength: number;
  readonly autoComplete?: string;
};

export function TextField({ id, label, value, onChange, onBlur, error, hint, full, type = "text", maxLength, autoComplete }: TextProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} full={full}>
      <input
        id={id}
        type={type}
        className={`${styles.input} ${error ? styles.invalid : ""}`}
        value={value}
        maxLength={maxLength}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        {...fieldAria(id, error, Boolean(hint))}
      />
    </FieldShell>
  );
}

type AreaProps = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onBlur: () => void;
  readonly error?: string;
  readonly hint: string;
  readonly reassure: string;
  readonly min: number;
  readonly max: number;
};

/** A textarea with a live "n / max · min" counter, a hint, and a reassuring line, as in the legacy form. */
export function TextAreaField({ id, label, value, onChange, onBlur, error, hint, reassure, min, max }: AreaProps) {
  return (
    <div className={`${styles.field} ${styles.full}`}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <textarea
        id={id}
        className={`${styles.textarea} ${error ? styles.invalid : ""}`}
        value={value}
        maxLength={max}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        {...fieldAria(id, error, true)}
      />
      <div className={styles.hintRow}>
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
        <span className={styles.counter}>
          {value.length} / {max} · {min} min
        </span>
      </div>
      <p className={styles.reassure}>{reassure}</p>
      {error ? (
        <p id={`${id}-error`} className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
