'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, RefreshCw, ShieldAlert, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import {
  RuleSetRecord,
  EscalationTrigger,
  EscalationSeverity,
  getAllRuleSets,
  saveRuleSet,
  deleteRuleSet,
  resetRuleSetsToDefault,
  getEffectiveRuleHierarchy,
  evaluateEscalation,
  GLOBAL_DEFAULT_RULESET,
} from '@/lib/rules';
import { AppUser } from '@/lib/auth';
import {
  getConversationTurns,
  generateCompanionResponse,
  ConversationTurnData,
  clearConversationTurns,
} from '@/lib/companion';
import { getChildProfile } from '@/lib/childProfile';

interface ClinicianRulesPageProps {
  user?: AppUser | null;
  onNavigateBack?: () => void;
}

// Sample patient caseload for child-specific rule assignment
const PATIENT_CASELOAD = [
  { id: 'cp_child_01', name: 'Leo Martinez', age: 8, ageGroup: 'SIX_TO_TEN', condition: 'Mild Somatic Anxiety' },
  { id: 'cp_child_02', name: 'Maya Lin', age: 12, ageGroup: 'TEN_TO_FOURTEEN', condition: 'Social & Peer Stress' },
  { id: 'cp_child_03', name: 'Sammy Davis', age: 7, ageGroup: 'SIX_TO_TEN', condition: 'Bedtime & Routine Dread' },
  { id: 'cp_child_04', name: 'Aiden Brooks', age: 13, ageGroup: 'TEN_TO_FOURTEEN', condition: 'Academic Performance Anxiety' },
];

export default function ClinicianRulesPage({ user, onNavigateBack }: ClinicianRulesPageProps) {
  const [ruleSets, setRuleSets] = useState<RuleSetRecord[]>([]);
  const [selectedRuleSetId, setSelectedRuleSetId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'rulesets' | 'hierarchy_inspector' | 'simulator' | 'audit_trail'>('rulesets');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [auditPatientId, setAuditPatientId] = useState<string>('cp_child_01');
  const [liveTestPrompt, setLiveTestPrompt] = useState<string>('Can you diagnose if I have ADHD and need pills?');
  const [liveTestResult, setLiveTestResult] = useState<any>(null);
  const [isGeneratingLiveTest, setIsGeneratingLiveTest] = useState<boolean>(false);

  // Form Editor State
  const [editForm, setEditForm] = useState<{
    id?: string;
    name: string;
    targetScope: 'GLOBAL' | 'CLINICIAN' | 'CHILD';
    childId: string | null;
    allowedTopics: string[];
    forbiddenTopics: string[];
    escalationTriggers: EscalationTrigger[];
    toneGuidelines: string;
    age6to10Vocab: string;
    age6to10Tone: string;
    age10to14Vocab: string;
    age10to14Tone: string;
  }>({
    name: '',
    targetScope: 'CLINICIAN',
    childId: null,
    allowedTopics: [],
    forbiddenTopics: [],
    escalationTriggers: [],
    toneGuidelines: '',
    age6to10Vocab: '',
    age6to10Tone: '',
    age10to14Vocab: '',
    age10to14Tone: '',
  });

  // Inputs for adding items in form
  const [newAllowedTopic, setNewAllowedTopic] = useState('');
  const [newForbiddenTopic, setNewForbiddenTopic] = useState('');
  const [newTriggerPattern, setNewTriggerPattern] = useState('');
  const [newTriggerDesc, setNewTriggerDesc] = useState('');
  const [newTriggerSeverity, setNewTriggerSeverity] = useState<EscalationSeverity>('MILD');

  // Hierarchy Inspector State
  const [inspectorChildId, setInspectorChildId] = useState<string>('cp_child_01');

  // Safety Simulator State
  const [simMessage, setSimMessage] = useState<string>('My stomach hurts really bad every morning before school starts.');
  const [simChildId, setSimChildId] = useState<string>('cp_child_01');

  // Load RuleSets on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = getAllRuleSets();
    setRuleSets(data);
    if (!selectedRuleSetId && data.length > 0) {
      setSelectedRuleSetId(data[0].id);
    }
  };

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 4000);
  };

  // Open Form for creating or editing
  const startCreate = (scope: 'CLINICIAN' | 'CHILD' = 'CLINICIAN', childId: string | null = null) => {
    setEditForm({
      name: scope === 'CHILD' && childId
        ? `${PATIENT_CASELOAD.find((p) => p.id === childId)?.name || 'Patient'} Custom Safety Plan`
        : 'New Clinical Guidance RuleSet',
      targetScope: scope,
      childId: childId,
      allowedTopics: [
        'Daily feelings and emotional expression',
        'Coping strategies, mindfulness, and breathing exercises',
        'Positive self-talk and daily encouragement',
      ],
      forbiddenTopics: [
        'Giving medical, psychiatric, or diagnostic advice',
        'Prescribing medications or therapeutic interventions',
      ],
      escalationTriggers: [
        {
          id: `esc_${Date.now()}_1`,
          keyword_or_pattern: 'scared of school|feeling lonely at recess',
          severity: 'MILD',
          description: 'Mild social or school distress',
        },
      ],
      toneGuidelines: 'Warm, calm, empathetic, curiosity-driven, and supportive.',
      age6to10Vocab: 'Short sentences (under 12 words), simple concrete words, playful analogies.',
      age6to10Tone: 'Gentle, nurturing, and playful.',
      age10to14Vocab: 'Conversational peer-support tone, validate independence, reflective prompts.',
      age10to14Tone: 'Respectful, collaborative, and validating.',
    });
    setIsEditing(true);
  };

  const startEdit = (record: RuleSetRecord) => {
    const age6 = record.content.ageGroupOverrides.find((a) => a.ageGroup === 'SIX_TO_TEN');
    const age10 = record.content.ageGroupOverrides.find((a) => a.ageGroup === 'TEN_TO_FOURTEEN');

    setEditForm({
      id: record.id,
      name: record.name,
      targetScope: record.clinicianId === null && record.childId === null ? 'GLOBAL' : record.childId ? 'CHILD' : 'CLINICIAN',
      childId: record.childId,
      allowedTopics: [...record.content.allowedTopics],
      forbiddenTopics: [...record.content.forbiddenTopics],
      escalationTriggers: record.content.escalationTriggers.map((t) => ({ ...t })),
      toneGuidelines: record.content.toneGuidelines,
      age6to10Vocab: age6?.vocabularyNotes || '',
      age6to10Tone: age6?.toneNotes || '',
      age10to14Vocab: age10?.vocabularyNotes || '',
      age10to14Tone: age10?.toneNotes || '',
    });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;

    let clinicianId: string | null = 'clp_clinician_01';
    let childId: string | null = null;

    if (editForm.targetScope === 'GLOBAL') {
      clinicianId = null;
      childId = null;
    } else if (editForm.targetScope === 'CLINICIAN') {
      clinicianId = 'clp_clinician_01';
      childId = null;
    } else if (editForm.targetScope === 'CHILD') {
      clinicianId = 'clp_clinician_01';
      childId = editForm.childId || 'cp_child_01';
    }

    const saved = saveRuleSet({
      id: editForm.id,
      name: editForm.name,
      clinicianId,
      childId,
      content: {
        allowedTopics: editForm.allowedTopics,
        forbiddenTopics: editForm.forbiddenTopics,
        escalationTriggers: editForm.escalationTriggers,
        toneGuidelines: editForm.toneGuidelines,
        ageGroupOverrides: [
          {
            ageGroup: 'SIX_TO_TEN',
            vocabularyNotes: editForm.age6to10Vocab,
            toneNotes: editForm.age6to10Tone,
          },
          {
            ageGroup: 'TEN_TO_FOURTEEN',
            vocabularyNotes: editForm.age10to14Vocab,
            toneNotes: editForm.age10to14Tone,
          },
        ],
      },
    });

    loadData();
    setIsEditing(false);
    setSelectedRuleSetId(saved.id);
    showNotification(`RuleSet "${saved.name}" saved successfully as Version v${saved.version}.`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete RuleSet "${name}"?`)) {
      deleteRuleSet(id);
      loadData();
      showNotification(`RuleSet "${name}" was deleted.`);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all RuleSets to initial system baseline? Any custom edits will be reverted.')) {
      resetRuleSetsToDefault();
      loadData();
      showNotification('All clinical rule sets have been reset to factory defaults.');
    }
  };

  // Add Allowed Topic helper
  const addAllowedTopic = () => {
    if (newAllowedTopic.trim() && !editForm.allowedTopics.includes(newAllowedTopic.trim())) {
      setEditForm((prev) => ({
        ...prev,
        allowedTopics: [...prev.allowedTopics, newAllowedTopic.trim()],
      }));
      setNewAllowedTopic('');
    }
  };

  // Add Forbidden Topic helper
  const addForbiddenTopic = () => {
    if (newForbiddenTopic.trim() && !editForm.forbiddenTopics.includes(newForbiddenTopic.trim())) {
      setEditForm((prev) => ({
        ...prev,
        forbiddenTopics: [...prev.forbiddenTopics, newForbiddenTopic.trim()],
      }));
      setNewForbiddenTopic('');
    }
  };

  // Add Trigger helper
  const addTrigger = () => {
    if (!newTriggerPattern.trim()) return;
    const trigger: EscalationTrigger = {
      id: `esc_${Date.now()}`,
      keyword_or_pattern: newTriggerPattern.trim(),
      severity: newTriggerSeverity,
      description: newTriggerDesc.trim() || undefined,
    };
    setEditForm((prev) => ({
      ...prev,
      escalationTriggers: [...prev.escalationTriggers, trigger],
    }));
    setNewTriggerPattern('');
    setNewTriggerDesc('');
    setNewTriggerSeverity('MILD');
  };

  // Remove item helpers
  const removeAllowedTopic = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      allowedTopics: prev.allowedTopics.filter((_, i) => i !== index),
    }));
  };

  const removeForbiddenTopic = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      forbiddenTopics: prev.forbiddenTopics.filter((_, i) => i !== index),
    }));
  };

  const removeTrigger = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      escalationTriggers: prev.escalationTriggers.filter((_, i) => i !== index),
    }));
  };

  // Inspector Hierarchy calculation
  const inspectedHierarchy = useMemo(() => {
    return getEffectiveRuleHierarchy(inspectorChildId, 'clp_clinician_01');
  }, [inspectorChildId, ruleSets]);

  // Simulator calculation
  const simHierarchy = useMemo(() => {
    return getEffectiveRuleHierarchy(simChildId, 'clp_clinician_01');
  }, [simChildId, ruleSets]);

  const simResult = useMemo(() => {
    return evaluateEscalation(simMessage, simHierarchy.effectiveRuleSet);
  }, [simMessage, simHierarchy]);

  const selectedPatient = PATIENT_CASELOAD.find((p) => p.id === inspectorChildId);

  return (
    <div id="clinician-rules-container" className="space-y-6 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {saveToast && (
        <div
          id="rules-save-toast"
          className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-stone-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-medium">{saveToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-400/20 border border-sky-300 text-3xl flex items-center justify-center shadow-xs">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-200 text-sky-900">
                  Clinical Safety & Governance
                </span>
                <span className="text-xs font-mono text-stone-500">
                  Prisma Model: RuleSet (v-tracked)
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 mt-1">
                Clinician Rule Engine & Safety Protocols
              </h1>
              <p className="text-sm text-stone-600">
                Define allowed topics, hard medical boundaries, escalation triggers, and age-group tone guidelines consumed by the companion AI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateBack && (
              <button
                type="button"
                onClick={onNavigateBack}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 transition-all shadow-xs"
              >
                ← Back to Dashboard
              </button>
            )}
            <button
              id="create-new-ruleset-btn"
              type="button"
              onClick={() => startCreate('CLINICIAN')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>+</span>
              <span>New RuleSet</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-sky-200/60">
          <button
            id="tab-rulesets-btn"
            type="button"
            onClick={() => {
              setActiveTab('rulesets');
              setIsEditing(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rulesets'
                ? 'bg-sky-900 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-sky-200/60'
            }`}
          >
            <span>📋</span>
            <span>Registered RuleSets ({ruleSets.length})</span>
          </button>
          <button
            id="tab-inspector-btn"
            type="button"
            onClick={() => {
              setActiveTab('hierarchy_inspector');
              setIsEditing(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'hierarchy_inspector'
                ? 'bg-sky-900 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-sky-200/60'
            }`}
          >
            <span>🧬</span>
            <span>Effective Rule Hierarchy</span>
          </button>
          <button
            id="tab-simulator-btn"
            type="button"
            onClick={() => {
              setActiveTab('simulator');
              setIsEditing(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-sky-900 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-sky-200/60'
            }`}
          >
            <span>⚡</span>
            <span>Live Escalation Tester</span>
          </button>
          <button
            id="tab-audit-trail-btn"
            type="button"
            onClick={() => {
              setActiveTab('audit_trail');
              setIsEditing(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'audit_trail'
                ? 'bg-sky-900 text-white shadow-xs'
                : 'bg-white/80 hover:bg-white text-stone-700 border border-sky-200/60'
            }`}
          >
            <span>🔍</span>
            <span>Conversation Audit Trail (Turns)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Registered RuleSets & List / Form View */}
      {activeTab === 'rulesets' && (
        <div className="space-y-6">
          {/* RuleSet Form Modal / View */}
          {isEditing ? (
            <div id="ruleset-editor-form-card" className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold uppercase tracking-wider">
                      {editForm.id ? 'Edit Mode' : 'New RuleSet'}
                    </span>
                    {editForm.id && (
                      <span className="text-xs text-stone-500 font-mono">
                        Saving will create v{(ruleSets.find((r) => r.id === editForm.id)?.version || 1) + 1}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-stone-900 mt-1">
                    {editForm.id ? `Edit RuleSet: ${editForm.name}` : 'Configure Clinical Safety RuleSet'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Basic Meta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                      RuleSet Name *
                    </label>
                    <input
                      id="ruleset-name-input"
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="e.g., Dr. Vance Pediatric Baseline, Leo Math Anxiety Override"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                      Application Scope *
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        id="ruleset-scope-select"
                        value={editForm.targetScope}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            targetScope: e.target.value as 'GLOBAL' | 'CLINICIAN' | 'CHILD',
                          })
                        }
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                      >
                        <option value="CLINICIAN">Clinician Caseload Default (All my patients)</option>
                        <option value="CHILD">Child-Specific Patient Override</option>
                        <option value="GLOBAL">System Global Default</option>
                      </select>

                      {editForm.targetScope === 'CHILD' && (
                        <select
                          id="ruleset-child-select"
                          value={editForm.childId || 'cp_child_01'}
                          onChange={(e) => setEditForm({ ...editForm, childId: e.target.value })}
                          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-amber-50"
                        >
                          {PATIENT_CASELOAD.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.age}y, {p.ageGroup})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section: Allowed & Forbidden Topics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Allowed Topics */}
                  <div className="space-y-3 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/70">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                          Allowed Topics ({editForm.allowedTopics.length})
                        </h3>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium">Encouraged domains</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        id="new-allowed-topic-input"
                        type="text"
                        value={newAllowedTopic}
                        onChange={(e) => setNewAllowedTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllowedTopic())}
                        placeholder="Add topic (e.g., drawing, routine building)"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={addAllowedTopic}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
                      >
                        Add
                      </button>
                    </div>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {editForm.allowedTopics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-100 text-emerald-900 border border-emerald-200"
                        >
                          <span>{topic}</span>
                          <button
                            type="button"
                            onClick={() => removeAllowedTopic(idx)}
                            className="text-emerald-700 hover:text-emerald-950 font-bold ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Forbidden Topics */}
                  <div className="space-y-3 p-4 rounded-xl bg-rose-50/50 border border-rose-200/70">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                          Forbidden Topics ({editForm.forbiddenTopics.length})
                        </h3>
                      </div>
                      <span className="text-[10px] text-rose-700 font-medium">Strict safety guardrails</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        id="new-forbidden-topic-input"
                        type="text"
                        value={newForbiddenTopic}
                        onChange={(e) => setNewForbiddenTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addForbiddenTopic())}
                        placeholder="Add forbidden rule (e.g., no drug dosages)"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        onClick={addForbiddenTopic}
                        className="px-3 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold hover:bg-rose-800"
                      >
                        Add
                      </button>
                    </div>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {editForm.forbiddenTopics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-100 text-rose-900 border border-rose-200"
                        >
                          <span>{topic}</span>
                          <button
                            type="button"
                            onClick={() => removeForbiddenTopic(idx)}
                            className="text-rose-700 hover:text-rose-950 font-bold ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section: Escalation Triggers Table */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
                        <span>⚡ Escalation Triggers Table</span>
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px]">
                          {editForm.escalationTriggers.length} defined
                        </span>
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Patterns evaluated against child messages. Firing a SERIOUS severity initiates immediate clinical & caregiver alerts.
                      </p>
                    </div>
                  </div>

                  {/* Add Trigger Sub-Form */}
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="text-[11px] font-bold text-stone-700">Add New Escalation Trigger</div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-6">
                        <input
                          id="trigger-pattern-input"
                          type="text"
                          value={newTriggerPattern}
                          onChange={(e) => setNewTriggerPattern(e.target.value)}
                          placeholder="Pattern or keywords separated by | (e.g. panic attack|can't breathe)"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          id="trigger-desc-input"
                          type="text"
                          value={newTriggerDesc}
                          onChange={(e) => setNewTriggerDesc(e.target.value)}
                          placeholder="Clinical reason / note"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          id="trigger-severity-select"
                          value={newTriggerSeverity}
                          onChange={(e) => setNewTriggerSeverity(e.target.value as EscalationSeverity)}
                          className={`w-full px-2 py-1.5 text-xs font-bold rounded-lg border focus:outline-none ${
                            newTriggerSeverity === 'SERIOUS'
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          <option value="MILD">MILD Severity</option>
                          <option value="SERIOUS">SERIOUS Severity</option>
                        </select>
                      </div>
                      <div className="sm:col-span-1">
                        <button
                          type="button"
                          onClick={addTrigger}
                          className="w-full px-2 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Triggers Table */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                        <tr>
                          <th className="p-2.5">Pattern / Keywords</th>
                          <th className="p-2.5">Description / Intent</th>
                          <th className="p-2.5">Severity</th>
                          <th className="p-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 bg-white">
                        {editForm.escalationTriggers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-stone-400 text-xs">
                              No escalation triggers added yet. Add one above.
                            </td>
                          </tr>
                        ) : (
                          editForm.escalationTriggers.map((trig, idx) => (
                            <tr key={trig.id || idx} className="hover:bg-stone-50">
                              <td className="p-2.5 font-mono text-[11px] text-stone-800 font-semibold max-w-xs break-all">
                                {trig.keyword_or_pattern}
                              </td>
                              <td className="p-2.5 text-stone-600 text-[11px]">
                                {trig.description || '—'}
                              </td>
                              <td className="p-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    trig.severity === 'SERIOUS'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {trig.severity}
                                </span>
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeTrigger(idx)}
                                  className="text-stone-400 hover:text-rose-600 text-xs font-semibold px-2 py-1"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section: Tone Guidelines */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                      Clinical Tone Guidelines
                    </label>
                    <span className="text-[11px] text-stone-500">Guides phrasing, mirroring & warmth</span>
                  </div>
                  <textarea
                    id="tone-guidelines-textarea"
                    rows={3}
                    value={editForm.toneGuidelines}
                    onChange={(e) => setEditForm({ ...editForm, toneGuidelines: e.target.value })}
                    placeholder="Describe specific clinical tone directives for the companion..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Section: Age Group Overrides */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                    Age Group Vocabulary & Tone Overrides
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 6 to 10 */}
                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900">SIX_TO_TEN (Ages 6-10)</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                          Primary Shell
                        </span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-amber-900">Vocabulary Notes</label>
                        <textarea
                          rows={2}
                          value={editForm.age6to10Vocab}
                          onChange={(e) => setEditForm({ ...editForm, age6to10Vocab: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-300 bg-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-amber-900">Tone Notes</label>
                        <input
                          type="text"
                          value={editForm.age6to10Tone}
                          onChange={(e) => setEditForm({ ...editForm, age6to10Tone: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-300 bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* 10 to 14 */}
                    <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900">TEN_TO_FOURTEEN (Ages 10-14)</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200 text-purple-900 font-bold">
                          Pre-Teen Shell
                        </span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-purple-900">Vocabulary Notes</label>
                        <textarea
                          rows={2}
                          value={editForm.age10to14Vocab}
                          onChange={(e) => setEditForm({ ...editForm, age10to14Vocab: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-purple-300 bg-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-purple-900">Tone Notes</label>
                        <input
                          type="text"
                          value={editForm.age10to14Tone}
                          onChange={(e) => setEditForm({ ...editForm, age10to14Tone: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-purple-300 bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-ruleset-submit-btn"
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2"
                  >
                    <span>💾</span>
                    <span>Save & Deploy Version</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* RuleSets Card Grid */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-stone-900">Active Clinical RuleSets</h2>
                  <p className="text-xs text-stone-500">
                    Rule hierarchy order: Global Default → Clinician Baseline → Child Patient Override.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs font-semibold text-stone-500 hover:text-stone-800 underline self-start sm:self-auto"
                >
                  Reset to System Defaults
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {ruleSets.map((set) => {
                  const isGlobal = set.clinicianId === null && set.childId === null;
                  const isChild = !!set.childId;
                  const linkedChild = isChild ? PATIENT_CASELOAD.find((p) => p.id === set.childId) : null;
                  const seriousCount = set.content.escalationTriggers.filter((t) => t.severity === 'SERIOUS').length;
                  const mildCount = set.content.escalationTriggers.filter((t) => t.severity === 'MILD').length;

                  return (
                    <div
                      key={set.id}
                      className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                        isGlobal
                          ? 'border-stone-300 ring-1 ring-stone-200'
                          : isChild
                          ? 'border-amber-300 bg-linear-to-b from-amber-50/30 to-white'
                          : 'border-sky-300 bg-linear-to-b from-sky-50/30 to-white'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Scope & Version Header */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isGlobal
                                ? 'bg-stone-200 text-stone-800'
                                : isChild
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-sky-100 text-sky-900 border border-sky-300'
                            }`}
                          >
                            {isGlobal ? '🌐 Global Default' : isChild ? '🧒 Child Override' : '🩺 Clinician Baseline'}
                          </span>

                          <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[11px] font-mono font-bold text-stone-700">
                            v{set.version}
                          </span>
                        </div>

                        {/* Title & Linked Target */}
                        <div>
                          <h3 className="text-sm font-bold text-stone-900 leading-snug">{set.name}</h3>
                          {linkedChild && (
                            <p className="text-xs text-amber-800 font-medium mt-0.5">
                              Assigned to: <strong>{linkedChild.name}</strong> ({linkedChild.age} yrs • {linkedChild.condition})
                            </p>
                          )}
                          <p className="text-[11px] text-stone-400 font-mono mt-1">
                            Updated {new Date(set.updatedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-stone-100 text-center">
                          <div className="p-1.5 rounded-lg bg-stone-50">
                            <div className="text-[10px] text-stone-500 uppercase font-bold">Allowed</div>
                            <div className="text-xs font-bold text-emerald-700">{set.content.allowedTopics.length}</div>
                          </div>
                          <div className="p-1.5 rounded-lg bg-stone-50">
                            <div className="text-[10px] text-stone-500 uppercase font-bold">Forbidden</div>
                            <div className="text-xs font-bold text-rose-700">{set.content.forbiddenTopics.length}</div>
                          </div>
                          <div className="p-1.5 rounded-lg bg-stone-50">
                            <div className="text-[10px] text-stone-500 uppercase font-bold">Triggers</div>
                            <div className="text-xs font-bold text-stone-800">
                              {seriousCount + mildCount}{' '}
                              <span className="text-[9px] font-normal text-rose-600">({seriousCount} S)</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Trigger Preview */}
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-stone-600 uppercase tracking-wide">Key Escalation Rules:</div>
                          <div className="space-y-1 max-h-24 overflow-y-auto text-[11px] font-mono text-stone-700">
                            {set.content.escalationTriggers.slice(0, 3).map((t, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 truncate">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    t.severity === 'SERIOUS' ? 'bg-rose-500' : 'bg-amber-500'
                                  }`}
                                />
                                <span className="truncate">{t.keyword_or_pattern}</span>
                              </div>
                            ))}
                            {set.content.escalationTriggers.length > 3 && (
                              <div className="text-[10px] text-stone-400">
                                +{set.content.escalationTriggers.length - 3} more triggers
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(set)}
                          className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs flex-1 text-center"
                        >
                          Edit & Version
                        </button>
                        {isGlobal ? (
                          <button
                            type="button"
                            onClick={() => startCreate('CHILD', 'cp_child_01')}
                            className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-[11px] font-medium text-stone-700 hover:bg-stone-50"
                          >
                            + Child Override
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDelete(set.id, set.name)}
                            className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-[11px] font-medium text-rose-700 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Effective Rule Hierarchy Inspector */}
      {activeTab === 'hierarchy_inspector' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider">
                  Precedence Resolver
                </span>
                <span className="text-xs font-mono text-stone-500">getEffectiveRuleSet(childId)</span>
              </div>
              <h2 className="text-lg font-bold text-stone-900 mt-1">
                Resolved Rule Hierarchy for Patient
              </h2>
              <p className="text-xs text-stone-500">
                Visual audit of how rules merge: Global Baseline (base) → Clinician Baseline → Child Override.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-stone-700">Select Patient:</label>
              <select
                id="hierarchy-patient-select"
                value={inspectorChildId}
                onChange={(e) => setInspectorChildId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-stone-300 bg-amber-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {PATIENT_CASELOAD.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.age}y, {p.ageGroup})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3-Tier Precedence Chain Visualizer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Level 1: Global Default */}
            <div className="p-4 rounded-xl border border-stone-300 bg-stone-50 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                  Level 1 • Base
                </span>
                <span className="text-xs font-mono text-stone-500">v{inspectedHierarchy.globalDefault.version}</span>
              </div>
              <h3 className="text-xs font-bold text-stone-900">{inspectedHierarchy.globalDefault.name}</h3>
              <p className="text-[11px] text-stone-600">
                Foundational safety baseline: medical diagnosis ban, suicide/abuse escalation.
              </p>
            </div>

            {/* Level 2: Clinician Override */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                inspectedHierarchy.clinicianOverride
                  ? 'border-sky-300 bg-sky-50/60'
                  : 'border-stone-200 bg-stone-50/30 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-200 text-sky-900">
                  Level 2 • Clinician Caseload
                </span>
                {inspectedHierarchy.clinicianOverride && (
                  <span className="text-xs font-mono text-stone-500">
                    v{inspectedHierarchy.clinicianOverride.version}
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-stone-900">
                {inspectedHierarchy.clinicianOverride?.name || 'No Clinician Override (Using Global)'}
              </h3>
              <p className="text-[11px] text-stone-600">
                Applies across all clinician's assigned patients unless overridden per child.
              </p>
            </div>

            {/* Level 3: Child Override */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                inspectedHierarchy.childOverride
                  ? 'border-amber-400 bg-amber-50/80 shadow-2xs'
                  : 'border-dashed border-stone-300 bg-stone-50/40 text-stone-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    inspectedHierarchy.childOverride
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  Level 3 • Child-Specific
                </span>
                {inspectedHierarchy.childOverride && (
                  <span className="text-xs font-mono text-stone-500">
                    v{inspectedHierarchy.childOverride.version}
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-stone-900">
                {inspectedHierarchy.childOverride?.name || `No override for ${selectedPatient?.name}`}
              </h3>
              <p className="text-[11px] text-stone-600">
                {inspectedHierarchy.childOverride
                  ? 'Highest specificity. Overrides tone and supplements triggers.'
                  : 'Inherits clinician caseload baseline and global safety rules.'}
              </p>
            </div>
          </div>

          {/* Applied Merged Sources Audit */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
              Computed Effective Configuration for {selectedPatient?.name} ({selectedPatient?.ageGroup})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500">Effective Tone Source:</span>
                  <div className="text-xs font-semibold text-stone-900">
                    {inspectedHierarchy.appliedSources.toneGuidelines}
                  </div>
                  <div className="text-xs text-stone-700 mt-1 italic bg-white p-2.5 rounded-lg border border-stone-200">
                    "{inspectedHierarchy.effectiveRuleSet.content.toneGuidelines}"
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500">Effective Vocabulary Notes:</span>
                  <div className="text-xs text-stone-800 mt-1 bg-white p-2.5 rounded-lg border border-stone-200">
                    {inspectedHierarchy.effectiveRuleSet.content.ageGroupOverrides.find(
                      (o) => o.ageGroup === selectedPatient?.ageGroup
                    )?.vocabularyNotes || 'Standard age baseline'}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-stone-500">Active Escalation Triggers</span>
                  <span className="text-xs font-bold text-stone-900">
                    {inspectedHierarchy.effectiveRuleSet.content.escalationTriggers.length} Active Rules
                  </span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {inspectedHierarchy.effectiveRuleSet.content.escalationTriggers.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white border border-stone-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="truncate font-mono text-[11px] text-stone-800">
                        {t.keyword_or_pattern}
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                          t.severity === 'SERIOUS'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Live Escalation Tester / Simulator */}
      {activeTab === 'simulator' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                Safety Simulation
              </span>
              <span className="text-xs font-mono text-stone-500">evaluateEscalation(text, effectiveRuleSet)</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900 mt-1">
              Live Trigger Evaluation Simulator
            </h2>
            <p className="text-xs text-stone-500">
              Type or select sample child utterances to test against the active hierarchical ruleset and observe trigger matches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Input & Presets */}
            <div className="md:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                    Simulated Patient Context
                  </label>
                  <select
                    value={simChildId}
                    onChange={(e) => setSimChildId(e.target.value)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-stone-300 bg-amber-50"
                  >
                    {PATIENT_CASELOAD.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.ageGroup})
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  id="simulator-message-input"
                  rows={4}
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  placeholder="Enter a child message to test..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Quick Sample Buttons */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wide">
                  Quick Clinical Test Presets:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSimMessage('My tummy hurts really bad every morning before school starts.')}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium"
                  >
                    Somatic School Refusal (MILD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimMessage('I hate myself and want to hurt myself, nobody would care if I disappear.')}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-medium border border-rose-200"
                  >
                    Self-Harm Crisis (SERIOUS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimMessage('Kids in 4th grade made fun of my shoes and pushed me at recess.')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200"
                  >
                    Bullying / Peer Teasing (MILD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimMessage('The transit bus is too loud and the driver yelled, I felt like crying.')}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-medium border border-sky-200"
                  >
                    Transit Sensory Trigger (Leo Override)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimMessage('I built a giant lego castle today and drew a green dragon!')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200"
                  >
                    Benign Creative Play (NO TRIGGER)
                  </button>
                </div>
              </div>
            </div>

            {/* Live Evaluation Output */}
            <div className="md:col-span-5 space-y-4">
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  !simResult.triggered
                    ? 'bg-emerald-50/60 border-emerald-300'
                    : simResult.highestSeverity === 'SERIOUS'
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-amber-50 border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Evaluation Result
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      !simResult.triggered
                        ? 'bg-emerald-200 text-emerald-900'
                        : simResult.highestSeverity === 'SERIOUS'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    {!simResult.triggered
                      ? '✓ SAFE / NO ESCALATION'
                      : `⚠️ ${simResult.highestSeverity} ESCALATION`}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-stone-700">Matched Triggers:</span>{' '}
                    <span className="font-mono">{simResult.matches.length} pattern(s)</span>
                  </div>

                  {simResult.matches.length > 0 ? (
                    <div className="space-y-2 pt-2">
                      {simResult.matches.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900 text-xs">
                              {m.trigger.description || 'Escalation Match'}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                m.trigger.severity === 'SERIOUS'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {m.trigger.severity}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono">
                            Pattern: <code className="text-stone-800 font-bold">{m.matchedPattern}</code>
                          </div>
                          <div className="text-[11px] text-stone-600">
                            Matched text: <mark className="bg-amber-200 px-1 rounded font-medium">"{m.matchedSnippet}"</mark>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-emerald-800 text-[11px] pt-1">
                      No safety triggers fired. Message will proceed to standard companion conversational LLM pipeline according to tone guidelines.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TAB 4: CONVERSATION AUDIT TRAIL (TURNS & LIVE TESTER)
          ------------------------------------------------------------- */}
      {activeTab === 'audit_trail' && (
        <div id="clinician-audit-trail-tab" className="space-y-6 animate-fadeIn">
          {/* Patient Selector & Live Safety Prompt Tester Header */}
          <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-sky-950 flex items-center gap-2">
                  <span>🔍</span>
                  <span>Companion Dialogue & Escalation Audit Trail</span>
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  Review every conversation turn, safety scoring (NONE, MILD, SERIOUS), and rationale according to RuleSet Version.
                </p>
              </div>

              {/* Patient Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-stone-600">Patient:</label>
                <select
                  id="audit-patient-select"
                  value={auditPatientId}
                  onChange={(e) => setAuditPatientId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold bg-stone-50 focus:bg-white text-stone-900"
                >
                  <option value="cp_child_01">Tommy (Age 8 • Pip)</option>
                  <option value="cp_child_02">Maya (Age 12 • Luna)</option>
                  <option value="cp_child_03">Leo (Age 6 • Blaze)</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    clearConversationTurns(auditPatientId);
                    setSaveToast('Audit log cleared for selected patient.');
                    setTimeout(() => setSaveToast(null), 3000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 text-xs font-semibold transition-all cursor-pointer"
                >
                  Clear History
                </button>
              </div>
            </div>

            {/* Live AI Simulation / Test Box */}
            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-700" />
                  Live Companion &amp; Safety Rule Execution Engine
                </span>
                <span className="text-[11px] font-mono text-sky-800">
                  Target Profile: {auditPatientId === 'cp_child_01' ? 'Tommy (6-10)' : 'Maya (10-14)'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="audit-live-test-input"
                  type="text"
                  value={liveTestPrompt}
                  onChange={(e) => setLiveTestPrompt(e.target.value)}
                  placeholder="Enter sample child dialogue to evaluate live response & safety classification..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-sky-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <button
                  id="audit-run-test-btn"
                  type="button"
                  disabled={!liveTestPrompt.trim() || isGeneratingLiveTest}
                  onClick={async () => {
                    setIsGeneratingLiveTest(true);
                    setLiveTestResult(null);
                    try {
                      const res = await generateCompanionResponse({
                        childId: auditPatientId,
                        userMessage: liveTestPrompt.trim(),
                      });
                      setLiveTestResult(res);
                    } catch (err: any) {
                      setLiveTestResult({
                        reply: `Simulation Error: ${err?.message || 'Failed to call companion API'}`,
                        severity: 'NONE',
                        reason: 'Error occurred during test execution.',
                      });
                    } finally {
                      setIsGeneratingLiveTest(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-900 hover:bg-sky-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isGeneratingLiveTest ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Execute Dialogue</span>
                  )}
                </button>
              </div>

              {/* Sample Clinician Test Quick Selectors */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className="text-stone-500 font-bold">Quick Injections:</span>
                <button
                  type="button"
                  onClick={() => setLiveTestPrompt('Can you diagnose if I have ADHD and need pills?')}
                  className="px-2 py-0.5 rounded bg-white hover:bg-sky-100 border border-sky-200 text-sky-900 font-semibold"
                >
                  🚫 Medical Diagnosis
                </button>
                <button
                  type="button"
                  onClick={() => setLiveTestPrompt('Kids on the bus pushed me and said I am stupid.')}
                  className="px-2 py-0.5 rounded bg-white hover:bg-sky-100 border border-sky-200 text-sky-900 font-semibold"
                >
                  ⚠️ Mild Bullying
                </button>
                <button
                  type="button"
                  onClick={() => setLiveTestPrompt('I feel completely hopeless and want to hurt myself.')}
                  className="px-2 py-0.5 rounded bg-white hover:bg-sky-100 border border-sky-200 text-sky-900 font-semibold"
                >
                  🚨 Serious Self-Harm
                </button>
                <button
                  type="button"
                  onClick={() => setLiveTestPrompt('Can you tell me a story about a friendly astronaut bear?')}
                  className="px-2 py-0.5 rounded bg-white hover:bg-sky-100 border border-sky-200 text-sky-900 font-semibold"
                >
                  ✨ Story Adventure
                </button>
              </div>

              {/* Live Test Output Bubble */}
              {liveTestResult && (
                <div className="p-3.5 rounded-xl bg-white border border-sky-200 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">
                      Companion Output ({liveTestResult.severity} Severity):
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        liveTestResult.severity === 'SERIOUS'
                          ? 'bg-rose-100 text-rose-800'
                          : liveTestResult.severity === 'MILD'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {liveTestResult.severity}
                    </span>
                  </div>
                  <p className="text-xs text-stone-800 font-medium bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                    "{liveTestResult.reply}"
                  </p>
                  <div className="text-[11px] text-stone-500">
                    <span className="font-bold text-stone-700">Safety Classifier Reason:</span>{' '}
                    {liveTestResult.reason}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Audit Table */}
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-stone-900">
              Recorded Turns for Patient {auditPatientId}
            </h3>

            {(() => {
              const patientTurns = getConversationTurns(auditPatientId, 50);
              if (patientTurns.length === 0) {
                return (
                  <div className="p-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
                    <p className="text-xs text-stone-500 font-medium">
                      No conversation turns recorded yet for this patient. Run a live test above or interact in the Child view.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {patientTurns.map((turn) => (
                    <div
                      key={turn.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        turn.severity === 'SERIOUS'
                          ? 'bg-rose-50/70 border-rose-200'
                          : turn.severity === 'MILD'
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-stone-50/60 border-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              turn.role === 'CHILD'
                                ? 'bg-purple-100 text-purple-800'
                                : turn.role === 'COMPANION'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-stone-200 text-stone-800'
                            }`}
                          >
                            {turn.role}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(turn.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            turn.severity === 'SERIOUS'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : turn.severity === 'MILD'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {turn.severity}
                        </span>
                      </div>

                      <p className="text-xs text-stone-800 font-medium leading-relaxed">
                        {turn.content}
                      </p>

                      {turn.reason && (
                        <div className="mt-2 pt-1.5 border-t border-stone-200/60 text-[11px] text-stone-600 flex items-start gap-1">
                          <span className="font-bold text-stone-700 flex-shrink-0">Clinical Rationale:</span>
                          <span>{turn.reason}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
