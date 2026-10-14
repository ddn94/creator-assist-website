"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddContentPanel } from "@/components/AddContentPanel";
import { FormAlert } from "@/components/FormAlert";
import { showToast } from "@/components/Toast";
import { addContentForRecordAction } from "@/lib/data/actions";
import type { ContentType } from "@/lib/tracker";

type RecordContentFormProps = {
  recordId: string;
  platformOptions: { value: string; label: string }[];
};

export function RecordContentForm({
  recordId,
  platformOptions,
}: RecordContentFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <AddContentPanel
        label="Add deal"
        platformOptions={platformOptions}
        onAdd={(payload) => {
          if (!payload.title.trim()) return;
          const type: ContentType =
            payload.type === "paid_collab" ? "paid_collab" : "organic";
          setError(null);
          void addContentForRecordAction(recordId, {
            title: payload.title,
            platform: payload.platform,
            niche: payload.niche.trim() || null,
            type,
            brandName:
              type === "paid_collab" ? payload.brandName.trim() || null : null,
            goLiveDate: payload.goLiveDate || null,
            notes: payload.notes,
          }).then((result) => {
            if ("error" in result) {
              setError(result.error);
              return;
            }
            showToast(`“${payload.title.trim()}” was added for them.`);
            router.refresh();
          });
        }}
      />
      {error ? (
        <div className="mb-4">
          <FormAlert error={error} />
        </div>
      ) : null}
    </div>
  );
}
