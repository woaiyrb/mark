"use client";

/**
 * Student roster.
 *
 * Mark has no Student or Class table — a learner only exists as the `userId`
 * on an AssignmentAttempt — so this page aggregates the real submission list
 * instead of showing invented enrolment data. A class-scoped roster would need
 * a backend model; until then every column here is measured.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import TeacherSidebar from "@/components/TeacherSidebar";
import { loadStudents, type StudentSummary } from "../data";

const relativeTime = (value: string | null): string => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  const minutes = Math.round((Date.now() - parsed.getTime()) / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} 天前`;
  return parsed.toLocaleDateString();
};

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    loadStudents()
      .then((rows) => {
        if (alive) setStudents(rows);
      })
      .catch(() => {
        if (alive) setError("学生数据加载失败，请稍后重试。");
      });
    return () => {
      alive = false;
    };
  }, []);

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
          <h1 className="text-xl font-bold text-slate-900">学生</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            由提交记录聚合 · 共 {students?.length ?? 0} 名学生
          </p>
        </header>

        <div className="flex-1 px-8 py-6">
          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : students === null ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <Users className="mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">
                还没有学生提交记录
              </p>
              <p className="mt-1 text-sm text-slate-400">
                学生完成任意作业后，这里会按提交记录自动聚合出名单。
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">学生</th>
                    <th className="px-6 py-3 font-medium">涉及作业</th>
                    <th className="px-6 py-3 font-medium">提交次数</th>
                    <th className="px-6 py-3 font-medium">平均分</th>
                    <th className="px-6 py-3 font-medium">最近提交</th>
                    <th className="px-6 py-3 font-medium">最近作业</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr
                      key={student.userId}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                            {student.name.slice(0, 1)}
                          </span>
                          <span
                            className="font-medium text-slate-800"
                            title={student.userId}
                          >
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {student.assignmentCount} 个
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {student.submittedCount} 次
                      </td>
                      <td className="px-6 py-3">
                        {student.averageGrade === null ? (
                          <span className="text-slate-400">待批改</span>
                        ) : (
                          <span
                            className={
                              student.averageGrade >= 80
                                ? "font-medium text-emerald-600"
                                : student.averageGrade >= 60
                                  ? "font-medium text-amber-600"
                                  : "font-medium text-rose-600"
                            }
                          >
                            {student.averageGrade}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {relativeTime(student.lastActivityAt)}
                      </td>
                      <td className="max-w-[220px] truncate px-6 py-3 text-slate-600">
                        {student.lastAssignmentName || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
