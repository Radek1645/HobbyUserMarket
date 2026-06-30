import {
  formatPriceInput,
  stripPriceDigits,
} from "@/lib/posts/price-input";

type PriceAmountInputProps = {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (digits: string) => void;
  inputClass: string;
  labelClass: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
};

export function PriceAmountInput({
  id,
  label,
  value,
  onChange,
  inputClass,
  labelClass,
  required = false,
  placeholder,
  hint,
}: PriceAmountInputProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        name="priceAmount"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        value={formatPriceInput(value)}
        onChange={(event) => onChange(stripPriceDigits(event.target.value))}
        className={inputClass}
        placeholder={placeholder}
      />
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}
