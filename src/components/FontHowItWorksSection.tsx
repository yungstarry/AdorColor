

interface FontHowItWorksSectionProps {}

export function FontHowItWorksSection({  }: FontHowItWorksSectionProps) {
  return (
<div className="max-w-3xl space-y-4">
            <section className="rounded-2xl border border-violet-300/25 bg-gradient-to-br from-[#171728] to-[#111722] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">Your library powers every recommendation</p>
              <h2 className="mt-2 text-lg font-bold text-white">How Font Selector works</h2>
              <p className="mt-2 text-xs leading-5 text-[#c7d1df]">Font Selector uses your font names and the classifications you provide to build reusable typography mixes for video. It does not fetch fonts, upload your data, or use AI to generate recommendations.</p>
            </section>
            {[
              { title: '1. Add your font names', body: 'Use Add Fonts to paste a simple list or use Organized Import for structured font records and combinations. The organized-import parser runs locally in your browser.' },
              { title: '2. Classify your library', body: 'Assign roles such as Primary, Hook, Supporting, or Accent. Add categories and tags that describe each font. These labels tell the generator what each font is suited for.' },
              { title: '3. Choose a video preset', body: 'Open Create Font Mix, choose a format such as Cinematic Reel, Talking Head Reel, Luxury, Fast / Viral Reel, or Podcast, then select how many fonts you want in the mix.' },
              { title: '4. Generate and refine', body: 'The deterministic matching rules select only fonts in your library whose roles or classifications fit the chosen preset. Shuffle for another valid mix, lock fonts you want to keep, or re-roll a single role.' },
              { title: '5. Save and reuse', body: 'Save a complete mix as a project set, organize combinations, and use Favorites to keep useful choices close at hand. Your library changes are saved in this browser and remain after refresh.' },
              { title: '6. Back up when needed', body: 'Open Settings to export your font knowledge as JSON. Import that file later to restore your fonts, categories, combinations, and project sets on this or another browser.' },
            ].map((step) => <section key={step.title} className="rounded-xl border border-[#303c50] bg-[#111722] p-4"><h3 className="text-sm font-bold text-white">{step.title}</h3><p className="mt-1.5 text-xs leading-5 text-[#bdc8d8]">{step.body}</p></section>)}
          </div>
  );
}
