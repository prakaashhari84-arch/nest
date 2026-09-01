'use client';

import React, { useState, useEffect } from 'react';
import {
  PlaceType,
  RatingLevel,
  PLACES_META,
  PlaceRatingData,
  getPlaceRatings,
  savePlaceRating,
} from '@/lib/mood';
import { ChildProfileData, VIBE_DEFINITIONS } from '@/lib/childProfile';
import { awardChildPoints } from '@/lib/gamification';
import {
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Home,
  Check,
} from 'lucide-react';

interface YourPlacesCheckinProps {
  profile: ChildProfileData;
  onOpenCompanionChatWithContext?: (placeContext: {
    place: PlaceType;
    label: string;
    note?: string;
  }) => void;
}

export default function YourPlacesCheckin({
  profile,
  onOpenCompanionChatWithContext,
}: YourPlacesCheckinProps) {
  const isYounger = profile.ageGroup === 'SIX_TO_TEN';
  const companionName = profile.companionName || 'Pip';
  const vibe = profile.companionVibe || 'CHILL';
  const vibeInfo = VIBE_DEFINITIONS[vibe];

  const [ratingsMap, setRatingsMap] = useState<Record<PlaceType, PlaceRatingData | undefined>>(
    {} as any
  );
  // Track which place recently clicked "NOT_GREAT" to trigger the supportive follow-up prompt
  const [activeNotGreatPrompt, setActiveNotGreatPrompt] = useState<PlaceType | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load existing place ratings on mount
  useEffect(() => {
    const data = getPlaceRatings(profile.userId);
    setRatingsMap(data);
  }, [profile.userId]);

  const handleRatingSelect = (place: PlaceType, rating: RatingLevel) => {
    const updated = savePlaceRating(profile.userId, place, rating);
    setRatingsMap((prev) => ({ ...prev, [place]: updated }));
    awardChildPoints(profile.userId, 'places_checkin');

    if (rating === 'NOT_GREAT') {
      // Show supportive follow-up prompt specifically for this place
      setActiveNotGreatPrompt(place);
    } else {
      // Close any active follow-up prompt for this place
      if (activeNotGreatPrompt === place) {
        setActiveNotGreatPrompt(null);
      }
      showToast(`+10 pts! Updated rating for ${PLACES_META[place].label}`);
    }
  };


  const handleTalkAboutIt = (place: PlaceType) => {
    // Save that child wants to talk about it
    savePlaceRating(profile.userId, place, 'NOT_GREAT', {
      wantsToTalk: true,
    });
    setActiveNotGreatPrompt(null);

    if (onOpenCompanionChatWithContext) {
      onOpenCompanionChatWithContext({
        place,
        label: PLACES_META[place].label,
        note: `Child selected 'Not great' for ${PLACES_META[place].label} and opted to talk about it with ${companionName}.`,
      });
    } else {
      showToast(`Saved. ${companionName} is keeping this in mind for your next chat!`);
    }
  };

  const handleJustKnowForNow = (place: PlaceType) => {
    // Save silent acknowledgment
    savePlaceRating(profile.userId, place, 'NOT_GREAT', {
      wantsToTalk: false,
    });
    setActiveNotGreatPrompt(null);
    showToast(`Got it. I'll just know for now. Thank you for telling me.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const placesList = Object.values(PLACES_META);

  return (
    <section
      id="your-places-checkin-container"
      className={`relative p-5 sm:p-7 bg-white border shadow-xs space-y-6 ${
        isYounger ? 'rounded-[2rem] border-purple-100' : 'rounded-2xl border-stone-200'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-stone-900 text-stone-100 text-xs font-semibold flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white text-[11px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-lg">
              📍
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 tracking-tight">
                Your Places
              </h2>
              <p className="text-xs text-stone-500 font-medium">
                Rate how different places feel to you. You can update these anytime.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-purple-800 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
          <span>{vibeInfo.emoji}</span>
          <span>Companion space tracker</span>
        </div>
      </div>

      {/* Grid of Places Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {placesList.map((placeMeta) => {
          const currentRating = ratingsMap[placeMeta.type]?.rating;
          const isPromptOpen = activeNotGreatPrompt === placeMeta.type;
          const isHome = placeMeta.type === 'HOME';

          return (
            <div
              key={placeMeta.type}
              id={`place-card-${placeMeta.type.toLowerCase()}`}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                currentRating === 'NOT_GREAT'
                  ? 'bg-rose-50/40 border-rose-200'
                  : currentRating === 'GOOD'
                  ? 'bg-emerald-50/20 border-emerald-100'
                  : 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
              }`}
            >
              {/* Place Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-1.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
                    {placeMeta.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-stone-900">
                        {placeMeta.label}
                      </h3>
                      {isHome && (
                        <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                          Core
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-1">
                      {placeMeta.description}
                    </p>
                  </div>
                </div>

                {/* Rating Status Badge */}
                {currentRating && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      currentRating === 'GOOD'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentRating === 'OKAY'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {currentRating === 'GOOD' ? 'Good' : currentRating === 'OKAY' ? 'Okay' : 'Not great'}
                  </span>
                )}
              </div>

              {/* Three Rating Chips: Good / Okay / Not great */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleRatingSelect(placeMeta.type, 'GOOD')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                    currentRating === 'GOOD'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300'
                  }`}
                >
                  <span>😊</span>
                  <span>Good</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRatingSelect(placeMeta.type, 'OKAY')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                    currentRating === 'OKAY'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-800 border border-stone-200 hover:border-amber-300'
                  }`}
                >
                  <span>😐</span>
                  <span>Okay</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRatingSelect(placeMeta.type, 'NOT_GREAT')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer ${
                    currentRating === 'NOT_GREAT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-800 border border-stone-200 hover:border-rose-300'
                  }`}
                >
                  <span>😢</span>
                  <span>Not great</span>
                </button>
              </div>

              {/* Supportive Follow-Up Prompt when set to "Not great" */}
              {isPromptOpen && (
                <div
                  id={`place-prompt-${placeMeta.type.toLowerCase()}`}
                  className="mt-3 p-3.5 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-3 animate-fadeIn"
                >
                  <div className="flex items-start gap-2 text-xs text-rose-900">
                    <span className="text-base flex-shrink-0">💛</span>
                    <p className="font-semibold leading-relaxed">
                      "That's tough. Want to talk about it, or would you rather I just know?"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleTalkAboutIt(placeMeta.type)}
                      className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Talk about it</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleJustKnowForNow(placeMeta.type)}
                      className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-stone-500" />
                      <span>Just know for now</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
