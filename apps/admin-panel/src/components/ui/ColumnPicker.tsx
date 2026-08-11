'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface ColumnOption {
  key: string;
  label: string;
  defaultVisible?: boolean;
  alwaysVisible?: boolean;
}

interface ColumnPickerProps {
  columns: ColumnOption[];
  visibleKeys: string[];
  onChange: (keys: string[]) => void;
  tableId?: string;
}

export default function ColumnPicker({ columns, visibleKeys, onChange, tableId }: ColumnPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (key: string) => {
    const col = columns.find((c) => c.key === key);
    if (col?.alwaysVisible) return;

    let updated: string[];
    if (visibleKeys.includes(key)) {
      if (visibleKeys.length <= 1) return;
      updated = visibleKeys.filter((k) => k !== key);
    } else {
      updated = [...visibleKeys, key];
    }

    onChange(updated);
    if (tableId) {
      try {
        localStorage.setItem(`table_cols_${tableId}`, JSON.stringify(updated));
      } catch {}
    }
  };

  const selectAll = () => {
    const allKeys = columns.map((c) => c.key);
    onChange(allKeys);
    if (tableId) {
      try {
        localStorage.setItem(`table_cols_${tableId}`, JSON.stringify(allKeys));
      } catch {}
    }
  };

  const resetDefault = () => {
    const defaultKeys = columns.filter((c) => c.defaultVisible !== false).map((c) => c.key);
    onChange(defaultKeys);
    if (tableId) {
      try {
        localStorage.setItem(`table_cols_${tableId}`, JSON.stringify(defaultKeys));
      } catch {}
    }
  };

  const hiddenCount = columns.length - visibleKeys.length;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-outline btn-sm"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '0.85rem',
          fontWeight: 600,
          borderRadius: '8px',
          border: '1px solid #CBD5E1',
          backgroundColor: isOpen ? '#F8FAFC' : '#FFFFFF',
          color: '#334155',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#1B4F72' }}>view_column</span>
        <span>Atur Kolom</span>
        {hiddenCount > 0 && (
          <span
            style={{
              backgroundColor: '#1B4F72',
              color: '#FFFFFF',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '1px 6px',
              marginLeft: '2px',
            }}
          >
            -{hiddenCount}
          </span>
        )}
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#64748B' }}>
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            width: '250px',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            zIndex: 99,
            padding: '8px 0',
          }}
        >
          <div
            style={{
              padding: '8px 14px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tampilkan Kolom
            </span>
            <button
              type="button"
              onClick={selectAll}
              style={{ background: 'none', border: 'none', color: '#1B4F72', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              Semua
            </button>
          </div>

          <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px 0' }}>
            {columns.map((col) => {
              const isChecked = visibleKeys.includes(col.key);
              return (
                <label
                  key={col.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '7px 14px',
                    fontSize: '0.85rem',
                    color: col.alwaysVisible ? '#94A3B8' : '#334155',
                    cursor: col.alwaysVisible ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!col.alwaysVisible) e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={col.alwaysVisible}
                    onChange={() => toggleColumn(col.key)}
                    style={{ accentColor: '#1B4F72', width: '15px', height: '15px', cursor: col.alwaysVisible ? 'not-allowed' : 'pointer' }}
                  />
                  <span style={{ flex: 1, fontWeight: isChecked ? 600 : 400 }}>{col.label}</span>
                  {col.alwaysVisible && (
                    <span style={{ fontSize: '0.65rem', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', color: '#64748B' }}>
                      Wajib
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          <div style={{ padding: '8px 14px 4px', borderTop: '1px solid #F1F5F9', textAlign: 'right' }}>
            <button
              type="button"
              onClick={resetDefault}
              style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
            >
              Reset Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function useColumnVisibility(tableId: string, initialColumns: ColumnOption[]) {
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`table_cols_${tableId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialColumns.filter((c) => c.defaultVisible !== false).map((c) => c.key);
  });

  const isVisible = (key: string) => visibleKeys.includes(key);

  return { visibleKeys, setVisibleKeys, isVisible };
}
