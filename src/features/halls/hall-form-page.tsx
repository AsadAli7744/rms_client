"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { FormActions } from "@/components/form/form-actions";
import { FormGrid } from "@/components/form/form-grid";
import { NumberField } from "@/components/form/number-field";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { createHall } from "@/features/branch/api";
import { useFloorsQuery } from "@/features/branch/hooks";
import { parseApiError } from "@/lib/api/client";

const schema = z.object({
  floor_id: z.coerce.number().int().positive("Pick a floor"),
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export function HallFormPage({ branchId }: { branchId: number }) {
  const router = useRouter();
  const floors = useFloorsQuery(branchId, 1, 200);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { floor_id: undefined as unknown as number, name: "", code: "", sort_order: 0 },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createHall(branchId, {
        floor_id: values.floor_id,
        name: values.name,
        code: values.code || null,
        sort_order: values.sort_order ?? 0,
        is_active: true,
      });
      toast.success("Hall created");
      router.push(`/branches/${branchId}/halls`);
      router.refresh();
    } catch (e) {
      toast.error(parseApiError(e));
    }
  });

  const floorOptions = floors.data?.data ?? [];

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Create hall"
          actions={
            <Button asChild variant="secondary">
              <Link href={`/branches/${branchId}/halls`}>Back</Link>
            </Button>
          }
        />
        <form className="max-w-2xl space-y-6" onSubmit={onSubmit}>
          <FormGrid>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="floor_id">
                Floor
              </label>
              <select
                id="floor_id"
                className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm dark:border-neutral-800 dark:bg-neutral-950"
                value={form.watch("floor_id") || ""}
                onChange={(e) =>
                  form.setValue("floor_id", Number(e.target.value), { shouldValidate: true })
                }
              >
                <option value="">Select floor…</option>
                {floorOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.floor_id?.message ? (
                <p className="text-xs text-red-600">
                  {String(form.formState.errors.floor_id.message)}
                </p>
              ) : null}
            </div>
            <TextField control={form.control} name="name" label="Name" required />
            <TextField control={form.control} name="code" label="Code" />
            <NumberField control={form.control} name="sort_order" label="Sort order" min={0} />
          </FormGrid>
          <FormActions>
            <Button type="button" variant="outline" asChild>
              <Link href={`/branches/${branchId}/halls`}>Cancel</Link>
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
