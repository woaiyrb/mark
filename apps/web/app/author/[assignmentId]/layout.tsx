import type { ReactNode } from "react";
import AuthorAccess from "@/components/AuthorAccess";
import TeacherSidebar from "@/components/TeacherSidebar";

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const awbUrl =
    process.env.AWB_URL ||
    (process.env.APP_ENV === "staging"
      ? "https://author.staging.skills.network"
      : "https://author.skills.network");
  return (
    <AuthorAccess
      key={assignmentId}
      assignmentId={Number(assignmentId)}
      awbUrl={awbUrl}
      providerId={process.env.AWB_MARK_PROVIDER_ID}
    >
      {/* Same sidebar as the teacher dashboard, so the author editor is part
          of the same product shell. Hidden on small screens, where the editor
          needs the full width. */}
      <div className="flex min-h-full">
        <TeacherSidebar
          assignmentId={Number(assignmentId)}
          className="sticky top-28 hidden max-h-[calc(100vh-8rem)] self-start overflow-y-auto lg:flex"
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AuthorAccess>
  );
}
