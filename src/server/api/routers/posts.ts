import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { LRUCache } from "lru-cache";

import { TRPCError } from "@trpc/server";

type PostResponse = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

type UserResponse = {
  id: number;
  name: string;
  username: string;
  email: string;
};

const cache = new LRUCache({
  max: 100,
  ttl: 10 * 1000,
});

const POSTS_CACHE_KEY = "posts";
const POSTS_API_URL = "https://jsonplaceholder.typicode.com/posts";

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    const cachedPosts = cache.get(POSTS_CACHE_KEY);

    if (cachedPosts) {
      return cachedPosts as PostResponse[];
    }

    try {
      const postsRes = await fetch(POSTS_API_URL);
      const posts = (await postsRes.json()) as PostResponse[];
      cache.set(POSTS_CACHE_KEY, posts);
      return posts;
    } catch (error) {
      console.error(error);
      throw new Error("Failed to fetch posts data");
    }
  }),
  getPostById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const cacheKey = input.id;
      const cachedPost = cache.get(cacheKey);

      if (cachedPost) {
        return cachedPost as PostResponse & {
          author: UserResponse;
        };
      }

      try {
        const postRes = await fetch(`${POSTS_API_URL}/${input.id}`);
        const post = (await postRes.json()) as PostResponse;

        const authorRes = await fetch(
          `https://jsonplaceholder.typicode.com/users/${post.userId}`
        );
        const { id, name, username, email } =
          (await authorRes.json()) as UserResponse;

        const postWithAuthor = {
          ...post,
          author: {
            id,
            name,
            username,
            email,
          },
        };
        cache.set(cacheKey, postWithAuthor);

        return postWithAuthor;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }
    }),
});
