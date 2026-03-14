 'use client';

import { useEffect, useMemo, useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { useLanguage } from '@/components/language-provider';
import { useMayaState } from '@/components/maya-state-provider';
import { getMemoryKindLabel, getPriorityLabel, getStageLabel, getUiText } from '@/lib/i18n';
import { getMayaProductText, memoryKinds, projectPriorities, projectStages } from '@/lib/maya-product-text';
import { MemoryItem, Project } from '@/lib/types';

type ProjectFormState = {
  title: string;
  summary: string;
  desiredOutcome: string;
  nextMove: string;
  risk: string;
  projectQuestion: string;
  stage: Project['stage'];
  priority: Project['priority'];
  tags: string;
  constraints: string;
};

type MemoryFormState = {
  title: string;
  kind: MemoryItem['kind'];
  summary: string;
  whyItMatters: string;
  tags: string;
  projectIds: string[];
  pinned: boolean;
};

function parseList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(values: string[] | undefined) {
  return (values || []).join(', ');
}

function createProjectForm(project?: Project): ProjectFormState {
  return {
    title: project?.title || '',
    summary: project?.summary || '',
    desiredOutcome: project?.desiredOutcome || '',
    nextMove: project?.nextMove || '',
    risk: project?.risk || '',
    projectQuestion: project?.projectQuestion || '',
    stage: project?.stage || 'active',
    priority: project?.priority || 'medium',
    tags: joinList(project?.tags),
    constraints: joinList(project?.constraints)
  };
}

function createMemoryForm(item?: MemoryItem): MemoryFormState {
  return {
    title: item?.title || '',
    kind: item?.kind || 'insight',
    summary: item?.summary || '',
    whyItMatters: item?.whyItMatters || '',
    tags: joinList(item?.tags),
    projectIds: item?.projectIds || [],
    pinned: Boolean(item?.pinned)
  };
}

export function ContextScreen() {
  const { language } = useLanguage();
  const text = getUiText(language);
  const productText = getMayaProductText(language);
  const { state, activeProject, updateProfile, upsertProject, deleteProject, upsertMemoryItem, deleteMemoryItem, setMemoryPinned, setActiveProjectId, isSaving } = useMayaState();
  const [displayName, setDisplayName] = useState('');
  const [addressing, setAddressing] = useState('');
  const [role, setRole] = useState('');
  const [mission, setMission] = useState('');
  const [assistantContract, setAssistantContract] = useState('');
  const [timezone, setTimezone] = useState('');
  const [location, setLocation] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [currentFocus, setCurrentFocus] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormState>(createProjectForm());
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [memoryForm, setMemoryForm] = useState<MemoryFormState>(createMemoryForm());

  useEffect(() => {
    if (!state) {
      return;
    }

    setDisplayName(state.profile.displayName || '');
    setAddressing(state.profile.addressing || '');
    setRole(state.profile.role || '');
    setMission(state.profile.mission || '');
    setAssistantContract(state.profile.assistantContract || '');
    setTimezone(state.profile.timezone || '');
    setLocation(state.profile.location || '');
    setCommunicationStyle(joinList(state.profile.communicationStyle));
    setCurrentFocus(joinList(state.profile.currentFocus));
  }, [state?.profile]);

  const sortedMemory = useMemo(() => {
    return [...(state?.memoryItems || [])].sort((left, right) => Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)) || left.title.localeCompare(right.title));
  }, [state?.memoryItems]);

  async function handleProfileSave() {
    await updateProfile({
      displayName,
      addressing,
      role,
      mission,
      assistantContract,
      timezone,
      location,
      communicationStyle: parseList(communicationStyle),
      currentFocus: parseList(currentFocus)
    });
  }

  async function handleProjectSave() {
    if (!projectForm.title.trim()) {
      return;
    }

    await upsertProject({
      id: editingProjectId || undefined,
      title: projectForm.title,
      summary: projectForm.summary,
      desiredOutcome: projectForm.desiredOutcome,
      nextMove: projectForm.nextMove,
      risk: projectForm.risk,
      projectQuestion: projectForm.projectQuestion,
      stage: projectForm.stage,
      priority: projectForm.priority,
      tags: parseList(projectForm.tags),
      constraints: parseList(projectForm.constraints)
    });

    setEditingProjectId(null);
    setProjectForm(createProjectForm());
  }

  async function handleMemorySave() {
    if (!memoryForm.title.trim()) {
      return;
    }

    await upsertMemoryItem({
      id: editingMemoryId || undefined,
      title: memoryForm.title,
      kind: memoryForm.kind,
      summary: memoryForm.summary,
      whyItMatters: memoryForm.whyItMatters,
      tags: parseList(memoryForm.tags),
      projectIds: memoryForm.projectIds,
      pinned: memoryForm.pinned
    });

    setEditingMemoryId(null);
    setMemoryForm(createMemoryForm());
  }

  return (
    <AppShell
      eyebrow={text.context.eyebrow}
      title={text.context.title}
      subtitle={text.context.subtitle}
      sidePanel={
        <div className="flex flex-col gap-4">
          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">{text.context.profile}</div>
            <h2 className="mt-2 text-xl font-semibold text-white">{state?.profile.displayName || productText.common.loading}</h2>
            <p className="mt-2 text-sm text-slate-300">{state?.profile.role}</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-400">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{text.context.timezone}</div>
                <div className="mt-1 text-slate-200">{state?.profile.timezone}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{text.context.location}</div>
                <div className="mt-1 text-slate-200">{state?.profile.location}</div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
            <div className="text-xs uppercase tracking-[0.22em] text-violet-300">{productText.context.activeFocus}</div>
            {activeProject ? (
              <>
                <h2 className="mt-2 text-xl font-semibold text-white">{activeProject.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{activeProject.nextMove}</p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-300">{productText.shell.noActiveProject}</p>
            )}
          </section>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">{productText.context.manageProfile}</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.displayName}</div>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.addressing}</div>
              <input value={addressing} onChange={(event) => setAddressing(event.target.value)} className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300 md:col-span-2">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.role}</div>
              <input value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300 md:col-span-2">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.mission}</div>
              <textarea value={mission} onChange={(event) => setMission(event.target.value)} className="min-h-28 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300 md:col-span-2">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.assistantContract}</div>
              <textarea value={assistantContract} onChange={(event) => setAssistantContract(event.target.value)} className="min-h-28 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.timezone}</div>
              <input value={timezone} onChange={(event) => setTimezone(event.target.value)} className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.location}</div>
              <input value={location} onChange={(event) => setLocation(event.target.value)} className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300 md:col-span-2">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.communicationStyle}</div>
              <textarea value={communicationStyle} onChange={(event) => setCommunicationStyle(event.target.value)} className="min-h-24 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300 md:col-span-2">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.currentFocus}</div>
              <textarea value={currentFocus} onChange={(event) => setCurrentFocus(event.target.value)} className="min-h-24 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
          </div>
          <button type="button" onClick={handleProfileSave} disabled={isSaving} className="mt-5 rounded-full border border-violet-400/40 bg-violet-500/10 px-5 py-3 text-sm font-medium text-violet-100 disabled:opacity-60">
            {productText.common.save}
          </button>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">{editingProjectId ? productText.context.editProject : productText.context.createProject}</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-300 md:col-span-2">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.projectTitle}</div>
              <input value={projectForm.title} onChange={(event) => setProjectForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300 md:col-span-2">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.projectSummary}</div>
              <textarea value={projectForm.summary} onChange={(event) => setProjectForm((current) => ({ ...current, summary: event.target.value }))} className="min-h-24 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.desiredOutcome}</div>
              <textarea value={projectForm.desiredOutcome} onChange={(event) => setProjectForm((current) => ({ ...current, desiredOutcome: event.target.value }))} className="min-h-24 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.nextMove}</div>
              <textarea value={projectForm.nextMove} onChange={(event) => setProjectForm((current) => ({ ...current, nextMove: event.target.value }))} className="min-h-24 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.risk}</div>
              <textarea value={projectForm.risk} onChange={(event) => setProjectForm((current) => ({ ...current, risk: event.target.value }))} className="min-h-24 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.projectQuestion}</div>
              <textarea value={projectForm.projectQuestion} onChange={(event) => setProjectForm((current) => ({ ...current, projectQuestion: event.target.value }))} className="min-h-24 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Stage</div>
              <select value={projectForm.stage} onChange={(event) => setProjectForm((current) => ({ ...current, stage: event.target.value as Project['stage'] }))} className="w-full rounded-[20px] border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
                {projectStages.map((stage) => <option key={stage} value={stage}>{getStageLabel(stage, language)}</option>)}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">Priority</div>
              <select value={projectForm.priority} onChange={(event) => setProjectForm((current) => ({ ...current, priority: event.target.value as Project['priority'] }))} className="w-full rounded-[20px] border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
                {projectPriorities.map((priority) => <option key={priority} value={priority}>{getPriorityLabel(priority, language)}</option>)}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.tags}</div>
              <input value={projectForm.tags} onChange={(event) => setProjectForm((current) => ({ ...current, tags: event.target.value }))} className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.constraints}</div>
              <input value={projectForm.constraints} onChange={(event) => setProjectForm((current) => ({ ...current, constraints: event.target.value }))} className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={handleProjectSave} disabled={isSaving} className="rounded-full border border-violet-400/40 bg-violet-500/10 px-5 py-3 text-sm font-medium text-violet-100 disabled:opacity-60">{productText.common.save}</button>
            {editingProjectId ? <button type="button" onClick={() => { setEditingProjectId(null); setProjectForm(createProjectForm()); }} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-100">{productText.common.cancel}</button> : null}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">{productText.context.manageProjects}</div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {(state?.projects || []).length > 0 ? state?.projects.map((project) => (
              <article key={project.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-200">{getStageLabel(project.stage, language)}</span>
                  <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-200">{getPriorityLabel(project.priority, language)}</span>
                  {activeProject?.id === project.id ? <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-violet-200">{productText.common.active}</span> : null}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white">{project.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{project.summary}</p>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{text.context.nextMove}</div>
                    <div className="mt-1">{project.nextMove}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.constraints}</div>
                    <div className="mt-1">{joinList(project.constraints)}</div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={() => { setEditingProjectId(project.id); setProjectForm(createProjectForm(project)); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100">{productText.common.edit}</button>
                  <button type="button" onClick={() => setActiveProjectId(activeProject?.id === project.id ? null : project.id)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100">{activeProject?.id === project.id ? productText.chat.clearFocus : productText.context.setFocus}</button>
                  <button type="button" onClick={() => deleteProject(project.id)} className="rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">{productText.common.delete}</button>
                </div>
              </article>
            )) : <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">{productText.context.noProjects}</div>}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
          <div className="text-xs uppercase tracking-[0.22em] text-violet-300">{editingMemoryId ? productText.context.editMemory : productText.context.createMemory}</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-300 md:col-span-2">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.memoryTitle}</div>
              <input value={memoryForm.title} onChange={(event) => setMemoryForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.memoryKind}</div>
              <select value={memoryForm.kind} onChange={(event) => setMemoryForm((current) => ({ ...current, kind: event.target.value as MemoryItem['kind'] }))} className="w-full rounded-[20px] border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
                {memoryKinds.map((kind) => <option key={kind} value={kind}>{getMemoryKindLabel(kind, language)}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-3 self-end rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <input type="checkbox" checked={memoryForm.pinned} onChange={(event) => setMemoryForm((current) => ({ ...current, pinned: event.target.checked }))} />
              <span>{memoryForm.pinned ? productText.context.unpin : productText.context.pin}</span>
            </label>
            <label className="text-sm text-slate-300 md:col-span-2">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.memorySummary}</div>
              <textarea value={memoryForm.summary} onChange={(event) => setMemoryForm((current) => ({ ...current, summary: event.target.value }))} className="min-h-24 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300 md:col-span-2">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.whyItMatters}</div>
              <textarea value={memoryForm.whyItMatters} onChange={(event) => setMemoryForm((current) => ({ ...current, whyItMatters: event.target.value }))} className="min-h-24 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="text-sm text-slate-300 md:col-span-2">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.tags}</div>
              <input value={memoryForm.tags} onChange={(event) => setMemoryForm((current) => ({ ...current, tags: event.target.value }))} className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <div className="text-sm text-slate-300 md:col-span-2">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">{productText.context.linkedProjects}</div>
              <div className="grid gap-3 md:grid-cols-2">
                {(state?.projects || []).map((project) => {
                  const checked = memoryForm.projectIds.includes(project.id);
                  return (
                    <label key={project.id} className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => setMemoryForm((current) => ({
                          ...current,
                          projectIds: event.target.checked
                            ? [...current.projectIds, project.id]
                            : current.projectIds.filter((projectId) => projectId !== project.id)
                        }))}
                      />
                      <span>{project.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={handleMemorySave} disabled={isSaving} className="rounded-full border border-violet-400/40 bg-violet-500/10 px-5 py-3 text-sm font-medium text-violet-100 disabled:opacity-60">{productText.common.save}</button>
            {editingMemoryId ? <button type="button" onClick={() => { setEditingMemoryId(null); setMemoryForm(createMemoryForm()); }} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-100">{productText.common.cancel}</button> : null}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-shell">
          <div className="text-xs uppercase tracking-[0.22em] text-violet-300">{productText.context.manageMemory}</div>
          <div className="mt-4 space-y-4">
            {sortedMemory.length > 0 ? sortedMemory.map((item) => (
              <article key={item.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-200">{getMemoryKindLabel(item.kind, language)}</span>
                  {item.pinned ? <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-violet-200">{productText.common.active}</span> : null}
                  {item.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">{tag}</span>
                  ))}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.summary}</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">{item.whyItMatters}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={() => { setEditingMemoryId(item.id); setMemoryForm(createMemoryForm(item)); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100">{productText.common.edit}</button>
                  <button type="button" onClick={() => setMemoryPinned(item.id, !item.pinned)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100">{item.pinned ? productText.context.unpin : productText.context.pin}</button>
                  <button type="button" onClick={() => deleteMemoryItem(item.id)} className="rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">{productText.common.delete}</button>
                </div>
              </article>
            )) : <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">{productText.context.noMemory}</div>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
