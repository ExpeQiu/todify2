import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, message } from 'antd';
import { SearchOutlined, PlusOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import './SelectableOptionSelector.css';

export interface Option {
  id: number | string;
  name: string;
  color?: string;
}

interface SelectableOptionSelectorProps {
  value?: number | string | null | (number | string)[];
  options: Option[];
  placeholder?: string;
  onCreate?: (name: string) => Promise<Option | null>;
  onDelete?: (id: number | string) => Promise<boolean>;
  onChange?: (value: number | string | null | (number | string)[]) => void;
  disabled?: boolean;
  allowClear?: boolean;
  mode?: 'single' | 'multiple';
}

const SelectableOptionSelector: React.FC<SelectableOptionSelectorProps> = ({
  value,
  options,
  placeholder = '请选择或创建一个选项',
  onCreate,
  onDelete,
  onChange,
  disabled = false,
  allowClear = true,
  mode = 'single',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [editMenuVisible, setEditMenuVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理单选和多选的值
  const isMultiple = mode === 'multiple';
  const selectedValues = isMultiple 
    ? (Array.isArray(value) ? value : value ? [value] : [])
    : (value ? [value] : []);
  
  const selectedOptions = selectedValues
    .map(v => options.find(opt => opt.id === v))
    .filter(Boolean) as Option[];
  
  const selectedOption = !isMultiple && selectedOptions.length > 0 ? selectedOptions[0] : null;

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setNewOptionName('');
        setEditingOption(null);
        setEditMenuVisible(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: Option) => {
    if (isMultiple) {
      // 多选模式：切换选中状态
      const currentValues = selectedValues;
      const isSelected = currentValues.includes(option.id);
      const newValues = isSelected
        ? currentValues.filter(v => v !== option.id)
        : [...currentValues, option.id];
      
      if (onChange) {
        onChange(newValues);
      }
      // 多选时不自动关闭下拉框
    } else {
      // 单选模式：直接选择
      if (onChange) {
        onChange(option.id);
      }
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleCreate = async () => {
    if (!newOptionName.trim() || !onCreate) return;

    // 检查是否已存在
    if (options.some(opt => opt.name.toLowerCase() === newOptionName.trim().toLowerCase())) {
      message.warning('该选项已存在');
      return;
    }

    setIsCreating(true);
    try {
      const newOption = await onCreate(newOptionName.trim());
      if (newOption) {
        if (onChange) {
          if (isMultiple) {
            // 多选模式：添加到已选列表
            const newValues = [...selectedValues, newOption.id];
            onChange(newValues);
          } else {
            // 单选模式：直接选择
            onChange(newOption.id);
            setIsOpen(false);
          }
        }
        setNewOptionName('');
        if (!isMultiple) {
          setIsOpen(false);
        }
        message.success('创建成功');
      }
    } catch (error) {
      message.error('创建失败');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (option: Option, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!onDelete) return;

    // 如果删除的是当前选中的选项，从选择中移除
    if (onChange) {
      if (isMultiple) {
        const newValues = selectedValues.filter(v => v !== option.id);
        onChange(newValues);
      } else if (value === option.id) {
        onChange(null);
      }
    }

    setIsDeleting(true);
    try {
      const success = await onDelete(option.id);
      if (success) {
        message.success('删除成功');
        if (isOpen) {
          setIsOpen(false);
        }
      }
    } catch (error) {
      message.error('删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      onChange(isMultiple ? [] : null);
    }
  };

  const handleRemoveTag = (optionId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange && isMultiple) {
      const newValues = selectedValues.filter(v => v !== optionId);
      onChange(newValues);
    }
  };

  const content = (
    <div className="selectable-option-selector-popover">
      <div className="selectable-option-search">
        <Input
          placeholder="搜索选项..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      <div className="selectable-option-list">
        <div className="selectable-option-list-title">选择或创建一个选项</div>
        {filteredOptions.map((option) => (
          <div key={option.id} className="selectable-option-item-wrapper">
            <div
              className={`selectable-option-item ${selectedValues.includes(option.id) ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
            >
              <span className="selectable-option-drag-handle">⋮⋮</span>
              <span className="selectable-option-name">{option.name}</span>
              {onDelete && (
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  className="selectable-option-menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editingOption?.id === option.id) {
                      setEditingOption(null);
                      setEditMenuVisible(false);
                    } else {
                      setEditingOption(option);
                      setEditMenuVisible(true);
                    }
                  }}
                />
              )}
            </div>
            {editingOption?.id === option.id && editMenuVisible && (
              <div className="selectable-option-edit-menu-inline">
                <div className="selectable-option-edit-input">
                  <Input
                    value={editingOption.name}
                    onChange={(e) => setEditingOption({ ...editingOption, name: e.target.value })}
                    suffix={<span className="info-icon">i</span>}
                    autoFocus
                  />
                </div>
                {onDelete && (
                  <div
                    className="selectable-option-delete-item"
                    onClick={(e) => {
                      handleDelete(editingOption, e);
                      setEditingOption(null);
                      setEditMenuVisible(false);
                    }}
                  >
                    <DeleteOutlined />
                    <span>删除</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {onCreate && (
          <div className="selectable-option-create">
            <Input
              placeholder="输入新选项名称..."
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              onPressEnter={handleCreate}
              suffix={
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  loading={isCreating}
                  disabled={!newOptionName.trim()}
                />
              }
            />
          </div>
        )}
      </div>
    </div>
  );


  return (
    <div ref={containerRef} className="selectable-option-selector">
      <div
        className={`selectable-option-trigger ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {isMultiple ? (
          selectedOptions.length > 0 ? (
            <div className="selectable-option-selected-multiple">
              <div className="selectable-option-tags">
                {selectedOptions.map(opt => (
                  <span key={opt.id} className="selectable-option-tag">
                    {opt.name}
                    {!disabled && (
                      <span
                        className="selectable-option-tag-remove"
                        onClick={(e) => handleRemoveTag(opt.id, e)}
                      >
                        ×
                      </span>
                    )}
                  </span>
                ))}
              </div>
              {allowClear && !disabled && selectedOptions.length > 0 && (
                <span
                  className="selectable-option-clear"
                  onClick={handleClear}
                >
                  ×
                </span>
              )}
            </div>
          ) : (
            <span className="selectable-option-placeholder">{placeholder}</span>
          )
        ) : (
          selectedOption ? (
            <div className="selectable-option-selected">
              <span className="selectable-option-tag">{selectedOption.name}</span>
              {allowClear && !disabled && (
                <span
                  className="selectable-option-clear"
                  onClick={handleClear}
                >
                  ×
                </span>
              )}
            </div>
          ) : (
            <span className="selectable-option-placeholder">{placeholder}</span>
          )
        )}
      </div>

      {isOpen && (
        <div className="selectable-option-dropdown">
          {content}
        </div>
      )}
    </div>
  );
};

export default SelectableOptionSelector;

