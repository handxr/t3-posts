import { type AppType } from "next/app";
import dynamic from "next/dynamic";

import { api } from "@/utils/api";

const ProgressBar = dynamic(() => import("@/components/ui/progress-bar"), {
  ssr: false,
});

import "@/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <ProgressBar />
      <Component {...pageProps} />
    </>
  );
};

export default api.withTRPC(MyApp);
