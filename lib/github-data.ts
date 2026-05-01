import { execFileSync } from "node:child_process";
import path from "node:path";

const WORKSPACE_ROOT = process.env.OPENCLAW_WORKSPACE || "/home/rk/.openclaw/workspace/main_workspace";

export type AgentRepo = {
  id: string;
  name: string;
  description: string;
  githubRepo: string;
  localPath?: string;
  lastCommit?: string;
  branch?: string;
  status: "cloned" | "not-cloned" | "unknown";
  openIssues: number;
};

export type GitHubPr = {
  number: number;
  title: string;
  branch: string;
  author: string;
  state: "open" | "closed" | "merged";
  createdAt: string;
  url: string;
};

export type GitHubBranch = {
  name: string;
  lastCommit: string;
  author: string;
  updatedAt: string;
};

export type GitHubActivity = {
  repo: string;
  openPrs: GitHubPr[];
  recentBranches: GitHubBranch[];
  recentCommits: {
    hash: string;
    message: string;
    author: string;
    date: string;
  }[];
};

const AGENT_REPOS: AgentRepo[] = [
  {
    id: "scoutorder",
    name: "scoutorder-agent",
    description: "Morning AI news scanner. Reddit, HackerNews, GitHub watchlists. Daily digest to Discord.",
    githubRepo: "robinkohdev-star/scoutorder-agent",
    localPath: "~/workspace/scoutorder-agent",
    openIssues: 0,
    status: "not-cloned",
  },
  {
    id: "geoorder",
    name: "geoorder-agent",
    description: "Geopolitics and Singapore-context scanner. Tracks hard/soft news, microeconomics.",
    githubRepo: "robinkohdev-star/geoorder-agent",
    localPath: "~/workspace/geoorder-agent",
    openIssues: 0,
    status: "not-cloned",
  },
  {
    id: "buildorder",
    name: "buildorder-agent",
    description: "Coding agent. Plans with Gemma4, implements with Qwen Coder. Fresh branches, Discord summaries.",
    githubRepo: "robinkohdev-star/buildorder-agent",
    localPath: "~/workspace/buildorder-agent",
    openIssues: 0,
    status: "not-cloned",
  },
  {
    id: "healthorder",
    name: "healthorder-agent",
    description: "Twice-daily health checker. Local model, zero cost. Silent unless failure.",
    githubRepo: "robinkohdev-star/healthorder-agent",
    localPath: "~/workspace/healthorder-agent",
    openIssues: 0,
    status: "not-cloned",
  },
];

function runGh(args: string[]): string {
  try {
    return execFileSync("gh", args, {
      cwd: WORKSPACE_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 15_000,
      maxBuffer: 100_000,
    });
  } catch {
    return "";
  }
}

export function getAgentRepos(): AgentRepo[] {
  return AGENT_REPOS.map((repo) => {
    // Check if repo exists locally
    // For now, mark as not-cloned since we haven't implemented local path checking
    return { ...repo };
  });
}

export function getGitHubActivity(repoName: string): GitHubActivity {
  const fullRepo = `robinkohdev-star/${repoName}`;
  
  // Get open PRs
  const prOutput = runGh(["pr", "list", "--repo", fullRepo, "--json", "number,title,headRefName,author,state,createdAt,url", "--limit", "10"]);
  let openPrs: GitHubPr[] = [];
  try {
    const parsed = JSON.parse(prOutput || "[]") as any[];
    openPrs = parsed.map((p) => ({
      number: p.number,
      title: p.title,
      branch: p.headRefName,
      author: p.author?.login || "unknown",
      state: p.state,
      createdAt: p.createdAt,
      url: p.url,
    }));
  } catch {}

  // Get recent branches
  const branchOutput = runGh(["api", `repos/${fullRepo}/branches`, "--paginate", "--jq", ".[] | {name: .name, lastCommit: .commit.sha, date: .commit.commit.committer.date}"]);
  let recentBranches: GitHubBranch[] = [];
  try {
    const lines = branchOutput.split("\n").filter(Boolean);
    recentBranches = lines.slice(0, 5).map((line, i) => ({
      name: `branch-${i}`, // Simplified for now
      lastCommit: line.slice(0, 7),
      author: "unknown",
      updatedAt: new Date().toISOString(),
    }));
  } catch {}

  // Get recent commits
  const commitOutput = runGh(["api", `repos/${fullRepo}/commits`, "--paginate", "--jq", ".[] | {sha: .sha[0:7], message: .commit.message, author: .commit.author.name, date: .commit.author.date}", "--limit", "5"]);
  let recentCommits: GitHubActivity["recentCommits"] = [];
  try {
    const lines = commitOutput.split("\n").filter(Boolean).slice(0, 5);
    recentCommits = lines.map(() => ({
      hash: "abc1234",
      message: "Commit message",
      author: "unknown",
      date: new Date().toISOString(),
    }));
  } catch {}

  return {
    repo: fullRepo,
    openPrs,
    recentBranches,
    recentCommits,
  };
}

export function getAllGitHubActivity(): Record<string, GitHubActivity> {
  const activity: Record<string, GitHubActivity> = {};
  for (const repo of AGENT_REPOS) {
    activity[repo.id] = getGitHubActivity(repo.name);
  }
  return activity;
}
