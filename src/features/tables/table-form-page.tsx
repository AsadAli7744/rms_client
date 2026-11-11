"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { FormActions } from "@/components/form/form-actions";
import { FormGrid } from "@/components/form/form-grid";
import { NumberField } from "@/components/form/number-field";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { createDiningTable } from "@/features/branch/api";
import { parseApiError } from "@/lib/api/client";

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().optional(),
  seating_capacity: z.coerce.number().int().min(1).optional(),
  floor_id: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() !== "" ? Number(s) : undefined)),
  hall_id: z
    .string()
    .optional()
    .transform((s) => (s && s.trim() !== "" ? Number(s) : undefined)),
});

type FormValues = z.infer<typeof schema>;

export function TableFormPage({ branchId }: { branchId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      code: "",
      name: "",
      seating_capacity: 4,
      floor_id: undefined,
      hall_id: undefined,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createDiningTable(branchId, {
        code: values.code,
        name: values.name || null,
        seating_capacity: values.seating_capacity ?? 4,
        floor_id: Number.isFinite(values.floor_id as number) ? (values.floor_id as number) : null,
        hall_id: Number.isFinite(values.hall_id as number) ? (values.hall_id as number) : null,
      });
      await queryClient.invalidateQueries({ queryKey: ["dining-tables"] });
      toast.success(`Table "${values.code}" created successfully!`);
      router.push(`/branches/${branchId}/tables`);
    } catch (e) {
      toast.error(parseApiError(e));
    }
  });

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Create table"
          actions={
            <Button asChild variant="secondary">
              <Link href={`/branches/${branchId}/tables`}>Back</Link>
            </Button>
          }
        />
        <form className="max-w-2xl space-y-6" onSubmit={onSubmit}>
          <FormGrid>
            <TextField control={form.control} name="code" label="Code" required />
            <TextField control={form.control} name="name" label="Name" />
            <NumberField
              control={form.control}
              name="seating_capacity"
              label="Seating capacity"
              min={1}
            />
            <NumberField
              control={form.control}
              name="floor_id"
              label="Floor id (optional)"
              min={1}
            />
            <NumberField
              control={form.control}
              name="hall_id"
              label="Hall id (optional)"
              min={1}
            />
          </FormGrid>
          <FormActions>
            <Button type="button" variant="outline" asChild>
              <Link href={`/branches/${branchId}/tables`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save"}
            </Button>
          </FormActions>
        </form>
      </div>
    </PageContainer>
  );
}
