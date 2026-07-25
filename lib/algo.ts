// Deterministic, no-AI-required engine. Used whenever a live model call is
// unavailable or fails, so the product still behaves like a real interactive
// resume/screening tool instead of falling back to static placeholder text.

const SKILL_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  "c++": "C++",
  "c#": "C#",
  golang: "Go",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  scala: "Scala",
  sql: "SQL",
  react: "React",
  "next.js": "Next.js",
  nextjs: "Next.js",
  vue: "Vue.js",
  angular: "Angular",
  svelte: "Svelte",
  html: "HTML",
  css: "CSS",
  tailwind: "Tailwind CSS",
  redux: "Redux",
  graphql: "GraphQL",
  "node.js": "Node.js",
  nodejs: "Node.js",
  express: "Express",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  spring: "Spring",
  rails: "Ruby on Rails",
  laravel: "Laravel",
  ".net": ".NET",
  nestjs: "NestJS",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  mysql: "MySQL",
  mongodb: "MongoDB",
  redis: "Redis",
  docker: "Docker",
  kubernetes: "Kubernetes",
  aws: "AWS",
  gcp: "Google Cloud",
  azure: "Azure",
  terraform: "Terraform",
  "ci/cd": "CI/CD",
  git: "Git",
  "github actions": "GitHub Actions",
  github: "GitHub",
  "machine learning": "Machine Learning",
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",
  llm: "LLMs",
  openai: "OpenAI API",
  nlp: "NLP",
  pandas: "Pandas",
  numpy: "NumPy",
  "rest api": "REST APIs",
  microservices: "Microservices",
  stripe: "Stripe API",
  firebase: "Firebase",
  supabase: "Supabase",
  websocket: "WebSockets",
  websockets: "WebSockets",
  jest: "Jest",
  cypress: "Cypress",

  // languages
  elixir: "Elixir",
  "dart language": "Dart",
  "flutter/dart": "Dart",
  solidity: "Solidity",
  haskell: "Haskell",
  clojure: "Clojure",
  perl: "Perl",
  lua: "Lua",
  "objective-c": "Objective-C",
  bash: "Bash",
  powershell: "PowerShell",

  // frontend
  "react native": "React Native",
  flutter: "Flutter",
  jquery: "jQuery",
  bootstrap: "Bootstrap",
  "material ui": "Material UI",
  mui: "Material UI",
  shadcn: "shadcn/ui",
  "framer motion": "Framer Motion",
  "three.js": "Three.js",
  threejs: "Three.js",
  astro: "Astro",
  "remix.run": "Remix",
  "remix framework": "Remix",
  gatsby: "Gatsby",
  vite: "Vite",
  webpack: "Webpack",
  sass: "Sass",
  scss: "Sass",
  "styled-components": "styled-components",
  zustand: "Zustand",
  "react query": "React Query",
  "tanstack query": "TanStack Query",

  // backend / api
  fastify: "Fastify",
  koa: "Koa",
  "phoenix framework": "Phoenix",
  "asp.net": "ASP.NET",
  symfony: "Symfony",
  grpc: "gRPC",
  trpc: "tRPC",
  prisma: "Prisma",
  drizzle: "Drizzle ORM",
  sqlalchemy: "SQLAlchemy",
  hibernate: "Hibernate",
  "spring boot": "Spring Boot",

  // databases
  sqlite: "SQLite",
  mariadb: "MariaDB",
  dynamodb: "DynamoDB",
  cassandra: "Cassandra",
  elasticsearch: "Elasticsearch",
  neo4j: "Neo4j",
  cockroachdb: "CockroachDB",
  snowflake: "Snowflake",
  bigquery: "BigQuery",

  // devops / cloud
  vercel: "Vercel",
  netlify: "Netlify",
  heroku: "Heroku",
  digitalocean: "DigitalOcean",
  cloudflare: "Cloudflare",
  nginx: "Nginx",
  ansible: "Ansible",
  jenkins: "Jenkins",
  "gitlab ci": "GitLab CI",
  circleci: "CircleCI",
  prometheus: "Prometheus",
  grafana: "Grafana",
  datadog: "Datadog",
  kafka: "Apache Kafka",
  "apache spark": "Apache Spark",
  pyspark: "PySpark",
  rabbitmq: "RabbitMQ",
  // ai / ml
  "hugging face": "Hugging Face",
  huggingface: "Hugging Face",
  langchain: "LangChain",
  "scikit-learn": "scikit-learn",
  sklearn: "scikit-learn",
  keras: "Keras",
  opencv: "OpenCV",
  anthropic: "Anthropic API",
  claude: "Claude API",
  pinecone: "Pinecone",
  "computer vision": "Computer Vision",
  "deep learning": "Deep Learning",
  "retrieval-augmented": "RAG",
  "retrieval augmented": "RAG",
  "rag pipeline": "RAG",
  "rag pipelines": "RAG",
  "rag system": "RAG",

  // testing
  playwright: "Playwright",
  vitest: "Vitest",
  mocha: "Mocha",
  selenium: "Selenium",
  pytest: "Pytest",
  junit: "JUnit",

  // mobile
  android: "Android",
  ios: "iOS",
  xcode: "Xcode",
  swiftui: "SwiftUI",

  // data
  hadoop: "Hadoop",
  airflow: "Airflow",
  dbt: "dbt",
  tableau: "Tableau",
  "power bi": "Power BI",

  // tools / other
  figma: "Figma",
  jira: "Jira",
  postman: "Postman",
  storybook: "Storybook",
  webrtc: "WebRTC",
  oauth: "OAuth",
  jwt: "JWT",
  twilio: "Twilio",
  sendgrid: "SendGrid",
  sentry: "Sentry",
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractSkills(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  for (const key of Object.keys(SKILL_LABELS)) {
    const re = new RegExp(`(?<![a-z0-9])${escapeRegex(key)}(?![a-z0-9])`, "i");
    if (re.test(text)) found.add(SKILL_LABELS[key]);
  }
  return [...found];
}

function looksDeployed(links: string[]): boolean {
  return links.some((l) => /^https?:\/\//i.test(l) || /\.(io|com|dev|app|co|net|org)(\/|$)/i.test(l));
}

// "A", "A and B", "A, B, and C"
function listPhrase(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function buildSummary(input: {
  title: string;
  projects: { title: string; links?: string[] }[];
  skills: string[];
}): string {
  const { title, projects, skills } = input;
  const sentences: string[] = [];

  // Sentence 1 — role + core skills, phrased naturally.
  const top = skills.slice(0, 3);
  if (top.length >= 2) {
    sentences.push(`${title} working across ${listPhrase(top)}.`);
  } else if (top.length === 1) {
    sentences.push(`${title} with hands-on ${top[0]} experience.`);
  } else {
    sentences.push(`${title}.`);
  }

  // Sentence 2 — projects, with a deployment signal when present.
  const named = projects.map((p) => p.title).filter(Boolean);
  const anyDeployed = projects.some((p) => looksDeployed(p.links || []));
  if (named.length === 1) {
    sentences.push(`Built ${named[0]}${anyDeployed ? ", a deployed project" : ""}.`);
  } else if (named.length >= 2) {
    const lead = named.slice(0, 2);
    const more = named.length - lead.length;
    sentences.push(
      `Built ${listPhrase(lead)}${more > 0 ? `, plus ${more} more` : ""}${
        anyDeployed ? " — including deployed work" : ""
      }.`
    );
  }

  return sentences.join(" ");
}

export function buildProjectExplanation(project: { title: string; description: string; links: string[] }): string {
  const deployed = looksDeployed(project.links);
  const base = project.description?.trim() || `${project.title} — no description provided yet.`;
  return deployed ? `${base} This project is live and linked above.` : base;
}

export function buildProjectImpact(project: { links: string[] }): string {
  return looksDeployed(project.links) ? "Live/deployed — see links above." : "Deployment status not specified.";
}

export function computeStrengths(input: {
  skills: string[];
  clarifyingQA: { question: string; answer: string }[];
}): string[] {
  const strengths: string[] = [];
  if (input.skills.length) {
    strengths.push(`Demonstrated skills: ${input.skills.slice(0, 5).join(", ")}.`);
  }
  const withNumbers = input.clarifyingQA.filter((qa) => /\d/.test(qa.answer)).map((qa) => qa.answer);
  strengths.push(...withNumbers.slice(0, 3));
  return strengths.slice(0, 5);
}

export function computeGrowthAreas(input: {
  skills: string[];
  projects: { links: string[] }[];
  rawResume: string;
  clarifyingQA: { question: string; answer: string }[];
}): string[] {
  const areas: string[] = [];
  const hasDeployed = input.projects.some((p) => looksDeployed(p.links));
  if (input.projects.length && !hasDeployed) {
    areas.push("No deployed or live-linked project yet — add one to strengthen credibility.");
  }
  if (input.skills.length < 3) {
    areas.push("Limited technical breadth documented — list more specific technologies used.");
  }
  const allText = input.rawResume + " " + input.clarifyingQA.map((qa) => qa.answer).join(" ");
  if (!/\d/.test(allText)) {
    areas.push("Add measurable outcomes (users, revenue, performance) to quantify impact.");
  }
  return areas;
}

export type AlgoScore = {
  value: number;
  label: "High Match" | "Needs Review" | "Low Match";
  reasons: string[];
};

export function scoreCandidateAlgorithmic(requirement: string, candidateSkills: string[]): AlgoScore {
  const reqSkills = extractSkills(requirement);

  if (!requirement?.trim() || reqSkills.length === 0) {
    return {
      value: 50,
      label: "Needs Review",
      reasons: ["No specific skill requirement set — set one and rescore to rank by fit."],
    };
  }

  const matched = reqSkills.filter((s) => candidateSkills.includes(s));
  const missing = reqSkills.filter((s) => !candidateSkills.includes(s));
  const pct = Math.round((matched.length / reqSkills.length) * 100);
  const label: AlgoScore["label"] = pct >= 70 ? "High Match" : pct >= 40 ? "Needs Review" : "Low Match";

  const reasons: string[] = [];
  if (matched.length) reasons.push(`Matches on ${matched.join(", ")}.`);
  if (missing.length) reasons.push(`No evidence found of ${missing.join(", ")}.`);

  return { value: pct, label, reasons };
}

type ProfileLike = {
  name: string;
  skills: string[];
  projects: { title: string; description: string; links: string[]; impact: string }[];
};

export function answerFromProfile(question: string, profile: ProfileLike): string {
  const q = question.toLowerCase();
  const firstName = profile.name?.split(" ")[0] || "This candidate";

  const projectMatch = profile.projects.find((p) => q.includes(p.title.toLowerCase()));
  if (projectMatch) {
    return `${projectMatch.title}: ${projectMatch.description}${
      projectMatch.impact ? ` ${projectMatch.impact}` : ""
    }`;
  }

  if (q.includes("deploy") || q.includes("live") || q.includes("production")) {
    const deployed = profile.projects.filter((p) => looksDeployed(p.links));
    return deployed.length
      ? `Deployed/live projects: ${deployed.map((p) => p.title).join(", ")}.`
      : "No projects are explicitly marked as deployed or live in this profile.";
  }

  const skillMatch = profile.skills.find((s) => q.includes(s.toLowerCase()));
  if (skillMatch) {
    return `Yes — ${firstName} has documented experience with ${skillMatch}.`;
  }

  if (q.includes("skill") || q.includes("technolog") || q.includes("stack")) {
    return profile.skills.length
      ? `Documented skills: ${profile.skills.join(", ")}.`
      : "No specific skills have been extracted from this profile yet.";
  }

  return `Nothing in the profile directly answers that. Documented skills: ${
    profile.skills.slice(0, 6).join(", ") || "none listed"
  }. Projects: ${profile.projects.map((p) => p.title).join(", ") || "none listed"}.`;
}
