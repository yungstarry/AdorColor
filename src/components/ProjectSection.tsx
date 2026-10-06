import { ArrowDownToLine, FolderKanban, Plus, Star, Trash2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { PROJECT_CARD_OPTIONS, ROLE_DETAILS, STYLE_OPTIONS, VIDEO_PRESETS, keyFor, type FontEntry, type LibraryState, type ProjectSet } from './fontSelectorModel';

export interface ProjectSectionProps {
  library: LibraryState;
  newProject: string;
  setNewProject: (value: string) => void;
  projectStyle: string;
  setProjectStyle: (value: string) => void;
  projectPurpose: string;
  setProjectPurpose: (value: string) => void;
  createProject: () => void;
  fontsById: Map<string, FontEntry>;
  fontsByName: Map<string, FontEntry>;
  updateProject: (id: string, update: Partial<ProjectSet>) => void;
  setLibrary: Dispatch<SetStateAction<LibraryState>>;
  markUsed: (ids: string[]) => void;
  exportProjectCardPng: (project: ProjectSet) => Promise<void>;
}

export function ProjectSection({ library, newProject, setNewProject, projectStyle, setProjectStyle, projectPurpose, setProjectPurpose, createProject, fontsById, fontsByName, updateProject, setLibrary, markUsed, exportProjectCardPng }: ProjectSectionProps) {
  return (
<div className="space-y-4">
            <form onSubmit={(event) => { event.preventDefault(); createProject(); }} className="rounded-2xl border border-[#303c50] bg-[#111722] p-4">
              <h2 className="text-sm font-bold text-white">Create Project Font Set</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1.1fr_1fr_1.5fr_auto]">
                <input value={newProject} onChange={(event) => setNewProject(event.target.value)} placeholder="Project name" className="rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#8795aa]" />
                <select value={projectStyle} onChange={(event) => setProjectStyle(event.target.value)} className="rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs text-white"><option value="">Style</option>{[...STYLE_OPTIONS, ...VIDEO_PRESETS.map((preset) => preset.label)].map((item) => <option key={item}>{item}</option>)}</select>
                <input value={projectPurpose} onChange={(event) => setProjectPurpose(event.target.value)} placeholder="Purpose, e.g. Reels + captions" className="rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#8795aa]" />
                <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-300 px-3 py-2.5 text-xs font-bold text-[#171222]"><Plus className="h-4 w-4" />Create</button>
              </div>
            </form>
            {library.projects.length ? <div className="grid gap-4 xl:grid-cols-2">{library.projects.map((project) => {
              const pickedFonts = project.fontIds.map((id) => fontsById.get(id)).filter((font): font is FontEntry => Boolean(font));
              return <article key={project.id} className="rounded-2xl border border-[#303c50] bg-[#111722] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3"><div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2"><input value={project.name} aria-label="Project Font Set name" onChange={(event) => updateProject(project.id, { name: event.target.value })} className="w-full bg-transparent text-base font-bold text-white outline-none" /><select aria-label="Project style" value={project.style} onChange={(event) => updateProject(project.id, { style: event.target.value })} className="rounded-lg border border-[#354156] bg-[#0b111b] px-2 py-2 text-[10px] text-white"><option value="">Choose style</option>{[...STYLE_OPTIONS, ...VIDEO_PRESETS.map((preset) => preset.label)].map((style) => <option key={style}>{style}</option>)}</select><input value={project.purpose} aria-label="Project purpose" onChange={(event) => updateProject(project.id, { purpose: event.target.value })} placeholder="Headings, captions, thumbnails..." className="rounded-lg border border-[#354156] bg-[#0b111b] px-2 py-2 text-[10px] text-white outline-none placeholder:text-[#8795aa] sm:col-span-2" /></div><button type="button" onClick={() => updateProject(project.id, { favorite: !project.favorite })} aria-label={`${project.favorite ? 'Unfavorite' : 'Favorite'} project set`} className={project.favorite ? 'text-amber-300' : 'text-[#a8b5c8] hover:text-amber-300'}><Star className="h-4 w-4" fill={project.favorite ? 'currentColor' : 'none'} /></button><button type="button" onClick={() => setLibrary((current) => ({ ...current, projects: current.projects.filter((item) => item.id !== project.id) }))} aria-label={`Delete project ${project.name}`} className="text-[#9eacc0] hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">{ROLE_DETAILS.map((role, index) => {
                  const currentId = project.fontIds[index] ?? '';
                  return <label key={role.id} className="block text-[10px] font-bold text-[#c0cada]">{project.fontRoles[index] || role.label}<span className="ml-1 font-normal text-[#9eacc0]">· {role.description}</span>
                    <select value={currentId} onChange={(event) => {
                      const next = [...project.fontIds];
                      next[index] = event.target.value;
                      updateProject(project.id, next.some(Boolean) ? { fontIds: next } : { fontIds: [] });
                      if (event.target.value) markUsed([event.target.value]);
                    }} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal text-white"><option value="">Choose from My Fonts</option>{library.fonts.map((font) => <option key={font.id} value={font.id}>{font.name}</option>)}</select>
                  </label>;
                })}</div>
                {pickedFonts.length > 2 && <p className="mt-3 rounded-lg border border-amber-200/20 bg-amber-200/[0.08] p-3 text-xs leading-5 text-amber-100">You’re using {pickedFonts.length} fonts in this project. For a more consistent visual identity, consider using 1–2 fonts. This is only a recommendation.</p>}
                {library.combinations.length > 0 && <label className="mt-3 block text-[10px] font-bold text-[#c0cada]">Saved combination
                  <select value={project.combinationId} onChange={(event) => {
                    const combo = library.combinations.find((item) => item.id === event.target.value);
                    if (!combo) { updateProject(project.id, { combinationId: '' }); return; }
                    const matched = combo.fontNames.map((name) => fontsByName.get(keyFor(name))?.id).filter((id): id is string => Boolean(id));
                    updateProject(project.id, { combinationId: combo.id, fontIds: matched.slice(0, 4) });
                  }} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal text-white"><option value="">None</option>{library.combinations.map((combo) => <option key={combo.id} value={combo.id}>{combo.name}</option>)}</select>
                </label>}
                <label className="mt-3 block text-[10px] font-bold text-[#c0cada]">Notes<textarea value={project.notes} onChange={(event) => updateProject(project.id, { notes: event.target.value })} rows={2} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-2.5 text-xs font-normal text-white outline-none" /></label>
                <div className="mt-3 flex flex-wrap gap-1.5">{pickedFonts.map((font, index) => <span key={font.id} className="rounded-md bg-[#202b3b] px-2 py-1 text-[10px] text-white">{project.fontRoles[index] || ROLE_DETAILS[index]?.label}: {font.name}</span>)}</div>
                <section className="mt-4 rounded-xl border border-[#303c50] bg-[#0c111a] p-3.5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div><h3 className="text-xs font-bold text-white">PNG card contents</h3><p className="mt-1 text-[10px] text-[#aebbd0]">Choose what to include. Your checklist is saved with this project.</p></div>
                    <button type="button" onClick={() => void exportProjectCardPng(project)} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-violet-300 px-3 py-2 text-[11px] font-bold text-[#171222] hover:bg-violet-200"><ArrowDownToLine className="h-3.5 w-3.5" />Export as PNG</button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {PROJECT_CARD_OPTIONS.map(([key, label]) => <label key={key} className="flex items-center gap-2 text-[10px] text-[#d4ddea]">
                      <input type="checkbox" checked={project.exportSections[key]} onChange={(event) => updateProject(project.id, { exportSections: { ...project.exportSections, [key]: event.target.checked } })} className="h-3.5 w-3.5 accent-violet-300" />
                      {label}
                    </label>)}
                  </div>
                </section>
              </article>;
            })}</div> : <div className="rounded-2xl border border-dashed border-[#49566b] bg-[#111722] p-8 text-center"><FolderKanban className="mx-auto h-7 w-7 text-[#b2bfd0]" /><p className="mt-3 text-sm font-bold text-white">No project mixes yet</p><p className="mt-1 text-xs text-[#bdc8d8]">Create one here or build and save a video-specific mix from Create Font Mix.</p></div>}
          </div>
  );
}
