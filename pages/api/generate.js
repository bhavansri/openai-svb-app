import { createClient } from "@supabase/supabase-js";
import { openai, configuration } from "./_utils";
import GPT3Tokenizer from "gpt3-tokenizer";

const supabase = createClient(
  "https://bxkvfloejmhlkhaqdtvn.supabase.co",
  process.env.SUPABASE_API_KEY
);

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message:
          "OpenAI API key not configured, please follow instructions in README.md",
      },
    });
    return;
  }

  const svbInput = (req.body.svbInput || "").trim();
  if (svbInput.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid phrase to translate.",
      },
    });
    return;
  }

  const embeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: svbInput.replaceAll("\n", " "),
  });

  if (embeddingResponse.status !== 200) {
    console.error("Error with embedding the prompt: ", svbInput);
  }

  const [{ embedding }] = embeddingResponse.data.data;

  const { data: documents } = await supabase.rpc("match_page_sections", {
    query_embedding: embedding,
    match_threshold: 0.78,
    match_count: 10,
  });

  console.log("documents: ", documents);

  const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
  let tokenCount = 0;
  let contextText = "";

  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    const content = document.body;
    const encoded = tokenizer.encode(content);
    tokenCount += encoded.text.length;

    if (tokenCount > 1500) {
      break;
    }

    contextText += `${content.trim()}\n---\n`;
  }

  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: generatePrompt(svbInput, contextText),
      temperature: 0.6,
      max_tokens: 2048,
    });
    res.status(200).json({ result: completion.data.choices[0].text });
  } catch (error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: "An error occurred during your request.",
        },
      });
    }
  }
}

function generatePrompt(svbInput, sections) {
  const promptText = `You are going to help answer questions about what happened
  in the SVB financial crisis, using information obtained from Wikipedia.

  Context sections: ${sections}

  Question: """
    ${svbInput}
  """  
  `;

  console.log(promptText);

  return promptText;
}
