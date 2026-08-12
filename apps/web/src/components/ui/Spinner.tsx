interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export default function Spinner({ size = 'md', text, className = '' }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
      </div>
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}
