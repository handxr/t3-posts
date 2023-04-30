import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { cache } from "../lib/lru";
import { COMMENTS_API_URL } from "../utils/constants";

export const commentsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        body: z.string().min(1).max(1000),
        postId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const comment = await fetch(COMMENTS_API_URL, {
        method: "POST",
        body: JSON.stringify({
          body: input.body,
        }),
      });

      cache.delete(input.postId);
      console.log("deleted from cache");

      return comment.json();
    }),
});
