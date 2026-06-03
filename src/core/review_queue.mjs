import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { REVIEW_STATUS } from "../contracts/workbench_contract.mjs";
import { makeId } from "./utils.mjs";

const reviewDir = fileURLToPath(new URL("../../data/reviews/", import.meta.url));

export async function createReviewSubmission({ draft, behaviorConfig }) {
  if (!draft?.spec) {
    return {
      accepted: false,
      reason: "Missing draft.spec"
    };
  }

  if (draft.riskReport?.blocked) {
    return {
      accepted: false,
      reason: "Draft is blocked by risk gate"
    };
  }

  const reviewId = makeId("review");
  const manufacturingPacket = [
    "ProductSpec locked for engineer review",
    "BOM generated from approved module library",
    "Parameterized enclosure queued for CAD check",
    "Firmware config preview attached",
    "Final quote waits for human approval"
  ];

  const submission = {
    reviewId,
    status: REVIEW_STATUS.QUEUED,
    createdAt: new Date().toISOString(),
    draft,
    behaviorConfig,
    manufacturingPacket
  };

  const filePath = join(reviewDir, `${reviewId}.json`);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(submission, null, 2));

  return {
    accepted: true,
    reviewId,
    status: submission.status,
    manufacturingPacket
  };
}
