"use client";

import { Select } from "@/components/Select";

type PnlCurrencySelectProps = {
  value: string;
  currencies: string[];
  onChange: (currency: string) => void;
};

export function PnlCurrencySelect({
  value,
  currencies,
  onChange,
}: PnlCurrencySelectProps) {
  const options = currencies.map((code) => ({ value: code, label: code }));
  const known = options.some((option) => option.value === value)
    ? options
    : [{ value, label: value }, ...options];

  return (
    <Select
      id="pnl-currency"
      ariaLabel="P&L currency"
      value={value}
      options={known}
      onChange={onChange}
      size="sm"
      className="w-28"
    />
  );
}
