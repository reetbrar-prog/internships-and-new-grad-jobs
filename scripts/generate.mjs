// Regenerates README.md from ForgeApply's live early-career feed.
// Run daily by .github/workflows/update.yml; safe to run locally with Node 18+.
import { writeFileSync } from "node:fs";

const FEED = "https://forgeapply.com/api/public/early-career";
const MAX_ROWS = 500;
const UTM = "utm_source=github&utm_medium=referral&utm_campaign=early_career_repo";

const res = await fetch(FEED, { headers: { "User-Agent": "internships-repo-bot" } });
if (!res.ok) {
  console.error(`Feed fetch failed: ${res.status}`);
  process.exit(1);
}
const data = await res.json();
if (!Array.isArray(data.jobs) || data.jobs.length === 0) {
  console.error("Feed returned no jobs; keeping existing README.");
  process.exit(0);
}

const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const day = (iso) => (iso ? String(iso).slice(0, 10) : "");

const rows = data.jobs.slice(0, MAX_ROWS);
const interns = rows.filter((j) => /intern/i.test(j.title) && !/internal|international/i.test(j.title));
const newgrad = rows.filter((j) => !interns.includes(j));

function table(jobs) {
  return [
    "| Company | Role | Location | Salary | Posted |",
    "|---|---|---|---|---|",
    ...jobs.map(
      (j) =>
        `| ${esc(j.company)} | [${esc(j.title)}](${j.url}) | ${esc(j.location || "—")} | ${esc(j.salary || "—")} | ${day(j.posted_at)} |`,
    ),
  ].join("\n");
}

const updated = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

const readme = `# \u{1F393} US Internships & New-Grad Jobs — Updated Daily

Live internship and entry-level/new-grad openings across software, data, hardware, product and more — pulled every day from **60,000+ live US job postings** tracked by [ForgeApply](https://forgeapply.com?${UTM}).

- ✅ Only live postings — expired jobs drop out automatically
- \u{1F4B0} Salaries shown where the employer discloses them
- \u{1F5FA}️ US roles (on-site + remote)
- ⏱️ Last updated: **${updated}** · ${rows.length} roles listed

Browse more: [All jobs by role & city](https://forgeapply.com/browse?${UTM})

## \u{1F9D1}‍\u{1F393} Internships (${interns.length})

${table(interns)}

## \u{1F331} New-Grad & Entry-Level (${newgrad.length})

${table(newgrad)}

---

*Apply to any of these in about a minute — [ForgeApply](https://forgeapply.com?${UTM}) autofills the application and tailors your resume to the exact posting. You review everything before it's sent.*
`;

writeFileSync("README.md", readme);
console.log(`Wrote README.md with ${rows.length} jobs (${interns.length} internships, ${newgrad.length} new-grad).`);
