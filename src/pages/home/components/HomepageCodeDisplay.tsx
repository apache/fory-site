import React, { useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  CODE_EXAMPLES,
  COPY_FAIL_MSG,
  COPY_SUCCESS_MSG,
  COPY_TIMEOUT,
} from "../../../constants";


export default function HomepageCodeDisplay() {
  const [selectedLang, setSelectedLang] = useState("java");
  const [copyMessage, setCopyMessage] = useState("");
  const programmingImageUrl = useBaseUrl("/home/programming.svg");

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(CODE_EXAMPLES[selectedLang].code)
      .then(() => {
        setCopyMessage("Copied!");
        setTimeout(() => setCopyMessage(""), COPY_TIMEOUT);
      })
      .catch(() => {
        setCopyMessage("Copy failed");
      });
  };

  return (
    <div className="flex flex-col md:flex-row md:m-32 m-6 items-center justify-center">
      {/* Left image */}
      <div className="md:w-1/2 hidden md:block">
        <img
          src={programmingImageUrl}
          alt="programming-coding"
          className="w-full h-auto max-w-md"
        />
      </div>

      {/* Code box */}
      <div className="md:w-1/2 w-full rounded-lg shadow-lg p-4 relative transition-all duration-300 min-h-[480px] max-h-[580px] bg-[#1e1e2f] border border-gray-700">
        {/* Top Bar */}
        <div className="flex justify-between items-center">
          <div className="space-x-2">
            {Object.keys(CODE_EXAMPLES).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedLang === lang
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {CODE_EXAMPLES[lang].label}
              </button>
            ))}
          </div>
          <button
            onClick={copyToClipboard}
            className="text-xs px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-500"
          >
            {copyMessage || "Copy"}
          </button>
        </div>

        {/* Code Block */}
        <div className="transition-opacity duration-300 ease-in-out text-sm leading-relaxed rounded-lg overflow-auto bg-[#1e1e2f] text-[#f8f8f2] min-h-[400px] max-h-[500px]">
          <SyntaxHighlighter
            language={selectedLang}
            style={dracula}
            wrapLongLines={true}
            codeTagProps={{ className: "text-sm" }}
          >
            {CODE_EXAMPLES[selectedLang].code}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
