import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
export const passwordSchema = z.string().min(12, "Use at least 12 characters.").max(128, "Use at most 128 characters.");
export const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(100),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });
export const resetPasswordSchema = z.object({ password: passwordSchema, confirmPassword: z.string() })
  .refine(data => data.password === data.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password.").max(128),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] })
  .refine(data => data.password !== data.currentPassword, { message: "Choose a different password.", path: ["password"] });
