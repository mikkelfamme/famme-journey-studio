import { BarChart3, GitBranch, Share2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useWorkspace } from '../store/WorkspaceContext';

const steps = [
  {
    title: 'Model the journey',
    body: 'Journeys are the shared data model. Build customer steps, channels, decisions, conversions and lifecycle handoffs on the canvas.',
    icon: GitBranch
  },
  {
    title: 'Connect measurement & performance',
    body: 'Attach tracking definitions to journey nodes, import performance snapshots and compare planned architecture with observed customer paths.',
    icon: BarChart3
  },
  {
    title: 'Reuse the architecture',
    body: 'Templates create independent journey starting points. Components can stay linked and synchronized across several journeys.',
    icon: Sparkles
  },
  {
    title: 'Share without exposing everything',
    body: 'Export a full workspace for collaboration or create a portfolio-safe copy that can hide performance, tracking details and internal notes.',
    icon: Share2
  }
];

export function WelcomeTour() {
  const { workspace, updateWorkspace } = useWorkspace();
  const [step, setStep] = useState(0);
  if (!workspace || workspace.settings.onboardingComplete) return null;
  const current = steps[step];
  const Icon = current.icon;
  const finish = () => updateWorkspace(ws => ({ ...ws, settings: { ...ws.settings, onboardingComplete: true } }));
  return <div className="tour-backdrop" role="dialog" aria-modal="true" aria-labelledby="tour-title">
    <div className="tour-card">
      <div className="tour-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>{steps.map((_, index)=><i key={index} className={index <= step ? 'active' : ''}/>)}</div>
      <div className="tour-icon"><Icon size={24}/></div>
      <div className="eyebrow-small">WELCOME · {step + 1}/{steps.length}</div>
      <h2 id="tour-title">{current.title}</h2>
      <p>{current.body}</p>
      {workspace.settings.demoWorkspace && <div className="tour-demo-note"><strong>Demo workspace</strong><span>All performance and observed-path data in this demo are synthetic and illustrative.</span></div>}
      <div className="tour-actions">
        <button className="button" onClick={finish}>Skip tour</button>
        <div>
          {step > 0 && <button className="button" onClick={()=>setStep(value=>Math.max(0,value-1))}>Back</button>}
          {step < steps.length - 1
            ? <button className="button primary" onClick={()=>setStep(value=>Math.min(steps.length-1,value+1))}>Next</button>
            : <button className="button primary" onClick={finish}>Start working</button>}
        </div>
      </div>
    </div>
  </div>;
}
