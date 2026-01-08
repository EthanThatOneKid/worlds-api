# Abstract: Worlds API™

> **The "Hippocampus" for Artificial Intelligence.**

**Worlds API** is a drop-in infrastructure layer that gives AI Agents long-term,
structured memory. It solves the "limited context window" problem by allowing
agents to offload vast amounts of knowledge into a queryable "World" and
retrieve only what is relevant for the current task.

## The Problem

LLMs are powerful reasoning engines but have poor long-term memory.

- **RAG (Vector DBs)** is good for fuzzy matching but fails at structured
  reasoning (e.g., "How is X related to Y?").
- **Context Windows** are expensive and ephemeral.

## The Solution

We provide a **Neuro-symbolic** memory store that combines:

1. **Graph Database (RDF/SPARQL):** For precise, structured facts and
   relationships.
2. **Vector Database:** For semantic understanding and fuzzy search.

## Key Features

- **Bring Your Own Brain (BYOB):** Works with any model (OpenAI, Anthropic,
  Llama).
- **Edge-Native:** Built on Deno and SQLite for millisecond latency.
- **Malleable:** Agents can `remember`, `recall`, and `forget` facts in
  real-time.
- **Structured:** Uses W3C standards (RDF) to ensure data portability.

## Core Hierarchy

- **User:** The human developer.
- **Agent:** The AI interacting with the world.
- **World:** A self-contained database (Knowledge Graph) serving as the agent's
  memory.
