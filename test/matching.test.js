import assert from "node:assert/strict";
import test from "node:test";
import { scoreJob, rankJobs } from "../server/matching.js";
import { primaryJobs } from "../server/seed-data.js";
import { getCandidateById } from "../server/candidates.js";

test("exact skill matches and location produce an explainable score", () => {
  const job = {
    location: "Zurich",
    workMode: "Hybrid",
    skills: ["React", "TypeScript", "API design", "Rust"],
  };
  const result = scoreJob(job, getCandidateById("candidate-001"));
  assert.equal(result.score, 80);
  assert.equal(result.matchedCount, 3);
  assert.deepEqual(result.skillBreakdown.map((item) => item.matched), [true, true, true, false]);
  assert.deepEqual(result.skillBreakdown.map((item) => item.matchType), ["exact", "exact", "exact", "missing"]);
  assert.deepEqual(result.skillBreakdown.map((item) => item.contribution), [20, 20, 20, 0]);
  assert.equal(result.locationFits, true);
  assert.equal(result.locationContribution, 20);
});

test("a specific candidate skill contributes half credit to a broader requirement", () => {
  const job = { location: "Bern", workMode: "Hybrid", skills: ["Frontend development"] };
  const candidate = { location: "Bern", skills: ["React"] };
  const result = scoreJob(job, candidate);
  assert.equal(result.score, 60);
  assert.equal(result.matchedCount, 1);
  assert.deepEqual(result.skillBreakdown[0], {
    skill: "Frontend development",
    matchType: "related",
    matched: true,
    reason: "Related skill",
    contribution: 40,
  });
});

test("an unrelated candidate skill is missing and earns no skill contribution", () => {
  const job = { location: "Bern", workMode: "Hybrid", skills: ["Frontend development"] };
  const candidate = { location: "Bern", skills: ["Go"] };
  const result = scoreJob(job, candidate);
  assert.equal(result.score, 20);
  assert.equal(result.matchedCount, 0);
  assert.deepEqual(result.skillBreakdown[0], {
    skill: "Frontend development",
    matchType: "missing",
    matched: false,
    reason: "Not found",
    contribution: 0,
  });
});

test("an exact candidate skill takes precedence over a related skill", () => {
  const job = { location: "Bern", workMode: "Hybrid", skills: ["Frontend development"] };
  const candidate = { location: "Bern", skills: ["React", "Frontend development"] };
  const result = scoreJob(job, candidate);
  assert.equal(result.score, 100);
  assert.equal(result.matchedCount, 1);
  assert.equal(result.skillBreakdown[0].matchType, "exact");
  assert.equal(result.skillBreakdown[0].contribution, 80);
});

test("a broader candidate skill does not satisfy a specific requirement", () => {
  const job = { location: "Bern", workMode: "Hybrid", skills: ["React"] };
  const candidate = { location: "Bern", skills: ["Frontend development"] };
  const result = scoreJob(job, candidate);
  assert.equal(result.score, 20);
  assert.equal(result.skillBreakdown[0].matchType, "missing");
});

test("remote roles retain the location contribution and ranking is stable", () => {
  const remoteJob = { location: "Lausanne", workMode: "Remote", skills: ["Frontend development"] };
  const remoteCandidate = { location: "Zurich", skills: [] };
  const remoteMatch = scoreJob(remoteJob, remoteCandidate);
  assert.equal(remoteMatch.score, 20);
  assert.equal(remoteMatch.locationFits, true);
  assert.equal(remoteMatch.locationContribution, 20);
  assert.ok(remoteMatch.score >= 0 && remoteMatch.score <= 100);
  assert.deepEqual(remoteMatch, scoreJob(remoteJob, remoteCandidate));

  const candidate = getCandidateById("candidate-003");
  const ranked = rankJobs(primaryJobs, candidate);
  assert.equal(ranked[0].id, "job-103");
  assert.equal(ranked[0].match.locationFits, true);
});
