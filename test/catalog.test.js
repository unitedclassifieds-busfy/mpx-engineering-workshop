import assert from "node:assert/strict";
import test from "node:test";
import { getCatalogSummary, getJobById, listJobs } from "../server/catalog.js";

test("catalog deduplicates canonical roles, prefers direct, and preserves order", () => {
  const jobs = listJobs();
  const copies = jobs.filter((job) => job.canonicalId === "role-101");
  assert.equal(copies.length, 1);
  assert.equal(copies[0].id, "job-101");
  assert.equal(copies[0].source, "Direct");
  assert.equal(getJobById("partner-778"), null);
  assert.deepEqual(jobs.map((job) => job.id), [
    "job-101", "job-102", "job-103", "job-104", "job-105", "job-106", "partner-779",
  ]);
  assert.deepEqual(getCatalogSummary(), {
    visibleListings: 7,
    uniqueRoles: 7,
    partnerListings: 1,
  });
});

test("catalog can filter by query, category, and location", () => {
  assert.equal(listJobs({ query: "Security" }).length, 1);
  assert.deepEqual(listJobs({ query: "Senior Product Engineer" }).map((job) => job.id), ["job-101"]);
  assert.equal(listJobs({ category: "Data" }).length, 1);
  assert.equal(listJobs({ location: "Lausanne" }).some((job) => job.id === "job-103"), true);
  assert.equal(listJobs({ location: "Bern" }).some((job) => job.id === "job-106"), true);
  assert.equal(getJobById("job-102")?.title, "Data Platform Engineer");
});
