/**
 * Data layer for the teacher dashboard (/dashboard).
 *
 * Everything here is aggregated from endpoints that already exist in the
 * product — no new backend surface:
 *   GET /api/v1/user-session                     -> who is signed in
 *   GET /api/v2/assignments                      -> the teacher's assignments
 *   GET /api/v2/assignments/:id/attempts         -> raw submission list
 *   GET /api/v2/assignments/:id/insights         -> analytics + question stats
 *
 * Class roster / knowledge-point tables exist only as a migration draft, so
 * this layer deliberately models "weak questions" (real, from question
 * correct-percentage) instead of inventing knowledge-point mastery numbers.
 */
import { getAttempts } from "@/lib/author";
import {
  getAssignments,
  getAuthorAssignmentInsights,
  getUser,
} from "@/lib/shared";
import type { AssignmentAttempt } from "@config/types";

const MAX_ASSIGNMENTS = 6;
const TREND_DAYS = 7;
const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** Insights payload — only the fields the dashboard actually reads. */
interface InsightPayload {
  analytics?: {
    uniqueLearners?: number;
    totalAttempts?: number;
    completedAttempts?: number;
    averageGrade?: number;
  };
  questions?: Array<{
    id: number;
    question?: string;
    correctPercentage?: number;
    responseCount?: number;
  }>;
  attempts?: Array<{
    id: number;
    userId?: string;
    submitted?: boolean;
    grade?: number | null;
    createdAt?: string;
  }>;
}

export interface TrendPoint {
  label: string;
  submitted: number;
  avgGrade: number;
}

export interface ActivityItem {
  key: string;
  who: string;
  action: string;
  time: string;
}

export interface TodoItem {
  key: string;
  title: string;
  meta: string;
  tone: "critical" | "warning" | "info" | "good";
  href?: string;
}

export interface WeakQuestion {
  key: string;
  assignmentId: number;
  assignmentName: string;
  questionId: number;
  question: string;
  correctPercentage: number;
  responseCount: number;
}

export interface AssignmentSummary {
  id: number;
  name: string;
  totalAttempts: number;
  completedAttempts: number;
  completionRate: number;
  uniqueLearners: number;
  averageGrade: number;
  pendingGrading: number;
  todaySubmissions: number;
  wrongAnswers: number;
}

export interface DashboardTotals {
  todaySubmissions: number;
  pendingGrading: number;
  wrongAnswers: number;
  weakQuestionCount: number;
  totalAttempts: number;
  uniqueLearners: number;
  averageGrade: number;
  assignmentCount: number;
}

export interface DashboardData {
  teacherName: string;
  greeting: string;
  hasSession: boolean;
  assignmentId?: number;
  role?: string;
  assignments: AssignmentSummary[];
  totals: DashboardTotals;
  trend: TrendPoint[];
  activities: ActivityItem[];
  todos: TodoItem[];
  weakQuestions: WeakQuestion[];
}

const toBool = (value: unknown): boolean =>
  value === true || value === "1" || value === 1 || value === "true";

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const isSameDay = (value: unknown, dayStart: number): boolean => {
  if (!value) return false;
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) return false;
  return startOfDay(parsed) === dayStart;
};

const relativeTime = (value: unknown): string => {
  if (!value) return "刚刚";
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) return "刚刚";
  const minutes = Math.round((Date.now() - parsed.getTime()) / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} 天前`;
  return parsed.toLocaleDateString();
};

/** Strips an email-ish userId down to something human ("wang@x.com" -> "wang"). */
const displayName = (userId?: string): string => {
  if (!userId) return "同学";
  const local = userId.split("@")[0];
  return local.length > 14 ? `${local.slice(0, 14)}…` : local || "同学";
};

const greetingFor = (hour: number): string => {
  if (hour < 6) return "凌晨好";
  if (hour < 12) return "上午好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
};

const plainText = (value?: string): string =>
  (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export async function loadDashboardData(): Promise<DashboardData> {
  const user = await getUser().catch(() => undefined);

  const assignments = (await getAssignments().catch(() => undefined)) ?? [];
  const scoped = [...assignments]
    .sort((a, b) => b.id - a.id)
    .slice(0, MAX_ASSIGNMENTS);

  const today = startOfDay(new Date());

  // Bucket the last TREND_DAYS days, oldest first.
  const dayBuckets = Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (TREND_DAYS - 1 - i));
    return { start: startOfDay(date), label: WEEKDAY_LABELS[date.getDay()] };
  });

  const summaries: AssignmentSummary[] = [];
  const weakQuestions: WeakQuestion[] = [];
  const activityCandidates: Array<{ at: number; item: ActivityItem }> = [];

  // day-start timestamp -> number of submissions that day (from /attempts,
  // which is the authoritative submission list).
  const dailySubmissions = new Map<number, number>();

  let pendingGrading = 0;
  let todaySubmissions = 0;
  let wrongAnswers = 0;
  let totalAttempts = 0;
  let uniqueLearners = 0;
  let gradeSum = 0;
  let gradeCount = 0;

  await Promise.all(
    scoped.map(async (assignment) => {
      const [attemptsResult, insightsResult] = await Promise.allSettled([
        getAttempts(assignment.id),
        getAuthorAssignmentInsights(assignment.id),
      ]);

      const attempts: AssignmentAttempt[] =
        attemptsResult.status === "fulfilled"
          ? (attemptsResult.value ?? [])
          : [];
      const insights =
        insightsResult.status === "fulfilled"
          ? ((insightsResult.value as InsightPayload | undefined) ?? undefined)
          : undefined;

      const submittedAttempts = attempts.filter((a) => toBool(a.submitted));
      const ungraded = submittedAttempts.filter(
        (a) => a.grade === null || a.grade === undefined,
      );

      const gradedAverage =
        submittedAttempts.length > 0
          ? submittedAttempts.reduce((sum, a) => sum + (a.grade ?? 0), 0) /
            submittedAttempts.length
          : undefined;

      const analytics = insights?.analytics;
      const questions = insights?.questions ?? [];

      // Approximate "wrong answers": responses on questions that learners did
      // not get fully right. Real data, no knowledge-point table needed.
      const wrongForAssignment = questions.reduce((sum, q) => {
        const responses = q.responseCount ?? 0;
        const correct = q.correctPercentage ?? 0;
        return sum + responses * (1 - correct / 100);
      }, 0);

      const total = analytics?.totalAttempts ?? attempts.length;
      const completed =
        analytics?.completedAttempts ?? submittedAttempts.length;

      summaries.push({
        id: assignment.id,
        name: assignment.name,
        totalAttempts: total,
        completedAttempts: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        uniqueLearners: analytics?.uniqueLearners ?? 0,
        averageGrade: analytics?.averageGrade ?? gradedAverage ?? 0,
        pendingGrading: ungraded.length,
        todaySubmissions: attempts.filter((a) => isSameDay(a.createdAt, today))
          .length,
        wrongAnswers: Math.round(wrongForAssignment),
      });

      for (const attempt of attempts) {
        if (!toBool(attempt.submitted)) continue;
        const key = attempt.createdAt
          ? startOfDay(new Date(attempt.createdAt))
          : today;
        dailySubmissions.set(key, (dailySubmissions.get(key) ?? 0) + 1);
      }

      pendingGrading += ungraded.length;
      todaySubmissions += attempts.filter((a) =>
        isSameDay(a.createdAt, today),
      ).length;
      wrongAnswers += Math.round(wrongForAssignment);
      totalAttempts += total;
      uniqueLearners += analytics?.uniqueLearners ?? 0;
      if (analytics?.averageGrade !== undefined) {
        gradeSum += analytics.averageGrade;
        gradeCount += 1;
      }

      for (const q of questions) {
        const correct = q.correctPercentage ?? 100;
        if (correct < 50) {
          weakQuestions.push({
            key: `${assignment.id}-${q.id}`,
            assignmentId: assignment.id,
            assignmentName: assignment.name,
            questionId: q.id,
            question: plainText(q.question) || `题目 #${q.id}`,
            correctPercentage: Math.round(correct),
            responseCount: q.responseCount ?? 0,
          });
        }
      }

      for (const attempt of insights?.attempts ?? []) {
        const at = attempt.createdAt
          ? new Date(attempt.createdAt).getTime()
          : 0;
        activityCandidates.push({
          at,
          item: {
            key: `${assignment.id}-${attempt.id}`,
            who: displayName(attempt.userId),
            action: toBool(attempt.submitted)
              ? `提交了《${assignment.name}》`
              : `开始了《${assignment.name}》`,
            time: relativeTime(attempt.createdAt),
          },
        });
      }
    }),
  );

  const trend: TrendPoint[] = dayBuckets.map(({ start, label }) => ({
    label,
    submitted: dailySubmissions.get(start) ?? 0,
    avgGrade: 0,
  }));

  // Daily accuracy is not available per-day server-side; fall back to the
  // overall average so the line stays honest rather than fabricating deltas.
  const overallAverage =
    gradeCount > 0 ? Math.round(gradeSum / gradeCount) : undefined;
  for (const point of trend) {
    if (overallAverage !== undefined) point.avgGrade = overallAverage;
  }

  const activities = activityCandidates
    .sort((a, b) => b.at - a.at)
    .slice(0, 5)
    .map(({ item }) => item);

  weakQuestions.sort((a, b) => a.correctPercentage - b.correctPercentage);

  const todos: TodoItem[] = [];
  if (pendingGrading > 0) {
    todos.push({
      key: "pending-grading",
      title: `${pendingGrading} 份作业等待批改确认`,
      meta: "AI 已评分，等待教师确认",
      tone: "info",
    });
  }
  for (const weak of weakQuestions.slice(0, 3)) {
    todos.push({
      key: weak.key,
      title: `正确率仅 ${weak.correctPercentage}%：${weak.question.slice(0, 18)}`,
      meta: weak.assignmentName,
      tone: weak.correctPercentage < 30 ? "critical" : "warning",
      href: `/author/${weak.assignmentId}/insights`,
    });
  }
  if (todaySubmissions === 0) {
    todos.push({
      key: "no-submissions",
      title: "今天还没有新的作业提交",
      meta: "可在作业页提醒学生",
      tone: "good",
    });
  }

  return {
    teacherName: user?.userId ? displayName(user.userId) : "老师",
    greeting: greetingFor(new Date().getHours()),
    hasSession: Boolean(user),
    assignmentId: user?.assignmentId,
    role: user?.role,
    assignments: summaries.sort((a, b) => b.id - a.id),
    totals: {
      todaySubmissions,
      pendingGrading,
      wrongAnswers,
      weakQuestionCount: weakQuestions.length,
      totalAttempts,
      uniqueLearners,
      averageGrade: overallAverage ?? 0,
      assignmentCount: assignments.length,
    },
    trend,
    activities,
    todos,
    weakQuestions: weakQuestions.slice(0, 5),
  };
}

export interface StudentSummary {
  userId: string;
  name: string;
  assignmentCount: number;
  submittedCount: number;
  /** Percentage (0-100) or null when nothing has been graded yet. */
  averageGrade: number | null;
  lastActivityAt: string | null;
  lastAssignmentName: string;
}

/**
 * Student roster derived from real submission data.
 *
 * There is no Student/Class table — learners only ever appear as the `userId`
 * on an AssignmentAttempt — so the roster is aggregated from the attempts
 * endpoints that already exist. Every number below is measured, not invented.
 */
export async function loadStudents(limit = 30): Promise<StudentSummary[]> {
  const assignments = (await getAssignments().catch(() => undefined)) ?? [];
  const scoped = [...assignments]
    .sort((a, b) => b.id - a.id)
    .slice(0, MAX_ASSIGNMENTS);

  interface Row {
    assignmentIds: Set<number>;
    submittedCount: number;
    gradeSum: number;
    gradeCount: number;
    lastAt: number;
    lastAssignmentName: string;
  }

  const rows = new Map<string, Row>();

  await Promise.all(
    scoped.map(async (assignment) => {
      const attempts =
        (await getAttempts(assignment.id).catch(() => undefined)) ?? [];

      for (const attempt of attempts) {
        const userId = attempt.userId ?? "unknown";
        let row = rows.get(userId);
        if (!row) {
          row = {
            assignmentIds: new Set<number>(),
            submittedCount: 0,
            gradeSum: 0,
            gradeCount: 0,
            lastAt: 0,
            lastAssignmentName: "",
          };
          rows.set(userId, row);
        }

        row.assignmentIds.add(assignment.id);
        if (toBool(attempt.submitted)) row.submittedCount += 1;
        if (attempt.grade !== null && attempt.grade !== undefined) {
          row.gradeSum += attempt.grade;
          row.gradeCount += 1;
        }

        const at = attempt.createdAt
          ? new Date(attempt.createdAt).getTime()
          : 0;
        if (at >= row.lastAt) {
          row.lastAt = at;
          row.lastAssignmentName = assignment.name;
        }
      }
    }),
  );

  return [...rows.entries()]
    .map(([userId, row]) => ({
      userId,
      name: displayName(userId),
      assignmentCount: row.assignmentIds.size,
      submittedCount: row.submittedCount,
      averageGrade:
        row.gradeCount > 0
          ? Math.round((row.gradeSum / row.gradeCount) * 100)
          : null,
      lastActivityAt:
        row.lastAt > 0 ? new Date(row.lastAt).toISOString() : null,
      lastAssignmentName: row.lastAssignmentName,
    }))
    .sort((a, b) =>
      (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""),
    )
    .slice(0, limit);
}
