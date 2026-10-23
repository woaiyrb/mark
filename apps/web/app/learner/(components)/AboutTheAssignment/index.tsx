"use client";

import { getLanguageName } from "@/app/Helpers/getLanguageName";
import Dropdown from "@/components/Dropdown";
import MarkdownViewer from "@/components/MarkdownViewer";
import Modal from "@/components/Modal";
import {
  Assignment,
  AssignmentAttempt,
  LearnerAssignmentState,
} from "@/config/types";
import { getSupportedLanguages } from "@/lib/talkToBackend";
import {
  INITIAL_UI_LANGUAGE,
  pickDefaultAssignmentLanguage,
  setStoredUiLanguage,
} from "@/lib/ui-language";
import {
  useAssignmentDetails,
  useLearnerOverviewStore,
  useLearnerStore,
} from "@/stores/learner";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { FC, useEffect, useState } from "react";
import { toast } from "sonner";
import BeginTheAssignmentButton from "./BeginTheAssignmentButton";
import PromoBanner from "@/components/promo/PromoBanner";
import { useUiTranslation } from "@/hooks/use-ui-translation";
import { formatShortDuration } from "@/lib/format-duration";
import {
  getExpiresAtMs,
  getLatestAttempt,
  getTimestampMs,
  isAttemptInProgress,
  isAttemptSubmitted,
} from "@/app/learner/utils/attempts";

interface AssignmentSectionProps {
  title: string;
  content: string;
}

const AssignmentSection: FC<AssignmentSectionProps> = ({ title, content }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const assignmentDetails = useAssignmentDetails(
    (state) => state.assignmentDetails,
  );
  const questionControls = assignmentDetails?.questionControls;
  return (
    <div className="mark-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200/80 bg-gradient-to-r from-violet-50/70 to-transparent px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-700/70 dark:from-violet-900/25">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </h2>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="sm:hidden flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
        >
          {isCollapsed ? (
            <ChevronDownIcon className="w-5 h-5" />
          ) : (
            <ChevronUpIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      <div
        className={`px-4 sm:px-6 py-4 transition-all duration-300 ${
          isCollapsed
            ? "max-h-0 opacity-0 py-0 sm:max-h-none sm:opacity-100 sm:py-4 overflow-hidden"
            : "max-h-none opacity-100"
        }`}
      >
        <MarkdownViewer
          className="text-gray-600 dark:text-gray-300 text-sm sm:text-base"
          allowCopy={!(questionControls?.disableCopy ?? false)}
        >
          {content || `No ${title.toLowerCase()} provided.`}
        </MarkdownViewer>
      </div>
    </div>
  );
};

interface AboutTheAssignmentProps {
  assignment: Assignment;
  attempts: AssignmentAttempt[];
  role: "learner" | "author";
  assignmentId: number;
  fetchData: () => void;
}

const getAssignmentState = (
  attempts: AssignmentAttempt[],
  numAttempts: number,
): LearnerAssignmentState => {
  if (numAttempts !== -1 && attempts.length >= numAttempts) return "completed";

  const inProgress = attempts.some(isAttemptInProgress);

  return inProgress ? "in-progress" : "not-started";
};

const AboutTheAssignment: FC<AboutTheAssignmentProps> = ({
  assignment,
  attempts,
  role,
  assignmentId,
  fetchData,
}) => {
  const {
    introduction = "No introduction provided.",
    instructions = "",
    gradingCriteriaOverview = "",
    allotedTimeMinutes,
    timeEstimateMinutes,
    numAttempts = -1,
    attemptsBeforeCoolDown = 1,
    retakeAttemptCoolDownMinutes = 5,
    passingGrade,
    name = "Untitled",
    id,
    graded,
    published = false,
  } = assignment;

  const normalizedNumAttempts = numAttempts ?? -1;

  const [userPreferedLanguage, setUserPreferedLanguage] = useLearnerStore(
    (state) => [state.userPreferedLanguage, state.setUserPreferedLanguage],
  );
  const [languageModalTriggered, setLanguageModalTriggered] =
    useLearnerOverviewStore((state) => [
      state.languageModalTriggered,
      state.setLanguageModalTriggered,
    ]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, activeLanguage } = useUiTranslation();
  const isAuthorPreview = searchParams.get("authorMode") === "true";
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
    userPreferedLanguage,
  );
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const [toggleLanguageSelectionModal, setToggleLanguageSelectionModal] =
    useState(false);
  const [isAboutCollapsed, setIsAboutCollapsed] = useState(false);
  useEffect(() => {
    if (!userPreferedLanguage || languageModalTriggered) {
      setToggleLanguageSelectionModal(true);
    }
  }, [userPreferedLanguage, languageModalTriggered]);

  useEffect(() => {
    setSelectedLanguage(userPreferedLanguage);
  }, [userPreferedLanguage]);

  useEffect(() => {
    async function fetchLanguages() {
      if (!assignmentId) return;
      setIsLoading(true);
      const supportedLanguages = await getSupportedLanguages(assignmentId);
      const sortedLanguages = [...supportedLanguages].sort((a, b) =>
        getLanguageName(a).localeCompare(getLanguageName(b)),
      );
      setLanguages(sortedLanguages);
      setSelectedLanguage((current) => {
        if (current && sortedLanguages.includes(current)) return current;
        if (
          userPreferedLanguage &&
          sortedLanguages.includes(userPreferedLanguage)
        )
          return userPreferedLanguage;
        return pickDefaultAssignmentLanguage(sortedLanguages);
      });
      setIsLoading(false);
    }
    void fetchLanguages();
  }, [assignmentId, userPreferedLanguage]);

  const assignmentState =
    !published && role === "learner"
      ? "not-published"
      : getAssignmentState(attempts, normalizedNumAttempts);

  const attemptsLeft =
    normalizedNumAttempts === -1
      ? Infinity
      : Math.max(0, normalizedNumAttempts - attempts.length);

  const latestAttempt = getLatestAttempt(attempts || []);

  const attemptsCount = attempts.length;
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (
      !latestAttempt ||
      !latestAttempt.createdAt ||
      attemptsBeforeCoolDown <= 0 ||
      attemptsCount < attemptsBeforeCoolDown ||
      attemptsLeft === 0 ||
      retakeAttemptCoolDownMinutes <= 0 ||
      assignmentState === "in-progress" ||
      !isAttemptSubmitted(latestAttempt)
    ) {
      setCooldownSecondsLeft(null);
      return;
    }

    const fallbackCreatedAt = latestAttempt.createdAt
      ? new Date(latestAttempt.createdAt).getTime()
      : undefined;

    const updatedAtMs = getTimestampMs(latestAttempt.updatedAt);

    let finishedAt =
      getExpiresAtMs(latestAttempt.expiresAt) ??
      updatedAtMs ??
      fallbackCreatedAt;

    if (
      isAttemptSubmitted(latestAttempt) &&
      updatedAtMs !== undefined &&
      !Number.isNaN(updatedAtMs)
    ) {
      finishedAt = finishedAt ? Math.min(finishedAt, updatedAtMs) : updatedAtMs;
    }

    if (finishedAt === undefined || Number.isNaN(finishedAt)) {
      setCooldownSecondsLeft(null);
      return;
    }

    const cooldownMs = retakeAttemptCoolDownMinutes * 60_000;
    const nextEligibleAt = finishedAt + cooldownMs;

    function updateCountdown() {
      const remainingMs = nextEligibleAt - Date.now();

      if (remainingMs <= 0) {
        setCooldownSecondsLeft(null);
        clearInterval(interval);
        return;
      }

      // Ceil, not floor: the state holds whole seconds, and a floor would
      // display "0s"-adjacent values while the cooldown is still active.
      setCooldownSecondsLeft(Math.ceil(remainingMs / 1000));
    }

    const interval = setInterval(updateCountdown, 1000);
    updateCountdown();
    return () => clearInterval(interval);
  }, [
    latestAttempt,
    attemptsLeft,
    attemptsCount,
    attemptsBeforeCoolDown,
    retakeAttemptCoolDownMinutes,
  ]);

  const handleConfirm = () => {
    const contentLanguage =
      selectedLanguage || languages[0] || INITIAL_UI_LANGUAGE;
    if (!contentLanguage) {
      toast.error("Please select a language to continue.");
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", contentLanguage);
    // No `?uiLang` here: it is the content language that changes, not the UI.
    params.delete("uiLang");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, undefined);
    setUserPreferedLanguage(contentLanguage);
    setStoredUiLanguage(INITIAL_UI_LANGUAGE);
    setLanguageModalTriggered(false);
    setToggleLanguageSelectionModal(false);
    void fetchData();
  };

  const handleCloseModal = () => {
    setLanguageModalTriggered(false);
    setToggleLanguageSelectionModal(false);
  };

  // The attempt is fetched server-side from this URL's `lang`, and it now
  // carries only the language it was asked for — so the learner's chosen
  // language has to travel with the link, or they would open their attempt in
  // English and have to switch it back by hand.
  const questionsParams = new URLSearchParams();
  if (role !== "learner") {
    questionsParams.set("authorMode", "true");
  }
  if (userPreferedLanguage) {
    questionsParams.set("lang", userPreferedLanguage);
  }
  const questionsQuery = questionsParams.toString();
  const url = `/learner/${assignmentId}/questions${
    questionsQuery ? `?${questionsQuery}` : ""
  }`;

  // One translatable key with the duration as a parameter, resolved here rather
  // than by RouteUiTranslator rewriting the DOM afterwards. Opted out because it
  // is already translated: RouteUiTranslator must neither rewrite it nor re-scan
  // the route each time the duration ticks. translate="no" additionally keeps
  // browser-level page translation from latching onto the ticking text.
  const cooldownMessage =
    cooldownSecondsLeft !== null ? (
      <span data-no-ui-translate="true" translate="no">
        {t("Please wait {time} before retrying", {
          time: formatShortDuration(cooldownSecondsLeft, activeLanguage),
        })}
      </span>
    ) : null;

  const buttonLabel = assignmentState === "in-progress" ? "Resume" : "Begin";
  let buttonMessage: React.ReactNode = "";
  let buttonDisabled = false;

  if (!role) {
    buttonDisabled = true;
    buttonMessage = "You must be signed in with a role to begin.";
  } else if (role === "learner" && assignmentState === "not-published") {
    buttonDisabled = true;
    buttonMessage = "The assignment is not published yet.";
  } else if (attemptsLeft === 0) {
    buttonDisabled = true;
    buttonMessage =
      "Maximum attempts reached, contact the author to request more.";
  } else if (cooldownMessage) {
    buttonDisabled = true;
    buttonMessage = cooldownMessage;
  } else {
    buttonMessage = `Click to ${assignmentState === "in-progress" ? "Resume" : "Begin"}`;
  }

  const latestAttemptDate = latestAttempt
    ? new Date(latestAttempt.createdAt).toLocaleString()
    : "No attempts yet";

  return (
    <>
      <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
          {role === "learner" && <PromoBanner placement="preStart" />}
          {/* Hero band: title, meta and the primary action share one loud
              surface — the game-header treatment from a community feed. */}
          <div className="mark-hero-lg mark-entrance flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative z-10 min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white ring-1 ring-white/30">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {graded ? "Graded" : "Practice"}
              </span>
              <h1 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">
                {name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                <span className="font-medium">
                  Latest attempt: {latestAttemptDate}
                </span>
                {role === "learner" && (
                  <Link
                    href={`/learner/${id}/attempts`}
                    className="font-medium text-white underline-offset-4 hover:underline"
                  >
                    See all attempts
                  </Link>
                )}
              </div>
              {cooldownMessage && (
                <span className="mt-2 block text-sm font-semibold text-white">
                  ({cooldownMessage})
                </span>
              )}
            </div>
            <div className="relative z-10 shrink-0">
              <BeginTheAssignmentButton
                tone="onHero"
                className="w-full sm:w-auto"
                disabled={buttonDisabled}
                message={buttonMessage}
                label={buttonLabel}
                href={url}
              />
            </div>
          </div>

          <div className="mark-card mark-card-hover mark-entrance-1 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-gray-200/80 bg-gradient-to-r from-violet-50/70 to-transparent px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-700/70 dark:from-violet-900/25">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
                About this assignment
              </h2>
              <button
                onClick={() => setIsAboutCollapsed(!isAboutCollapsed)}
                className="sm:hidden flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                aria-label={
                  isAboutCollapsed
                    ? "Expand about section"
                    : "Collapse about section"
                }
              >
                {isAboutCollapsed ? (
                  <ChevronDownIcon className="w-5 h-5" />
                ) : (
                  <ChevronUpIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <div
              className={`transition-all duration-300 ${
                isAboutCollapsed
                  ? "max-h-0 opacity-0 overflow-hidden sm:max-h-none sm:opacity-100"
                  : "max-h-none opacity-100"
              }`}
            >
              {/* Spec tiles — the "at a glance" strip, TapTap stat-card style. */}
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-6 lg:grid-cols-5">
                <div className="mark-spec mark-entrance-1 bg-gradient-to-br from-violet-50 to-white ring-violet-100 hover:shadow-soft dark:from-violet-900/25 dark:to-gray-800 dark:ring-violet-800/40">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                    Assignment type
                  </span>
                  <span className="mt-1 block text-sm font-bold text-gray-800 dark:text-gray-100">
                    {graded ? "Graded" : "Practice"}
                  </span>
                </div>
                <div className="mark-spec mark-entrance-2 bg-gradient-to-br from-coral-50 to-white ring-coral-100 hover:shadow-soft dark:from-coral-900/25 dark:to-gray-800 dark:ring-coral-800/40">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-coral-600 dark:text-coral-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-coral-500" />
                    Time Limit
                  </span>
                  <span className="mt-1 block text-sm font-bold text-gray-800 dark:text-gray-100">
                    {allotedTimeMinutes
                      ? `${allotedTimeMinutes} minutes`
                      : "Unlimited"}
                  </span>
                </div>
                <div className="mark-spec mark-entrance-3 bg-gradient-to-br from-mint-50 to-white ring-mint-100 hover:shadow-soft dark:from-mint-900/25 dark:to-gray-800 dark:ring-mint-800/40">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-mint-700 dark:text-mint-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
                    Estimated Time
                  </span>
                  <span className="mt-1 block text-sm font-bold text-gray-800 dark:text-gray-100">
                    {timeEstimateMinutes
                      ? `${timeEstimateMinutes} minutes`
                      : "Not provided"}
                  </span>
                </div>
                <div className="mark-spec mark-entrance-4 bg-gradient-to-br from-sunny-50 to-white ring-sunny-100 hover:shadow-soft dark:from-sunny-900/25 dark:to-gray-800 dark:ring-sunny-800/40">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sunny-700 dark:text-sunny-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-sunny-500" />
                    Assignment attempts
                  </span>
                  <span className="mt-1 block text-sm font-bold text-gray-800 dark:text-gray-100">
                    {normalizedNumAttempts === -1
                      ? "Unlimited"
                      : `${attemptsLeft} attempt${
                          attemptsLeft > 1 ? "s" : ""
                        } left`}
                  </span>
                </div>
                <div className="mark-spec mark-entrance-5 bg-gradient-to-br from-violet-50 to-white ring-violet-100 hover:shadow-soft dark:from-violet-900/25 dark:to-gray-800 dark:ring-violet-800/40">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                    Passing Grade
                  </span>
                  <span className="mt-1 block text-sm font-bold text-gray-800 dark:text-gray-100">
                    {passingGrade}%
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
                <MarkdownViewer className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                  {introduction}
                </MarkdownViewer>
              </div>
            </div>
          </div>

          <AssignmentSection title="Instructions" content={instructions} />
          <AssignmentSection
            title="Grading Criteria"
            content={gradingCriteriaOverview}
          />

          {(() => {
            const qc = assignment.questionControls;
            if (!qc) return null;

            const restrictions = [];

            if (qc.disableCopy) {
              restrictions.push({
                title: "Copying Disabled",
                description: "You cannot copy text during this assignment",
              });
            }

            if (qc.disablePaste) {
              restrictions.push({
                title: "Pasting Disabled",
                description: "You cannot paste content into answer fields",
              });
            }

            if (qc.disableRightClick) {
              restrictions.push({
                title: "Right Click Disabled",
                description: "Right-click context menu is disabled",
              });
            }

            if (qc.disablePrint) {
              restrictions.push({
                title: "Printing Disabled",
                description:
                  "Print functionality is disabled for this assignment",
              });
            }

            if (restrictions.length === 0) return null;

            return (
              <div className="mark-card mark-card-hover overflow-hidden">
                <div className="border-b border-gray-200/80 bg-gradient-to-r from-coral-50/80 to-transparent px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-700/70 dark:from-coral-900/25">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
                    Assignment Restrictions
                  </h2>
                </div>
                <div className="px-4 sm:px-6 py-4">
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    The following restrictions are enabled for this assignment:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {restrictions.map((restriction, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-xl border border-sunny-200 bg-sunny-50 p-3 dark:border-sunny-900 dark:bg-sunny-900/20"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <svg
                            className="w-5 h-5 text-orange-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {restriction.title}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {restriction.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="flex justify-center mt-6">
            <BeginTheAssignmentButton
              className="w-full sm:w-auto"
              disabled={buttonDisabled}
              message={buttonMessage}
              label={buttonLabel}
              href={url}
            />
          </div>
        </div>
      </main>
      {toggleLanguageSelectionModal &&
        role === "learner" &&
        languageModalTriggered && (
          <Modal
            onClose={handleCloseModal}
            Title="Please pick one of the available languages"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                We recommend you experience our assignment in
                <strong> English </strong>
                as it's the original language. However, if you would like to
                continue learning in your chosen language please be aware that
                our translations are AI generated and may contain some
                inaccuracies.
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                You will be able to switch your language at any time during the
                assignment.
              </p>

              {isLoading ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Loading languages...
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <Dropdown
                    items={languages.map((lang) => ({
                      label: getLanguageName(lang),
                      value: lang,
                    }))}
                    selectedItem={selectedLanguage}
                    setSelectedItem={setSelectedLanguage}
                    placeholder="Select language"
                    disableUiTranslation={true}
                    disabled={isAuthorPreview}
                    disabledTooltip={
                      isAuthorPreview
                        ? "Translations are only available after publishing this assignment. Publish to preview translated content."
                        : undefined
                    }
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  className="w-full sm:w-auto px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  className="w-full sm:w-auto px-4 py-2 bg-violet-500 text-white rounded-pill shadow-soft disabled:opacity-50 hover:bg-violet-600 hover:shadow-lift transition-all"
                  onClick={handleConfirm}
                  disabled={isLoading}
                >
                  Confirm
                </button>
              </div>
            </div>
          </Modal>
        )}
    </>
  );
};

export default AboutTheAssignment;
