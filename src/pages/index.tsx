import React from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { translate } from "@docusaurus/Translate";
import HomepageLanding from "../components/home/HomepageLanding";

export default function App() {
  const { siteConfig } = useDocusaurusContext();

  const metaDescription = translate({
    id: "homepage.metaDescription",
    message: siteConfig.tagline,
    description: "The meta description of the homepage",
  });

  return (
    <Layout title={`${siteConfig.title}`} description={metaDescription}>
      <HomepageLanding />
    </Layout>
  );
}
