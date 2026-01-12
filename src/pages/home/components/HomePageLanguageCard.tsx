import React, { useEffect, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import "../css/tailwind.css";
import { imageUrls } from "../../../constants";
import styles from "../css/HomePageLanguageCard.module.css";

export default function HomePageLanguageCard() {
  const [locale, setLocale] = useState("en-US");
  const [processedImageUrls, setProcessedImageUrls] = useState([]);

  //用useBaseUrl处理一遍图像，防止本地资源不部署
  const processedImages = imageUrls.map((item) => ({
    ...item,
    src: useBaseUrl(item.src),
  }));

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setLocale(navigator.language || "en-US");
    }
    setProcessedImageUrls(processedImages);
  }, []);

  const getLanguageUrl = (language) => {
    const baseUrl = locale.startsWith("zh-CN")
      ? "https://fory.apache.org/zh-CN/docs/start/usage/#"
      : "https://fory.apache.org/docs/start/usage/#";
    return `${baseUrl}${language}`;
  };

  return (
    <div className="text-center p-8">
      <h2 className="text-3xl font-bold mb-4 dark:text-white">Quick Start!</h2>
      <p className="text-lg mb-8 text-gray-600 dark:text-gray-400">
        Choose a language to get started.
      </p>
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-6">
          {processedImageUrls.map(({ key, src, label }) => (
            <div
              key={key}
              className={styles.languageCard}
              onClick={() =>
                (window.location.href = getLanguageUrl(
                  key === "java"
                    ? "java-serialization"
                    : key === "more"
                    ? "cross-language-serialization"
                    : key
                ))
              }
            >
              <img
                src={src}
                className="w-16 h-16 mb-4"
                alt={`${label} logo`}
              />
              <span className="text-xl font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
