/**
 * AI Training Dataset Foundation Contracts
 * Enforces ethical data collection, explicit consent, and anonymization tracking
 * for future ZhongWenHub model fine-tuning and evaluation datasets.
 */

export type DatasetSourceType =
  | 'AUTHORIZED_LESSON_MATERIAL'
  | 'TEACHER_EXERCISE'
  | 'APPROVED_ANSWER_RUBRIC'
  | 'AI_GRADING_SUGGESTION'
  | 'TEACHER_GRADING_CORRECTION'
  | 'VALIDATED_STUDENT_OUTCOME'
  | 'EXPLICIT_FEEDBACK';

export type DatasetPermissionStatus =
  | 'REVOKED'
  | 'PENDING_CONSENT'
  | 'EXPLICITLY_GRANTED'
  | 'RESTRICTED_INTERNAL_ONLY';

export type DatasetAnonymizationStatus =
  | 'RAW_RESTRICTED'
  | 'PARTIALLY_MASKED'
  | 'FULLY_ANONYMIZED_PII_REMOVED';

export type DatasetReviewStatus =
  | 'UNREVIEWED'
  | 'ACCEPTED_HIGH_QUALITY'
  | 'REJECTED_LOW_QUALITY'
  | 'FLAGGED_POLICY_VIOLATION';

export interface DatasetProvenance {
  sourceType: DatasetSourceType;
  sourceReferenceId: string;
  creatorId: string;
  creatorRole: 'TEACHER' | 'STUDENT' | 'CURRICULUM_SPECIALIST';
  hskLevel?: string;
  language: 'zh' | 'vi' | 'zh-vi';
  createdAt: string;
}

export interface TrainingDatasetCandidate {
  candidateId: string;
  datasetVersion: string;
  provenance: DatasetProvenance;
  permissionStatus: DatasetPermissionStatus;
  consentGrantedAt?: string;
  anonymizationStatus: DatasetAnonymizationStatus;
  reviewStatus: DatasetReviewStatus;
  reviewerNotes?: string;
  features: {
    instructionZh?: string;
    promptHanzi?: string;
    studentResponse?: string;
    teacherCorrection?: string;
    grammarCategory?: string;
    qualityScore?: number;
  };
  tags: string[];
  registeredAt: string;
}

export interface DatasetVersion {
  versionId: string;
  releaseTag: string;
  sampleCount: number;
  description: string;
  isLockedForTraining: boolean;
  exportedAt?: string;
}
