import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { readFile } from "fs/promises";

import React from "react";

if (typeof window !== "undefined") {
  globalThis.Run = await import("../lib/run");
  await import("../lib/api");
}

export async function getStaticProps(ctx) {
  return {
    props: {
      // not tested
      code: readFile(
        "/Users/jarred/Build/es-module-lexer/test/samples/magic-string.js",
        { encoding: "utf-8" },
      ),
    },
  };
}

var textDecoder = new TextDecoder();
export default function Home({ code }) {
  const fileNameRef = React.useRef<HTMLInputElement>(null);
  const [esbuildResult, setEsbuildResult] = React.useState("");
  const [bunResult, setBunResult] = React.useState("");
  const [swcResult, setSWCResult] = React.useState("");
  React.useEffect(() => {
    globalThis.Run.start();
  }, []);

  const runBuild = React.useCallback(
    (event) => {
      globalThis.Run.transform(
        event.target.value,
        fileNameRef?.current?.value,
      ).then((result) => {
        setEsbuildResult(result.esbuild.code);
        setBunResult(textDecoder.decode(result.bun.files[0].data));
        setSWCResult(result.swc.code);
      }, console.error);
    },
    [fileNameRef, setEsbuildResult, setBunResult, setSWCResult],
  );
  return (
    <div className={styles.container}>
      <Head>
        <title>Next.js</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div>
          <input
            autoComplete="filename"
            type="text"
            placeholder="filename"
            defaultValue="input.tsx"
            ref={fileNameRef}
          />
          <textarea onChange={runBuild} defaultValue={code}></textarea>

          <textarea readOnly value={esbuildResult}></textarea>
          <textarea readOnly value={bunResult}></textarea>
          <textarea readOnly value={swcResult}></textarea>
        </div>
      </main>
    </div>
  );
}
