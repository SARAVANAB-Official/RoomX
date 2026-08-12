import { forwardRef, TextareaHTMLAttributes } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  textarea?: false;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  textarea: true;
}

type Props = InputProps | TextareaProps;

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  ({ label, error, textarea, className = '', ...props }, ref) => {
    const baseClasses = `
      w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3
      text-gray-100 placeholder-gray-500
      focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
      transition-all duration-200
      ${error ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' : ''}
      ${className}
    `;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        {textarea ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={`${baseClasses} min-h-[100px] resize-y`}
            {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            className={baseClasses}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
