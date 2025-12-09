# Worlds API™

[![JSR](https://jsr.io/badges/@fartlabs/worlds)](https://jsr.io/@fartlabs/worlds)
[![JSR score](https://jsr.io/badges/@fartlabs/worlds/score)](https://jsr.io/@fartlabs/worlds/score)
[![GitHub Actions](https://github.com/EthanThatOneKid/worlds-api/actions/workflows/check.yaml/badge.svg)](https://github.com/EthanThatOneKid/worlds-api/actions/workflows/check.yaml)

Worlds API™ is a REST API that can be used to manage, query, update, and reason
over [SPARQL 1.1](https://www.w3.org/TR/sparql11-overview/)-compatible stores at
the edge, placing knowledge within arm's reach of your AI agent.

## BYOB

Bring your own **brain**. Worlds API™ is agnostic to the agent using it.

## Design

Worlds API™ is designed to be simple and easy to use. You can embed it in your
agent applications, or run it locally or on the cloud.

We aren't just handing off our work to agents, we're coming up with entirely new
ways to work by grounding our agents in malleable knowledge.

## Etymology

We named the Worlds API™ after the management of multiple, coexisting **Worlds**
and their components.

- **Triple** is the atomic unit of knowledge (also known as triplet or quad).
- **Graph** is a collection of triples. Each graph or graph network is a
  knowledge base.
- **Knowledge Base** is a form of digital twin, a reified perspective or mirror
  of the world.
- **World** is a source of truth for a knowledge base.

## Glossary

Study more terminology.

- **API** is an Application Programming Interface used by developers to leverage
  the underlying functionality of a program or service.
- **Neuro-symbolic AI** is an AI system that combines the strengths of neural
  networks and structured data.
- **RDF**[^1] is a World Wide Web Consortium (W3C) standard for representing
  information in a machine-readable way.
- **SPARQL**[^2] is a World Wide Web Consortium (W3C) standard for querying and
  updating RDF data.
- **Semantic Web**[^3] is a global initiative to make the web more
  machine-readable, sometimes referred to as **Web 3.0**.
- **World Wide Web Consortium (W3C)**[^4] is an international organization that
  develops Web standards such as HTML, CSS, and JavaScript.
- **Ontology** is a formal description of a domain of knowledge, interchangeably
  referred to as a **Vocabulary**.

## Develop

Contributions are welcome! Please open an issue or submit a pull request.

Once you have cloned the repository, you can start the development server.

```sh
deno task start
```

Please run this command to format, lint, and test the code before submitting a
pull request.

```sh
deno task precommit
```

## Benchmarks

Here are benchmark results testing the speed of encoding/decoding Oxigraph
stores in different formats:

```
> deno task bench
Task bench deno bench -A
Check file:///C:/Users/ethan/Documents/GitHub/worlds-api/src/oxigraph/oxigraph-service.bench.ts
    CPU | 12th Gen Intel(R) Core(TM) i7-1280P
Runtime | Deno 2.5.6 (x86_64-pc-windows-msvc)

file:///C:/Users/ethan/Documents/GitHub/worlds-api/src/oxigraph/oxigraph-service.bench.ts

| benchmark            | time/iter (avg) |        iter/s |      (min … max)      |      p75 |      p99 |     p995 |
| -------------------- | --------------- | ------------- | --------------------- | -------- | -------- | -------- |
| decodeStore jsonld   |         23.1 µs |        43,340 | (  8.7 µs …   5.0 ms) |  15.3 µs | 210.8 µs | 484.8 µs |
| encodeStore jsonld   |          4.6 µs |       219,400 | (  4.3 µs …   5.7 µs) |   4.5 µs |   5.7 µs |   5.7 µs |
| decodeStore nq       |         19.5 µs |        51,280 | (  6.3 µs …   4.0 ms) |   9.7 µs | 345.3 µs | 827.9 µs |
| encodeStore nq       |          2.9 µs |       345,100 | (  2.7 µs …   3.7 µs) |   2.9 µs |   3.7 µs |   3.7 µs |
| decodeStore trig     |         17.0 µs |        58,980 | (  6.7 µs …   4.8 ms) |   9.0 µs | 316.1 µs | 760.7 µs |
| encodeStore trig     |          3.1 µs |       318,700 | (  3.0 µs …   3.8 µs) |   3.2 µs |   3.8 µs |   3.8 µs |
```

## Papers

This work is inspired by some of the following research papers:

- [Thinking with Knowledge Graphs: Enhancing LLM Reasoning Through Structured Data](https://arxiv.org/abs/2412.10654)
- [A Benchmark to Understand the Role of Knowledge Graphs on Large Language Model's Accuracy for Question Answering on Enterprise SQL Databases](https://arxiv.org/abs/2311.07509)
- [Jelly: a Fast and Convenient RDF Serialization Format](https://arxiv.org/abs/2506.11298)
- [An AI System to Help Scientists Write Expert-Level Empirical Software](https://arxiv.org/abs/2509.06503)
- [NeSy is Alive and Well: A LLM-Driven Symbolic Approach for Better Code Comment Data Generation and Classification](https://arxiv.org/abs/2402.16910)
- [Inverse Knowledge Search over Verifiable Reasoning: Synthesizing a Scientific Encyclopedia from a Long Chains-of-Thought Knowledge Base](https://arxiv.org/abs/2510.26854)
- [What You See Is What It Does: A Structural Pattern for Legible Software](https://arxiv.org/abs/2508.14511)
- [Graph-Constrained Reasoning: Faithful Reasoning on Knowledge Graphs with Large Language Models](https://arxiv.org/abs/2410.13080)

---

Developed with 🧪 [**@FartLabs**](https://github.com/FartLabs)

[^1]: https://www.w3.org/TR/rdf11-concepts/

[^2]: https://www.w3.org/TR/sparql11-overview/

[^3]: https://en.wikipedia.org/wiki/Semantic_Web

[^4]: https://www.w3.org/
