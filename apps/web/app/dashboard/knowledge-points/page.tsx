"use client";

/**
 * Knowledge points and their question tagging.
 *
 * Mastery shown here is measured: each tagged question's correct-percentage
 * comes from the assignment insights endpoint, so the numbers are real
 * submission data rather than an invented mastery score.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Sparkles, Trash2 } from "lucide-react";
import TeacherSidebar from "@/components/TeacherSidebar";
import {
  archiveKnowledgePoint,
  attachQuestionToKnowledgePoint,
  createKnowledgePoint,
  detachQuestionFromKnowledgePoint,
  knowledgePointQuestions,
  listKnowledgePoints,
  type KnowledgePointQuestion,
  type KnowledgePointSummary,
} from "@/lib/classes";
import { getAssignments, getAuthorAssignmentInsights } from "@/lib/shared";

interface AssignmentOption {
  id: number;
  name: string;
}

interface QuestionOption {
  id: number;
  question: string;
}

export default function KnowledgePointsPage() {
  const [points, setPoints] = useState<KnowledgePointSummary[] | null>(null);
  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");

  const [openPointId, setOpenPointId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<KnowledgePointQuestion[]>([]);

  // Tagging panel: pick an assignment, then tag one of its questions.
  const [taggingAssignment, setTaggingAssignment] = useState<number | null>(
    null,
  );
  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [rows, assignmentRows] = await Promise.all([
        listKnowledgePoints(),
        getAssignments().catch(() => []),
      ]);
      setPoints(rows);
      setAssignments(
        (assignmentRows ?? []).map((assignment) => ({
          id: assignment.id,
          name: assignment.name,
        })),
      );
    } catch {
      setError("知识点数据加载失败，请确认已登录为教师。");
      setPoints([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openPoint = async (pointId: number) => {
    if (openPointId === pointId) {
      setOpenPointId(null);
      setQuestions([]);
      return;
    }
    setOpenPointId(pointId);
    setQuestions([]);
    try {
      setQuestions(await knowledgePointQuestions(pointId));
    } catch {
      setError("题目加载失败。");
    }
  };

  const loadQuestionOptions = async (assignmentId: number) => {
    setTaggingAssignment(assignmentId);
    setQuestionOptions([]);
    try {
      const insights = (await getAuthorAssignmentInsights(assignmentId)) as
        | { questions?: Array<{ id: number; question?: string }> }
        | undefined;
      setQuestionOptions(
        (insights?.questions ?? []).map((question) => ({
          id: question.id,
          question: question.question ?? `题目 #${question.id}`,
        })),
      );
    } catch {
      setError("该作业的题目列表加载失败。");
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createKnowledgePoint({
        name: name.trim(),
        subject: subject.trim() || undefined,
      });
      setName("");
      setSubject("");
      await refresh();
    } catch {
      setError("创建知识点失败，请重试。");
    }
  };

  const handleAttach = async (questionId: number) => {
    if (openPointId === null) return;
    try {
      await attachQuestionToKnowledgePoint({
        questionId,
        knowledgePointId: openPointId,
        isPrimary: true,
      });
      setQuestions(await knowledgePointQuestions(openPointId));
      await refresh();
    } catch {
      setError("关联题目失败：只能关联自己创建的作业中的题目。");
    }
  };

  const handleDetach = async (linkId: number) => {
    if (openPointId === null) return;
    try {
      await detachQuestionFromKnowledgePoint(linkId);
      setQuestions(await knowledgePointQuestions(openPointId));
      await refresh();
    } catch {
      setError("解除关联失败。");
    }
  };

  const stripHtml = (value: string) =>
    value
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800">
      <TeacherSidebar />

      <main className="flex flex-1 flex-col overflow-auto">
        <header className="border-b border-slate-200 bg-white px-8 py-5">
          <Link
            href="/dashboard"
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            返回工作台
          </Link>
          <h1 className="text-xl font-bold text-slate-900">知识点</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            把题目关联到知识点，掌握度由真实作答数据计算
          </p>
        </header>

        <div className="flex-1 space-y-6 px-8 py-6">
          {error && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Plus className="h-4 w-4" />
              新建知识点
            </h2>
            <div className="flex flex-wrap gap-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="知识点名称，如「一元二次方程」"
                className="min-w-[240px] flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="学科（选填）"
                className="w-40 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </section>

          {points === null ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>
          ) : points.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <Sparkles className="mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">还没有知识点</p>
              <p className="mt-1 text-sm text-slate-400">
                创建知识点后，把题目关联进来即可按知识点查看掌握情况。
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {points.map((point) => (
                <div
                  key={point.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <button
                    onClick={() => void openPoint(point.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {point.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {point.subject || "未设置学科"} · 层级 {point.level}
                      </p>
                    </div>
                    <span className="text-sm text-slate-500">
                      {point.questionCount} 道题目
                    </span>
                  </button>

                  {openPointId === point.id && (
                    <div className="space-y-4 border-t border-slate-100 px-5 py-4">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          已关联题目
                        </p>
                        {questions.length === 0 ? (
                          <p className="text-sm text-slate-400">
                            还没有关联任何题目
                          </p>
                        ) : (
                          <ul className="divide-y divide-slate-100">
                            {questions.map((question) => (
                              <li
                                key={question.linkId}
                                className="flex items-center justify-between gap-3 py-2 text-sm"
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="text-slate-700">
                                    {stripHtml(question.question).slice(
                                      0,
                                      60,
                                    ) || `题目 #${question.questionId}`}
                                  </span>
                                  <span className="ml-2 text-xs text-slate-400">
                                    {question.assignmentName}
                                  </span>
                                </span>
                                <Link
                                  href={`/author/${question.assignmentId}/insights`}
                                  className="text-xs text-indigo-600 hover:underline"
                                >
                                  查看正确率
                                </Link>
                                <button
                                  onClick={() =>
                                    void handleDetach(question.linkId)
                                  }
                                  className="text-slate-400 transition hover:text-rose-600"
                                  title="解除关联"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          关联更多题目
                        </p>
                        <select
                          value={taggingAssignment ?? ""}
                          onChange={(event) =>
                            event.target.value
                              ? void loadQuestionOptions(
                                  Number(event.target.value),
                                )
                              : setTaggingAssignment(null)
                          }
                          className="w-72 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                        >
                          <option value="">选择作业以列出题目</option>
                          {assignments.map((assignment) => (
                            <option key={assignment.id} value={assignment.id}>
                              {assignment.name}
                            </option>
                          ))}
                        </select>

                        {questionOptions.length > 0 && (
                          <ul className="mt-3 max-h-56 divide-y divide-slate-100 overflow-auto rounded-xl border border-slate-200">
                            {questionOptions.map((question) => (
                              <li
                                key={question.id}
                                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                              >
                                <span className="min-w-0 flex-1 truncate text-slate-700">
                                  {stripHtml(question.question).slice(0, 70)}
                                </span>
                                <button
                                  onClick={() => void handleAttach(question.id)}
                                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100"
                                >
                                  关联
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          void archiveKnowledgePoint(point.id).then(refresh)
                        }
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                      >
                        停用该知识点
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
