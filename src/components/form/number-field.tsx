"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FieldWrapper } from "@/components/form/field-wrapper";

export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  min,
  placeholder,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  hint?: string;
  min?: number;
  placeholder?: string;
}) {
  const id = String(name);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldWrapper
          id={id}
          label={label}
          required={required}
          hint={hint}
          error={fieldState.error?.message}
        >
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            placeholder={placeholder}
            value={field.value ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              field.onChange(v === "" ? undefined : Number(v));
            }}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            aria-invalid={!!fieldState.error}
          />
        </FieldWrapper>
      )}
    />
  );
}
