
import z from "zod";

const gmailConnectValidation = z.object({
  body: z.object({
    code: z.string({ required_error: "Authorization code is required" }),
  }),
});

export const GmailValidation = {
  gmailConnectValidation,
};