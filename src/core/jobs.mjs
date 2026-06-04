import { JOB_CAPABILITY, JOB_PROVIDER, JOB_STATUS } from "../contracts/workbench_contract.mjs";
import { createElectronicsLayout } from "./electronics_layout.mjs";
import { createGeometrySpec, generateModelArtifacts } from "./geometry_generation.mjs";
import { createModelPreview } from "./model_preview.mjs";
import { createQuoteEstimate } from "./quote_plan.mjs";
import { makeId } from "./utils.mjs";

const jobs = new Map();

export function createGenerationJob({ planId = "", revisionId = "", capability, provider, input = {} } = {}) {
  const normalizedCapability = normalizeCapability(capability);
  const normalizedProvider = normalizeProvider(provider, normalizedCapability);
  const now = new Date().toISOString();
  const job = {
    jobId: makeId("job"),
    planId,
    revisionId,
    capability: normalizedCapability,
    provider: normalizedProvider,
    status: JOB_STATUS.RUNNING,
    input,
    output: null,
    error: null,
    createdAt: now,
    updatedAt: now
  };

  try {
    job.output = runJob(job);
    job.status = JOB_STATUS.SUCCEEDED;
  } catch (error) {
    job.status = JOB_STATUS.FAILED;
    job.error = {
      message: error instanceof Error ? error.message : "Unknown generation failure"
    };
  }
  job.updatedAt = new Date().toISOString();
  jobs.set(job.jobId, job);
  return job;
}

export function getGenerationJob(jobId) {
  return jobs.get(jobId);
}

export function listGenerationJobs({ planId, revisionId } = {}) {
  return [...jobs.values()].filter((job) => {
    if (planId && job.planId !== planId) return false;
    if (revisionId && job.revisionId !== revisionId) return false;
    return true;
  });
}

function normalizeCapability(capability) {
  return Object.values(JOB_CAPABILITY).includes(capability)
    ? capability
    : JOB_CAPABILITY.AI_CHAT_RESERVED;
}

function normalizeProvider(provider, capability) {
  if (Object.values(JOB_PROVIDER).includes(provider)) return provider;
  if (capability === JOB_CAPABILITY.MODEL_GENERATION) return JOB_PROVIDER.PROVIDER_ADAPTER;
  if (capability === JOB_CAPABILITY.AI_CHAT_RESERVED) return JOB_PROVIDER.MANUAL_PLACEHOLDER;
  return JOB_PROVIDER.INTERNAL_RULES;
}

function runJob(job) {
  if (job.capability === JOB_CAPABILITY.MODEL_GENERATION) {
    const geometrySpec = createGeometrySpec({
      spec: job.input.spec,
      modules: job.input.modules || [],
      riskReport: job.input.riskReport || {}
    });
    const modelArtifacts = generateModelArtifacts({
      geometrySpec,
      planId: job.planId,
      revisionId: job.revisionId,
      jobId: job.jobId,
      generateArtifacts: job.input.generateArtifacts !== false
    });
    return {
      geometrySpec,
      modelArtifacts,
      geometryValidation: modelArtifacts.validation,
      modelPreview: createModelPreview({
        spec: job.input.spec,
        modules: job.input.modules || [],
        geometrySpec,
        modelArtifacts,
        geometryValidation: modelArtifacts.validation
      })
    };
  }

  if (job.capability === JOB_CAPABILITY.ELECTRONICS_LAYOUT) {
    const modelPreview = job.input.modelPreview || job.input.modelJob?.output?.modelPreview || {};
    return {
      electronicsLayout: createElectronicsLayout({
        spec: job.input.spec,
        modules: job.input.modules || [],
        modelPreview
      })
    };
  }

  if (job.capability === JOB_CAPABILITY.QUOTE_ESTIMATE) {
    return {
      quoteEstimate: createQuoteEstimate(job.input)
    };
  }

  if (job.capability === JOB_CAPABILITY.REVIEW_PACKET) {
    return {
      reviewPacket: {
        status: "ready_for_local_write",
        note: "Review packet job is reserved; review_queue writes the final local JSON."
      }
    };
  }

  return {
    reserved: true,
    note: "AI chat provider adapter is reserved for future prompt and memory integration."
  };
}
