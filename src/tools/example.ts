import type { ModelMessage } from "ai";
import { generateText, stepCountIs } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createServer } from "#/server/server.ts";
import { createTestAccount, createTestContext } from "#/server/testing.ts";
import type { WorldsOptions } from "#/sdk/types.ts";
import { World, Worlds } from "#/sdk/worlds.ts";
import { createTools, formatPrompt } from "./tools.ts";
import systemPrompt from "./prompt.md" with { type: "text" };

if (import.meta.main) {
  // Set up in-memory world.
  const appContext = await createTestContext();
  const server = await createServer(appContext);
  const worldsOptions: WorldsOptions = {
    baseUrl: "http://localhost/v1",
    apiKey: appContext.admin!.apiKey!,
    fetch: (url, init) => server.fetch(new Request(url, init)),
  };

  const worlds = new Worlds(worldsOptions);

  const testAccount = await createTestAccount(appContext.db);
  const worldRecord = await worlds.create({
    accountId: testAccount.id,
    name: "Test World",
    description: "Test World",
    isPublic: false,
  }, { accountId: testAccount.id });

  const world = new World({
    ...worldsOptions,
    worldId: worldRecord.id,
  });

  // Set up tools.
  const tools = createTools({
    world,
    userIri: "https://etok.me/",
  });

  // Set up AI.
  const messages: ModelMessage[] = [];
  const google = createGoogleGenerativeAI({
    apiKey: Deno.env.get("GOOGLE_API_KEY")!,
  });

  console.log("Welcome to the Worlds API example. Type 'exit' to quit.");

  // Run REPL.
  while (true) {
    const userInput = prompt("> ");
    if (!userInput) {
      continue;
    }

    if (userInput.toLowerCase() === "exit") {
      break;
    }

    messages.push({
      role: "user",
      content: [{
        type: "text",
        text: formatPrompt({
          content: userInput,
          userIri: "https://etok.me/",
          date: new Date(),
        }),
      }],
    });

    const result = await generateText({
      model: google("gemini-3-flash-preview"),
      tools,
      system: systemPrompt,
      stopWhen: stepCountIs(100),
      messages,
    });

    messages.push({
      role: "assistant",
      content: result.text,
    });

    console.log(`${result.text}`);

    for (const step of result.steps) {
      for (const call of step.toolCalls) {
        const toolResult = step.toolResults
          .find((r) => r.toolCallId === call.toolCallId);

        switch (call.toolName) {
          case "generateIri": {
            console.log(
              `generateIri(${call.input.entityText})${
                toolResult?.output.iri ? ` => ${toolResult?.output.iri}` : ""
              }`,
            );
            break;
          }

          case "executeSparql": {
            console.log(
              `executeSparql(${call.input.sparql})${
                toolResult?.output ? ` => ${toolResult?.output}` : ""
              }`,
            );
            break;
          }

          case "searchFacts": {
            console.log(
              `searchFacts(${call.input.query})${
                toolResult?.output ? ` => ${toolResult?.output}` : ""
              }`,
            );
            break;
          }
        }
      }
    }

    messages.push(
      { role: "assistant", content: result.content } as ModelMessage,
    );

    console.log("");
  }
}
