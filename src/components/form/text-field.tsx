"use client";

import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FieldWrapper } from "@/components/form/field-wrapper";

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  type = "text",
  placeholder,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  hint?: string;
  type?: string;
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
            type={type}
            placeholder={placeholder}
            value={field.value ?? ""}
            onChange={field.onChange}
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
