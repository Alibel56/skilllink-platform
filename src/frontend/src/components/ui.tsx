import type { ReactNode } from 'react';
import { Star } from 'lucide-react';

export function IconBadge({ children }: { children: ReactNode }) {
  return <div className="icon-badge">{children}</div>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

export function Button({
  children, variant = 'primary', onClick, className = '', type = 'button', style,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}) {
  return (
    <button type={type} className={`btn btn-${variant} ${className}`.trim()} onClick={onClick} style={style}>
      {children}
    </button>
  );
}

export function InputField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ''}`.trim()} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`textarea ${props.className ?? ''}`.trim()} />;
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'success' | 'soft' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Avatar({ name, image, onClick }: { name: string; image?: string; onClick?: () => void }) {
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2);
  return (
    <div className="avatar" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', overflow: 'hidden' }}>
      {image ? <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <div className="stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={16} className={i < Math.round(value) ? 'star active' : 'star'} />
      ))}
    </div>
  );
}