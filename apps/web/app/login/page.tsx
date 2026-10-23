"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Shield, User, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUser } from "@/lib/shared";
import { writeAdminSessionToStorage } from "@/lib/admin-session";
import type { User as MarkUser } from "@config/types";

const roles = [
  { key: "teacher", label: "教师端", icon: GraduationCap },
  { key: "student", label: "学生端", icon: User },
  { key: "admin", label: "管理端", icon: Shield },
] as const;

type RoleKey = (typeof roles)[number]["key"];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<RoleKey>("teacher");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState<MarkUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Mark identifies teachers/students through the course-platform session
  // (GET /api/v1/user-session), not a local password. Admins are the one role
  // that signs in here, via email verification code.
  useEffect(() => {
    let alive = true;
    getUser()
      .then((user) => {
        if (alive) setSessionUser(user ?? null);
      })
      .catch(() => {
        if (alive) setSessionUser(null);
      })
      .finally(() => {
        if (alive) setCheckingSession(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Honour ?redirect=/some/path so a deep link survives the sign-in step.
  // Read from location at click time instead of useSearchParams() to avoid a
  // Suspense boundary requirement on this client page.
  const redirectTarget = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("redirect");
    return next && next.startsWith("/") ? next : "/dashboard";
  }, []);

  const enterWithSession = useCallback(() => {
    if (!sessionUser) return;
    if (role === "student") {
      router.push(
        sessionUser.assignmentId
          ? `/learner/${sessionUser.assignmentId}`
          : redirectTarget(),
      );
      return;
    }
    router.push(redirectTarget());
  }, [redirectTarget, role, router, sessionUser]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/v1/auth/admin/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "验证码发送失败");
      }
      setNotice(data.message || "如果该邮箱已授权，验证码已发送。");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/admin/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "验证码校验失败");
      }
      writeAdminSessionToStorage({
        sessionToken: data.sessionToken,
        email,
        expiresAt: data.expiresAt,
      });
      router.push(redirectTarget());
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证码校验失败");
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (sessionUser) {
      enterWithSession();
      return;
    }
    setError(
      "未检测到课程平台会话。教师/学生请从课程平台进入 Mark（账号密码由平台管理），或切换到管理端使用邮箱验证码登录。",
    );
  };

  const isAdmin = role === "admin";

  return (
    <main className="flex h-screen w-full overflow-hidden bg-white font-sans text-slate-800">
      {/* 左侧品牌区 */}
      <section className="relative hidden w-[46%] flex-col justify-between bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 p-10 text-white lg:flex">
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <span className="text-2xl font-bold">Σ</span>
          </div>
          <span className="text-lg font-semibold">数学讲评与错题跟踪助手</span>
        </div>

        <div className="relative z-10 max-w-md space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight tracking-tight">
              数学讲评与错题跟踪助手
            </h1>
            <p className="text-indigo-100">
              让每一道错题，都成为下一次进步的起点
            </p>
          </div>

          <div className="space-y-4">
            {[
              { title: "学情数据分析", desc: "班级薄弱知识点一目了然" },
              { title: "AI 智能讲评", desc: "一键生成针对性讲评方案" },
              { title: "错题持续跟踪", desc: "长期追踪每位学生的成长" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/15"
              >
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-indigo-100">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-indigo-200">
          © Mark · 作业批改与学情洞察
        </p>
      </section>

      {/* 右侧登录区 */}
      <section className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-10 sm:px-12">
        <div className="w-full max-w-md space-y-7">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <span className="text-xl font-bold">Σ</span>
            </div>
            <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-slate-900">
              欢迎回来 <span className="text-2xl">👋</span>
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {isAdmin
                ? "使用管理员邮箱验证码登录"
                : "登录教师账号，开始今天的教学工作"}
            </p>
          </div>

          <div className="rounded-pill border border-slate-200 bg-slate-100/70 p-1">
            <div className="grid grid-cols-3 gap-1">
              {roles.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setRole(key);
                    setError("");
                    setNotice("");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-pill py-2 text-sm font-medium transition",
                    role === key
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!isAdmin && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              {checkingSession ? (
                "正在检测平台会话…"
              ) : sessionUser ? (
                <>
                  已检测到平台会话：
                  <span className="font-semibold text-indigo-600">
                    {sessionUser.userId}
                  </span>
                  （{sessionUser.role === "author" ? "教师" : "学生"}
                  {sessionUser.assignmentId
                    ? ` · 作业 #${sessionUser.assignmentId}`
                    : ""}
                  ）
                </>
              ) : (
                "未检测到平台会话。教师/学生身份由课程平台单点登录提供，账号密码由平台管理。"
              )}
            </div>
          )}

          {isAdmin ? (
            step === "email" ? (
              <form onSubmit={handleSendCode} className="space-y-5">
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="管理员邮箱"
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                  />
                </div>
                {renderFeedback()}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="h-11 w-full rounded-pill bg-indigo-600 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:-translate-y-px hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loading ? "发送中…" : "获取验证码"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-5">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="6 位验证码"
                    required
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm tracking-widest outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                  />
                </div>
                {renderFeedback()}
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="h-11 w-full rounded-pill bg-indigo-600 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:-translate-y-px hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loading ? "校验中…" : "登 录"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError("");
                  }}
                  className="w-full text-center text-xs text-slate-500 hover:underline"
                >
                  使用其他邮箱
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handlePlatformSubmit} className="space-y-5">
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="请输入账号"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（由课程平台校验）"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                  />
                  记住我
                </label>
                <a
                  href="https://skills.network"
                  className="text-indigo-600 hover:underline"
                >
                  忘记密码？
                </a>
              </div>

              {renderFeedback()}

              <button
                type="submit"
                disabled={checkingSession}
                className="h-11 w-full rounded-pill bg-indigo-600 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:-translate-y-px hover:bg-indigo-700 disabled:opacity-60"
              >
                {sessionUser ? "进入工作台" : "登 录"}
              </button>
            </form>
          )}

          {!isAdmin && sessionUser && (
            <button
              type="button"
              onClick={enterWithSession}
              className="w-full text-center text-sm font-medium text-indigo-600 hover:underline"
            >
              使用当前会话直接进入 →
            </button>
          )}

          <p className="text-center text-[11px] text-slate-400">
            教师/学生通过课程平台单点登录；管理端使用邮箱验证码登录。
          </p>
        </div>
      </section>
    </main>
  );

  function renderFeedback() {
    if (error) {
      return (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </p>
      );
    }
    if (notice) {
      return (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          {notice}
        </p>
      );
    }
    return null;
  }
}
