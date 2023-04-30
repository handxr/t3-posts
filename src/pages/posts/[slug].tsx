import { api } from "@/utils/api";
import { ssrHelper } from "@/utils/ss-helpers";
import {
  type InferGetServerSidePropsType,
  type GetServerSidePropsContext,
} from "next";

const PostPage = (
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) => {
  const { data, isError, error } = api.posts.getPostById.useQuery({
    id: props.id,
  });

  if (isError)
    return <div>{error.message || "Something unexpected ocurred"}</div>;

  if (!data?.id) return <div>Post not found</div>;

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.author.name}</p>
      {data.comments.length > 0 ? (
        <div>
          <h2>Comments</h2>
          <ul>
            {data.comments.map((comment) => (
              <li key={comment.id}>{comment.body}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No comments</p>
      )}
    </div>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext<{ slug: string }>
) => {
  const id = context.params?.slug as string;

  await ssrHelper.posts.getPostById.prefetch({ id });

  return {
    props: {
      trpcState: ssrHelper.dehydrate(),
      id,
    },
  };
};

export default PostPage;
