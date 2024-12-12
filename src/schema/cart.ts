import { z } from "zod";

export const CreatCartSchema = z.object({
  productId: z.number(),
  quantity: z.number(),
});

export const ChangeOuantitySchema = z.object({
  quantity: z.number(),
});
