import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";

type PageBodyProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
  children: ReactNode;
};

/** Page title and content. The nav lives in the home and workspace layouts. */
export function PageBody({
  title,
  description,
  action,
  back,
  children,
}: PageBodyProps) {
  if (!title) return children;
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={action}
        back={back}
      />
      <div className="mt-6 sm:mt-8">{children}</div>
    </>
  );
}
