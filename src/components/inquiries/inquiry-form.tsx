"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  inquiryIntakeSchema,
  type InquiryIntakeInput,
} from "@/domain/schemas";
import { createInquiryAction } from "@/app/actions/inquiries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const defaultValues: InquiryIntakeInput = {
  title: "",
  questionText: "",
  productName: "",
  therapeuticArea: "",
  requesterType: "hcp",
  requesterName: "",
  requesterOrganization: "",
  channel: "email",
  priority: "medium",
  submitImmediately: false,
};

export function InquiryForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const form = useForm<InquiryIntakeInput>({
    resolver: zodResolver(inquiryIntakeSchema),
    defaultValues,
    mode: "onBlur",
  });

  const requesterType = useWatch({
    control: form.control,
    name: "requesterType",
  });
  const channel = useWatch({ control: form.control, name: "channel" });
  const priority = useWatch({ control: form.control, name: "priority" });

  const onSubmit = (values: InquiryIntakeInput, submitImmediately: boolean) => {
    setFormError(null);
    setFormSuccess(null);
    startTransition(async () => {
      const result = await createInquiryAction({
        ...values,
        submitImmediately,
      });
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      setFormSuccess(result.message);
      if (result.inquiryId) {
        router.push(`/medical-information/inquiries/${result.inquiryId}`);
        router.refresh();
      }
    });
  };

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit((values) => onSubmit(values, false))}
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="title">Inquiry title</Label>
          <Input
            id="title"
            aria-invalid={Boolean(form.formState.errors.title)}
            {...form.register("title")}
          />
          {form.formState.errors.title ? (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.title.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="questionText">Question</Label>
          <Textarea
            id="questionText"
            rows={5}
            aria-invalid={Boolean(form.formState.errors.questionText)}
            {...form.register("questionText")}
          />
          {form.formState.errors.questionText ? (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.questionText.message}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Do not include real patient identifiers or PHI. Use synthetic
            scenarios only.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="productName">Product</Label>
          <Input
            id="productName"
            {...form.register("productName")}
            aria-invalid={Boolean(form.formState.errors.productName)}
          />
          {form.formState.errors.productName ? (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.productName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="therapeuticArea">Therapeutic area</Label>
          <Input
            id="therapeuticArea"
            {...form.register("therapeuticArea")}
            aria-invalid={Boolean(form.formState.errors.therapeuticArea)}
          />
          {form.formState.errors.therapeuticArea ? (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.therapeuticArea.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="requesterName">Requester name</Label>
          <Input
            id="requesterName"
            {...form.register("requesterName")}
            aria-invalid={Boolean(form.formState.errors.requesterName)}
          />
          {form.formState.errors.requesterName ? (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.requesterName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="requesterOrganization">Organization (optional)</Label>
          <Input
            id="requesterOrganization"
            {...form.register("requesterOrganization")}
          />
        </div>

        <div className="space-y-2">
          <Label>Requester type</Label>
          <Select
            value={requesterType}
            onValueChange={(value) => {
              if (value) {
                form.setValue(
                  "requesterType",
                  value as InquiryIntakeInput["requesterType"],
                  { shouldValidate: true },
                );
              }
            }}
          >
            <SelectTrigger className="w-full" aria-label="Requester type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hcp">Healthcare professional</SelectItem>
              <SelectItem value="patient">Patient (synthetic)</SelectItem>
              <SelectItem value="caregiver">Caregiver (synthetic)</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Channel</Label>
          <Select
            value={channel}
            onValueChange={(value) => {
              if (value) {
                form.setValue(
                  "channel",
                  value as InquiryIntakeInput["channel"],
                  { shouldValidate: true },
                );
              }
            }}
          >
            <SelectTrigger className="w-full" aria-label="Channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="portal">Portal</SelectItem>
              <SelectItem value="congress">Congress</SelectItem>
              <SelectItem value="msl_field">MSL field</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={priority}
            onValueChange={(value) => {
              if (value) {
                form.setValue(
                  "priority",
                  value as InquiryIntakeInput["priority"],
                  { shouldValidate: true },
                );
              }
            }}
          >
            <SelectTrigger className="w-full" aria-label="Priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formError ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {formError}
        </div>
      ) : null}
      {formSuccess ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          role="status"
        >
          {formSuccess}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save as draft"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={form.handleSubmit((values) => onSubmit(values, true))}
        >
          Save & submit
        </Button>
      </div>
    </form>
  );
}
