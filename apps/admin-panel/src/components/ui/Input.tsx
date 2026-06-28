import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className = '', ...props }, ref) => {
    return (
      <div className="form-group">
        {label && (
          <label className="form-label">
            {label}
            {required && <span className="required"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`form-input ${className}`}
          style={error ? { borderColor: 'var(--wf-danger)' } : undefined}
          {...props}
        />
        {error && <div className="form-hint text-danger" style={{ marginTop: '0.25rem' }}>{error}</div>}
        {hint && !error && <div className="form-hint" style={{ marginTop: '0.25rem' }}>{hint}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
