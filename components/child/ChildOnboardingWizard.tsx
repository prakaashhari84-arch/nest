import React, { useState } from 'react';
import { OnboardingFormValues } from '@/lib/childProfile';

interface ChildOnboardingWizardProps {
  initialNickname?: string;
  onComplete: (values: OnboardingFormValues) => void;
}

const COMMON_NATIONALITIES = [
  { name: 'United States', flag: '🇺🇸' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Other / Somewhere else', flag: '🌍' },
];

const COMMON_LANGUAGES = [
  { code: 'English', name: 'English', flag: '🇬🇧', greeting: 'Hello!' },
  { code: 'Spanish', name: 'Español (Spanish)', flag: '🇪🇸', greeting: '¡Hola!' },
  { code: 'French', name: 'Français (French)', flag: '🇫🇷', greeting: 'Bonjour!' },
  { code: 'German', name: 'Deutsch (German)', flag: '🇩🇪', greeting: 'Hallo!' },
  { code: 'Mandarin', name: '中文 (Mandarin)', flag: '🇨🇳', greeting: '你好!' },
  { code: 'Japanese', name: '日本語 (Japanese)', flag: '🇯🇵', greeting: 'こんにちは!' },
  { code: 'Arabic', name: 'العربية (Arabic)', flag: '🇸🇦', greeting: 'مرحباً!' },
  { code: 'Portuguese', name: 'Português', flag: '🇧🇷', greeting: 'Olá!' },
  { code: 'Hindi', name: 'हिन्दी (Hindi)', flag: '🇮🇳', greeting: 'नमस्ते!' },
];

const COMMON_GRADES = [
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  'Homeschool / Other',
];

export default function ChildOnboardingWizard({
  initialNickname = '',
  onComplete,
}: ChildOnboardingWizardProps) {
  // Wizard Step: 1 to 6
  const [step, setStep] = useState<number>(1);

  // Form Fields
  const [nickname, setNickname] = useState<string>(initialNickname || '');
  const [age, setAge] = useState<number>(8);
  const [grade, setGrade] = useState<string>('');
  const [customGrade, setCustomGrade] = useState<string>('');
  const [nationality, setNationality] = useState<string>('United States');
  const [customNationality, setCustomNationality] = useState<string>('');
  const [preferredLanguage, setPreferredLanguage] = useState<string>('English');
  const [traumaChoice, setTraumaChoice] = useState<'YES' | 'NO' | 'PREFER_NOT_TO_SAY' | null>(null);
  const [traumaHistoryNote, setTraumaHistoryNote] = useState<string>('');
  const [trustedPersonName, setTrustedPersonName] = useState<string>('');
  const [trustedPersonRel, setTrustedPersonRel] = useState<string>('');
  const [trustedPersonContact, setTrustedPersonContact] = useState<string>('');

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      // Complete step 6
      const resolvedGrade = grade === 'Homeschool / Other' && customGrade ? customGrade : grade;
      const resolvedNationality = nationality === 'Other / Somewhere else' && customNationality ? customNationality : nationality;
      
      onComplete({
        nickname: nickname.trim() || 'Friend',
        age,
        grade: resolvedGrade.trim() || undefined,
        nationality: resolvedNationality.trim() || 'Earth',
        preferredLanguage,
        traumaChoice: traumaChoice || 'PREFER_NOT_TO_SAY',
        // Sensitive field stored strictly for system prompt LLM context; never shown in UI or logged in telemetry
        traumaHistoryNote: traumaChoice === 'YES' ? traumaHistoryNote.trim() : undefined,
        trustedPersonName: trustedPersonName.trim() || undefined,
        trustedPersonRel: trustedPersonRel.trim() || undefined,
        trustedPersonContact: trustedPersonContact.trim() || undefined,
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  // Step validation to enable/disable Next button
  const canProceed = () => {
    switch (step) {
      case 1:
        return nickname.trim().length >= 1;
      case 2:
        return age >= 5 && age <= 18;
      case 3:
        return true; // skippable
      case 4:
        return nationality.length > 0;
      case 5:
        return preferredLanguage.length > 0;
      case 6:
        return traumaChoice !== null;
      default:
        return true;
    }
  };

  return (
    <div id="child-onboarding-container" className="w-full max-w-xl mx-auto py-2 sm:py-6 px-2 sm:px-4 flex-1 flex flex-col justify-center">
      {/* Friendly Soft Outer Container */}
      <div className="bg-white rounded-3xl border border-amber-200/80 shadow-md p-5 sm:p-8 space-y-6 w-full">
        {/* Top Progress Dots & Step Pill */}
        <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🪺</span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
              Getting to know you • {step} of {totalSteps}
            </span>
          </div>

          {/* 6 Step Progress Dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-7 bg-amber-500 shadow-xs'
                    : i < step
                    ? 'w-2.5 bg-amber-300'
                    : 'w-2.5 bg-stone-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: NICKNAME */}
        {step === 1 && (
          <div id="step-1-nickname" className="space-y-6 py-2 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-4xl inline-block animate-bounce">👋</span>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                What should we call you?
              </h1>
              <p className="text-sm sm:text-base text-stone-600 max-w-md mx-auto">
                Pick a nickname or your real first name. Whatever makes you smile!
              </p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <input
                id="nickname-input"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Type your nickname here..."
                autoFocus
                maxLength={24}
                className="w-full px-5 py-4 text-lg sm:text-xl font-bold text-center rounded-2xl border-2 border-amber-300 bg-amber-50/40 text-stone-900 focus:outline-none focus:ring-4 focus:ring-amber-400/30 focus:border-amber-500 shadow-xs transition-all placeholder:text-stone-400"
              />

              {/* Quick Suggestion Chips */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-stone-400 text-center block">
                  Or tap one you like:
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Leo', 'Sam', 'Maya', 'Alex', 'Charlie', 'Sunny', 'Nova'].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNickname(name)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        nickname === name
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-stone-100 hover:bg-amber-100 text-stone-700'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: AGE NUMBER PICKER */}
        {step === 2 && (
          <div id="step-2-age" className="space-y-6 py-2 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-4xl inline-block">🎂</span>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                How old are you?
              </h1>
              <p className="text-sm sm:text-base text-stone-600">
                Tap your age so we can make everything just right for you!
              </p>
            </div>

            {/* Visual Age Selector Tiles */}
            <div className="space-y-4 max-w-lg mx-auto">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {[6, 7, 8, 9, 10, 11, 12, 13, 14].map((num) => {
                  const isSelected = age === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      id={`age-btn-${num}`}
                      onClick={() => setAge(num)}
                      className={`py-3.5 px-2 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500 text-white shadow-md scale-105'
                          : 'border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-300 text-stone-800'
                      }`}
                    >
                      <span className="text-2xl">{num}</span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-amber-100' : 'text-stone-400'}`}>
                        years
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Stepper controls for younger/older ages */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                <button
                  type="button"
                  onClick={() => setAge((prev) => Math.max(5, prev - 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 text-xl font-bold flex items-center justify-center shadow-xs"
                >
                  −
                </button>
                <div className="text-center">
                  <span className="text-lg font-black text-amber-900">{age} years old</span>
                  <span className="text-[11px] text-amber-700 block">
                    {age <= 10 ? 'Explorer (6-10 age group)' : 'Navigator (10-14 age group)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAge((prev) => Math.min(18, prev + 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 text-xl font-bold flex items-center justify-center shadow-xs"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: GRADE (OPTIONAL / SKIPPABLE) */}
        {step === 3 && (
          <div id="step-3-grade" className="space-y-6 py-2 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-4xl inline-block">🎒</span>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                What grade are you in?
              </h1>
              <p className="text-sm sm:text-base text-stone-600">
                You can pick your school grade, or skip this if you want.
              </p>
            </div>

            <div className="space-y-3 max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-2.5">
                {COMMON_GRADES.map((g) => {
                  const isSelected = grade === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      id={`grade-option-${g.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      onClick={() => setGrade(g)}
                      className={`p-3 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all text-left flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                          : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                      }`}
                    >
                      <span>{g}</span>
                      {isSelected && <span className="text-amber-600">✓</span>}
                    </button>
                  );
                })}
              </div>

              {grade === 'Homeschool / Other' && (
                <input
                  type="text"
                  value={customGrade}
                  onChange={(e) => setCustomGrade(e.target.value)}
                  placeholder="Type your grade or learning style..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              )}
            </div>
          </div>
        )}

        {/* STEP 4: NATIONALITY / WHERE ARE YOU FROM */}
        {step === 4 && (
          <div id="step-4-nationality" className="space-y-6 py-2 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-4xl inline-block">🌎</span>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Where are you from?
              </h1>
              <p className="text-sm sm:text-base text-stone-600">
                Pick your home country or where you live!
              </p>
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                {COMMON_NATIONALITIES.map((c) => {
                  const isSelected = nationality === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setNationality(c.name)}
                      className={`p-3 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all flex items-center gap-2.5 text-left ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                          : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                      }`}
                    >
                      <span className="text-xl">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>

              {nationality === 'Other / Somewhere else' && (
                <input
                  type="text"
                  value={customNationality}
                  onChange={(e) => setCustomNationality(e.target.value)}
                  placeholder="Type your country or town..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              )}
            </div>
          </div>
        )}

        {/* STEP 5: PREFERRED LANGUAGE */}
        {step === 5 && (
          <div id="step-5-language" className="space-y-6 py-2 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-4xl inline-block">💬</span>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                What language do you want to chat in?
              </h1>
              <p className="text-sm sm:text-base text-stone-600">
                Your companion will talk with you in the language you choose.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto">
              {COMMON_LANGUAGES.map((lang) => {
                const isSelected = preferredLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    id={`lang-btn-${lang.code.toLowerCase()}`}
                    onClick={() => setPreferredLanguage(lang.code)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500 text-white shadow-md scale-102'
                        : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-amber-100' : 'text-stone-400'}`}>
                        {lang.greeting}
                      </span>
                    </div>
                    <span className="font-bold text-xs sm:text-sm">{lang.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: GENTLE, NON-CLINICAL SENSITIVE CARE QUESTION */}
        {step === 6 && (
          <div id="step-6-care-framing" className="space-y-6 py-2 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-4xl inline-block">💛</span>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                Has anything really hard happened to you recently that you'd want me to be extra careful about?
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                This stays completely private between you and your helper so we can treat you with extra gentleness.
              </p>
            </div>

            {/* 3 Clear Choice Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
              <button
                type="button"
                id="trauma-choice-yes"
                onClick={() => setTraumaChoice('YES')}
                className={`py-3.5 px-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-1 ${
                  traumaChoice === 'YES'
                    ? 'border-amber-500 bg-amber-500 text-white shadow-md'
                    : 'border-stone-200 bg-stone-50 hover:bg-amber-50 text-stone-800'
                }`}
              >
                <span className="text-lg">🌿</span>
                <span>Yes</span>
              </button>

              <button
                type="button"
                id="trauma-choice-no"
                onClick={() => {
                  setTraumaChoice('NO');
                  setTraumaHistoryNote('');
                }}
                className={`py-3.5 px-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-1 ${
                  traumaChoice === 'NO'
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                    : 'border-stone-200 bg-stone-50 hover:bg-emerald-50 text-stone-800'
                }`}
              >
                <span className="text-lg">☀️</span>
                <span>No</span>
              </button>

              <button
                type="button"
                id="trauma-choice-skip"
                onClick={() => {
                  setTraumaChoice('PREFER_NOT_TO_SAY');
                  setTraumaHistoryNote('');
                }}
                className={`py-3.5 px-4 rounded-2xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-1 ${
                  traumaChoice === 'PREFER_NOT_TO_SAY'
                    ? 'border-stone-600 bg-stone-700 text-white shadow-md'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <span className="text-lg">🤐</span>
                <span>Prefer not to say</span>
              </button>
            </div>

            {/* Optional Free-Text Field if 'Yes' */}
            {traumaChoice === 'YES' && (
              <div className="space-y-2 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 max-w-lg mx-auto animate-fadeIn">
                <label className="text-xs sm:text-sm font-semibold text-amber-900 block">
                  You don't have to share details — even a word or two helps me be more careful.
                </label>
                <textarea
                  id="trauma-note-input"
                  value={traumaHistoryNote}
                  onChange={(e) => setTraumaHistoryNote(e.target.value)}
                  placeholder="e.g. lost a pet, moved homes, feeling sad recently... (optional)"
                  rows={3}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder:text-stone-400"
                />
                <p className="text-[11px] text-amber-700 italic">
                  🔒 Kept strictly for your companion's gentle responses. Never shown again in your profile.
                </p>
              </div>
            )}

            {/* Optional Trusted Adult / Advocate Contact (Safety Protocol) */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 max-w-lg mx-auto space-y-3 text-left">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <label className="text-xs font-bold text-stone-800">
                  Trusted Person or Family Advocate (Optional)
                </label>
              </div>
              <p className="text-[11px] text-stone-500">
                An adult you feel safe with (e.g. an aunt, uncle, school counselor, or family friend) in case you ever need extra help.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={trustedPersonName}
                  onChange={(e) => setTrustedPersonName(e.target.value)}
                  placeholder="Name (e.g. Aunt Sarah)"
                  className="p-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={trustedPersonRel}
                  onChange={(e) => setTrustedPersonRel(e.target.value)}
                  placeholder="Relationship (e.g. Aunt / Counselor)"
                  className="p-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <input
                type="text"
                value={trustedPersonContact}
                onChange={(e) => setTrustedPersonContact(e.target.value)}
                placeholder="Phone or Email (optional)"
                className="w-full p-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Navigation Action Buttons at Bottom */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-100">
          {step > 1 ? (
            <button
              id="wizard-back-btn"
              type="button"
              onClick={handleBack}
              className="px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm transition-all flex items-center gap-1.5"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {step === 3 && !grade && (
              <button
                id="wizard-skip-grade-btn"
                type="button"
                onClick={() => {
                  setGrade('');
                  handleNext();
                }}
                className="px-4 py-3 rounded-2xl text-stone-500 hover:text-stone-800 font-semibold text-xs transition-all"
              >
                Skip for now
              </button>
            )}

            <button
              id="wizard-next-btn"
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-black text-sm sm:text-base shadow-sm transition-all flex items-center gap-2 disabled:cursor-not-allowed hover:scale-102 active:scale-98"
            >
              <span>{step === totalSteps ? 'Finish & Meet Creature ✨' : 'Next →'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
