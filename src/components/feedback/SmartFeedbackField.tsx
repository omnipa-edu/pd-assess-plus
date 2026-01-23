import { useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isSmartFeedbackEnabled, type FeedbackContext } from "@/lib/smartFeedback";

import { SmartFeedbackAssistant } from "./SmartFeedbackAssistant";


interface SmartFeedbackFieldProps {
  /** The label for the textarea */
  label?: string;
  /** The current value of the textarea */
  value: string;
  /** Callback when the value changes */
  onChange: (value: string) => void;
  /** Callback when AI assistant is used (for tracking) */
  onAIUsed?: () => void;
  /** Callback when AI suggestions are applied (for tracking) */
  onAIApplied?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum height in pixels */
  minHeight?: string;
  /** Optional context for better analysis */
  context?: FeedbackContext;
  /** Additional className for the textarea */
  className?: string;
  /** Additional props to pass to the textarea */
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

/**
 * A wrapper component that combines a textarea with the Smart Feedback Assistant.
 * The assistant only appears if the feature is enabled.
 */
export function SmartFeedbackField({
  label,
  value,
  onChange,
  onAIUsed,
  onAIApplied,
  placeholder,
  minHeight = "80px",
  context,
  className,
  textareaProps,
}: SmartFeedbackFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  // Check if feature is enabled
  const isEnabled = isSmartFeedbackEnabled();

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Save cursor position for text insertion
    setCursorPosition(e.target.selectionStart || 0);
    onChange(e.target.value);
  };

  const handleReplaceFeedback = (newFeedback: string) => {
    onChange(newFeedback);
    // Focus the textarea after replacement
    setTimeout(() => {
      textareaRef.current?.focus();
      const length = newFeedback.length;
      textareaRef.current?.setSelectionRange(length, length);
    }, 0);
  };

  const handleInsertText = (textToInsert: string) => {
    const currentValue = value;
    const beforeCursor = currentValue.slice(0, cursorPosition);
    const afterCursor = currentValue.slice(cursorPosition);
    
    // Insert text with proper spacing
    const separator = beforeCursor && !beforeCursor.endsWith(' ') && !beforeCursor.endsWith('\n') ? ' ' : '';
    const newValue = beforeCursor + separator + textToInsert + (afterCursor ? ' ' : '') + afterCursor;
    
    onChange(newValue);
    
    // Restore cursor position after insertion
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPosition = cursorPosition + separator.length + textToInsert.length + (afterCursor ? 1 : 0);
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.target.selectionStart || 0);
    textareaProps?.onFocus?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0);
    textareaProps?.onClick?.(e);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0);
    textareaProps?.onKeyUp?.(e);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onFocus={handleFocus}
        onClick={handleClick}
        onKeyUp={handleKeyUp}
        placeholder={placeholder}
        className={className}
        style={{ minHeight }}
        {...textareaProps}
      />
      {isEnabled && (
        <SmartFeedbackAssistant
          currentFeedback={value}
          onReplaceFeedback={handleReplaceFeedback}
          onInsertText={handleInsertText}
          onAIUsed={onAIUsed}
          onAIApplied={onAIApplied}
          context={context}
        />
      )}
    </div>
  );
}

