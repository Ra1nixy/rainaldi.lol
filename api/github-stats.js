// Sanitized GitHub API Proxy (Maximum Security)
// Access this at /api/github-stats

const LANGUAGE_COLORS = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  PHP: "#8892be",
  HTML: "#e34f26",
  CSS: "#1572b6",
  Python: "#3572A5",
  Dart: "#00B4AB",
  Java: "#b07219",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  Swift: "#f05138",
  Kotlin: "#7F52FF",
  Vue: "#41b883",
  Shell: "#89e051",
  SCSS: "#c6538c",
  Other: "#9ca3af",
};

export default async function handler(req, res) {
  const GITHUB_USERNAME = "Ra1nixy";
  const GITHUB_TOKEN = process.env.VITE_GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: "GitHub Token not found." });
  }

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "rainaldi-lol-portfolio"
  };

  try {
    // 1. Fetch User Profile
    const userRes = await fetch("https://api.github.com/user", { headers });
    if (!userRes.ok) throw new Error(`User API error: ${userRes.status}`);
    const userData = await userRes.json();

    // 2. Fetch Repositories for Aggregation
    const reposRes = await fetch(
      "https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator&sort=updated", 
      { headers }
    );
    if (!reposRes.ok) throw new Error(`Repos API error: ${reposRes.status}`);
    const reposData = await reposRes.json();

    // Aggregations (Calculation on Server)
    const totalRepos = reposData.length;
    const totalStars = reposData
      .filter(r => !r.fork)
      .reduce((acc, r) => acc + r.stargazers_count, 0);

    const langCount = {};
    reposData.forEach(repo => {
      if (repo.language) {
        langCount[repo.language] = (langCount[repo.language] || 0) + 1;
      }
    });

    const sortedLangs = Object.entries(langCount).sort((a, b) => b[1] - a[1]);
    const topLangs = sortedLangs.slice(0, 8);
    const otherCount = sortedLangs.slice(8).reduce((acc, [, v]) => acc + v, 0);

    const langData = topLangs.map(([name, value]) => ({
      name,
      value,
      color: LANGUAGE_COLORS[name] || LANGUAGE_COLORS.Other,
    }));

    if (otherCount > 0) {
      langData.push({ name: "Other", value: otherCount, color: LANGUAGE_COLORS.Other });
    }

    // 3. Fetch Contributions (GraphQL)
    const gqlQuery = {
      query: `
        query($userName:String!) {
          user(login: $userName) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                    color
                  }
                }
              }
            }
          }
        }
      `,
      variables: { userName: GITHUB_USERNAME }
    };

    let contributions = null;
    const gqlRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify(gqlQuery)
    });

    if (gqlRes.ok) {
      const resJson = await gqlRes.json();
      contributions = resJson.data?.user?.contributionsCollection?.contributionCalendar || null;
    }

    // Return ONLY sanitized data - NO REPOSITORY NAMES or IDs revealed to the client
    return res.status(200).json({
      user: {
        login: userData.login,
        name: userData.name,
        followers: userData.followers,
        following: userData.following,
        bio: userData.bio,
        html_url: userData.html_url
      },
      totalStars,
      totalRepos,
      langData,
      contributions
    });

  } catch (error) {
    console.error("API Proxy Error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch data from GitHub"
    });
  }
}
