import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

import { TRPCError } from "@trpc/server";
import {
  COMMENTS_API_URL,
  POSTS_API_URL,
  USERS_API_URL,
} from "../utils/constants";
import { cache } from "../lib/lru";

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

type CommentResponse = {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
};

type PostWithAuthor = PostResponse & {
  author: UserResponse;
};

type PostWithComments = PostWithAuthor & {
  comments: CommentResponse[];
};

export const POSTS_CACHE_KEY = "posts";

const addAuthorDataToPost = async (
  post: PostResponse
): Promise<PostWithAuthor> => {
  const users = await fetch(USERS_API_URL);
  const usersData = (await users.json()) as UserResponse[];

  const author = usersData.find((user) => user.id === post.userId);

  if (!author) {
    throw new Error("Author not found");
  }

  return Promise.resolve({
    ...post,
    author,
  });
};

const addCommentsToPost = async (
  post: PostWithAuthor
): Promise<PostWithComments> => {
  const comments = await fetch(COMMENTS_API_URL);
  const commentsData = (await comments.json()) as CommentResponse[];

  const postComments = commentsData.filter(
    (comment) => comment.postId === post.id
  );

  return Promise.resolve({
    ...post,
    comments: postComments,
  });
};

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => {
    const cachedPosts = cache.get(POSTS_CACHE_KEY);

    if (cachedPosts) {
      console.log("using cached posts");
      return cachedPosts as PostWithAuthor[];
    }

    try {
      const postsRes = await fetch(POSTS_API_URL);
      const posts = (await postsRes.json()) as PostResponse[];
      const postsWithAuthor = await Promise.all(posts.map(addAuthorDataToPost));
      console.log("setting cache");
      cache.set(POSTS_CACHE_KEY, postsWithAuthor);
      return postsWithAuthor;
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
        console.log("using cached post");
        return cachedPost as PostWithComments;
      }

      try {
        const postRes = await fetch(`${POSTS_API_URL}/${input.id}`);
        const post = (await postRes.json()) as PostResponse;

        const postWithAuthor = await addAuthorDataToPost(post).then(
          addCommentsToPost
        );
        console.log("setting cache");
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
