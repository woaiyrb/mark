"use client";

/**
 * Class roster management.
 *
 * Backed by the real Class / ClassEnrollment / AssignmentClass tables — the
 * roster is whatever the teacher enrols, not a client-side guess.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, Plus, Trash2, Users } from "lucide-react";
import TeacherSidebar from "@/components/TeacherSidebar";
import { getAssignments } from "@/lib/shared";
import {
  addClassStudent,
  archiveClass,
  assignClassAssignment,
  createClass,
  getClass,
  listClasses,
  removeClassStudent,
  type ClassDetail,
  type ClassSummary,
} from "@/lib/classes";

interface AssignmentOption {
  id: number;
  name: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassSummary[] | null>(null);
  const [assignments, setAssignments] = useState<AssignmentOption[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [term, setTerm] = useState("");

  const [openClassId, setOpenClassId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [studentInput, setStudentInput] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<number | null>(
    null,
  );

  const refresh = useCallback(async () => {
    try {
      const [rows, assignmentRows] = await Promise.all([
        listClasses(),
        getAssignments().catch(() => []),
      ]);
      setClasses(rows);
      setAssignments(
        (assignmentRows ?? []).map((assignment) => ({
          id: assignment.id,
          name: assignment.name,
        })),
      );
    } catch {
      setError("班级数据加载失败，请确认已登录为教师。");
      setClasses([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openClass = async (classId: number) => {
    if (openClassId === classId) {
      setOpenClassId(null);
      setDetail(null);
      return;
    }
    setOpenClassId(classId);
    setDetail(null);
    try {
      setDetail(await getClass(classId));
    } catch {
      setError("班级详情加载失败。");
    }
  };

  const reloadDetail = async () => {
    if (openClassId === null) return;
    setDetail(await getClass(openClassId));
    await refresh();
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createClass({
        name: name.trim(),
        subject: subject.trim() || undefined,
        term: term.trim() || undefined,
      });
      setName("");
      setSubject("");
      setTerm("");
      await refresh();
    } catch {
      setError("创建班级失败，请重试。");
    } finally {
      setSaving(false);
    }
  };

  const handleAddStudent = async (classId: number) => {
    const userId = studentInput.trim();
    if (!userId) return;
    try {
      await addClassStudent(classId, { userId });
      setStudentInput("");
      await reloadDetail();
    } catch {
      setError("添加学生失败，请重试。");
    }
  };

  const handleAssign = async (classId: number) => {
    if (selectedAssignment === null) return;
    try {
      await assignClassAssignment(classId, {
        assignmentId: selectedAssignment,
      });
      setSelectedAssignment(null);
      await reloadDetail();
    } catch {
      setError("布置作业失败：只能布置自己创建的作业。");
    }
  };

  const handleArchive = async (classId: number) => {
    try {
      await archiveClass(classId);
      setOpenClassId(null);
      setDetail(null);
      await refresh();
    } catch {
      setError("归档班级失败。");
    }
  };

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
          <h1 className="text-xl font-bold text-slate-900">班级</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            管理班级名册与作业布置 · 共 {classes?.length ?? 0} 个班级
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
              新建班级
            </h2>
            <div className="flex flex-wrap gap-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="班级名称，如「高一(3)班」"
                className="min-w-[220px] flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="学科（选填）"
                className="w-40 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="学期（选填）"
                className="w-40 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleCreate}
                disabled={saving || !name.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </section>

          {classes === null ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <GraduationCap className="mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">还没有班级</p>
              <p className="mt-1 text-sm text-slate-400">
                创建班级后，可以把学生加入名册，并把作业布置给整个班级。
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <button
                    onClick={() => void openClass(item.id)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[item.subject, item.term]
                          .filter(Boolean)
                          .join(" · ") || "未设置学科"}
                        {item.classCode ? ` · 班级码 ${item.classCode}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {item.studentCount} 名学生
                      </span>
                      <span>{item.assignmentCount} 个作业</span>
                    </div>
                  </button>

                  {openClassId === item.id && (
                    <div className="border-t border-slate-100 px-5 py-4">
                      {detail === null ? (
                        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                      ) : (
                        <div className="space-y-5">
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              名册
                            </p>
                            {detail.students.length === 0 ? (
                              <p className="text-sm text-slate-400">
                                还没有学生加入
                              </p>
                            ) : (
                              <ul className="divide-y divide-slate-100">
                                {detail.students.map((student) => (
                                  <li
                                    key={student.userId}
                                    className="flex items-center justify-between py-2 text-sm"
                                  >
                                    <span className="text-slate-700">
                                      {student.displayName || student.userId}
                                      {student.studentNo
                                        ? ` · 学号 ${student.studentNo}`
                                        : ""}
                                    </span>
                                    <button
                                      onClick={() =>
                                        void removeClassStudent(
                                          detail.id,
                                          student.userId,
                                        ).then(reloadDetail)
                                      }
                                      className="text-slate-400 transition hover:text-rose-600"
                                      title="移出班级"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="mt-3 flex gap-2">
                              <input
                                value={studentInput}
                                onChange={(event) =>
                                  setStudentInput(event.target.value)
                                }
                                placeholder="学生 userId / 邮箱前缀"
                                className="w-64 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                              />
                              <button
                                onClick={() => void handleAddStudent(detail.id)}
                                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                              >
                                加入
                              </button>
                            </div>
                          </div>

                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              作业
                            </p>
                            {detail.assignments.length > 0 && (
                              <ul className="mb-3 divide-y divide-slate-100">
                                {detail.assignments.map((link) => (
                                  <li
                                    key={link.assignmentId}
                                    className="flex items-center justify-between py-2 text-sm text-slate-700"
                                  >
                                    <span>{link.name}</span>
                                    <span className="text-xs text-slate-400">
                                      {link.dueAt
                                        ? `截止 ${new Date(
                                            link.dueAt,
                                          ).toLocaleDateString()}`
                                        : "无截止时间"}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="flex gap-2">
                              <select
                                value={selectedAssignment ?? ""}
                                onChange={(event) =>
                                  setSelectedAssignment(
                                    event.target.value
                                      ? Number(event.target.value)
                                      : null,
                                  )
                                }
                                className="w-72 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                              >
                                <option value="">选择要布置的作业</option>
                                {assignments.map((assignment) => (
                                  <option
                                    key={assignment.id}
                                    value={assignment.id}
                                  >
                                    {assignment.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => void handleAssign(detail.id)}
                                disabled={selectedAssignment === null}
                                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                              >
                                布置
                              </button>
                              <button
                                onClick={() => void handleArchive(detail.id)}
                                className="ml-auto rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
                              >
                                归档班级
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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
