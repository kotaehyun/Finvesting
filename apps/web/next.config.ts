import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["@finvesting/api", "@finvesting/core", "@finvesting/db", "@finvesting/ai"],
};
export default config;
