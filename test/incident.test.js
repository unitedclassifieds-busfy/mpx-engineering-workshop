import test from "node:test";
import assert from "node:assert/strict";
import { getDuplicateListings } from "../src/lib/incident.js";
import { listJobs } from "../server/catalog.js";
import { primaryJobs, partnerJobs } from "../server/seed-data.js";

test("incident evidence identifies the duplicate in the raw source feeds", () => {
  const groups = getDuplicateListings([...primaryJobs, ...partnerJobs]);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].map((job) => job.source), ["Direct", "Partner feed"]);
});

test("incident evidence resolves when the catalog contains unique roles", () => {
  const unique = [...new Map(listJobs().map((job) => [job.canonicalId, job])).values()];
  assert.deepEqual(getDuplicateListings(unique), []);
});
