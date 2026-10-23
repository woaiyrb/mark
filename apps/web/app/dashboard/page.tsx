"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TeacherSidebar from "@/components/TeacherSidebar";
import { loadDashboardData, type DashboardData } from "./data";

const kpiSpark = (values: number[], w = 100, h = 32): string =>
  values
    .map((v, i) => {
      const max = Math.max(...values, 1);
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    })
    .join(" ");

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadDashboardData()
      .then((result) => {
        if (!alive) return;
        setData(result);
        setUpdatedAt(new Date());
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "加载工作台数据失败");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const assignmentId = data?.assignmentId;

  // Header search filters the assignment list we already loaded.
  const trimmedQuery = query.trim().toLowerCase();
  const searchMatches = trimmedQuery
    ? (data?.assignments ?? [])
        .filter((item) => item.name.toLowerCase().includes(trimmedQuery))
        .slice(0, 6)
    : [];

  const totals = data?.totals;
  const kpis = [
    {
      label: "今日提交",
      value: totals?.todaySubmissions ?? 0,
      unit: "份",
      change: `覆盖 ${data?.assignments.length ?? 0} 个作业`,
      tone: "neutral",
      spark: (data?.trend ?? []).map((p) => p.submitted),
    },
    {
      label: "待批改确认",
      value: totals?.pendingGrading ?? 0,
      unit: "份",
      change: "AI 已评分，等待教师确认",
      tone: "info",
    },
    {
      label: "错题作答",
      value: totals?.wrongAnswers ?? 0,
      unit: "次",
      change: `涉及 ${totals?.weakQuestionCount ?? 0} 道薄弱题`,
      tone: "warn",
    },
    {
      label: "平均得分率",
      value: Math.round(totals?.averageGrade ?? 0),
      unit: "%",
      change: `${totals?.uniqueLearners ?? 0} 名学习者参与`,
      tone: "good",
    },
  ] as const;

  const chartW = 600;
  const chartH = 200;
  const pad = { top: 16, bottom: 32, left: 28, right: 12 };
  const innerW = chartW - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;
  const trend = data?.trend ?? [];
  const maxSubmitted = Math.max(...trend.map((p) => p.submitted), 1);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800">
      {/* 左侧导航（与作者端共用同一套侧边栏） */}
      <TeacherSidebar
        assignmentId={assignmentId}
        userName={data?.teacherName}
      />

      {/* 主内容区 */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              {data?.greeting ?? "你好"}，{data?.teacherName ?? "老师"}{" "}
              <span>👋</span>
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              这是您今天的教学概览 · 共 {totals?.assignmentCount ?? 0} 个作业
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索作业……"
                className="h-10 w-72 rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10"
              />
              {searchMatches.length > 0 && (
                <div className="absolute left-0 right-0 top-12 z-20 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {searchMatches.map((item) => (
                    <Link
                      key={item.id}
                      href={`/author/${item.id}/insights`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <span className="truncate font-medium">{item.name}</span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {item.totalAttempts} 次尝试
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={loading}
              title="刷新数据"
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
            </button>
            <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              {(totals?.pendingGrading ?? 0) > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>
            <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
              <HelpCircle className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 pl-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                {(data?.teacherName ?? "老").slice(0, 1)}
              </div>
              <div className="hidden text-sm leading-tight md:block">
                <p className="font-semibold text-slate-900">
                  {data?.teacherName ?? "老师"}
                </p>
                <p className="text-xs text-slate-500">
                  {data?.role === "author"
                    ? "作业作者"
                    : data?.role === "learner"
                      ? "学习者"
                      : "—"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {loading && (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              正在加载教学概览…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && data && !data.hasSession && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              <p className="font-semibold">未检测到登录会话</p>
              <p className="mt-1">
                Mark 通过课程平台会话识别身份。请先从平台进入，或前往
                <Link
                  href="/login?redirect=/dashboard"
                  className="mx-1 font-medium underline"
                >
                  登录页
                </Link>
                使用管理员邮箱验证码登录。
              </p>
            </div>
          )}

          {!loading && !error && data && (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 flex flex-col gap-6 lg:col-span-9">
                {/* KPI */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {kpis.map((kpi) => {
                    const insightsHref = assignmentId
                      ? `/author/${assignmentId}/insights`
                      : undefined;
                    const body = (
                      <>
                        <span className="text-sm text-slate-500">
                          {kpi.label}
                        </span>
                        <div className="mt-3 flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-slate-900">
                            {kpi.value}
                          </span>
                          <span className="text-sm text-slate-500">
                            {kpi.unit}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            kpi.tone === "warn" && "text-amber-600",
                            kpi.tone === "good" && "text-emerald-600",
                            kpi.tone === "info" && "text-slate-500",
                            kpi.tone === "neutral" && "text-slate-500",
                          )}
                        >
                          {kpi.change}
                        </p>
                        {"spark" in kpi && kpi.spark.length > 0 && (
                          <svg
                            className="mt-3 h-10 w-full"
                            viewBox="0 0 100 32"
                            preserveAspectRatio="none"
                          >
                            <polyline
                              fill="none"
                              stroke="#4f46e5"
                              strokeWidth="2"
                              points={kpiSpark(kpi.spark)}
                            />
                          </svg>
                        )}
                      </>
                    );
                    return insightsHref ? (
                      <Link
                        key={kpi.label}
                        href={insightsHref}
                        className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div
                        key={kpi.label}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        {body}
                      </div>
                    );
                  })}
                </div>

                {/* 趋势图 */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        作业提交完成情况
                      </h2>
                      <p className="text-xs text-slate-500">
                        最近 7 天提交份数与平均得分率
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />{" "}
                        提交份数
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />{" "}
                        平均得分率
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <svg
                      viewBox={`0 0 ${chartW} ${chartH}`}
                      className="h-64 w-full min-w-[520px]"
                    >
                      {[0, 50, 100].map((tick) => (
                        <g key={tick}>
                          <line
                            x1={pad.left}
                            y1={pad.top + innerH - (tick / 100) * innerH}
                            x2={chartW - pad.right}
                            y2={pad.top + innerH - (tick / 100) * innerH}
                            stroke="#e2e8f0"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={6}
                            y={pad.top + innerH - (tick / 100) * innerH + 4}
                            className="fill-slate-400 text-[10px]"
                          >
                            {tick}
                          </text>
                        </g>
                      ))}

                      {trend.map((point, i) => {
                        const slot = innerW / Math.max(trend.length, 1);
                        const x = pad.left + i * slot + slot / 2;
                        const barW = Math.min(slot * 0.42, 26);
                        const h = (point.submitted / maxSubmitted) * innerH;
                        return (
                          <g key={point.label}>
                            <rect
                              x={x - barW / 2}
                              y={pad.top + innerH - h}
                              width={barW}
                              height={point.submitted > 0 ? Math.max(h, 2) : 0}
                              rx={4}
                              fill="#6366f1"
                              opacity={0.75}
                            />
                            {point.submitted > 0 && (
                              <text
                                x={x}
                                y={pad.top + innerH - h - 6}
                                textAnchor="middle"
                                className="fill-slate-500 text-[10px]"
                              >
                                {point.submitted}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {trend.length > 0 && (
                        <polyline
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth={2.5}
                          strokeDasharray="6 4"
                          points={trend
                            .map((point, i) => {
                              const slot = innerW / trend.length;
                              const x = pad.left + i * slot + slot / 2;
                              const y =
                                pad.top +
                                innerH -
                                (point.avgGrade / 100) * innerH;
                              return `${x},${y}`;
                            })
                            .join(" ")}
                        />
                      )}

                      {trend.map((point, i) => {
                        const slot = innerW / Math.max(trend.length, 1);
                        const x = pad.left + i * slot + slot / 2;
                        return (
                          <text
                            key={`${point.label}-label`}
                            x={x}
                            y={chartH - 8}
                            textAnchor="middle"
                            className="fill-slate-500 text-[10px]"
                          >
                            {point.label}
                          </text>
                        );
                      })}
                    </svg>
                  </div>

                  {trend.every((p) => p.submitted === 0) && (
                    <p className="mt-2 text-xs text-slate-400">
                      最近 7 天暂无提交记录
                    </p>
                  )}
                </section>

                {/* 作业表现 + 薄弱题目 */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          作业表现
                        </h2>
                        <p className="text-xs text-slate-500">
                          共 {data.assignments.length} 个作业（最多展示 6 个）
                        </p>
                      </div>
                      {assignmentId && (
                        <Link
                          href={`/author/${assignmentId}/insights`}
                          className="flex items-center gap-0.5 text-xs text-indigo-600 hover:underline"
                        >
                          统计洞察 <ChevronRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>

                    {data.assignments.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        还没有作业数据。
                        {assignmentId ? (
                          <Link
                            href={`/author/${assignmentId}`}
                            className="ml-1 text-indigo-600 hover:underline"
                          >
                            去编辑作业
                          </Link>
                        ) : null}
                      </p>
                    ) : (
                      <ul className="space-y-4">
                        {data.assignments.slice(0, 4).map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <Link
                                href={`/author/${item.id}/insights`}
                                className="truncate text-sm font-semibold text-slate-900 hover:text-indigo-600"
                              >
                                {item.name}
                              </Link>
                              <p className="text-xs text-slate-500">
                                {item.totalAttempts} 次尝试 ·{" "}
                                {item.uniqueLearners} 名学习者
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-4 text-right">
                              <div>
                                <p className="text-xs text-slate-500">完成率</p>
                                <p className="text-sm font-bold text-slate-900">
                                  {item.completionRate}%
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">平均分</p>
                                <p className="text-sm font-bold text-slate-900">
                                  {Math.round(item.averageGrade)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">待批改</p>
                                <p className="text-sm font-bold text-amber-600">
                                  {item.pendingGrading}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4">
                      <h2 className="text-base font-bold text-slate-900">
                        薄弱题目
                      </h2>
                      <p className="text-xs text-slate-500">
                        按正确率升序（正确率 &lt; 50% 的题目）
                      </p>
                    </div>

                    {data.weakQuestions.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        暂无正确率偏低的题目。
                      </p>
                    ) : (
                      <ul className="space-y-4">
                        {data.weakQuestions.map((q) => (
                          <li key={q.key}>
                            <div className="flex items-center justify-between gap-3">
                              <Link
                                href={`/author/${q.assignmentId}/insights`}
                                className="min-w-0 truncate text-sm font-medium text-slate-800 hover:text-indigo-600"
                              >
                                {q.question}
                              </Link>
                              <span
                                className={cn(
                                  "shrink-0 text-sm font-bold",
                                  q.correctPercentage < 30
                                    ? "text-red-600"
                                    : "text-amber-600",
                                )}
                              >
                                {q.correctPercentage}%
                              </span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={cn(
                                  "h-full rounded-full",
                                  q.correctPercentage < 30
                                    ? "bg-red-400"
                                    : "bg-amber-400",
                                )}
                                style={{ width: `${q.correctPercentage}%` }}
                              />
                            </div>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {q.assignmentName} · {q.responseCount} 次作答
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              </div>

              {/* 右侧 */}
              <div className="col-span-12 flex flex-col gap-6 lg:col-span-3">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">
                      待处理事项
                    </h2>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                      {data.todos.length}
                    </span>
                  </div>
                  {data.todos.length === 0 ? (
                    <p className="text-sm text-slate-500">全部处理完毕 🎉</p>
                  ) : (
                    <div className="space-y-3.5">
                      {data.todos.map((item) => (
                        <TodoRow key={item.key} item={item} />
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">
                      最近活动
                    </h2>
                    {assignmentId && (
                      <Link
                        href={`/author/${assignmentId}/insights`}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        全部
                      </Link>
                    )}
                  </div>
                  {data.activities.length === 0 ? (
                    <p className="text-sm text-slate-500">暂无活动记录。</p>
                  ) : (
                    <div className="space-y-4">
                      {data.activities.map((act) => (
                        <div key={act.key} className="flex gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-800">
                              <span className="font-semibold">{act.who}</span>{" "}
                              {act.action}
                            </p>
                            <p className="text-xs text-slate-500">{act.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {updatedAt && !loading && (
            <p className="mt-5 text-right text-[11px] text-slate-400">
              数据更新于 {updatedAt.toLocaleTimeString()} · 刷新可获取最新提交
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function TodoRow({ item }: { item: DashboardData["todos"][number] }) {
  const dot =
    item.tone === "critical"
      ? "bg-red-500"
      : item.tone === "warning"
        ? "bg-amber-500"
        : item.tone === "good"
          ? "bg-emerald-500"
          : "bg-indigo-500";

  const body = (
    <>
      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{item.title}</p>
        <p className="text-xs text-slate-500">{item.meta}</p>
      </div>
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="flex items-start gap-3 hover:underline">
        {body}
      </Link>
    );
  }
  return <div className="flex items-start gap-3">{body}</div>;
}
