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
import { createFloor } from "@/features/branch/api";
import { parseApiError } from "@/lib/api/client";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export function FloorFormPage({ branchId }: { branchId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { name: "", code: "", sort_order: 0 },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createFloor(branchId, {
        name: values.name,
        code: values.code || null,
        sort_order: values.sort_order ?? 0,
        is_active: true,
      });
      await queryClient.invalidateQueries({ queryKey: ["floors"] });
      toast.success(`Floor "${values.name}" created successfully!`);
      router.push(`/branches/${branchId}/floors`);
    } catch (e) {
      toast.error(parseApiError(e));
    }
  });

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Create floor"
          description="Floors group seating areas for halls and tables."
          actions={
            <Button asChild variant="secondary">
              <Link href={`/branches/${branchId}/floors`}>Back</Link>
            </Button>
          }
        />
        <form className="max-w-2xl space-y-6" onSubmit={onSubmit}>
          <FormGrid>
            <TextField control={form.control} name="name" label="Name" required />
            <TextField control={form.control} name="code" label="Code" />
            <NumberField control={form.control} name="sort_order" label="Sort order" min={0} />
          </FormGrid>
          <FormActions>
            <Button type="button" variant="outline" asChild>
              <Link href={`/branches/${branchId}/floors`}>Cancel</Link>
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
