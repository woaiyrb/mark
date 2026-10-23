"use client";

/**
 * Sidebar shared by the teacher dashboard and the author editor, so the two
 * surfaces read as one product instead of two apps with separate chrome.
 *
 * Entries that need an assignment context are greyed out when the session has
 * no assignment id, and entities the backend does not model yet (class roster,
 * knowledge points) stay greyed out rather than becoming dead links.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  FileQuestion,
  GraduationCap,
  Home,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherSidebarProps {
  assignmentId?: number;
  userName?: string;
  className?: string;
}

export default function TeacherSidebar({
  assignmentId,
  userName,
  className,
}: TeacherSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "首页", href: "/dashboard" },
    {
      icon: BookOpen,
      label: "作业",
      href: assignmentId ? `/author/${assignmentId}` : undefined,
    },
    {
      icon: FileQuestion,
      label: "题目",
      href: assignmentId ? `/author/${assignmentId}/questions` : undefined,
    },
    {
      icon: BarChart3,
      label: "统计洞察",
      href: assignmentId ? `/author/${assignmentId}/insights` : undefined,
    },
    {
      // Wrong-answer view = insights, which ranks every question by
      // correct-percentage. No separate endpoint exists.
      icon: AlertCircle,
      label: "错题",
      href: assignmentId ? `/author/${assignmentId}/insights` : undefined,
    },
    // Roster aggregated from real attempts — see app/dashboard/data.ts.
    { icon: Users, label: "学生", href: "/dashboard/students" },
    { icon: GraduationCap, label: "班级", href: "/dashboard/classes" },
    {
      icon: Sparkles,
      label: "知识点",
      href: "/dashboard/knowledge-points",
    },
    { icon: Settings, label: "设置", href: "/admin" },
  ];

  const isActive = (href?: string) => Boolean(href && pathname === href);

  return (
    <aside
      className={cn(
        "flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6",
        className,
      )}
    >
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <span className="text-lg font-bold">Σ</span>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map(({ icon: Icon, label, href }) =>
          href ? (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive(href)
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ) : (
            <span
              key={label}
              className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300"
            >
              <Icon className="h-5 w-5" />
              {label}
            </span>
          ),
        )}
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {(userName ?? "老").slice(0, 1)}
          </div>
        </div>
      </div>
    </aside>
  );
}
