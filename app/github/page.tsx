import { PageHeader } from "@/components/mission/shell";
import { PixelOtter } from "@/components/mission/otter";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAgentRepos, getAllGitHubActivity } from "@/lib/github-data";
import { GitBranch, GitPullRequest, GitCommit, FolderGit } from "lucide-react";

export const dynamic = "force-dynamic";

const accentMap: Record<string, "pink" | "purple" | "red" | "blue"> = {
  scoutorder: "purple",
  geoorder: "red",
  buildorder: "blue",
  healthorder: "pink",
};

export default function GitHubPage() {
  const repos = getAgentRepos();
  const activity = getAllGitHubActivity();

  return <>
    <PageHeader 
      eyebrow="Priority 10" 
      title="GitHub" 
      subtitle="Per-agent repository tracking. Visibility into code, branches, PRs, and BuildOrder activity." 
    />

    <div className="mb-6 rounded-2xl border border-cyan-200/15 bg-cyan-200/5 p-4 text-sm text-slate-300">
      <p>Each crew member has their own repository for tracking configurations, scripts, and activity.</p>
      <p className="mt-1 text-xs text-slate-400">Repos are created as needed. Local paths checked against ~/workspace/.</p>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      {repos.map((repo) => {
        const repoActivity = activity[repo.id];
        const accent = accentMap[repo.id] || "pink";
        
        return (
          <Card key={repo.id} className="overflow-hidden">
            <div className="border-b border-cyan-200/15 bg-slate-950/40 p-5">
              <div className="flex items-start gap-4">
                <PixelOtter accent={accent} active={repo.status === "cloned"} className="h-14 w-14" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black tracking-tight">{repo.name}</h2>
                    <Badge variant={repo.status === "cloned" ? "green" : "muted"}>
                      {repo.status === "cloned" ? "CLONED" : "NOT CLONED"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{repo.description}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <FolderGit className="h-3.5 w-3.5" />
                    <span className="truncate">{repo.githubRepo}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5">
              {/* Activity Stats */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-cyan-200/15 bg-slate-950/40 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <GitPullRequest className="h-3.5 w-3.5" />
                    <span>PRs</span>
                  </div>
                  <div className="mt-1 text-2xl font-black">{repoActivity?.openPrs?.length || 0}</div>
                </div>
                <div className="rounded-xl border border-cyan-200/15 bg-slate-950/40 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <GitBranch className="h-3.5 w-3.5" />
                    <span>Branches</span>
                  </div>
                  <div className="mt-1 text-2xl font-black">{repoActivity?.recentBranches?.length || 0}</div>
                </div>
                <div className="rounded-xl border border-cyan-200/15 bg-slate-950/40 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <GitCommit className="h-3.5 w-3.5" />
                    <span>Commits</span>
                  </div>
                  <div className="mt-1 text-2xl font-black">{repoActivity?.recentCommits?.length || 0}</div>
                </div>
              </div>

              {/* Open PRs */}
              {repoActivity?.openPrs && repoActivity.openPrs.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200">Open Pull Requests</h3>
                  {repoActivity.openPrs.map((pr) => (
                    <div key={pr.number} className="flex items-center justify-between rounded-xl border border-cyan-200/10 bg-slate-950/30 p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-pink-300">#{pr.number}</span>
                          <span className="truncate text-sm font-semibold">{pr.title}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {pr.branch} · {pr.author} · {new Date(pr.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="pink">OPEN</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-slate-400">
                  No open pull requests
                </div>
              )}

              {/* Quick Links */}
              <div className="mt-4 flex gap-2">
                <a 
                  href={`https://github.com/${repo.githubRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-200/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-200/20"
                >
                  <FolderGit className="h-3.5 w-3.5" />
                  View on GitHub
                </a>
              </div>
            </div>
          </Card>
        );
      })}
    </div>

    {/* BuildOrder Focus Section */}
    <Card className="mt-6">
      <div className="border-b border-cyan-200/15 bg-slate-950/40 p-5">
        <div className="flex items-center gap-3">
          <PixelOtter accent="blue" active className="h-12 w-12" />
          <div>
            <h2 className="text-xl font-black tracking-tight">BuildOrder Activity</h2>
            <p className="text-sm text-slate-400">Coding agent branches, PRs, and recent work</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-cyan-200/15 bg-slate-950/40 p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200">Workflow</h3>
            <ol className="mt-3 space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-300">1</span>
                Plan with Gemma4
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-300">2</span>
                Implement with Qwen Coder on fresh branch
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-300">3</span>
                Post summary to Discord for review
              </li>
            </ol>
          </div>
          <div className="rounded-xl border border-cyan-200/15 bg-slate-950/40 p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200">Current Status</h3>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Active branches</span>
                <Badge variant="blue">{activity.buildorder?.recentBranches?.length || 0}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Open PRs</span>
                <Badge variant={activity.buildorder?.openPrs?.length ? "pink" : "muted"}>
                  {activity.buildorder?.openPrs?.length || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Last commit</span>
                <span className="text-xs text-slate-500">
                  {activity.buildorder?.recentCommits?.[0]?.date 
                    ? new Date(activity.buildorder.recentCommits[0].date).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </>;
}
