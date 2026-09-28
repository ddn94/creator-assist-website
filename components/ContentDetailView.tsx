"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CategoryCard } from "@/components/CategoryCard";
import { CategoryPill } from "@/components/CategoryPill";
import { DateField } from "@/components/DateField";
import { DeliverableTable } from "@/components/DeliverableTable";
import { ExpenseTable } from "@/components/ExpenseTable";
import { Field } from "@/components/Field";
import { FormAlert } from "@/components/FormAlert";
import { Select } from "@/components/Select";
import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import { TextArea } from "@/components/TextArea";
import { TextField } from "@/components/TextField";
import { toDateInput } from "@/lib/timestamps";
import {
  deleteContentAction,
  updateContentInvoiceAction,
  upsertContentAction,
} from "@/lib/data/actions";
import {
  CONTENT_TYPE_OPTIONS,
  DELIVERABLE_TYPE_OPTIONS,
  EXPENSE_CATEGORY_OPTIONS,
  PAYMENT_TERM_OPTIONS,
  stageOptionsFor,
  computeDealStatus,
  computeDueDate,
  contentCategory,
  contentPillLabel,
  dealStatusTone,
  DEAL_STATUS_LABELS,
  deliverablesTotal,
  formatLiveDate,
  fmtMoney,
  type ContentType,
  type PaymentTerms,
  type TrackerDeal,
  type TrackerDetail,
  type TrackerDeliverable,
  type TrackerExpense,
} from "@/lib/tracker";

const EMPTY_DEAL: TrackerDeal = {
  feeAgreed: 0,
  paymentTerms: "net_30",
  dateDelivered: null,
  dateInvoiced: null,
  datePaid: null,
  deliverables: [],
};

type ContentDetailViewProps = {
  initial: TrackerDetail;
  platformOptions: { value: string; label: string }[];
  currency: string;
  backHref?: string;
  /** Agency sees the same UI; only invoice dates + terms stay editable. */
  mode?: "talent" | "agency";
};

export function ContentDetailView({
  initial,
  platformOptions,
  currency,
  backHref = "/home/tracker",
  mode = "talent",
}: ContentDetailViewProps) {
  return (
    <ContentDetailEditor
      key={`${initial.id}-${initial.updatedAt}`}
      initial={initial}
      platformOptions={platformOptions}
      currency={currency}
      backHref={backHref}
      mode={mode}
    />
  );
}

function ContentDetailEditor({
  initial,
  platformOptions,
  currency,
  backHref,
  mode,
}: {
  initial: TrackerDetail;
  platformOptions: { value: string; label: string }[];
  currency: string;
  backHref: string;
  mode: "talent" | "agency";
}) {
  const router = useRouter();
  const [item, setItem] = useState(initial);
  const [draftType, setDraftType] = useState<ContentType>(initial.type);
  const [formGeneration, setFormGeneration] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const isAgency = mode === "agency";
  const locked = isAgency;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("section") !== "deal") {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const node = document.getElementById("deal");
      if (!node) return;
      const top = window.scrollY + node.getBoundingClientRect().top - 24;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [item.id]);

  const isPaid = draftType === "paid_collab";
  const visibleDeal = isPaid ? (item.deal ?? EMPTY_DEAL) : null;
  const totalExpenses = item.expenses.reduce((sum, e) => sum + e.amount, 0);
  const fee = visibleDeal?.feeAgreed ?? 0;
  const dealStatus = visibleDeal ? computeDealStatus(visibleDeal) : null;
  const dueDate = visibleDeal ? computeDueDate(visibleDeal) : null;
  const deliverableSum = visibleDeal
    ? deliverablesTotal(visibleDeal.deliverables)
    : 0;

  async function commit(next: TrackerDetail) {
    if (isAgency) return;
    const previous = item;
    setSaveError(null);
    setItem(next);
    const result = await upsertContentAction(next);
    if (result.error) {
      setItem(previous);
      setDraftType(previous.type);
      setFormGeneration((generation) => generation + 1);
      setSaveError(result.error);
      return;
    }
    setDraftType(next.type);
    router.refresh();
  }

  function removeDeliverable(deliverableId: string) {
    if (!item.deal || isAgency) return;
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
    if (isAgency) return;
    commit({
      ...item,
      expenses: item.expenses.filter((e) => e.id !== expenseId),
    });
  }

  async function handleDelete() {
    if (isAgency) return;
    await deleteContentAction(item.id);
    router.push("/home/tracker");
  }

  async function handleDealSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const deal = item.deal ?? (draftType === "paid_collab" ? EMPTY_DEAL : null);
    if (!deal) return;
    const data = new FormData(event.currentTarget);
    const paymentTerms = (String(data.get("paymentTerms") ?? "net_30") ||
      "net_30") as PaymentTerms;
    const dateInvoiced = String(data.get("dateInvoiced") ?? "") || null;
    const datePaid = String(data.get("datePaid") ?? "") || null;

    if (isAgency) {
      if (!item.deal) return;
      if (!dateInvoiced) {
        setInvoiceError("Enter a valid invoice date.");
        return;
      }
      const previous = item;
      setInvoiceError(null);
      setItem({
        ...item,
        deal: {
          ...item.deal,
          paymentTerms,
          dateInvoiced,
          datePaid,
          dateDelivered: item.deal.dateDelivered ?? dateInvoiced,
        },
      });
      setInvoiceSaving(true);
      const result = await updateContentInvoiceAction(item.id, {
        dateInvoiced,
        paymentTerms,
        datePaid,
      });
      setInvoiceSaving(false);
      if (result.error) {
        setItem(previous);
        setInvoiceError(result.error);
        return;
      }
      router.refresh();
      return;
    }

    commit({
      ...item,
      type: "paid_collab",
      deal: {
        ...deal,
        feeAgreed: Number(data.get("feeAgreed") || 0),
        paymentTerms,
        dateDelivered: String(data.get("dateDelivered") ?? "") || null,
        dateInvoiced,
        datePaid,
      },
    });
  }

  const money = (amount: number) => fmtMoney(amount, currency);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <BackLink href={backHref} label="Back" />
        <button
          type="button"
          aria-label="Delete content item"
          title="Delete"
          onClick={handleDelete}
          disabled={locked}
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-card text-danger shadow-card transition-colors hover:bg-organic disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card"
        >
          <TrashIcon size={18} weight="regular" aria-hidden />
        </button>
      </div>

      <div className="mb-5">
        <CategoryPill category={contentCategory(draftType)}>
          {contentPillLabel(draftType)}
        </CategoryPill>
        <Text variant="heading" className="mt-2.5 text-2xl sm:text-3xl">
          {item.title}
        </Text>
        {saveError ? (
          <div className="mt-3">
            <FormAlert error={saveError} />
          </div>
        ) : null}
      </div>

      <Card className="mb-5">
        <Text variant="title" className="mb-3 text-base">
          Details
        </Text>
        <form
          key={`details-${formGeneration}`}
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (locked) return;
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
              disabled={locked}
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
              disabled={locked}
              size="sm"
              full
            />
          </Field>
          <Field id="niche" label="Niche / tag">
            <TextField
              id="niche"
              name="niche"
              defaultValue={item.niche ?? ""}
              disabled={locked}
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
              disabled={locked}
              size="sm"
              full
              onChange={(value) =>
                setDraftType(value === "paid_collab" ? "paid_collab" : "organic")
              }
            />
          </Field>
          <Field id="brandName" label="Brand">
            <TextField
              id="brandName"
              name="brandName"
              defaultValue={item.brandName ?? ""}
              disabled={locked}
              size="sm"
              full
            />
          </Field>
          <Field id="stage" label="Stage">
            <Select
              id="stage"
              name="stage"
              defaultValue={item.stage}
              options={stageOptionsFor(item.stage)}
              disabled={locked}
              size="sm"
              full
            />
          </Field>
          <Field id="goLiveDate" label="Go-live date">
            <DateField
              id="goLiveDate"
              name="goLiveDate"
              defaultValue={toDateInput(item.goLiveDate)}
              disabled={locked}
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
              disabled={locked}
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
              disabled={locked}
              size="sm"
              full
            />
          </Field>
          <div>
            <Button type="submit" size="sm" className="h-10" disabled={locked}>
              Save
            </Button>
          </div>
        </form>
      </Card>

      {visibleDeal ? (
        <CategoryCard
          id="deal"
          category="payment"
          className="mb-5 scroll-mt-6 p-6 sm:p-8"
        >
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
            key={`deal-${formGeneration}`}
            className="grid grid-cols-1 gap-3 md:grid-cols-3"
            onSubmit={handleDealSubmit}
          >
            <Field id="feeAgreed" label={`Fee agreed (${currency})`}>
              <TextField
                id="feeAgreed"
                name="feeAgreed"
                type="number"
                step="0.01"
                min="0"
                defaultValue={visibleDeal.feeAgreed || ""}
                disabled={locked}
                size="sm"
                full
              />
            </Field>
            <Field id="paymentTerms" label="Payment terms">
              <Select
                id="paymentTerms"
                name="paymentTerms"
                defaultValue={visibleDeal.paymentTerms}
                options={[...PAYMENT_TERM_OPTIONS]}
                size="sm"
                full
              />
            </Field>
            <Field id="dateDelivered" label="Date delivered">
              <DateField
                id="dateDelivered"
                name="dateDelivered"
                defaultValue={toDateInput(visibleDeal.dateDelivered)}
                disabled={locked}
                size="sm"
                full
              />
            </Field>
            <Field id="dateInvoiced" label="Date invoiced">
              <DateField
                id="dateInvoiced"
                name="dateInvoiced"
                defaultValue={toDateInput(visibleDeal.dateInvoiced)}
                required={isAgency}
                size="sm"
                full
              />
            </Field>
            <Field id="datePaid" label="Date paid">
              <DateField
                id="datePaid"
                name="datePaid"
                defaultValue={toDateInput(visibleDeal.datePaid)}
                size="sm"
                full
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3 md:col-span-3">
              <Button
                type="submit"
                size="sm"
                className="h-10"
                disabled={invoiceSaving}
              >
                {isAgency
                  ? invoiceSaving
                    ? "Saving…"
                    : "Save deal"
                  : "Save deal"}
              </Button>
              <Text variant="caption" className="text-sm">
                Due date:{" "}
                <span className="font-semibold text-ink">
                  {dueDate ? formatLiveDate(dueDate) : "—"}
                </span>
              </Text>
              {invoiceError ? (
                <Text variant="caption" className="text-danger">
                  {invoiceError}
                </Text>
              ) : null}
            </div>
          </form>

          <div className="mt-5 border-t border-border pt-4">
            <Text variant="cardTitle" className="mb-2 text-sm">
              Deliverables
            </Text>
            <DeliverableTable
              deliverables={visibleDeal.deliverables}
              onRemove={locked ? undefined : removeDeliverable}
              variant="plain"
            />
            {visibleDeal.deliverables.length > 0 &&
            deliverableSum !== visibleDeal.feeAgreed ? (
              <Text
                variant="caption"
                className="mb-3 rounded-lg border border-idea-pill/40 bg-idea px-2.5 py-1.5 text-xxs text-ink"
              >
                Deliverables total ({money(deliverableSum)}) differs from the
                agreed fee ({money(visibleDeal.feeAgreed)}). P&L uses the agreed
                fee.
              </Text>
            ) : null}
            <form
              key={`deliverable-${formGeneration}`}
              className="grid grid-cols-3 items-end gap-2 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)_minmax(0,1fr)_auto] md:gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (locked || !visibleDeal) return;
                const data = new FormData(event.currentTarget);
                const type = String(
                  data.get("type") ?? "video",
                ) as TrackerDeliverable["type"];
                const quantity = Number(data.get("quantity") || 1);
                const rate = Number(data.get("rate") || 0);
                if (!rate) return;
                commit({
                  ...item,
                  type: "paid_collab",
                  deal: {
                    ...visibleDeal,
                    deliverables: [
                      ...visibleDeal.deliverables,
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
                  disabled={locked}
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
                  disabled={locked}
                  size="sm"
                  full
                />
              </Field>
              <Field
                id="rate"
                label={`Rate (${currency} per unit)`}
                className="min-w-0"
              >
                <TextField
                  id="rate"
                  name="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  required={!locked}
                  disabled={locked}
                  size="sm"
                  full
                />
              </Field>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={locked}
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
            (total {money(totalExpenses)})
          </span>
        </Text>
        <ExpenseTable
          expenses={item.expenses}
          onRemove={locked ? undefined : removeExpense}
          variant="plain"
        />
        <form
          key={`expense-${formGeneration}`}
          className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-end md:gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (locked) return;
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
              disabled={locked}
              size="sm"
              full
            />
          </Field>
          <Field
            id="expenseAmount"
            label={`Amount (${currency})`}
            className="min-w-0"
          >
            <TextField
              id="expenseAmount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required={!locked}
              disabled={locked}
              size="sm"
              full
            />
          </Field>
          <Field id="expenseDate" label="Date" className="min-w-0">
            <DateField
              id="expenseDate"
              name="date"
              disabled={locked}
              size="sm"
              full
            />
          </Field>
          <Field
            id="expenseNote"
            label="Note"
            className="min-w-0 md:min-w-40 md:flex-1"
          >
            <TextField
              id="expenseNote"
              name="note"
              disabled={locked}
              size="sm"
              full
            />
          </Field>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={locked}
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
            Fee {money(fee)} − Expenses {money(totalExpenses)} ={" "}
            <span
              className={[
                "font-display text-base font-bold",
                fee - totalExpenses >= 0 ? "text-primary-hover" : "text-danger",
              ].join(" ")}
            >
              {money(fee - totalExpenses)}
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
            {locked ? (
              <span className="text-sm font-medium text-muted">
                (view in brain dump)
              </span>
            ) : (
              <Button href="/home/ideas">(view in brain dump)</Button>
            )}
          </Text>
        </Card>
      ) : null}
    </div>
  );
}
