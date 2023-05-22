import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [svbInput, setSvbInput] = useState("");
  const [result, setResult] = useState();

  const getWikiData = async () => {
    const response = await fetch("/api/scrapeWiki", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    console.log(data.result);
  };

  useEffect(() => {
    getWikiData();
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ svbInput }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw (
          data.error ||
          new Error(`Request failed with status ${response.status}`)
        );
      }

      setResult(data.result);
      setSvbInput("");
    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }

  return (
    <div>
      <Head>
        <title>OpenAI Quickstart</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <img src="/dog.png" className={styles.icon} />
        <h3>Your SVB learner!</h3>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="svbInput"
            placeholder="Ask a question about the SVB crisis"
            value={svbInput}
            onChange={(e) => setSvbInput(e.target.value)}
          />
          <input type="submit" value="Generate answer" />
        </form>
        <div className={styles.result}>{result}</div>
      </main>
    </div>
  );
}
