/**
 * Renders an assessment form from procedure_version.assessment_form (sections/items).
 * Values are keyed by item id; parent manages form_responses state and passes onChange.
 */

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

export type FormItemType =
  | "checklist"
  | "free_text"
  | "likert"
  | "entrustment"
  | "numeric_score"
  | "file_attachment_stub"
  | "epa_milestone_metadata"
  | "custom_button_set";

export interface FormItemConfig {
  min?: number;
  max?: number;
  labels?: string[];
  levels?: { value: string; label: string }[];
}

export interface FormItem {
  id: string;
  type: FormItemType;
  label: string;
  required: boolean;
  config: FormItemConfig;
}

export interface FormSection {
  id: string;
  title: string;
  collapsible: boolean;
  order: number;
  items: FormItem[];
}

export interface AssessmentFormRendererProps {
  sections: FormSection[];
  formResponses: Record<string, unknown>;
  onChange: (itemId: string, value: unknown) => void;
  disabled?: boolean;
}

export function AssessmentFormRenderer({
  sections,
  formResponses,
  onChange,
  disabled = false,
}: AssessmentFormRendererProps) {
  const sortedSections = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-6">
      {sortedSections.map((section) => (
        <div key={section.id} className="rounded-lg border bg-card p-4">
          <h3 className="mb-4 text-lg font-semibold">{section.title}</h3>
          <div className="space-y-4">
            {(section.items || []).map((item) => (
              <FormItemField
                key={item.id}
                item={item}
                value={formResponses[item.id]}
                onChange={(v) => onChange(item.id, v)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormItemField({
  item,
  value,
  onChange,
  disabled,
}: {
  item: FormItem;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
}) {
  const { type, label, required, config } = item;

  switch (type) {
    case "checklist":
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={item.id}
            checked={!!value}
            onCheckedChange={(checked) => onChange(checked)}
            disabled={disabled}
          />
          <Label htmlFor={item.id} className="font-normal">
            {label}
            {required && " *"}
          </Label>
        </div>
      );

    case "free_text":
      return (
        <div className="space-y-2">
          <Label htmlFor={item.id}>
            {label}
            {required && " *"}
          </Label>
          <Textarea
            id={item.id}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={3}
          />
        </div>
      );

    case "likert": {
      const min = config?.min ?? 1;
      const max = config?.max ?? 5;
      const labels = config?.labels ?? [];
      const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <div className="space-y-2">
          <Label>
            {label}
            {required && " *"}
          </Label>
          <RadioGroup
            value={value != null ? String(value) : ""}
            onValueChange={(v) => onChange(Number(v))}
            disabled={disabled}
            className="flex flex-wrap gap-4"
          >
            {options.map((n, i) => (
              <div key={n} className="flex items-center space-x-2">
                <RadioGroupItem value={String(n)} id={`${item.id}-${n}`} />
                <Label htmlFor={`${item.id}-${n}`} className="font-normal cursor-pointer">
                  {n}
                  {labels[i] ? ` – ${labels[i]}` : ""}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    }

    case "entrustment": {
      const levels = (config?.levels ?? []) as { value: string; label: string }[];
      if (levels.length === 0) {
        return (
          <div className="space-y-2">
            <Label>{label}</Label>
            <Input
              value={(value as string) ?? ""}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder="Entrustment level"
            />
          </div>
        );
      }
      return (
        <div className="space-y-2">
          <Label>{label}{required && " *"}</Label>
          <RadioGroup
            value={(value as string) ?? ""}
            onValueChange={onChange}
            disabled={disabled}
            className="space-y-2"
          >
            {levels.map((lev) => (
              <div key={lev.value} className="flex items-center space-x-2">
                <RadioGroupItem value={lev.value} id={`${item.id}-${lev.value}`} />
                <Label htmlFor={`${item.id}-${lev.value}`} className="font-normal cursor-pointer">
                  {lev.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    }

    case "numeric_score": {
      const min = config?.min ?? 0;
      const max = config?.max ?? 10;
      return (
        <div className="space-y-2">
          <Label htmlFor={item.id}>
            {label}
            {required && " *"}
          </Label>
          <Input
            id={item.id}
            type="number"
            min={min}
            max={max}
            value={(value as number) ?? ""}
            onChange={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              onChange(v);
            }}
            disabled={disabled}
          />
        </div>
      );
    }

    case "file_attachment_stub":
    case "epa_milestone_metadata":
    case "custom_button_set":
    default:
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <Input
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={`${type} (stub)`}
          />
        </div>
      );
  }
}
