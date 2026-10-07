import type { InputHTMLAttributes } from "react";
import { Select, type SelectOption } from "@/components/Select";
import { fieldText } from "@/lib/control";

type MoneyFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "value" | "onChange"
> & {
  currency: string;
  currencyOptions: SelectOption[];
  onCurrencyChange: (currency: string) => void;
  currencyDisabled?: boolean;
};

/** Amount input with the currency choice on the left, inside the same field. */
export function MoneyField({
  id,
  currency,
  currencyOptions,
  onCurrencyChange,
  currencyDisabled,
  disabled,
  className = "",
  ...props
}: MoneyFieldProps) {
  return (
    <div
      className={[
        "flex h-10 w-full items-stretch overflow-hidden rounded-input border border-border bg-card",
        disabled ? "opacity-60" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex w-fit shrink-0 items-stretch border-r border-border">
        <Select
          id={id ? `${id}-currency` : undefined}
          name="currency"
          ariaLabel="Currency"
          value={currency}
          options={currencyOptions}
          onChange={onCurrencyChange}
          disabled={disabled || currencyDisabled}
          plain
          size="sm"
          className="w-full"
        />
      </div>
      <input
        id={id}
        disabled={disabled}
        className={[
          "min-w-0 flex-1 bg-transparent px-3 text-ink outline-none placeholder:text-placeholder [appearance:textfield] disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          fieldText.sm,
        ].join(" ")}
        {...props}
      />
    </div>
  );
}
