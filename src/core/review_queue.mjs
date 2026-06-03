import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { REVIEW_STATUS } from "../contracts/workbench_contract.mjs";
import { makeId } from "./utils.mjs";

const reviewDir = fileURLToPath(new URL("../../data/reviews/", import.meta.url));

export async function createReviewSubmission({ draft, behaviorConfig, productPlan, revision, contactInfo = {}, jobs = [], assets = [] }) {
  if (productPlan && revision) {
    return createProductPlanReviewSubmission({ productPlan, revision, contactInfo, jobs, assets });
  }

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
    "Standard 3D printed enclosure queued for fit check",
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

async function createProductPlanReviewSubmission({ productPlan, revision, contactInfo, jobs, assets }) {
  if (!contactInfo.name || !contactInfo.email) {
    return {
      accepted: false,
      reason: "Contact name and email are required for human review"
    };
  }

  const reviewId = makeId("review");
  const manufacturingPacket = [
    "ProductPlan revision locked for internal human review",
    "Conversation summary, spec, parts list, risk limits, model placeholder, electronics layout, and quote assumptions attached",
    "No payment has been collected",
    "No manufacturing or supplier order has been started",
    "Human confirmation is required before any real order step"
  ];
  const modelJob = jobs.find((job) => job.capability === "model_generation") || null;
  const electronicsLayoutJob = jobs.find((job) => job.capability === "electronics_layout") || null;
  const quoteJob = jobs.find((job) => job.capability === "quote_estimate") || null;
  const quote = revision.quoteEstimate || revision.quote || null;
  const riskReport = revision.riskReport || null;
  const electronicsLayout = revision.electronicsLayout || electronicsLayoutJob?.output?.electronicsLayout || null;
  const quoteAssumptions = revision.quoteEstimate?.assumptions || revision.assumptions || [];
  const submission = {
    reviewId,
    status: REVIEW_STATUS.QUEUED,
    reviewMode: productPlan.status === "manual_expansion_draft"
      ? "manual_expansion_review"
      : "standard_desktop_display_review",
    paymentStatus: "not_collected",
    productionStatus: "not_started",
    humanReviewNotice: "已提交人工审核：这不是付款，也不是立即生产。",
    createdAt: new Date().toISOString(),
    planId: productPlan.planId,
    revisionId: revision.revisionId,
    contactInfo,
    revision,
    jobs,
    assets,
    modelJob,
    electronicsLayoutJob,
    quoteJob,
    electronicsLayout,
    quote,
    quoteAssumptions,
    riskReport,
    productPlanSnapshot: {
      planId: productPlan.planId,
      status: productPlan.status,
      currentRevisionId: productPlan.currentRevisionId,
      requiredInputs: productPlan.requiredInputs,
      conversationSummary: summarizeConversation(productPlan.conversation),
      revision,
      assets,
      jobs,
      reviewSubmission: null
    },
    manufacturingPacket
  };

  const filePath = join(reviewDir, `${reviewId}.json`);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(submission, null, 2));

  return {
    accepted: true,
    reviewId,
    status: submission.status,
    reviewMode: submission.reviewMode,
    paymentStatus: submission.paymentStatus,
    productionStatus: submission.productionStatus,
    humanReviewNotice: submission.humanReviewNotice,
    manufacturingPacket
  };
}

function summarizeConversation(conversation = []) {
  return conversation
    .slice(-8)
    .map((turn) => `${turn.role}: ${turn.text}`)
    .join("\n");
}
