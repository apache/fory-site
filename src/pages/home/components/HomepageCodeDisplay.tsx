import React, { useEffect, useState, useRef } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "framer-motion";
import {
  CODE_EXAMPLES,
  COPY_FAIL_MSG,
  COPY_SUCCESS_MSG,
  COPY_TIMEOUT,
} from "../../../constants";

const AUTO_SLIDE_INTERVAL = 6000;

export default function HomepageCodeDisplay() {
  const [selectedLang, setSelectedLang] = useState("java");
  const [copyMessage, setCopyMessage] = useState("");
  const programmingImageUrl = useBaseUrl("/home/programming.svg");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const langs = Object.keys(CODE_EXAMPLES);

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  const startAutoSlide = () => {
    stopAutoSlide();
    timeoutRef.current = setInterval(() => {
      setSelectedLang((prev) => {
        const currentIndex = langs.indexOf(prev);
        return langs[(currentIndex + 1) % langs.length];
      });
    }, AUTO_SLIDE_INTERVAL);
  };

  const stopAutoSlide = () => {
    if (timeoutRef.current) clearInterval(timeoutRef.current);
  };

  const handleLangChange = (lang: string) => {
    setSelectedLang(lang);
    startAutoSlide();
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(CODE_EXAMPLES[selectedLang].code)
      .then(() => {
        setCopyMessage(COPY_SUCCESS_MSG || "Copied!");
        setTimeout(() => setCopyMessage(""), COPY_TIMEOUT);
      })
      .catch(() => {
        setCopyMessage(COPY_FAIL_MSG || "Copy failed");
      });
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center md:m-32 m-6 space-y-6 md:space-y-0 md:space-x-8">
      {/* Pic */}
      <div className="hidden md:flex w-full md:w-1/2 justify-center">
        <img
          src={programmingImageUrl}
          alt="programming-coding"
          className="w-full max-w-md h-auto"
        />
      </div>
      {/* Code Box */}
      <div
        className="relative text-sm overflow-hidden bg-[#1e1e2f]rounded-lg"
        style={{
          width: "100%",
          maxWidth: "600px",
          height: "666px",
        }}
      >
        {/* Top Bar */}
        <div className="flex items-center px-3 py-2 bg-[#1e1e2f]">
          <div className="space-x-3 overflow-auto">
            {langs.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLangChange(lang)}
                className={`px-3 py-1 rounded-full text-sm font-medium border border-gray-500 duration-200 ${selectedLang === lang
                  ? "bg-blue-600 text-white"
                  : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  }`}
              >
                {CODE_EXAMPLES[lang].label}
              </button>
            ))}
          </div>
        </div>


        {/* Code Area with animation and scroll */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedLang}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="relative w-full h-full"
          >
            <button
              onClick={copyToClipboard}
              className="absolute top-5 right-5 z-10 text-xs px-2 py-1 rounded border border-gray-500 text-white hover:bg-white/10 transition"
            >
              {copyMessage || "Copy"}
            </button>
            <div className="w-full h-full overflow-auto px-4 py-2">
              <SyntaxHighlighter
                language={selectedLang}
                style={dracula}
                wrapLongLines={true}
                codeTagProps={{ className: "text-sm bg-transparent" }}
              >
                {CODE_EXAMPLES[selectedLang].code}
              </SyntaxHighlighter>
            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </div>

  );
}
