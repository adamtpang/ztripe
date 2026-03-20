"use client";

interface AmountInputProps {
  amount: string;
  onChange: (val: string) => void;
  memo: string;
  onMemoChange: (val: string) => void;
}

export default function AmountInput({
  amount,
  onChange,
  memo,
  onMemoChange,
}: AmountInputProps) {
  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-ink mb-1.5"
        >
          Amount
        </label>
        <div className="relative">
          <input
            id="amount"
            type="number"
            step="0.0001"
            min="0.0001"
            placeholder="0.1"
            value={amount}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-ink/20 bg-white px-4 py-3 text-lg text-ink placeholder:text-muted/50 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">
            ZEC
          </span>
        </div>
      </div>

      <div>
        <label
          htmlFor="memo"
          className="block text-sm font-medium text-ink mb-1.5"
        >
          Message (optional)
        </label>
        <input
          id="memo"
          type="text"
          maxLength={140}
          placeholder="Welcome to Zcash"
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          className="w-full border border-ink/20 bg-white px-4 py-3 text-ink placeholder:text-muted/50 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
        />
      </div>
    </div>
  );
}
