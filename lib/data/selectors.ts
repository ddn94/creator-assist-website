/** Barrel: UI assembly helpers split by topic under lib/data/. */

export type {
  AttentionItem,
  ContinueFeedItem,
  OverviewStats,
} from "@/lib/data/home";
export {
  buildAgencyAttention,
  buildAgencyOverviewMoney,
  buildContinueFeed,
  buildOverviewStats,
} from "@/lib/data/home";

export {
  buildAgencyPayments,
  buildTalentPayments,
} from "@/lib/data/payments";

export {
  buildAgencyPnlBrands,
  buildAgencyPnlCurrencies,
  buildAgencyPnlTalent,
  buildTalentPnlByBrand,
  buildTalentPnlByNiche,
  buildTalentPnlRows,
  buildTalentPnlSummary,
} from "@/lib/data/pnl";

export {
  buildTalentActivity,
  buildTalentDetailFromRecord,
  buildTalentRoster,
} from "@/lib/data/roster";
