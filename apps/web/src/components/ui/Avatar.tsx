import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  showOnline?: boolean;
  isOnline?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

const onlineDotSize = {
  sm: 'w-2.5 h-2.5 border-[1.5px]',
  md: 'w-3 h-3 border-2',
  lg: 'w-3.5 h-3.5 border-2',
};

export default function Avatar({ src, name, size = 'md', showOnline = false, isOnline = false, className = '' }: AvatarProps) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-white/20 transition-all bg-gradient-to-br from-indigo-500 to-purple-600`}
      >
        {src ? (
          <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
        ) : initials ? (
          <span className="font-semibold text-white">{initials}</span>
        ) : (
          <User className="w-1/2 h-1/2 text-white" />
        )}
      </div>
      {showOnline && (
        <span
          className={`absolute bottom-0 right-0 ${onlineDotSize[size]} rounded-full border-gray-950 ${
            isOnline ? 'bg-green-500' : 'bg-gray-500'
          }`}
        />
      )}
    </div>
  );
}
