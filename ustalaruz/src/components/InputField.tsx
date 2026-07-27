import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';

interface InputFieldProps {
  id: string;
  label: string;
  type: 'text' | 'password' | 'tel';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  icon: LucideIcon;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
}

export default function InputField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder = '',
  error,
  icon: Icon,
  required = false,
  autoComplete,
  autoFocus = false,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.value === value) return;
    onChangeRef.current(el.value);
  }, [type, value]);

  // Formatter producing "+998 XX XXX XX XX"
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Check if backspace was used and emptied the field
    if (raw === '') {
      onChange('');
      return;
    }

    // Strip everything except digits
    let digits = raw.replace(/\D/g, '');

    // Strip the country code 998 if it's there at the start
    if (digits.startsWith('998')) {
      digits = digits.substring(3);
    }

    // Maximum 9 digits for Uzbek numbers
    digits = digits.substring(0, 9);

    // Format: "+998 XX XXX XX XX"
    let formatted = '+998 ';
    if (digits.length > 0) {
      formatted += digits.substring(0, 2);
    }
    if (digits.length >= 3) {
      formatted += ' ' + digits.substring(2, 5);
    }
    if (digits.length >= 6) {
      formatted += ' ' + digits.substring(5, 7);
    }
    if (digits.length >= 8) {
      formatted += ' ' + digits.substring(7, 9);
    }

    onChange(formatted);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'tel') {
      handlePhoneChange(e);
    } else {
      onChange(e.target.value);
    }
  };

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : 'text';

  const defaultPlaceholder = type === 'tel' ? '+998 __ ___ __ __' : placeholder;

  return (
    <div className="flex flex-col gap-1.5 w-full relative">
      <label
        htmlFor={id}
        className="text-[13px] font-medium text-text-secondary dark:text-text-secondary pl-1"
      >
        {label}
      </label>

      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-text-secondary dark:text-text-secondary pointer-events-none">
          <Icon size={18} strokeWidth={1.5} />
        </div>

        <input
          ref={inputRef}
          id={id}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); setCapsLock(false); }}
          onKeyDown={(e) => {
            if (isPassword) setCapsLock(e.getModifierState('CapsLock'));
          }}
          placeholder={defaultPlaceholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-required={required || undefined}
           className={`w-full py-3 pl-11 pr-12 bg-surface-input text-[15px] text-text-primary rounded-lg border transition-all duration-150 outline-none placeholder:text-slate-300 dark:placeholder:text-text-secondary ${
            error
              ? 'border-red-400 focus:border-red-500 ring-2 ring-red-100/50'
              : isFocused
              ? 'border-brand ring-2 ring-brand/10'
              : 'border-border hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        />

        {/* Password toggle icon matching screenshot */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 p-1.5 rounded-lg text-text-secondary dark:text-text-secondary hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-95 transition-all duration-150"
            tabIndex={-1}
            aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
          </button>
        )}
      </div>

      {/* Caps lock warning */}
      <AnimatePresence>
        {isPassword && capsLock && isFocused && (
          <motion.p
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs font-semibold text-amber-500 mt-0.5 pl-1 flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Caps Lock yoqilgan
          </motion.p>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs font-semibold text-red-500 mt-0.5 pl-1"
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
