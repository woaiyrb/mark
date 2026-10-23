import Title from "@/components/Title";
import type { FC } from "react";

interface PageTitleProps {
  title: string;
  description?: string;
}

const PageTitle: FC<PageTitleProps> = ({ title, description }) => (
  <section className="flex flex-col gap-y-2 text-gray-900 dark:text-gray-100">
    <div className="mark-title-accent">
      <Title level={1} className="tracking-tight">
        {title}
      </Title>
    </div>
    {description && (
      <p className="max-w-3xl text-base font-[450] leading-7 text-gray-600 dark:text-gray-300">
        {description}
      </p>
    )}
  </section>
);

export default PageTitle;
