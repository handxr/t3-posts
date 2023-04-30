import { type AppType } from "next/app";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";

import { api } from "@/utils/api";

const ProgressBar = dynamic(() => import("@/components/ui/progress-bar"), {
  ssr: false,
});

import "@/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <ProgressBar />
      <Toaster />
      <Component {...pageProps} />
    </>
  );
};

export default api.withTRPC(MyApp);
