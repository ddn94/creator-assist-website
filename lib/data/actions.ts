/** Barrel: product server actions split by topic under lib/data/. */

export {
  addContentAction,
  addContentForRecordAction,
  deleteContentAction,
  setContentStageAction,
  upsertContentAction,
} from "@/lib/data/contentActions";

export {
  addIdeaAction,
  deleteIdeaAction,
  turnIdeaIntoContentAction,
  upsertIdeaAction,
} from "@/lib/data/ideaActions";

export {
  markContentInvoicedAction,
  markContentPaidAction,
  updateContentInvoiceAction,
} from "@/lib/data/paymentActions";
