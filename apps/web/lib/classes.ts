/**
 * Client for the class roster and knowledge-point APIs.
 *
 * Both resources are real backend entities (Prisma models Class / ClassTeacher
 * / ClassEnrollment / AssignmentClass / KnowledgePoint / QuestionKnowledgePoint,
 * migration 20260920121401) — nothing here is synthesised on the client.
 */
import { getApiRoutes } from "@/config/constants";
import { apiClient } from "./api-client";

export interface ClassSummary {
  id: number;
  name: string;
  classCode: string | null;
  subject: string | null;
  term: string | null;
  gradeLevel: string | null;
  studentCount: number;
  assignmentCount: number;
  createdAt: string;
}

export interface ClassStudent {
  userId: string;
  displayName: string | null;
  studentNo: string | null;
  joinedAt: string;
}

export interface ClassAssignmentLink {
  assignmentId: number;
  name: string;
  assignedAt: string;
  dueAt: string | null;
}

export interface ClassDetail extends Omit<ClassSummary, "createdAt"> {
  students: ClassStudent[];
  assignments: ClassAssignmentLink[];
}

export interface KnowledgePointSummary {
  id: number;
  name: string;
  code: string | null;
  subject: string | null;
  level: number;
  parentId: number | null;
  questionCount: number;
  createdAt: string;
}

export interface KnowledgePointQuestion {
  linkId: number;
  questionId: number;
  question: string;
  assignmentId: number;
  assignmentName: string;
  weight: number;
  isPrimary: boolean;
}

const classesUrl = () => getApiRoutes().classes;
const knowledgePointsUrl = () => getApiRoutes().knowledgePoints;

// ---------------------------------------------------------------- classes ---

export async function listClasses(): Promise<ClassSummary[]> {
  return await apiClient.get(classesUrl());
}

export async function createClass(payload: {
  name: string;
  subject?: string;
  term?: string;
  gradeLevel?: string;
}): Promise<ClassSummary> {
  return await apiClient.post(classesUrl(), payload);
}

export async function getClass(classId: number): Promise<ClassDetail> {
  return await apiClient.get(`${classesUrl()}/${classId}`);
}

export async function addClassStudent(
  classId: number,
  payload: { userId: string; displayName?: string; studentNo?: string },
): Promise<ClassStudent> {
  return await apiClient.post(`${classesUrl()}/${classId}/students`, payload);
}

export async function removeClassStudent(
  classId: number,
  userId: string,
): Promise<void> {
  await apiClient.delete(`${classesUrl()}/${classId}/students/${userId}`);
}

export async function assignClassAssignment(
  classId: number,
  payload: { assignmentId: number; dueAt?: string },
): Promise<void> {
  await apiClient.post(`${classesUrl()}/${classId}/assignments`, payload);
}

export async function archiveClass(classId: number): Promise<void> {
  await apiClient.delete(`${classesUrl()}/${classId}`);
}

// -------------------------------------------------------- knowledge points ---

export async function listKnowledgePoints(
  subject?: string,
): Promise<KnowledgePointSummary[]> {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return await apiClient.get(`${knowledgePointsUrl()}${query}`);
}

export async function createKnowledgePoint(payload: {
  name: string;
  code?: string;
  subject?: string;
  parentId?: number;
  level?: number;
}): Promise<KnowledgePointSummary> {
  return await apiClient.post(knowledgePointsUrl(), payload);
}

export async function knowledgePointQuestions(
  knowledgePointId: number,
): Promise<KnowledgePointQuestion[]> {
  return await apiClient.get(
    `${knowledgePointsUrl()}/${knowledgePointId}/questions`,
  );
}

export async function attachQuestionToKnowledgePoint(payload: {
  questionId: number;
  knowledgePointId: number;
  weight?: number;
  isPrimary?: boolean;
}): Promise<void> {
  await apiClient.post(`${knowledgePointsUrl()}/questions`, payload);
}

export async function detachQuestionFromKnowledgePoint(
  linkId: number,
): Promise<void> {
  await apiClient.delete(`${knowledgePointsUrl()}/questions/${linkId}`);
}

export async function archiveKnowledgePoint(id: number): Promise<void> {
  await apiClient.delete(`${knowledgePointsUrl()}/${id}`);
}
