"use client";

import { TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { calendarDay } from "@/lib/calendarDay";
import { CURRENCY_OPTIONS, currencyFlag } from "@/lib/countries";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BackLink } from "@/components/BackLink";
import { showToast } from "@/components/Toast";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CategoryCard } from "@/components/CategoryCard";
import { CategoryPill } from "@/components/CategoryPill";
import { DateField } from "@/components/DateField";
import { DeliverableTable } from "@/components/DeliverableTable";
import { ExpenseTable } from "@/components/ExpenseTable";
import { Field } from "@/components/Field";
import { MoneyField } from "@/components/MoneyField";
import { FormAlert } from "@/components/FormAlert";
import { Select } from "@/components/Select";
import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import { TextArea } from "@/components/TextArea";
import { TextField } from "@/components/TextField";
import { toDateInput } from "@/lib/timestamps";
import { convertOnDate, moneyCode, EMPTY_RATE_BOOK, type RateBook } from "@/lib/fx";
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
  type ContentType,
  type PaymentTerms,
  type TrackerDeal,
  type TrackerDetail,
  type TrackerDeliverable,
  type TrackerExpense,
} from "@/lib/tracker";
import type { TalentActivityItem } from "@/lib/talent";

function currencyChoices(code: string) {
  const options = CURRENCY_OPTIONS.some((option) => option.value === code)
    ? CURRENCY_OPTIONS
    : [{ value: code, label: code }, ...CURRENCY_OPTIONS];
  return options.map((option) => ({
    value: option.value,
    label: `${currencyFlag(option.value)} ${option.value}`.trim(),
  }));
}

function controlValue(field: Element) {
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLSelectElement ||
    field instanceof HTMLTextAreaElement
  ) {
    return field.value;
  }
  return "";
}

function readField(form: HTMLFormElement, name: string) {
  const field = form.elements.namedItem(name);
  if (field instanceof RadioNodeList) {
    // A dropdown's hidden input shares its name with the visible control's id,
    // so the form hands back both. The named input holds the chosen value.
    const named = [...field].find(
      (element) =>
        element instanceof HTMLInputElement && element.name === name,
    );
    return named ? controlValue(named) : "";
  }
  if (field instanceof Element) return controlValue(field);
  return "";
}

function unsavedSentence(names: string[]) {
  const label =
    names.length <= 1
      ? names[0] ?? "This section"
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  return `${label} not saved. Leave this page anyway?`;
}

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
  rates?: RateBook;
  backHref?: string;
  /**
   * talent: the owner edits everything.
   * agency: linked talent; only invoice dates and terms stay editable.
   * record: a private card, or a deal the agency logged that both sides still edit.
   */
  mode?: "talent" | "agency" | "record";
  /** Connected talent who has been disconnected: show the deal, do not edit it. */
  dealLocked?: boolean;
  /** Agency edits on this item. Talent tracker pages pass this. */
  activity?: TalentActivityItem[];
};

export function ContentDetailView({
  initial,
  platformOptions,
  currency,
  rates = EMPTY_RATE_BOOK,
  backHref = "/home/tracker",
  mode = "talent",
  dealLocked = false,
  activity,
}: ContentDetailViewProps) {
  return (
    <ContentDetailEditor
      // id only: a save refreshes activity, and updatedAt would remount this
      // editor and throw away typing in the sections that were not saved.
      key={initial.id}
      initial={initial}
      platformOptions={platformOptions}
      currency={currency}
      rates={rates}
      backHref={backHref}
      mode={mode}
      dealLocked={dealLocked}
      activity={activity}
    />
  );
}

function ContentDetailEditor({
  initial,
  platformOptions,
  currency,
  rates,
  backHref,
  mode,
  dealLocked,
  activity,
}: {
  initial: TrackerDetail;
  platformOptions: { value: string; label: string }[];
  currency: string;
  rates: RateBook;
  backHref: string;
  mode: "talent" | "agency" | "record";
  dealLocked: boolean;
  activity?: TalentActivityItem[];
}) {
  const router = useRouter();
  const [item, setItem] = useState(initial);
  const [draftType, setDraftType] = useState<ContentType>(initial.type);
  const [formGeneration, setFormGeneration] = useState({
    details: 0,
    deal: 0,
    deliverable: 0,
    expense: 0,
  });
  const [dealCurrencyDraft, setDealCurrencyDraft] = useState(
    () => initial.deal?.currency?.trim() || currency,
  );
  const [deliverableCurrencyDraft, setDeliverableCurrencyDraft] = useState(
    () => initial.deal?.currency?.trim() || currency,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const saveQueueRef = useRef(Promise.resolve());
  const saveEpochRef = useRef(0);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const isAgency = mode === "agency";
  const locked = isAgency;
  const canDelete = mode === "talent" || (mode === "record" && !initial.creatorId);
  const [removeTarget, setRemoveTarget] = useState<
    "post" | { kind: "deliverable" | "expense"; id: string } | null
  >(null);
  const [removePending, setRemovePending] = useState(false);
  const [expenseOverride, setExpenseOverride] = useState<string | null>(null);
  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(
    null,
  );
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const detailsFormRef = useRef<HTMLFormElement>(null);
  const dealFormRef = useRef<HTMLFormElement>(null);
  const deliverableFormRef = useRef<HTMLFormElement>(null);
  const expenseFormRef = useRef<HTMLFormElement>(null);
  const allowLeaveRef = useRef(false);
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const [leaveSections, setLeaveSections] = useState<string[]>([]);
  const [leaveOpen, setLeaveOpen] = useState(false);

  // A second click in the same moment would build its line from the old list.
  // The lock drops after this update paints, so the next line includes it.
  useEffect(() => {
    savingRef.current = false;
  });

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
  const dealCurrency = visibleDeal?.currency?.trim() || currency;
  const expenseCurrency = expenseOverride ?? dealCurrency;
  const totalExpenses = item.expenses.reduce(
    (sum, expense) =>
      sum +
      convertOnDate(
        expense.amount,
        expense.currency?.trim() || dealCurrency,
        dealCurrency,
        expense.date,
        rates,
      ),
    0,
  );
  const fee = visibleDeal?.feeAgreed ?? 0;
  const dealStatus = visibleDeal ? computeDealStatus(visibleDeal) : null;
  const dueDate = visibleDeal ? computeDueDate(visibleDeal) : null;
  const deliverableSum = visibleDeal
    ? deliverablesTotal(visibleDeal.deliverables)
    : 0;
  const editingDeliverable =
    visibleDeal?.deliverables.find((row) => row.id === editingDeliverableId) ??
    null;
  const editingExpense =
    item.expenses.find((row) => row.id === editingExpenseId) ?? null;
  const typeUnsaved = draftType !== item.type;

  function blockUntilTypeSaved() {
    if (!typeUnsaved) return false;
    showToast("Save the type first.", "danger");
    return true;
  }

  function unsavedSections() {
    const names: string[] = [];
    const details = detailsFormRef.current;
    if (details && !locked) {
      const type = readField(details, "type") || draftType;
      const detailsChanged =
        readField(details, "title") !== item.title ||
        readField(details, "platform") !== item.platform ||
        readField(details, "niche").trim() !== (item.niche ?? "") ||
        type !== item.type ||
        draftType !== item.type ||
        readField(details, "brandName").trim() !== (item.brandName ?? "") ||
        readField(details, "stage") !== item.stage ||
        (readField(details, "goLiveDate") || "") !== toDateInput(item.goLiveDate) ||
        readField(details, "shotList") !== item.shotList ||
        readField(details, "notes") !== item.notes;
      if (detailsChanged) names.push("Details");
    }

    const deal = dealFormRef.current;
    if (deal && !dealLocked) {
      const saved = item.deal;
      const fee = Number(readField(deal, "feeAgreed") || 0);
      const savedCurrency = saved?.currency?.trim() || currency;
      const dealChanged =
        !Number.isFinite(fee) ||
        fee !== (saved?.feeAgreed ?? 0) ||
        (readField(deal, "paymentTerms") || "net_30") !==
          (saved?.paymentTerms ?? "net_30") ||
        (readField(deal, "dateDelivered") || "") !==
          toDateInput(saved?.dateDelivered) ||
        (readField(deal, "dateInvoiced") || "") !==
          toDateInput(saved?.dateInvoiced) ||
        (readField(deal, "datePaid") || "") !== toDateInput(saved?.datePaid) ||
        moneyCode(readField(deal, "currency"), savedCurrency) !== savedCurrency;
      if (dealChanged) names.push("Deal");
    }

    const deliverable = deliverableFormRef.current;
    if (deliverable && !locked) {
      const type = readField(deliverable, "type") || "video";
      const quantity = Number(readField(deliverable, "quantity") || 1);
      const rateRaw = readField(deliverable, "rate").trim();
      const savedCurrency = item.deal?.currency?.trim() || currency;
      const draftCurrency = moneyCode(readField(deliverable, "currency"), savedCurrency);
      const deliverableChanged = editingDeliverable
        ? type !== editingDeliverable.type ||
          quantity !== editingDeliverable.quantity ||
          Number(rateRaw || 0) !== editingDeliverable.rate ||
          draftCurrency !== savedCurrency
        : type !== "video" ||
          quantity !== 1 ||
          rateRaw !== "" ||
          draftCurrency !== savedCurrency;
      if (deliverableChanged) names.push("Deliverables");
    }

    const expense = expenseFormRef.current;
    if (expense && !locked) {
      const category = readField(expense, "category") || "editor";
      const amountRaw = readField(expense, "amount").trim();
      const note = readField(expense, "note").trim();
      const date = readField(expense, "date") || "";
      const savedCurrency = item.deal?.currency?.trim() || currency;
      const draftCurrency = moneyCode(readField(expense, "currency"), savedCurrency);
      const expenseChanged = editingExpense
        ? category !== editingExpense.category ||
          Number(amountRaw || 0) !== editingExpense.amount ||
          note !== (editingExpense.note ?? "").trim() ||
          date !== toDateInput(editingExpense.date) ||
          draftCurrency !== (editingExpense.currency?.trim() || savedCurrency)
        : category !== "editor" ||
          amountRaw !== "" ||
          note !== "" ||
          date !== "" ||
          draftCurrency !== savedCurrency;
      if (expenseChanged) names.push("Expenses");
    }

    return names;
  }

  const unsavedSectionsRef = useRef(unsavedSections);
  unsavedSectionsRef.current = unsavedSections;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const sections = unsavedSectionsRef.current();
      if (allowLeaveRef.current || sections.length === 0) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;
      const raw = anchor.getAttribute("href");
      if (
        !raw ||
        raw.startsWith("#") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setLeaveSections(sections);
      setLeaveHref(`${url.pathname}${url.search}${url.hash}`);
      setLeaveOpen(true);
    }

    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (allowLeaveRef.current || unsavedSectionsRef.current().length === 0) return;
      event.preventDefault();
      event.returnValue = "";
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  function enqueueSave(
    epoch: number,
    work: () => Promise<{ error: string | null }>,
    onError: (message: string) => void,
  ) {
    const run = saveQueueRef.current.then(async () => {
      let message: string | null = null;
      try {
        const result = await work();
        message = result.error;
      } catch (error) {
        message =
          error instanceof Error ? error.message : "Could not save content.";
      }
      if (message) {
        if (saveEpochRef.current === epoch) onError(message);
        showToast(message, "danger");
        return;
      }
      router.refresh();
    });
    saveQueueRef.current = run.then(
      () => undefined,
      () => undefined,
    );
  }

  function commit(
    next: TrackerDetail,
    notice: { message: string; tone?: "success" | "danger" } | undefined,
    action: "details" | "deal" | "deliverable" | "expense" | "remove",
    section: "details" | "deal" | "deliverables" | "expenses",
  ): boolean {
    if (isAgency || savingRef.current) return false;
    if (section !== "details" && blockUntilTypeSaved()) return false;
    const previous = item;
    const previousType = draftType;
    const previousDealCurrency = dealCurrencyDraft;
    const previousDeliverableCurrency = deliverableCurrencyDraft;
    const epoch = ++saveEpochRef.current;
    savingRef.current = true;
    setSaveError(null);
    setItem(next);
    setDraftType(next.type);
    const nextSaved = next.deal?.currency?.trim() || currency;
    if (action === "deal") {
      setDealCurrencyDraft(nextSaved);
      setDeliverableCurrencyDraft((current) =>
        current === previousDealCurrency ? nextSaved : current,
      );
    }
    if (action === "deliverable") {
      setDeliverableCurrencyDraft(nextSaved);
      setDealCurrencyDraft((current) =>
        current === previousDealCurrency ? nextSaved : current,
      );
    }
    if (notice) showToast(notice.message, notice.tone ?? "success");
    enqueueSave(
      epoch,
      () => upsertContentAction(next, section),
      (message) => {
        setItem(previous);
        setDraftType(previousType);
        setDealCurrencyDraft(previousDealCurrency);
        setDeliverableCurrencyDraft(previousDeliverableCurrency);
        if (action === "details" || action === "deal") {
          setFormGeneration((current) => ({
            ...current,
            [action]: current[action] + 1,
          }));
        }
        setSaveError(message);
      },
    );
    return true;
  }

  function beginEditDeliverable(id: string) {
    if (blockUntilTypeSaved()) return;
    setSaveError(null);
    setDeliverableCurrencyDraft(item.deal?.currency?.trim() || currency);
    setEditingDeliverableId(id);
  }

  function cancelEditDeliverable() {
    setDeliverableCurrencyDraft(item.deal?.currency?.trim() || currency);
    setEditingDeliverableId(null);
  }

  function beginEditExpense(id: string) {
    if (blockUntilTypeSaved()) return;
    const expense = item.expenses.find((row) => row.id === id);
    if (!expense) return;
    setSaveError(null);
    setEditingExpenseId(id);
    setExpenseOverride(expense.currency?.trim() || dealCurrency);
  }

  function cancelEditExpense() {
    setEditingExpenseId(null);
    setExpenseOverride(null);
  }

  function removeDeliverable(deliverableId: string) {
    if (!item.deal || isAgency || blockUntilTypeSaved()) return;
    if (editingDeliverableId === deliverableId) cancelEditDeliverable();
    return commit(
      {
        ...item,
        deal: {
          ...item.deal,
          deliverables: item.deal.deliverables.filter(
            (d) => d.id !== deliverableId,
          ),
        },
      },
      { message: "Deliverable removed.", tone: "danger" },
      "remove",
      "deliverables",
    );
  }

  function removeExpense(expenseId: string) {
    if (isAgency || blockUntilTypeSaved()) return;
    if (editingExpenseId === expenseId) cancelEditExpense();
    return commit(
      {
        ...item,
        expenses: item.expenses.filter((e) => e.id !== expenseId),
      },
      { message: "Expense removed.", tone: "danger" },
      "remove",
      "expenses",
    );
  }

  async function confirmRemove() {
    if (!removeTarget || removePending) return;
    if (blockUntilTypeSaved()) {
      setRemoveTarget(null);
      return;
    }
    if (removeTarget === "post") {
      if (!canDelete) return;
      setRemovePending(true);
      setSaveError(null);
      const result = await deleteContentAction(item.id);
      setRemovePending(false);
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      setRemoveTarget(null);
      showToast("Content deleted.", "danger");
      router.push(mode === "record" ? backHref : "/home/tracker");
      return;
    }
    const removed =
      removeTarget.kind === "deliverable"
        ? removeDeliverable(removeTarget.id)
        : removeExpense(removeTarget.id);
    if (removed) setRemoveTarget(null);
  }

  async function handleDealSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dealLocked || savingRef.current || blockUntilTypeSaved()) return;
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
      const epoch = ++saveEpochRef.current;
      savingRef.current = true;
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
      showToast("Deal saved.");
      enqueueSave(
        epoch,
        () =>
          updateContentInvoiceAction(item.id, {
            dateInvoiced,
            paymentTerms,
            datePaid,
          }),
        (message) => {
          setItem(previous);
          setInvoiceError(message);
        },
      );
      return;
    }

    const nextCurrency = moneyCode(
      String(data.get("currency") ?? ""),
      deal.currency?.trim() || currency,
    );
    void commit({
      ...item,
      type: "paid_collab",
      deal: {
        ...deal,
        feeAgreed: Number(data.get("feeAgreed") || 0),
        currency: nextCurrency,
        paymentTerms,
        dateDelivered: String(data.get("dateDelivered") ?? "") || null,
        dateInvoiced,
        datePaid,
      },
    }, { message: "Deal saved." }, "deal", "deal");
  }

  const money = (amount: number) => fmtMoney(amount, dealCurrency);
  const busy = removePending;

  return (
    <div
      className={
        activity
          ? "lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)] lg:gap-x-8"
          : "mx-auto max-w-3xl"
      }
    >
      <div className="mb-3 flex items-center justify-between lg:col-start-1">
        <BackLink href={backHref} label="Back" />
        <button
          type="button"
          aria-label="Delete content item"
          title="Delete"
          onClick={() => {
            if (!canDelete || savingRef.current || blockUntilTypeSaved()) return;
            setSaveError(null);
            setRemoveTarget("post");
          }}
          disabled={!canDelete || busy}
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-card text-danger shadow-card transition-colors hover:bg-organic disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card"
        >
          <TrashIcon size={18} weight="regular" aria-hidden />
        </button>
      </div>

      <div className="mb-5 lg:col-start-1">
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

      <div className="min-w-0 lg:col-start-1">
        <Card className="mb-5">
          <Text variant="title" className="mb-3 text-base">
            Details
          </Text>
          <form
            ref={detailsFormRef}
            key={`details-${formGeneration.details}`}
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (locked || savingRef.current) return;
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
                      currency,
                    }
                    : null,
              }, { message: "Details have been saved." }, "details", "details");
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
                options={[...STAGE_OPTIONS]}
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
              <Button
                type="submit"
                size="sm"
                className="h-10"
                disabled={locked || busy}
              >
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
              ref={dealFormRef}
              key={`deal-${formGeneration.deal}`}
              className="grid grid-cols-1 gap-3 md:grid-cols-3"
              onSubmit={handleDealSubmit}
            >
              <Field id="feeAgreed" label="Fee agreed">
                <MoneyField
                  id="feeAgreed"
                  name="feeAgreed"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={visibleDeal.feeAgreed || ""}
                  disabled={locked}
                  currency={dealCurrencyDraft}
                  currencyOptions={currencyChoices(dealCurrencyDraft)}
                  currencyDisabled={dealLocked}
                  onCurrencyChange={setDealCurrencyDraft}
                />
              </Field>
              <Field id="paymentTerms" label="Payment terms">
                <Select
                  id="paymentTerms"
                  name="paymentTerms"
                  defaultValue={visibleDeal.paymentTerms}
                  options={[...PAYMENT_TERM_OPTIONS]}
                  disabled={locked || dealLocked}
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
                  required={isAgency && !dealLocked}
                  disabled={dealLocked}
                  size="sm"
                  full
                />
              </Field>
              <Field id="datePaid" label="Date paid">
                <DateField
                  id="datePaid"
                  name="datePaid"
                  defaultValue={toDateInput(visibleDeal.datePaid)}
                  disabled={dealLocked}
                  size="sm"
                  full
                />
              </Field>
              <div className="flex flex-wrap items-center gap-3 md:col-span-3">
                {dealLocked ? null : (
                  <Button
                    type="submit"
                    size="sm"
                    className="h-10"
                    disabled={busy}
                  >
                    Save deal
                  </Button>
                )}
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
                editingId={editingDeliverable?.id}
                actionsDisabled={busy}
                onEdit={locked ? undefined : beginEditDeliverable}
                onRemove={
                  locked
                    ? undefined
                    : (id) => {
                      if (savingRef.current || blockUntilTypeSaved()) return;
                      setSaveError(null);
                      setRemoveTarget({ kind: "deliverable", id });
                    }
                }
                variant="plain"
                currency={dealCurrency}
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
                ref={deliverableFormRef}
                key={`deliverable-${formGeneration.deliverable}-${editingDeliverable?.id ?? "new"}`}
                className="grid grid-cols-1 items-end gap-2 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_5.5rem_minmax(13rem,1.4fr)_auto] md:gap-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (locked || !visibleDeal || savingRef.current || blockUntilTypeSaved()) {
                    return;
                  }
                  const data = new FormData(event.currentTarget);
                  const type = String(
                    data.get("type") ?? "video",
                  ) as TrackerDeliverable["type"];
                  const quantity = Number(data.get("quantity") || 1);
                  const rate = Number(data.get("rate"));
                  if (!Number.isFinite(rate) || rate <= 0) {
                    showToast("Enter a rate above zero.", "danger");
                    return;
                  }
                  const nextDeliverable = {
                    id: editingDeliverable?.id ?? crypto.randomUUID(),
                    type,
                    quantity,
                    rate,
                  };
                  const pickedCurrency = moneyCode(
                    String(data.get("currency") ?? ""),
                    dealCurrency,
                  );
                  const saved = commit({
                    ...item,
                    type: "paid_collab",
                    deal: {
                      ...visibleDeal,
                      ...(pickedCurrency !== dealCurrency
                        ? { currency: pickedCurrency }
                        : {}),
                      deliverables: editingDeliverable
                        ? visibleDeal.deliverables.map((row) =>
                          row.id === editingDeliverable.id
                            ? nextDeliverable
                            : row,
                        )
                        : [...visibleDeal.deliverables, nextDeliverable],
                    },
                  }, {
                    message: editingDeliverable
                      ? "Deliverable updated."
                      : "Deliverable added.",
                  }, "deliverable", "deliverables");
                  if (!saved) return;
                  setEditingDeliverableId(null);
                  if (!editingDeliverable) {
                    setFormGeneration((current) => ({
                      ...current,
                      deliverable: current.deliverable + 1,
                    }));
                  }
                }}
              >
                <Field id="deliverableType" label="Type" className="min-w-0">
                  <Select
                    id="deliverableType"
                    name="type"
                    defaultValue={editingDeliverable?.type ?? "video"}
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
                    defaultValue={editingDeliverable?.quantity ?? 1}
                    disabled={locked}
                    size="sm"
                    full
                  />
                </Field>
                <Field id="rate" label="Rate" className="min-w-0">
                  <MoneyField
                    id="rate"
                    name="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    required={!locked}
                    disabled={locked}
                    defaultValue={
                      editingDeliverable ? String(editingDeliverable.rate) : undefined
                    }
                    currency={deliverableCurrencyDraft}
                    currencyOptions={currencyChoices(deliverableCurrencyDraft)}
                    currencyDisabled={dealLocked}
                    onCurrencyChange={setDeliverableCurrencyDraft}
                  />
                </Field>
                <div className="col-span-full flex gap-2 md:col-span-1">
                  {editingDeliverable ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-10"
                      disabled={busy}
                      onClick={cancelEditDeliverable}
                    >
                      Cancel
                    </Button>
                  ) : null}
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={locked || busy}
                    className="h-10 w-full md:w-auto"
                  >
                    {editingDeliverable ? "Update" : "Add deliverable"}
                  </Button>
                </div>
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
            editingId={editingExpense?.id}
            actionsDisabled={busy}
            onEdit={locked ? undefined : beginEditExpense}
            onRemove={
              locked
                ? undefined
                : (id) => {
                  if (savingRef.current || blockUntilTypeSaved()) return;
                  setSaveError(null);
                  setRemoveTarget({ kind: "expense", id });
                }
            }
            variant="plain"
            currency={dealCurrency}
          />
          <form
            ref={expenseFormRef}
            key={`expense-${formGeneration.expense}-${editingExpense?.id ?? "new"}`}
            className="flex flex-col gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (locked || savingRef.current || blockUntilTypeSaved()) return;
              const data = new FormData(event.currentTarget);
              const amount = Number(data.get("amount"));
              if (!Number.isFinite(amount) || amount <= 0) {
                showToast("Enter an amount above zero.", "danger");
                return;
              }
              const category = String(
                data.get("category") ?? "other",
              ) as TrackerExpense["category"];
              const nextExpense = {
                id: editingExpense?.id ?? crypto.randomUUID(),
                category,
                amount,
                note: String(data.get("note") ?? "").trim() || null,
                date:
                  String(data.get("date") ?? "") || calendarDay(new Date()),
                currency: expenseCurrency,
              };
              const saved = commit(
                {
                  ...item,
                  expenses: editingExpense
                    ? item.expenses.map((row) =>
                      row.id === editingExpense.id ? nextExpense : row,
                    )
                    : [nextExpense, ...item.expenses],
                },
                {
                  message: editingExpense ? "Expense updated." : "Expense added.",
                },
                "expense",
                "expenses",
              );
              if (!saved) return;
              if (editingExpense) cancelEditExpense();
              else {
                setFormGeneration((current) => ({
                  ...current,
                  expense: current.expense + 1,
                }));
              }
            }}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-end">
              <Field id="expenseCategory" label="Category" className="min-w-0 md:flex-1">
                <Select
                  id="expenseCategory"
                  name="category"
                  defaultValue={editingExpense?.category ?? "editor"}
                  options={[...EXPENSE_CATEGORY_OPTIONS]}
                  disabled={locked}
                  size="sm"
                  full
                />
              </Field>
              <Field id="expenseAmount" label="Amount" className="min-w-0 md:flex-[1.15]">
                <MoneyField
                  id="expenseAmount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required={!locked}
                  disabled={locked}
                  defaultValue={
                    editingExpense ? String(editingExpense.amount) : undefined
                  }
                  currency={expenseCurrency}
                  currencyOptions={currencyChoices(expenseCurrency)}
                  onCurrencyChange={setExpenseOverride}
                />
              </Field>
              <Field id="expenseDate" label="Date" className="min-w-0 md:flex-1">
                <DateField
                  id="expenseDate"
                  name="date"
                  defaultValue={
                    editingExpense ? toDateInput(editingExpense.date) : ""
                  }
                  disabled={locked}
                  size="sm"
                  full
                />
              </Field>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Field
                id="expenseNote"
                label="Note"
                className="min-w-0 sm:flex-1"
              >
                <TextField
                  id="expenseNote"
                  name="note"
                  defaultValue={editingExpense?.note ?? ""}
                  disabled={locked}
                  size="sm"
                  full
                />
              </Field>
              {editingExpense ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-10 shrink-0"
                  disabled={busy}
                  onClick={cancelEditExpense}
                >
                  Cancel
                </Button>
              ) : null}
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={locked || busy}
                className="h-10 shrink-0"
              >
                {editingExpense ? "Update" : "Add expense"}
              </Button>
            </div>
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

        <ConfirmModal
          open={leaveOpen}
          title="Leave before saving?"
          question={unsavedSentence(leaveSections)}
          confirmLabel="Leave"
          cancelLabel="Stay"
          onClose={() => {
            setLeaveOpen(false);
            setLeaveHref(null);
            setLeaveSections([]);
          }}
          onConfirm={() => {
            const href = leaveHref;
            allowLeaveRef.current = true;
            setLeaveOpen(false);
            setLeaveHref(null);
            if (href) router.push(href);
          }}
        />
        <ConfirmModal
          open={removeTarget !== null}
          title={
            removeTarget === "post"
              ? "Delete this post"
              : removeTarget?.kind === "deliverable"
                ? "Remove this deliverable"
                : "Remove this expense"
          }
          question={
            removeTarget === "post"
              ? `Are you sure you want to delete “${item.title}”?`
              : removeTarget?.kind === "deliverable"
                ? "Are you sure you want to remove this deliverable?"
                : "Are you sure you want to remove this expense?"
          }
          confirmLabel={removeTarget === "post" ? "Delete" : "Remove"}
          pendingLabel={removeTarget === "post" ? "Deleting…" : "Removing…"}
          pending={removePending}
          error={saveError}
          onClose={() => setRemoveTarget(null)}
          onConfirm={() => void confirmRemove()}
        />
      </div>
      {activity ? (
        <aside className="mt-8 min-w-0 lg:col-start-2 lg:row-start-2 lg:row-span-2 lg:mt-0 lg:grid lg:grid-rows-subgrid">
          <ActivityFeed items={activity} className="contents" />
        </aside>
      ) : null}
    </div>
  );
}
