const GITHUB_API = "https://api.github.com";
const token = process.env.GITHUB_TOKEN;

export type ContributionDay = { date: string; count: number };

export type GithubStats = {
  stars: number;
  forks: number;
  publicRepos: number;
  followers: number;
  accountCreated: string;
  currentStreak: number;
  totalContributions: number;
  heatmapWeeks: ContributionDay[][];
  topLanguages: { name: string; count: number }[];
  recentCommits: { repo: string; message: string; sha: string }[];
  pinnedRepos: { name: string; stars: number }[];
  status: { message: string; emoji: string } | null;
};

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "User-Agent": "profile-readme-generator",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function restJson<T>(path: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: authHeaders({ Accept: "application/vnd.github+json" }),
  });
  if (!res.ok) throw new Error(`GitHub REST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchAllOwnedRepos(username: string): Promise<any[]> {
  const repos: any[] = [];
  let page = 1;
  for (;;) {
    const batch = await restJson<any[]>(`/users/${username}/repos?per_page=100&page=${page}&type=owner`);
    repos.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return repos;
}

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${GITHUB_API}/graphql`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T; errors?: unknown };
    if (json.errors) return null;
    return json.data ?? null;
  } catch {
    return null;
  }
}

function computeStreak(days: ContributionDay[]): number {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? 1 : -1));
  let index = 0;
  if (sorted.length && sorted[0].count === 0) index = 1;
  let streak = 0;
  for (; index < sorted.length; index += 1) {
    if (sorted[index].count > 0) streak += 1;
    else break;
  }
  return streak;
}

const CONTRIBUTIONS_QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      status { message emoji }
      pinnedItems(first: 3, types: [REPOSITORY]) {
        nodes {
          ... on Repository { name stargazerCount }
        }
      }
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }
`;

export async function fetchGithubStats(username: string): Promise<GithubStats> {
  const [user, repos, events] = await Promise.all([
    restJson<any>(`/users/${username}`),
    fetchAllOwnedRepos(username),
    restJson<any[]>(`/users/${username}/events/public?per_page=30`),
  ]);

  const ownRepos = repos.filter((repo) => !repo.fork);
  const stars = ownRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const forks = ownRepos.reduce((sum, repo) => sum + repo.forks_count, 0);

  const languageCounts = new Map<string, number>();
  for (const repo of ownRepos) {
    if (!repo.language) continue;
    languageCounts.set(repo.language, (languageCounts.get(repo.language) ?? 0) + 1);
  }
  const topLanguages = [...languageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const recentCommits = events
    .filter((event) => event.type === "PushEvent")
    .flatMap((event) =>
      (event.payload?.commits ?? []).map((commit: any) => ({
        repo: String(event.repo.name).split("/")[1] ?? event.repo.name,
        message: String(commit.message).split("\n")[0],
        sha: String(commit.sha).slice(0, 7),
      })),
    )
    .slice(0, 4);

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 7 * 20);

  const graphqlData = await graphql<{
    user: {
      status: { message: string; emoji: string } | null;
      pinnedItems: { nodes: { name: string; stargazerCount: number }[] };
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
        };
      };
    };
  }>(CONTRIBUTIONS_QUERY, { login: username, from: from.toISOString(), to: now.toISOString() });

  const calendar = graphqlData?.user?.contributionsCollection?.contributionCalendar;
  const heatmapWeeks: ContributionDay[][] =
    calendar?.weeks.map((week) => week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount }))) ?? [];
  const flatDays = heatmapWeeks.flat();

  return {
    stars,
    forks,
    publicRepos: user.public_repos,
    followers: user.followers,
    accountCreated: user.created_at,
    currentStreak: computeStreak(flatDays),
    totalContributions: calendar?.totalContributions ?? 0,
    heatmapWeeks,
    topLanguages,
    recentCommits,
    pinnedRepos: (graphqlData?.user?.pinnedItems?.nodes ?? []).map((node) => ({ name: node.name, stars: node.stargazerCount })),
    status: graphqlData?.user?.status ?? null,
  };
}
