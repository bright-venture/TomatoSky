"use client";

// A date field that shows a readable placeholder when empty. iOS Safari renders
// an empty <input type="date"> as a blank box, and native placeholders are not
// supported, so an overlay label stands in until a date is chosen.
export function DateInput({ value, onChange, placeholder = "Choose a date", id, disabled, required, ariaLabel }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
}) {
  return <span className="date-wrap">
    <input id={id} type="date" value={value} onChange={e => onChange(e.target.value)} disabled={disabled} required={required} aria-label={ariaLabel} className={value ? undefined : "is-empty"} />
    {!value && <span className="date-ph" aria-hidden="true">{placeholder}</span>}
  </span>;
}
