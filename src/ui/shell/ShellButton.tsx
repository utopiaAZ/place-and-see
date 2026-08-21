import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ShellButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
  readonly tone?: 'primary' | 'secondary' | 'coral' | 'quiet';
}

export function ShellButton({ children, className = '', tone = 'primary', ...props }: ShellButtonProps) {
  return <button type="button" className={`shell-button shell-button-${tone} ${className}`.trim()} {...props}>{children}</button>;
}
