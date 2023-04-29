import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { LRUCache } from "lru-cache";

type PostResponse = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

const cache = new LRUCache({
  max: 100,
  ttl: 10 * 1000,
});

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    if (cache.has("posts")) {
      return cache.get("posts") as PostResponse[];
    }

    const posts = (await fetch(
      "https://jsonplaceholder.typicode.com/posts"
    ).then((res) => res.json())) as Promise<PostResponse[]>;
    cache.set("posts", posts);
    return posts;
  }),

  getPostById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      if (cache.has(input.id)) {
        return cache.get(input.id) as PostResponse;
      }
      const post = (await fetch(
        `https://jsonplaceholder.typicode.com/posts/${input.id}`
      ).then((res) => res.json())) as Promise<PostResponse>;

      cache.set(input.id, post);
      return post;
    }),
});
