import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, User, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import InputField from './InputField';
import { useAuthSession } from '../auth/AuthProvider';

interface AuthViewProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// One entry point for both signing in and signing up:
//
//   phone -> check account -> exists?  -> code -> sign in
//                          -> new?     -> profile -> code -> create + sign in
//
// The code is sent by /auth/phone-start regardless of the branch, so the SMS
// is already on its way while a new user fills in their name. Verifying the
// phone before the account row is written is what stops anyone from
// registering a number they don't control (which would otherwise lock the
// real owner out of this very flow).
type Step = 'phone' | 'profile' | 'code';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const SPINNER = (
  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const stepTransition = {
  initial: { opacity: 0, x: 15 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -15 },
  transition: { duration: 0.2 },
};

export default function AuthView({ onSuccess, onError }: AuthViewProps) {
  const { startPhoneAuth, verifyPhoneAuth } = useAuthSession();

  const [step, setStep] = useState<Step>('phone');
  const [accountExists, setAccountExists] = useState(false);

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [codeError, setCodeError] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Guards the auto-submit that fires as soon as the 6th digit lands, so a
  // re-render mid-request can't kick off a second verify with the same code
  // (the server burns the code on the first one, and the second would come
  // back as "kod noto'g'ri" over a sign-in that actually succeeded).
  const submittingRef = useRef(false);

  const normalizedPhone = useMemo(() => '+' + phone.replace(/\D/g, ''), [phone]);
  const isPhoneComplete = phone.replace(/\D/g, '').length === 12;

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  // Only usable while the code step is already on screen (after a wrong code
  // or a resend). Entering the step is handled by autoFocus on the first box
  // instead: AnimatePresence mode="wait" keeps the previous step mounted
  // until its exit animation finishes, so a timeout fired at transition time
  // ran while codeRefs was still empty and the user landed on six unfocused
  // boxes with nothing to type into.
  const focusFirstCodeInput = () => {
    codeRefs.current[0]?.focus();
  };

  const requestCode = async () => {
    const res = await startPhoneAuth(normalizedPhone);
    setResendIn(RESEND_SECONDS);
    return res;
  };

  // --- Step 1: phone -----------------------------------------------------

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneComplete) {
      setPhoneError("Iltimos, telefon raqamingizni to'liq kiriting");
      return;
    }
    setPhoneError('');
    setIsLoading(true);
    try {
      const { accountExists: exists } = await requestCode();
      setAccountExists(exists);
      setCode(Array(OTP_LENGTH).fill(''));
      setCodeError('');
      if (exists) {
        setStep('code');
      } else {
        setStep('profile');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Kod yuborishda xatolik yuz berdi.";
      setPhoneError(msg);
      onError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 2 (new accounts only): profile -------------------------------

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Iltimos, ism va familiyangizni kiriting');
      return;
    }
    setNameError('');
    setStep('code');
  };

  // --- Step 3: code ------------------------------------------------------

  const submitCode = async (fullCode: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setCodeError('');
    setIsLoading(true);
    try {
      const { isNewAccount } = await verifyPhoneAuth(
        normalizedPhone,
        fullCode,
        accountExists ? undefined : name.trim()
      );
      onSuccess(
        isNewAccount
          ? 'Profil muvaffaqiyatli yaratildi va tizimga kirdingiz!'
          : 'Tizimga muvaffaqiyatli kirdingiz! "Master Group" portaliga xush kelibsiz.'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kodni tasdiqlashda xatolik yuz berdi.';
      // The server asks for the profile when it turns out the phone has no
      // account after all (e.g. it was deleted between the two steps) - send
      // the user to that step instead of showing a dead-end error.
      if ((err as { needsProfile?: boolean }).needsProfile) {
        setStep('profile');
        setNameError(msg);
      } else {
        setCodeError(msg);
        setCode(Array(OTP_LENGTH).fill(''));
        focusFirstCodeInput();
      }
    } finally {
      setIsLoading(false);
      submittingRef.current = false;
    }
  };

  const applyCodeDigits = (startIndex: number, digits: string) => {
    if (!digits) return;
    const next = [...code];
    for (let i = 0; i < digits.length && startIndex + i < OTP_LENGTH; i++) {
      next[startIndex + i] = digits[i];
    }
    setCode(next);
    setCodeError('');

    const lastFilled = Math.min(startIndex + digits.length, OTP_LENGTH) - 1;
    codeRefs.current[Math.min(lastFilled + 1, OTP_LENGTH - 1)]?.focus();

    // `next` is the array, so completeness is "no empty slot" - checking the
    // joined string with .includes('') can never work: every string contains
    // the empty string, which made the auto-submit dead code and the manual
    // submit below reject a fully entered code.
    if (next.every((d) => d !== '')) {
      submitCode(next.join(''));
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return;
    // A paste lands as one multi-digit change event - spread it across the
    // remaining boxes instead of keeping only the last character.
    applyCodeDigits(index, digits.length > 1 ? digits : digits.slice(-1));
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...code];
      if (next[index]) {
        next[index] = '';
        setCode(next);
      } else if (index > 0) {
        next[index - 1] = '';
        setCode(next);
        codeRefs.current[index - 1]?.focus();
      }
      setCodeError('');
    } else if (e.key === 'ArrowLeft' && index > 0) {
      codeRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.some((d) => d === '')) {
      setCodeError("Iltimos, 6 xonali tasdiqlash kodini to'liq kiriting");
      return;
    }
    submitCode(code.join(''));
  };

  const handleResend = async () => {
    if (resendIn > 0 || isLoading) return;
    setCode(Array(OTP_LENGTH).fill(''));
    setCodeError('');
    try {
      const { accountExists: exists } = await requestCode();
      setAccountExists(exists);
      focusFirstCodeInput();
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Kodni qayta yuborishda xatolik yuz berdi.');
    }
  };

  const backToPhone = () => {
    setStep('phone');
    setCode(Array(OTP_LENGTH).fill(''));
    setCodeError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col w-full"
    >
      <AnimatePresence mode="wait">
        {step === 'phone' && (
          <motion.div key="phone-step" {...stepTransition}>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-text-primary tracking-tight">
                Tizimga kirish
              </h2>
              <p className="text-[13px] text-text-secondary mt-1.5">
                Telefon raqamingizni kiriting — kirish yoki ro'yxatdan o'tish avtomatik davom etadi.
              </p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-5">
              <InputField
                id="auth-phone"
                label="Telefon raqami"
                type="tel"
                value={phone}
                onChange={(val) => {
                  setPhone(val);
                  if (val.replace(/\D/g, '').length === 12) setPhoneError('');
                }}
                error={phoneError}
                icon={Phone}
                autoComplete="tel"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand hover:bg-brand-hover text-white py-3.5 px-4 rounded-xl font-semibold text-[15px] shadow-md shadow-brand/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    {SPINNER}
                    Tekshirilmoqda...
                  </>
                ) : (
                  <>
                    Davom etish
                    <ArrowRight size={18} strokeWidth={2} />
                  </>
                )}
              </button>

              <p className="text-[12px] text-text-secondary text-center leading-relaxed">
                Davom etish orqali siz{' '}
                <a href="/privacy" className="font-semibold text-brand hover:text-brand-hover">
                  maxfiylik siyosati
                </a>
                ga rozilik bildirasiz.
              </p>
            </form>
          </motion.div>
        )}

        {step === 'profile' && (
          <motion.div key="profile-step" {...stepTransition}>
            <div className="text-center mb-6">
              <h2 className="text-base font-medium text-text-primary leading-snug tracking-tight">
                Bu raqam bo'yicha hisob topilmadi
              </h2>
              <p className="text-[13px] text-text-secondary mt-1.5">
                Yangi profil yaratamiz — ism va familiyangizni kiriting.
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
              <InputField
                id="auth-name"
                label="Ism-familiya"
                type="text"
                value={name}
                onChange={(val) => {
                  setName(val);
                  if (val.trim()) setNameError('');
                }}
                placeholder="Akmal Saidov"
                error={nameError}
                icon={User}
                autoComplete="name"
                // Mid-flow step: the user got here by submitting the phone,
                // so the one field on screen should be ready to type into.
                autoFocus
              />

              <button
                type="submit"
                className="w-full bg-brand hover:bg-brand-hover text-white py-3.5 px-4 rounded-xl font-semibold text-[15px] shadow-md shadow-brand/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Davom etish
                <ArrowRight size={18} strokeWidth={2} />
              </button>

              <button
                type="button"
                onClick={backToPhone}
                className="text-[13px] font-semibold text-text-secondary dark:text-slate-300 hover:text-text-primary transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-brand/20 rounded self-center flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                Raqamni o'zgartirish
              </button>
            </form>
          </motion.div>
        )}

        {step === 'code' && (
          <motion.div key="code-step" {...stepTransition}>
            <div className="text-center mb-6">
              <div className="w-11 h-11 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-3">
                <ShieldCheck size={20} />
              </div>
              <h2 className="text-base font-medium text-text-primary leading-snug tracking-tight mb-1">
                Telefon raqamini tasdiqlang
              </h2>
              <p className="text-xs text-text-secondary mb-1">Kodni ushbu raqamga yubordik:</p>
              <p className="font-bold text-text-primary text-sm tracking-wider">{phone}</p>
            </div>

            <form onSubmit={handleCodeSubmit} className="flex flex-col gap-5">
              <div className="flex justify-between gap-2 max-w-xs mx-auto my-2">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      codeRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoFocus={idx === 0}
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    aria-label={`Tasdiqlash kodining ${idx + 1}-raqami`}
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                    onPaste={(e) => {
                      e.preventDefault();
                      applyCodeDigits(idx, e.clipboardData.getData('text').replace(/\D/g, ''));
                    }}
                    className="w-11 h-12 text-center text-xl font-bold bg-slate-50 dark:bg-surface-input border border-slate-200 dark:border-border focus:border-brand rounded-xl outline-none focus:ring-4 focus:ring-brand/10 transition-all text-text-primary"
                  />
                ))}
              </div>

              {codeError && (
                <p className="text-xs font-semibold text-red-500 text-center" role="alert">
                  ⚠️ {codeError}
                </p>
              )}

              <div className="text-center -mt-1">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendIn > 0}
                  className="text-xs font-bold text-brand hover:text-brand-hover underline active:scale-95 transition-all disabled:no-underline disabled:text-text-secondary disabled:cursor-default"
                >
                  {resendIn > 0 ? `Kodni qayta yuborish (${resendIn}s)` : 'Kodni qayta yuborish'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1 bg-brand hover:bg-brand-hover text-white py-3.5 px-4 rounded-xl font-semibold text-[15px] shadow-md shadow-brand/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    {SPINNER}
                    {accountExists ? 'Tizimga kirilmoqda...' : 'Hisob yaratilmoqda...'}
                  </>
                ) : accountExists ? (
                  'Tizimga kirish'
                ) : (
                  'Hisobni yaratish'
                )}
              </button>

              <button
                type="button"
                onClick={accountExists ? backToPhone : () => setStep('profile')}
                className="text-[13px] font-semibold text-text-secondary dark:text-slate-300 hover:text-text-primary transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-brand/20 rounded self-center flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                Orqaga
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
