/**
 * WYSIWYG procedure form builder: split-pane with structure panel + live preview.
 * Click sections/items in the preview to select and edit in the left panel.
 */

import { useState } from "react";

import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";

import {
  AssessmentFormRenderer,
  type FormSection,
  type FormItem,
  type FormItemType,
} from "@/components/assessments/AssessmentFormRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const ITEM_TYPES: { value: FormItemType; label: string }[] = [
  { value: "checklist", label: "Checklist" },
  { value: "free_text", label: "Free text" },
  { value: "likert", label: "Likert scale" },
  { value: "entrustment", label: "Entrustment scale" },
  { value: "numeric_score", label: "Numeric score" },
  { value: "file_attachment_stub", label: "File attachment (stub)" },
  { value: "epa_milestone_metadata", label: "EPA/milestone" },
  { value: "custom_button_set", label: "Custom button set" },
];

export interface ProcedureFormBuilderProps {
  sections: FormSection[];
  addSection: () => void;
  addItem: (sectionId: string) => void;
  updateSection: (sectionId: string, updates: Partial<FormSection>) => void;
  updateItem: (sectionId: string, itemId: string, updates: Partial<FormItem>) => void;
  removeSection: (sectionId: string) => void;
  removeItem: (sectionId: string, itemId: string) => void;
  moveSection: (index: number, dir: "up" | "down") => void;
  moveItem: (sectionId: string, itemIndex: number, dir: "up" | "down") => void;
}

export function ProcedureFormBuilder({
  sections,
  addSection,
  addItem,
  updateSection,
  updateItem,
  removeSection,
  removeItem,
  moveSection,
  moveItem,
}: ProcedureFormBuilderProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const selectedItem = selectedSection?.items.find((i) => i.id === selectedItemId);

  const handleSectionClick = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setSelectedItemId(null);
  };

  const handleItemClick = (sectionId: string, itemId: string) => {
    setSelectedSectionId(sectionId);
    setSelectedItemId(itemId);
  };

  const sortedSections = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Left: Structure panel */}
      <div className="flex flex-col rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Form structure</h3>
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus className="mr-2 h-4 w-4" />
            Add section
          </Button>
        </div>
        <ScrollArea className="h-[400px] flex-1 p-3">
          <div className="space-y-3">
            {sortedSections.map((section, sIdx) => (
              <div
                key={section.id}
                className={`rounded-md border bg-background p-2 transition-colors ${
                  selectedSectionId === section.id && !selectedItemId ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Input
                    className="flex-1 text-sm font-medium"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                    placeholder="Section title"
                    onClick={() => handleSectionClick(section.id)}
                  />
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveSection(sIdx, "up")}
                      disabled={sIdx === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => moveSection(sIdx, "down")}
                      disabled={sIdx === sortedSections.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeSection(section.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 ml-6 space-y-1.5">
                  {(section.items || []).map((item, iIdx) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 rounded border bg-muted/30 px-2 py-1.5 ${
                        selectedItemId === item.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span
                        className="min-w-0 flex-1 truncate text-sm"
                        onClick={() => handleItemClick(section.id, item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleItemClick(section.id, item.id);
                          }
                        }}
                      >
                        {item.label || `(${item.type})`}
                      </span>
                      <div className="flex shrink-0 gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveItem(section.id, iIdx, "up")}
                          disabled={iIdx === 0}
                        >
                          <ChevronUp className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveItem(section.id, iIdx, "down")}
                          disabled={iIdx === section.items.length - 1}
                        >
                          <ChevronDown className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeItem(section.id, item.id)}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => addItem(section.id)}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Add item
                  </Button>
                </div>
              </div>
            ))}
            {sections.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No sections yet. Click &quot;Add section&quot; to start.
              </p>
            )}
          </div>
        </ScrollArea>

        {/* Selected item/section editors */}
        {(selectedSection || selectedItem) && (
          <>
            <Separator />
            <div className="space-y-3 border-t p-3">
              {selectedSection && !selectedItem && (
                <>
                  <h4 className="text-sm font-medium">Edit section</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={selectedSection.title}
                      onChange={(e) => updateSection(selectedSection.id, { title: e.target.value })}
                      placeholder="Section title"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="collapsible"
                        checked={selectedSection.collapsible}
                        onChange={(e) =>
                          updateSection(selectedSection.id, { collapsible: e.target.checked })
                        }
                      />
                      <Label htmlFor="collapsible" className="text-xs">
                        Collapsible
                      </Label>
                    </div>
                  </div>
                </>
              )}
              {selectedItem && selectedSection && (
                <>
                  <h4 className="text-sm font-medium">Edit item</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={selectedItem.label}
                      onChange={(e) =>
                        updateItem(selectedSection.id, selectedItem.id, { label: e.target.value })
                      }
                      placeholder="Item label"
                    />
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={selectedItem.type || "free_text"}
                      onValueChange={(v) =>
                        updateItem(selectedSection.id, selectedItem.id, { type: v as FormItemType })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="required"
                        checked={selectedItem.required}
                        onChange={(e) =>
                          updateItem(selectedSection.id, selectedItem.id, {
                            required: e.target.checked,
                          })
                        }
                      />
                      <Label htmlFor="required" className="text-xs">
                        Required
                      </Label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right: Live preview */}
      <div className="flex flex-col rounded-lg border bg-muted/20">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Live preview</h3>
          <p className="text-xs text-muted-foreground">
            Click a section or item to select and edit in the left panel.
          </p>
        </div>
        <ScrollArea className="h-[400px] flex-1 p-4">
          {sections.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Add sections and items to see the form preview.
            </p>
          ) : (
            <AssessmentFormRenderer
              sections={sections}
              formResponses={{}}
              onChange={() => {}}
              disabled
              builderMode={{
                selectedSectionId,
                selectedItemId,
                onSectionClick: handleSectionClick,
                onItemClick: handleItemClick,
              }}
            />
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
