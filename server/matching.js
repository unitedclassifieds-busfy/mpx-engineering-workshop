import { broaderSkills } from "./skills.js";

function normalized(value) {
  return value.trim().toLowerCase();
}

const broaderSkillsBySpecific = new Map(
  Object.entries(broaderSkills).map(([specific, broader]) => [
    normalized(specific),
    new Set(broader.map(normalized)),
  ]),
);

export function scoreJob(job, candidate) {
  const candidateSkills = new Set(candidate.skills.map(normalized));
  const relatedSkills = new Set(
    [...candidateSkills].flatMap((skill) => [...(broaderSkillsBySpecific.get(skill) ?? [])]),
  );
  const pointsPerExactSkill = job.skills.length ? 80 / job.skills.length : 0;
  const skillBreakdown = job.skills.map((skill) => {
    const normalizedSkill = normalized(skill);
    const matchType = candidateSkills.has(normalizedSkill)
      ? "exact"
      : relatedSkills.has(normalizedSkill)
        ? "related"
        : "missing";

    return {
      skill,
      matchType,
      matched: matchType !== "missing",
      reason: matchType === "exact"
        ? "Exact skill"
        : matchType === "related"
          ? "Related skill"
          : "Not found",
      contribution: pointsPerExactSkill * (matchType === "exact" ? 1 : matchType === "related" ? 0.5 : 0),
    };
  });
  const matchedCount = skillBreakdown.filter((item) => item.matched).length;
  const locationFits = job.location === candidate.location || job.workMode === "Remote";
  const locationContribution = locationFits ? 20 : 0;
  const score = Math.max(0, Math.min(100, Math.round(
    skillBreakdown.reduce((total, item) => total + item.contribution, 0) + locationContribution,
  )));

  return {
    score,
    matchedCount,
    requiredCount: job.skills.length,
    locationFits,
    locationContribution,
    skillBreakdown,
  };
}

export function rankJobs(jobs, candidate) {
  return jobs
    .map((job) => ({ ...job, match: scoreJob(job, candidate) }))
    .sort((a, b) => b.match.score - a.match.score || a.title.localeCompare(b.title));
}
