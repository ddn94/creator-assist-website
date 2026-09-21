"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CategoryCard } from "@/components/CategoryCard";
import { CategoryPill } from "@/components/CategoryPill";
import { DeliverableTable } from "@/components/DeliverableTable";
import { ExpenseTable } from "@/components/ExpenseTable";
import { Field } from "@/components/Field";
import { Select } from "@/components/Select";
import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import { TextArea } from "@/components/TextArea";
import { TextField } from "@/components/TextField";
import { deleteContent, upsertContent } from "@/lib/mockStore";
import { useSelfContentPlatformOptions, useTrackerDetail } from "@/lib/useMockDb";
import {
  CONTENT_TYPE_OPTIONS,
  DELIVERABLE_TYPE_OPTIONS,
  EXPENSE_CATEGORY_OPTIONS,
  PAYMENT_TERM_OPTIONS,
  STAGE_OPTIONS,
  computeDealStatus,
  computeDueDate,
  contentCategory,
  contentPillLabel,
  dealStatusTone,
  DEAL_STATUS_LABELS,
  deliverablesTotal,
  formatLiveDate,
  fmtMoney,
  type TrackerDetail,
  type TrackerDeliverable,
  type TrackerExpense,
} from "@/lib/tracker";

type ContentDetailViewProps = {
  id: string;
};

export function ContentDetailView({ id }: ContentDetailViewProps) {
  const stored = useTrackerDetail(id);

  if (!stored) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <Text variant="heading" className="text-2xl">
          Content not found
        </Text>
        <Text variant="description" className="mt-2">
          This item may have been deleted.
        </Text>
        <Button href="/home/tracker" className="mt-6" size="sm">
          Back to tracker
        </Button>
      </div>
    );
  }

  return <ContentDetailEditor key={stored.id} initial={stored} />;
}

function ContentDetailEditor({ initial }: { initial: TrackerDetail }) {
  const router = useRouter();
  const stored = useTrackerDetail(initial.id);
  const [item, setItem] = useState(initial);
  const platformOptions = useSelfContentPlatformOptions(item.platform);

  useEffect(() => {
    if (stored) setItem(stored);
  }, [stored]);

  const isPaid = item.type === "paid_collab";
  const totalExpenses = item.expenses.reduce((sum, e) => sum + e.amount, 0);
  const fee = item.deal?.feeAgreed ?? 0;
  const dealStatus = item.deal ? computeDealStatus(item.deal) : null;
  const dueDate = item.deal ? computeDueDate(item.deal) : null;
  const deliverableSum = item.deal
    ? deliverablesTotal(item.deal.deliverables)
    : 0;

  function commit(next: TrackerDetail) {
    setItem(next);
    upsertContent({
      ...next,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  }

  function removeDeliverable(deliverableId: string) {
    if (!item.deal) return;
    commit({
      ...item,
      deal: {
        ...item.deal,
        deliverables: item.deal.deliverables.filter(
          (d) => d.id !== deliverableId,
        ),
      },
    });
  }

  function removeExpense(expenseId: string) {
    commit({
      ...item,
      expenses: item.expenses.filter((e) => e.id !== expenseId),
    });
  }

  function handleDelete() {
    deleteContent(item.id);
    router.push("/home/tracker");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <BackLink href="/home/tracker" label="Back" />
        <button
          type="button"
          aria-label="Delete content item"
          title="Delete"
          onClick={handleDelete}
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-card text-danger shadow-card transition-colors hover:bg-organic"
        >
          <TrashIcon size={18} weight="regular" aria-hidden />
        </button>
      </div>

      <div className="mb-5">
        <CategoryPill category={contentCategory(item.type)}>
          {contentPillLabel(item.type)}
        </CategoryPill>
        <Text variant="heading" className="mt-2.5 text-2xl sm:text-3xl">
          {item.title}
        </Text>
      </div>

      <Card className="mb-5">
        <Text variant="title" className="mb-3 text-base">
          Details
        </Text>
        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const type =
              data.get("type") === "paid_collab" ? "paid_collab" : "organic";
            commit({
              ...item,
              title: String(data.get("title") ?? item.title),
              platform: String(data.get("platform") ?? item.platform),
              niche: String(data.get("niche") ?? "").trim() || null,
              type,
              brandName:
                type === "paid_collab"
                  ? String(data.get("brandName") ?? "").trim() || null
                  : null,
              stage: (String(data.get("stage") ?? item.stage) as typeof item.stage),
              goLiveDate: String(data.get("goLiveDate") ?? "") || null,
              shotList: String(data.get("shotList") ?? ""),
              notes: String(data.get("notes") ?? ""),
              deal:
                type === "paid_collab"
                  ? item.deal ?? {
                      feeAgreed: 0,
                      paymentTerms: "net_30",
                      dateDelivered: null,
                      dateInvoiced: null,
                      datePaid: null,
                      deliverables: [],
                    }
                  : null,
            });
          }}
        >
          <Field id="title" label="Title" className="md:col-span-2">
            <TextField
              id="title"
              name="title"
              defaultValue={item.title}
              required
              size="sm"
              full
            />
          </Field>
          <Field id="platform" label="Platform">
            <Select
              id="platform"
              name="platform"
              defaultValue={item.platform}
              options={platformOptions}
              size="sm"
              full
            />
          </Field>
          <Field id="niche" label="Niche / tag">
            <TextField
              id="niche"
              name="niche"
              defaultValue={item.niche ?? ""}
              size="sm"
              full
            />
          </Field>
          <Field id="type" label="Type">
            <Select
              id="type"
              name="type"
              defaultValue={item.type}
              options={[...CONTENT_TYPE_OPTIONS]}
              size="sm"
              full
            />
          </Field>
          <Field id="brandName" label="Brand">
            <TextField
              id="brandName"
              name="brandName"
              defaultValue={item.brandName ?? ""}
              size="sm"
              full
            />
          </Field>
          <Field id="stage" label="Stage">
            <Select
              id="stage"
              name="stage"
              defaultValue={item.stage}
              options={STAGE_OPTIONS}
              size="sm"
              full
            />
          </Field>
          <Field id="goLiveDate" label="Go-live date">
            <TextField
              id="goLiveDate"
              name="goLiveDate"
              type="date"
              defaultValue={item.goLiveDate ?? ""}
              size="sm"
              full
            />
          </Field>
          <Field id="shotList" label="Shot list" className="md:col-span-2">
            <TextArea
              id="shotList"
              name="shotList"
              defaultValue={item.shotList}
              rows={3}
              placeholder="Shots, angles, references — plan it while it's in Concept"
              size="sm"
              full
            />
          </Field>
          <Field id="notes" label="Notes" className="md:col-span-2">
            <TextArea
              id="notes"
              name="notes"
              defaultValue={item.notes}
              rows={4}
              size="sm"
              full
            />
          </Field>
          <div>
            <Button type="submit" size="sm" className="h-10">
              Save
            </Button>
          </div>
        </form>
      </Card>

      {isPaid && item.deal ? (
        <CategoryCard category="payment" className="mb-5 p-6 sm:p-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Text variant="title" className="text-base">
              Deal
            </Text>
            {dealStatus ? (
              <StatusTag
                label={DEAL_STATUS_LABELS[dealStatus]}
                tone={dealStatusTone[dealStatus]}
              />
            ) : null}
          </div>

          <form
            className="grid grid-cols-1 gap-3 md:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!item.deal) return;
              const data = new FormData(event.currentTarget);
              commit({
                ...item,
                deal: {
                  ...item.deal,
                  feeAgreed: Number(data.get("feeAgreed") || 0),
                  paymentTerms: (String(data.get("paymentTerms") ?? "net_30") ||
                    "net_30") as typeof item.deal.paymentTerms,
                  dateDelivered: String(data.get("dateDelivered") ?? "") || null,
                  dateInvoiced: String(data.get("dateInvoiced") ?? "") || null,
                  datePaid: String(data.get("datePaid") ?? "") || null,
                },
              });
            }}
          >
            <Field id="feeAgreed" label="Fee agreed">
              <TextField
                id="feeAgreed"
                name="feeAgreed"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item.deal.feeAgreed || ""}
                size="sm"
                full
              />
            </Field>
            <Field id="paymentTerms" label="Payment terms">
              <Select
                id="paymentTerms"
                name="paymentTerms"
                defaultValue={item.deal.paymentTerms}
                options={[...PAYMENT_TERM_OPTIONS]}
                size="sm"
                full
              />
            </Field>
            <Field id="dateDelivered" label="Date delivered">
              <TextField
                id="dateDelivered"
                name="dateDelivered"
                type="date"
                defaultValue={item.deal.dateDelivered ?? ""}
                size="sm"
                full
              />
            </Field>
            <Field id="dateInvoiced" label="Date invoiced">
              <TextField
                id="dateInvoiced"
                name="dateInvoiced"
                type="date"
                defaultValue={item.deal.dateInvoiced ?? ""}
                size="sm"
                full
              />
            </Field>
            <Field id="datePaid" label="Date paid">
              <TextField
                id="datePaid"
                name="datePaid"
                type="date"
                defaultValue={item.deal.datePaid ?? ""}
                size="sm"
                full
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3 md:col-span-3">
              <Button type="submit" size="sm" className="h-10">
                Save deal
              </Button>
              <Text variant="caption" className="text-sm">
                Due date:{" "}
                <span className="font-semibold text-ink">
                  {dueDate ? formatLiveDate(dueDate) : "—"}
                </span>
              </Text>
            </div>
          </form>

          <div className="mt-5 border-t border-border pt-4">
            <Text variant="cardTitle" className="mb-2 text-sm">
              Deliverables
            </Text>
            <DeliverableTable
              deliverables={item.deal.deliverables}
              onRemove={removeDeliverable}
              variant="plain"
            />
            {item.deal.deliverables.length > 0 &&
            deliverableSum !== item.deal.feeAgreed ? (
              <Text
                variant="caption"
                className="mb-3 rounded-lg border border-idea-pill/40 bg-idea px-2.5 py-1.5 text-xxs text-ink"
              >
                Deliverables total ({fmtMoney(deliverableSum)}) differs from the
                agreed fee ({fmtMoney(item.deal.feeAgreed)}). P&L uses the agreed
                fee.
              </Text>
            ) : null}
            <form
              className="grid grid-cols-3 items-end gap-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,1fr)_auto] md:gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!item.deal) return;
                const data = new FormData(event.currentTarget);
                const type = String(data.get("type") ?? "video") as TrackerDeliverable["type"];
                const quantity = Number(data.get("quantity") || 1);
                const rate = Number(data.get("rate") || 0);
                if (!rate) return;
                commit({
                  ...item,
                  deal: {
                    ...item.deal,
                    deliverables: [
                      ...item.deal.deliverables,
                      {
                        id: `d-${Date.now()}`,
                        type,
                        quantity,
                        rate,
                      },
                    ],
                  },
                });
                event.currentTarget.reset();
              }}
            >
              <Field id="deliverableType" label="Type" className="min-w-0">
                <Select
                  id="deliverableType"
                  name="type"
                  defaultValue="video"
                  options={[...DELIVERABLE_TYPE_OPTIONS]}
                  size="sm"
                  full
                />
              </Field>
              <Field id="quantity" label="Volume" className="min-w-0">
                <TextField
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue={1}
                  size="sm"
                  full
                />
              </Field>
              <Field id="rate" label="Rate (per unit)" className="min-w-0">
                <TextField
                  id="rate"
                  name="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  size="sm"
                  full
                />
              </Field>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="col-span-3 h-10 w-full md:col-span-1 md:w-auto"
              >
                Add deliverable
              </Button>
            </form>
          </div>
        </CategoryCard>
      ) : null}

      <Card className="mb-5">
        <Text variant="title" className="mb-3 text-base">
          Expenses{" "}
          <span className="font-sans text-sm font-normal text-muted">
            (total {fmtMoney(totalExpenses)})
          </span>
        </Text>
        <ExpenseTable
          expenses={item.expenses}
          onRemove={removeExpense}
          variant="plain"
        />
        <form
          className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-end md:gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const amount = Number(data.get("amount") || 0);
            if (!amount) return;
            const category = String(
              data.get("category") ?? "other",
            ) as TrackerExpense["category"];
            commit({
              ...item,
              expenses: [
                {
                  id: `e-${Date.now()}`,
                  category,
                  amount,
                  note: String(data.get("note") ?? "").trim() || null,
                  date:
                    String(data.get("date") ?? "") ||
                    new Date().toISOString().slice(0, 10),
                },
                ...item.expenses,
              ],
            });
            event.currentTarget.reset();
          }}
        >
          <Field id="expenseCategory" label="Category" className="min-w-0">
            <Select
              id="expenseCategory"
              name="category"
              defaultValue="editor"
              options={[...EXPENSE_CATEGORY_OPTIONS]}
              size="sm"
              full
            />
          </Field>
          <Field id="expenseAmount" label="Amount" className="min-w-0">
            <TextField
              id="expenseAmount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              size="sm"
              full
            />
          </Field>
          <Field id="expenseDate" label="Date" className="min-w-0">
            <TextField
              id="expenseDate"
              name="date"
              type="date"
              size="sm"
              full
            />
          </Field>
          <Field
            id="expenseNote"
            label="Note"
            className="min-w-0 md:min-w-40 md:flex-1"
          >
            <TextField id="expenseNote" name="note" size="sm" full />
          </Field>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            className="col-span-2 h-10 w-full md:w-auto"
          >
            Add expense
          </Button>
        </form>
      </Card>

      {isPaid && item.deal ? (
        <Card className="mb-5">
          <Text variant="title" className="mb-2 text-base">
            Profit for this item
          </Text>
          <Text variant="description">
            Fee {fmtMoney(fee)} − Expenses {fmtMoney(totalExpenses)} ={" "}
            <span
              className={[
                "font-display text-base font-bold",
                fee - totalExpenses >= 0 ? "text-primary-hover" : "text-danger",
              ].join(" ")}
            >
              {fmtMoney(fee - totalExpenses)}
            </span>
          </Text>
        </Card>
      ) : null}

      {item.ideaTitle ? (
        <Card className="mb-5">
          <Text variant="title" className="mb-2 text-base">
            Created from idea
          </Text>
          <Text variant="description">
            💡 {item.ideaTitle}{" "}
            <Button href="/home/ideas">(view in brain dump)</Button>
          </Text>
        </Card>
      ) : null}
    </div>
  );
}
