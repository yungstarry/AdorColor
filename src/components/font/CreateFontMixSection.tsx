import { Heart, Lock, RotateCw, Sparkles, Unlock, Shuffle } from 'lucide-react';
import { VIDEO_PRESETS, explainMixRole, type LibraryState, type Recommendation, type VideoPreset } from './fontSelectorModel';
import { FontChips } from './FontChips';

export interface CreateFontMixSectionProps {
  activePreset: VideoPreset;
  findStyle: string;
  setFindStyle: (style: string) => void;
  setRecommendations: (recommendations: Recommendation[] | null) => void;
  findProject: string;
  setFindProject: (value: string) => void;
  selectedMixCount: number;
  library: LibraryState;
  findFonts: () => void;
  recommendations: Recommendation[] | null;
  shuffleFontMix: () => void;
  requiredMixComplete: boolean;
  saveRecommendation: () => void;
  lockedRoles: Record<string, string>;
  setLockedRoles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  rerollRole: (roleId: string) => void;
}

export function CreateFontMixSection({ activePreset, findStyle, setFindStyle, setRecommendations, findProject, setFindProject, selectedMixCount, library, findFonts, recommendations, shuffleFontMix, requiredMixComplete, saveRecommendation, lockedRoles, setLockedRoles, rerollRole }: CreateFontMixSectionProps) {
  return (
<div className="space-y-4">
            <section className="rounded-2xl border border-violet-300/30 bg-gradient-to-br from-[#171728] to-[#111722] p-4 sm:p-6">
              <div className="max-w-3xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">Font mix generator for videos</p>
                <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">Create a Font Mix</h2>
                <p className="mt-2 text-sm leading-6 text-[#c7d1df]">Choose a video preset. Each mix pairs a main font with readable support and a contrasting accent from your own library.</p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#bec9d8]">What are you making?
                  <select value={findStyle} onChange={(event) => {
                    const preset = VIDEO_PRESETS.find((item) => item.id === event.target.value) ?? VIDEO_PRESETS[0];
                    setFindStyle(preset.id);
                    setRecommendations(null);
                  }} className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-3 text-sm font-semibold normal-case tracking-normal text-white outline-none">
                    {VIDEO_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#bec9d8]">Video / project name <span className="font-normal normal-case tracking-normal text-[#8997ab]">· optional</span>
                  <input value={findProject} onChange={(event) => setFindProject(event.target.value)} placeholder="e.g. Launch teaser" className="mt-1.5 w-full rounded-lg border border-[#354156] bg-[#0b111b] px-3 py-3 text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#8795aa]" />
                </label>
                <label className="rounded-xl border border-[#354156] bg-[#0c111a]/80 p-3 sm:col-span-2">
                  <span className="flex items-center justify-between text-xs font-bold text-white"><span>Mix structure</span><span className="text-violet-200">3 fonts · Main + Support + Accent</span></span>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold">
                    {['Main', 'Support', 'Accent'].map((role) => <span key={role} className="rounded-lg border border-[#354156] bg-[#151e2c] px-2 py-2 text-[#d8dff0]">{role}</span>)}
                  </div>
                </label>
              </div>
              <div className="mt-4 rounded-xl border border-[#303c50] bg-[#0c111a]/80 p-3.5">
                <p className="text-xs font-bold text-white">{activePreset.label} rules · {activePreset.minFonts} fonts</p>
                <p className="mt-1 text-xs leading-5 text-[#bdc8d8]">{activePreset.summary}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{activePreset.roles.slice(0, selectedMixCount).map((role) => <div key={role.id} className="rounded-lg border border-[#354156] bg-[#141d2a] p-2.5"><p className="text-[10px] font-bold uppercase tracking-wide text-violet-200">{role.label}</p><p className="mt-1 text-[10px] leading-4 text-[#c3cedc]">{role.description}</p></div>)}</div>
              </div>
              <button type="button" onClick={findFonts} disabled={library.fonts.length === 0} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-300 px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-[#171222] shadow-lg shadow-violet-950/20 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles className="h-4 w-4" />Create Mix</button>
            </section>
            {recommendations && <section className="rounded-2xl border border-violet-300/30 bg-[#121722] p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">Your Mix</p><h2 className="mt-1 text-base font-bold text-white">{findProject.trim() || activePreset.label}</h2><p className="mt-1 text-xs text-[#bdc8d8]">{recommendations.length} of up to {activePreset.maxFonts} fonts · {activePreset.label} · selected from your library</p></div><div className="flex flex-wrap gap-2">{recommendations.length > 0 && <><button type="button" onClick={shuffleFontMix} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#46536a] bg-[#192334] px-3.5 py-2 text-xs font-bold text-white"><Shuffle className="h-4 w-4" />Shuffle Mix</button><button type="button" disabled={!requiredMixComplete} onClick={saveRecommendation} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-violet-300 px-3.5 py-2 text-xs font-bold text-[#171222] disabled:cursor-not-allowed disabled:opacity-40"><Heart className="h-4 w-4" />Save Mix</button></>}</div></div>
              {recommendations.length === 3 ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{recommendations.map((item) =>
                <article key={`${item.roleId}-${item.font.id}`} className="rounded-xl border border-[#354156] bg-[#0c121b] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">{item.role}</p><h3 className="mt-2 text-lg font-bold text-white">{item.font.name}</h3></div>
                    <div className="flex gap-1.5">
                      <button type="button" disabled={lockedRoles[item.roleId] === item.font.id} onClick={() => rerollRole(item.roleId)} aria-label={`Re-roll ${item.role}`} title={`Re-roll ${item.role} only`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#46536a] px-2.5 py-2 text-[10px] font-semibold text-[#c3cede] hover:border-violet-300/30 disabled:cursor-not-allowed disabled:opacity-45"><RotateCw className="h-3.5 w-3.5" />Re-roll</button>
                      <button type="button" aria-pressed={lockedRoles[item.roleId] === item.font.id} aria-label={`${lockedRoles[item.roleId] === item.font.id ? 'Unlock' : 'Lock'} ${item.font.name} in the ${item.role} role`} onClick={() => setLockedRoles((current) => {
                        const next = { ...current };
                        if (next[item.roleId] === item.font.id) delete next[item.roleId];
                        else next[item.roleId] = item.font.id;
                        return next;
                      })} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[10px] font-semibold ${lockedRoles[item.roleId] === item.font.id ? 'border-violet-200/50 bg-violet-300/15 text-violet-100' : 'border-[#46536a] text-[#c3cede] hover:border-violet-300/30'}`}>
                        {lockedRoles[item.roleId] === item.font.id ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}{lockedRoles[item.roleId] === item.font.id ? 'Locked' : 'Lock'}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#bdc8d8]">{item.roleDescription}</p>
                  <p className="mt-2 text-xs leading-5 text-[#e0d7ff]"><span className="font-semibold">Why this role:</span> {explainMixRole(item, recommendations)}</p>
                  <div className="mt-3"><p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#c2cede]">Matched your classifications</p><FontChips values={item.matchedLabels} /></div>
                </article>
              )}</div> : <p className="mt-4 rounded-lg border border-amber-200/20 bg-amber-200/[0.08] p-3 text-xs leading-5 text-amber-100">This preset needs matching library fonts for its main, supporting, and accent roles. Assign those roles or add suitable categories and tags in My Fonts.</p>}
              {recommendations.length > 0 && <div className="mt-4 rounded-xl border border-[#354156] bg-[#0c111a] p-4">
                <h3 className="text-xs font-bold text-white">Why this mix?</h3>
                <p className="mt-2 text-xs leading-5 text-[#cbd5e2]">The mix separates the visual jobs: a lead font establishes hierarchy, a supporting font improves readability, and an accent adds a controlled point of personality. Classification matches remain listed with each font.</p>
                <p className="mt-2 text-[10px] text-[#929fb2]">This explanation is generated from your saved classifications and preset rules. No AI is used.</p>
              </div>}
              {recommendations.length > 0 && !requiredMixComplete && <p className="mt-4 rounded-lg border border-amber-200/20 bg-amber-200/[0.08] p-3 text-xs leading-5 text-amber-100">This mix is incomplete and cannot be saved yet. It must contain three unique library fonts for the main, supporting, and accent roles.</p>}
            </section>}
          </div>
  );
}
