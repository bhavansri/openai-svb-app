import { createClient } from "@supabase/supabase-js";
import { openai } from "./_utils";

const axios = require("axios");
const cheerio = require("cheerio");
const supabase = createClient(
  "https://bxkvfloejmhlkhaqdtvn.supabase.co",
  process.env.SUPABASE_API_KEY
);

const url = "https://en.wikipedia.org/wiki/Collapse_of_Silicon_Valley_Bank";

export default async function (req, res) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    $("p").map(async (i, element) => {
      const body = $(element).text().trim();

      if (body.length === 0) {
        return;
      }

      const { data, error } = await supabase
        .from("sections")
        .select("*")
        .eq("body", body);

      if (error === null && data.length > 0) {
        const embeddings = data[0].embedding;
      } else {
        const embeddingResponse = await openai.createEmbedding({
          model: "text-embedding-ada-002",
          input: body,
        });

        const [responseData] = embeddingResponse.data.data;
        const { data, error } = await supabase.from("sections").insert({
          body,
          embedding: responseData.embedding,
        });
      }
    });

    res.status(200).json({ result });
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
}
