import { appRouter } from "@/server/api/root";
import { createServerSideHelpers } from "@trpc/react-query/server";
import SuperJSON from "superjson";

export const ssrHelper = createServerSideHelpers({
  router: appRouter,
  ctx: {},
  transformer: SuperJSON,
});
