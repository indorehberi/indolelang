import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, options, className = '', ...props }, ref) => {
    return (
      <div className="form-group">
        {label && (
          <label className="form-label">
            {label}
            {required && <span className="required"> *</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`form-select ${className}`}
          style={error ? { borderColor: 'var(--wf-danger)' } : undefined}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <div className="form-hint text-danger" style={{ marginTop: '0.25rem' }}>{error}</div>}
        {hint && !error && <div className="form-hint" style={{ marginTop: '0.25rem' }}>{hint}</div>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
