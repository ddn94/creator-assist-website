"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  getAgencyProfile,
  getMockRevision,
  hydrateMockDbFromSession,
  subscribeMockDb,
} from "@/lib/mockStore";
import type { PnlDateFilter } from "@/lib/pnlRange";
import {
  getAgencyPnlBrands,
  getAgencyPnlCurrencies,
  getAgencyPnlTalent,
  getAgencyAttention,
  getAgencyOverviewStats,
  getAgencyPayments,
  getAgencyRoster,
  getAgencyTalent,
  getContinueFeed,
  getIdeas,
  getOverviewStats,
  getSelfProfile,
  getSelfContentPlatformOptions,
  getTalentById,
  getTalentPayments,
  getTalentPnlByBrand,
  getTalentPnlByNiche,
  getTalentPnlRows,
  getTalentPnlSummary,
  getTrackerDetail,
  getTrackerItems,
} from "@/lib/talentMock";

function useMockRevision() {
  useEffect(() => {
    hydrateMockDbFromSession();
  }, []);

  return useSyncExternalStore(
    subscribeMockDb,
    getMockRevision,
    () => 0,
  );
}

export function useTrackerItems() {
  const rev = useMockRevision();
  return useMemo(() => getTrackerItems(), [rev]);
}

export function useTrackerDetail(id: string) {
  const rev = useMockRevision();
  return useMemo(() => getTrackerDetail(id), [rev, id]);
}

export function useIdeas() {
  const rev = useMockRevision();
  return useMemo(() => getIdeas(), [rev]);
}

export function useTalentPayments() {
  const rev = useMockRevision();
  return useMemo(() => getTalentPayments(), [rev]);
}

export function useTalentPnl(filter: PnlDateFilter) {
  const rev = useMockRevision();
  const { range, from = "", to = "" } = filter;
  return useMemo(
    () => {
      const next: PnlDateFilter = { range, from, to };
      return {
        summary: getTalentPnlSummary(next),
        rows: getTalentPnlRows(next),
        byBrand: getTalentPnlByBrand(next),
        byNiche: getTalentPnlByNiche(next),
      };
    },
    [rev, range, from, to],
  );
}

export function useAgencyPnl(filter: PnlDateFilter) {
  const rev = useMockRevision();
  const { range, from = "", to = "" } = filter;
  return useMemo(
    () => {
      const next: PnlDateFilter = { range, from, to };
      return {
        currencies: getAgencyPnlCurrencies(next),
        talent: getAgencyPnlTalent(next),
        brands: getAgencyPnlBrands(next),
      };
    },
    [rev, range, from, to],
  );
}

export function useSelfProfile() {
  const rev = useMockRevision();
  return useMemo(() => getSelfProfile(), [rev]);
}

export function useAgencyProfile() {
  const rev = useMockRevision();
  return useMemo(() => getAgencyProfile(), [rev]);
}

export function useSelfContentPlatformOptions(extra?: string | null) {
  const rev = useMockRevision();
  return useMemo(
    () => getSelfContentPlatformOptions(extra),
    [rev, extra],
  );
}

export function useTalentOverviewData() {
  const rev = useMockRevision();
  return useMemo(
    () => ({
      stats: getOverviewStats(),
      feed: getContinueFeed(),
      profile: getSelfProfile(),
    }),
    [rev],
  );
}

export function useAgencyTalent() {
  const rev = useMockRevision();
  return useMemo(() => getAgencyTalent(), [rev]);
}

export function useAgencyTalentDetail(id: string) {
  const rev = useMockRevision();
  return useMemo(() => getTalentById(id), [rev, id]);
}

export function useAgencyOverviewData() {
  const rev = useMockRevision();
  return useMemo(
    () => ({
      stats: getAgencyOverviewStats(),
      roster: getAgencyRoster(),
      attention: getAgencyAttention(),
    }),
    [rev],
  );
}

export function useAgencyPayments() {
  const rev = useMockRevision();
  return useMemo(() => getAgencyPayments(), [rev]);
}
