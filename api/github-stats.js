// Vercel Serverless Function to Fetch GitHub Data Securely
// Access this at /api/github-stats

export default async function handler(req, res) {
  const GITHUB_USERNAME = "Ra1nixy";
  const GITHUB_TOKEN = process.env.VITE_GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: "GitHub Token not found in server environment." });
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

    // 2. Fetch Repositories
    const reposRes = await fetch(
      "https://api.github.com/user/repos?per_page=100&affiliation=owner,collaborator&sort=updated", 
      { headers }
    );
    if (!reposRes.ok) throw new Error(`Repos API error: ${reposRes.status}`);
    const reposData = await reposRes.json();

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

    // Return combined data
    return res.status(200).json({
      user: userData,
      repos: reposData,
      contributions
    });

  } catch (error) {
    console.error("API Proxy Error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch data from GitHub",
      message: error.message 
    });
  }
}
