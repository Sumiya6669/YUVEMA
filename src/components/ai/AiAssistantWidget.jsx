import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import {
  aiScenarioConfig,
  routineConcerns,
  routineGoals,
  routineSkinTypes,
} from "@/services/ai/scenarios";

const AiWidgetContext = createContext(null);

const defaultRoutineProfile = {
  skinType: "Не знаю",
  concerns: [],
  goal: "Полный уход",
};

const introText = {
  consultation:
    "Спросите о различиях между средствами, активами и текстурами. Я отвечу коротко и по делу, без перегруза.",
  sales:
    "Помогу мягко собрать более сильную корзину: основной продукт, логичное дополнение и понятная аргументация.",
  routine:
    "Соберу персональный уход по типу кожи, задачам и цели. Для этого достаточно выбрать профиль ниже.",
};

function createIntroEntry(mode) {
  return {
    id: `intro-${mode}`,
    role: "assistant",
    kind: "intro",
    title: aiScenarioConfig[mode].label,
    text: introText[mode],
  };
}

function buildRoutineUserSummary(profile) {
  const concerns =
    profile.concerns.length > 0 ? profile.concerns.join(", ") : "без явных проблем";

  return `Тип кожи: ${profile.skinType}. Задачи: ${concerns}. Цель: ${profile.goal}.`;
}

function formatPrice(value) {
  if (value === undefined || value === null) {
    return "По запросу";
  }

  return `${Number(value).toLocaleString()} ₸`;
}

export function AiAssistantProvider({ children }) {
  const aiAssistant = useAiAssistant();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("consultation");
  const [draft, setDraft] = useState("");
  const [entries, setEntries] = useState([createIntroEntry("consultation")]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [routineProfile, setRoutineProfile] = useState(defaultRoutineProfile);

  function resetScenario(nextMode = mode, options = {}) {
    setMode(nextMode);
    setEntries([createIntroEntry(nextMode)]);
    setDraft(options.message || "");
    setSelectedProductIds(
      Array.isArray(options.selectedProductIds) ? options.selectedProductIds.slice(0, 4) : [],
    );
    setRoutineProfile({
      ...defaultRoutineProfile,
      ...(options.profile || {}),
      concerns: Array.isArray(options.profile?.concerns)
        ? options.profile.concerns
        : defaultRoutineProfile.concerns,
    });
  }

  function openWidget(options = {}) {
    setIsOpen(true);

    if (
      options.mode ||
      options.message !== undefined ||
      options.profile ||
      options.selectedProductIds ||
      options.reset
    ) {
      resetScenario(options.mode || mode, options);
    }
  }

  function closeWidget() {
    setIsOpen(false);
  }

  function changeMode(nextMode) {
    if (nextMode === mode) {
      return;
    }

    resetScenario(nextMode);
  }

  function toggleConcern(concern) {
    setRoutineProfile((current) => ({
      ...current,
      concerns: current.concerns.includes(concern)
        ? current.concerns.filter((item) => item !== concern)
        : [...current.concerns, concern],
    }));
  }

  async function submitRequest() {
    if (aiAssistant.isPending) {
      return;
    }

    if (mode !== "routine" && !String(draft || "").trim()) {
      toast.error("Введите вопрос, чтобы открыть консультацию.");
      return;
    }

    const userEntry =
      mode === "routine"
        ? {
            id: `user-${Date.now()}`,
            role: "user",
            kind: "text",
            text: buildRoutineUserSummary(routineProfile),
          }
        : {
            id: `user-${Date.now()}`,
            role: "user",
            kind: "text",
            text: draft.trim(),
          };

    const payload =
      mode === "routine"
        ? {
            mode,
            profile: routineProfile,
            selectedProductIds,
          }
        : {
            mode,
            message: draft.trim(),
            selectedProductIds,
          };

    const previousDraft = draft;

    setEntries((current) => [...current, userEntry]);

    if (mode !== "routine") {
      setDraft("");
    }

    try {
      const result = await aiAssistant.mutateAsync(payload);

      setEntries((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          kind: "result",
          result,
        },
      ]);
    } catch (error) {
      toast.error(error.message || "Не удалось получить ответ консультанта.");
      setEntries((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          kind: "error",
          text: "Сейчас ответ не загрузился. Попробуйте ещё раз через несколько секунд.",
        },
      ]);

      if (mode !== "routine") {
        setDraft(previousDraft);
      }
    }
  }

  return (
    <AiWidgetContext.Provider
      value={{
        aiAssistant,
        changeMode,
        closeWidget,
        draft,
        entries,
        isOpen,
        mode,
        openWidget,
        resetScenario,
        routineProfile,
        selectedProductIds,
        setDraft,
        setRoutineProfile,
        submitRequest,
        toggleConcern,
      }}
    >
      {children}
    </AiWidgetContext.Provider>
  );
}

export function useAiWidget() {
  const context = useContext(AiWidgetContext);

  if (!context) {
    throw new Error("useAiWidget must be used inside AiAssistantProvider");
  }

  return context;
}

export default function AiAssistantWidget() {
  const {
    aiAssistant,
    changeMode,
    closeWidget,
    draft,
    entries,
    isOpen,
    mode,
    openWidget,
    resetScenario,
    routineProfile,
    selectedProductIds,
    setDraft,
    setRoutineProfile,
    submitRequest,
    toggleConcern,
  } = useAiWidget();
  const scrollerRef = useRef(null);
  const scenario = aiScenarioConfig[mode];

  useEffect(() => {
    if (!isOpen || !scrollerRef.current) {
      return;
    }

    scrollerRef.current.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [entries, isOpen, mode, aiAssistant.isPending]);

  return (
    <>
      <button
        type="button"
        onClick={() => openWidget()}
        className="fixed bottom-4 right-4 z-[60] inline-flex items-center gap-2.5 rounded-full border border-[#DFC4A2] bg-[#F6E9D9] px-3.5 py-2.5 text-sm font-medium text-[#604A35] shadow-[0_18px_40px_rgba(156,123,102,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#F2E1CB] sm:bottom-6 sm:right-6"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-soft">
          <MessageCircle className="h-[18px] w-[18px] text-[#9D7A4E]" strokeWidth={1.7} />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[10px] uppercase tracking-[0.2em] text-[#8B6B47]">
            Консультация
          </span>
          <span className="block text-sm text-[#604A35]">Помочь с выбором</span>
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
          >
            <div
              className="absolute inset-0 bg-[rgba(255,251,246,0.68)] backdrop-blur-[3px]"
              onClick={closeWidget}
            />

            <motion.aside
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-3 bottom-3 top-auto flex h-[72vh] max-h-[700px] flex-col overflow-hidden rounded-[2rem] border border-[#E9DDD0] bg-[#FFFCF8]/96 shadow-[0_36px_90px_rgba(156,123,102,0.22)] backdrop-blur-xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[620px] sm:max-h-[72vh] sm:w-[392px]"
            >
              <div className="border-b border-[#EEE3D6] px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="gold-shimmer font-serif text-[1.1rem] tracking-[0.28em]">
                      YUVEMA
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Встроенная консультация по продуктам, подбору и покупке.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeWidget}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone shadow-soft transition-colors hover:bg-[#F8F1E8]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(aiScenarioConfig).map(([scenarioKey, item]) => (
                    <button
                      key={scenarioKey}
                      type="button"
                      onClick={() => changeMode(scenarioKey)}
                      className={cn(
                        "rounded-full border px-3 py-2 text-[11px] uppercase tracking-[0.16em] transition-all",
                        mode === scenarioKey
                          ? "border-[#D4B083] bg-[#F8ECDD] text-[#6C543B] shadow-soft"
                          : "border-[#E9DED2] bg-white text-[#7A6551] hover:border-[#D8C0A0] hover:bg-[#FFF9F1]",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div ref={scrollerRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
                {entries.map((entry) => (
                  <ChatEntry
                    key={entry.id}
                    entry={entry}
                    onSuggestionClick={(question) => setDraft(question)}
                  />
                ))}

                {aiAssistant.isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mr-10 rounded-[1.5rem] border border-[#EFE2D7] bg-white px-4 py-3 shadow-soft"
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Собираю ответ под каталог YUVEMA…
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="border-t border-[#EEE3D6] bg-[#FFFDF9] px-4 pb-4 pt-3">
                {mode === "routine" ? (
                  <div className="rounded-[1.4rem] border border-[#EEE2D6] bg-white px-4 py-4 shadow-soft">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Профиль кожи
                    </p>

                    <div className="mt-3">
                      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[#8A7258]">
                        Тип кожи
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {routineSkinTypes.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() =>
                              setRoutineProfile((current) => ({ ...current, skinType: item }))
                            }
                            className={cn(
                              "rounded-full border px-3 py-2 text-xs transition-all",
                              routineProfile.skinType === item
                                ? "border-[#D6B185] bg-[#F8ECDD] text-[#684E34]"
                                : "border-[#ECE1D5] bg-[#FFFDFC] text-[#7B6856] hover:bg-[#FFF7F0]",
                            )}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[#8A7258]">
                        Задачи
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {routineConcerns.map((concern) => (
                          <button
                            key={concern}
                            type="button"
                            onClick={() => toggleConcern(concern)}
                            className={cn(
                              "rounded-full border px-3 py-2 text-xs transition-all",
                              routineProfile.concerns.includes(concern)
                                ? "border-[#D6B185] bg-[#F8ECDD] text-[#684E34]"
                                : "border-[#ECE1D5] bg-[#FFFDFC] text-[#7B6856] hover:bg-[#FFF7F0]",
                            )}
                          >
                            {concern}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[#8A7258]">
                        Цель
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {routineGoals.map((goal) => (
                          <button
                            key={goal}
                            type="button"
                            onClick={() =>
                              setRoutineProfile((current) => ({ ...current, goal }))
                            }
                            className={cn(
                              "rounded-full border px-3 py-2 text-xs transition-all",
                              routineProfile.goal === goal
                                ? "border-[#D6B185] bg-[#F8ECDD] text-[#684E34]"
                                : "border-[#ECE1D5] bg-[#FFFDFC] text-[#7B6856] hover:bg-[#FFF7F0]",
                            )}
                          >
                            {goal}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={submitRequest}
                        disabled={aiAssistant.isPending}
                        className="flex-1 text-[11px] uppercase tracking-[0.16em]"
                      >
                        {aiAssistant.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Подбираем
                          </>
                        ) : (
                          <>
                            Собрать уход
                            <WandSparkles className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => resetScenario(mode)}
                        className="px-4"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {scenario.suggestions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setDraft(item)}
                          className="rounded-full border border-[#ECE1D5] bg-white px-3 py-2 text-xs text-[#7A6652] shadow-soft transition-all hover:-translate-y-0.5 hover:bg-[#FFF8F1]"
                        >
                          {item}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-[1.4rem] border border-[#EEE2D6] bg-white p-3 shadow-soft">
                      <textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder={scenario.placeholder}
                        className="min-h-[72px] w-full resize-none border-0 bg-transparent px-1 py-1 text-sm leading-relaxed text-stone outline-none placeholder:text-muted-foreground/75"
                      />

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-xs text-muted-foreground">
                          {selectedProductIds.length > 0
                            ? "Ответ учитывает выбранный товар."
                            : "Ответ строится на каталоге YUVEMA."}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => resetScenario(mode)}
                            className="px-4"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={submitRequest}
                            disabled={aiAssistant.isPending}
                            className="px-4"
                          >
                            {aiAssistant.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ChatEntry({ entry, onSuggestionClick }) {
  if (entry.kind === "result") {
    const { result } = entry;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mr-6 rounded-[1.6rem] border border-[#EEE3D8] bg-white px-4 py-4 shadow-soft"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBF0E3] shadow-soft">
            <Sparkles className="h-4 w-4 text-[#A88152]" strokeWidth={1.6} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#8B7156]">Консультация</p>
            <h3 className="mt-1 font-serif text-[1.65rem] leading-[1.02] text-stone">
              {result.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {result.summary}
            </p>

            {result.highlights?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {result.highlights.map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))}
              </div>
            )}

            <div className="markdown-premium mt-4 rounded-[1.3rem] bg-[#FCF8F2] p-4">
              <ReactMarkdown>{result.responseMarkdown}</ReactMarkdown>
            </div>

            {result.recommendedProducts?.length > 0 && (
              <div className="mt-4 space-y-3">
                {result.recommendedProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="block rounded-[1.2rem] border border-[#EEE2D6] bg-[#FFFCF8] px-4 py-3 transition-colors hover:bg-[#FBF5EE]"
                  >
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {product.brand}
                    </p>
                    <div className="mt-1 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-stone">{product.name}</p>
                        {product.short_description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {product.short_description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-medium text-[#6B543D]">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {result.suggestedQuestions?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {result.suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => onSuggestionClick(question)}
                    className="rounded-full border border-[#ECE1D5] bg-white px-3 py-2 text-xs text-[#7A6652] transition-colors hover:bg-[#FFF8F1]"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "max-w-[92%] rounded-[1.5rem] px-4 py-3 shadow-soft",
        entry.role === "assistant"
          ? "mr-10 border border-[#EFE2D7] bg-white"
          : "ml-auto border border-[#E4CBA8] bg-[#F8ECDD] text-[#5C4734]",
      )}
    >
      {entry.kind === "intro" ? (
        <>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#8B7156]">{entry.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{entry.text}</p>
        </>
      ) : entry.kind === "error" ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{entry.text}</p>
      ) : (
        <p className="text-sm leading-relaxed">{entry.text}</p>
      )}
    </motion.div>
  );
}
