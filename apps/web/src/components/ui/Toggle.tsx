interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, size = 'md', disabled = false }: ToggleProps) {
  const sizes = {
    sm: { track: 'w-9 h-5', thumb: 'w-3.5 h-3.5', translate: checked ? 'translate-x-4' : 'translate-x-0.5' },
    md: { track: 'w-11 h-6', thumb: 'w-4.5 h-4.5', translate: checked ? 'translate-x-5' : 'translate-x-0.5' },
  };

  const s = sizes[size];

  return (
    <label className={`inline-flex items-center gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex shrink-0 rounded-full transition-colors duration-200 ease-in-out
          ${s.track}
          ${checked ? 'bg-indigo-600' : 'bg-white/10 border border-white/10'}
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-gray-950
        `}
      >
        <span
          className={`
            pointer-events-none inline-block rounded-full bg-white shadow-lg transform transition duration-200 ease-in-out
            ${s.thumb}
            ${s.translate}
          `}
          style={{ marginTop: size === 'sm' ? '3px' : '4px' }}
        />
      </button>
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  );
}
