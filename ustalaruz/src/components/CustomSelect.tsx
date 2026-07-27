import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
}

export default function CustomSelect({ options = [], value, onChange, icon, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);
  const label = selected?.label || placeholder || 'Tanlang';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full text-xs font-bold pl-10 pr-10 py-3 border border-border bg-surface-card text-text-primary rounded-2xl outline-none flex items-center gap-2 transition-all cursor-pointer ${
          open ? 'ring-2 ring-blue-500/10 border-brand' : ''
        }`}
      >
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">{icon}</span>}
        <span className={`flex-1 text-left truncate ${selected ? '' : 'text-text-secondary'}`}>{label}</span>
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card border border-border rounded-2xl shadow-xl z-50 max-h-52 overflow-y-auto no-scrollbar">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left text-xs font-bold px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl cursor-pointer ${
                opt.value === value
                  ? 'bg-brand/10 text-brand'
                  : 'text-text-primary hover:bg-surface-tertiary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
