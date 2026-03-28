import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import OpenAI from "openai";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  tool_call_id: z.string().optional(),
  name: z.string().optional(),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema),
  tools: z
    .array(
      z.object({
        type: z.literal("function"),
        function: z.object({
          name: z.string(),
          description: z.string(),
          parameters: z.record(z.string(), z.any()),
        }),
      })
    )
    .optional(),
});

export const openaiChatProcedure = publicProcedure
  .input(ChatRequestSchema)
  .mutation(async ({ input }) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: input.messages as any,
      tools: input.tools as any,
      temperature: 0.7,
    });

    return {
      message: completion.choices[0].message,
      usage: completion.usage,
    };
  });
