import type { CheckboxFieldId, FieldId, FormValues, TextFieldId } from "@/features/application/fields";

/** What every step receives from the form. */
export type StepProps = {
  readonly values: FormValues;
  readonly errors: Readonly<Partial<Record<FieldId, string>>>;
  readonly onChange: (field: TextFieldId, value: string) => void;
  readonly onToggle: (field: CheckboxFieldId, checked: boolean) => void;
  readonly onBlur: (field: FieldId) => void;
};
