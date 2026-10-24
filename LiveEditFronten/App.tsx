
import React, { useState, useEffect } from 'react';
import { useLogto } from '@logto/react';
import { AppMode, MediaAsset } from './types';
import ChatInterface from './components/ChatInterface';
import LiveInterface from './components/LiveInterface';
import VideoGenerator from './components/VideoGenerator';
import ImageGenerator from './components/ImageGenerator';
import MediaSidebar from './components/MediaSidebar';
import LandingPage from './components/LandingPage';
import AuthForm from './components/AuthForm';
import { SubscriptionPlans } from './components/SubscriptionPlans';
import { PaymentModal } from './components/PaymentModal';
import { useSubscription } from './hooks/useSubscription';
import ProjectsView from './components/ProjectsView';
import WorkflowCanvas from './components/WorkflowCanvas';
import ThemeToggle from './components/ThemeToggle';
import { apiFetch, requireBackendUrl, setAuthTokenGetter } from './services/api';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isSidebarOpen] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLogtoInitialized, setIsLogtoInitialized] = useState(false);
  const [showSubscriptionPlans, setShowSubscriptionPlans] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: number; name: string; price: number } | null>(null);
  const [showProjects, setShowProjects] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const { subscription } = useSubscription(userEmail);
  const { isLoading, isAuthenticated, getIdToken, signOut } = useLogto();

  useEffect(() => {
    setAuthTokenGetter(async () => (await getIdToken()) ?? null);
  }, [getIdToken]);

  useEffect(() => {
    if (!isLoading) {
      setIsLogtoInitialized(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLogtoInitialized) return;
    if (!isAuthenticated) {
      setUserEmail('');
      setAuthError('');
      setShowLanding(true);
      return;
    }

    let cancelled = false;
    const loadLiveEditAccount = async () => {
      try {
        const token = await getIdToken();
        if (!token) {
          throw new Error('Your sign-in session is still initializing. Please try again.');
        }

        const response = await apiFetch(`${requireBackendUrl()}/api/auth/session`, {
          credentials: 'include',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Your sign-in session expired. Please sign in again.');
          }
          if (response.status === 403) {
            throw new Error(data.error || 'A verified email is required.');
          }
          throw new Error(data.error || 'Unable to set up your LiveEdit account.');
        }
        if (!data.email) {
          throw new Error('LiveEdit did not receive your account email. Please sign in again.');
        }
        if (!cancelled) {
          setUserEmail(data.email);
          setAuthError('');
          setShowLanding(false);
          setShowAuthForm(false);
        }
      } catch (error) {
        if (!cancelled) {
          setAuthError(error instanceof Error ? error.message : 'Sign-in failed.');
        }
      }
    };
    loadLiveEditAccount();
    return () => {
      cancelled = true;
    };
  }, [getIdToken, isAuthenticated, isLogtoInitialized]);

  const handleAddAsset = (asset: MediaAsset) => {
    setAssets(prev => [asset, ...prev]);
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
  };

  const handleLogout = async () => {
    await signOut(`${window.location.origin}/`);
    setUserEmail('');
    setShowLanding(true);
    setShowAuthForm(false);
    setShowProjects(false);
    setCurrentProjectId(null);
  };

  const handleSubscribe = async (planId: number) => {
    try {
      const response = await apiFetch(`${requireBackendUrl()}/api/payments/plans`, {
        credentials: 'include'
      });
      const plans = await response.json();
      const plan = plans.find((p: any) => p.id === planId);

      if (plan) {
        setSelectedPlan({ id: plan.id, name: plan.name, price: plan.price });
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch plan details:', error);
    }
  };

  const handleNavigateToProjects = () => {
    setShowProjects(true);
    setCurrentProjectId(null);
  };

  const handleOpenProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    setShowProjects(false);
  };

  const handleBackFromWorkflow = () => {
    setCurrentProjectId(null);
    setShowProjects(true);
  };

  const handleBackFromProjects = () => {
    setShowProjects(false);
  };

  if (!isLogtoInitialized) {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  if (isAuthenticated && !userEmail && !authError) {
    return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Signing in…</div>;
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p>{authError}</p>
        <button onClick={() => void signOut(`${window.location.origin}/`)} className="text-[#00ff41] underline">Sign out and try again</button>
      </div>
    );
  }

  if (showLanding && !showAuthForm) {
    return <LandingPage onStart={() => setShowAuthForm(true)} />;
  }

  if (showLanding && showAuthForm && !isAuthenticated) {
    return <AuthForm onClose={() => setShowAuthForm(false)} />;
  }

  if (currentProjectId && !showProjects) {
    return (
      <WorkflowCanvas
        projectId={currentProjectId}
        onBack={handleBackFromWorkflow}
      />
    );
  }

  if (showProjects && !currentProjectId) {
    return (
      <ProjectsView
        userEmail={userEmail}
        onOpenProject={handleOpenProject}
        onBack={handleBackFromProjects}
      />
    );
  }

  if (showSubscriptionPlans) {
    return (
      <div className="min-h-screen editor-bg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h1 className="text-2xl font-bold">Subscription Plans</h1>
          <button
            onClick={() => setShowSubscriptionPlans(false)}
            className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to App
          </button>
        </div>
        <SubscriptionPlans
          userEmail={userEmail}
          onSubscribe={handleSubscribe}
          currentPlan={subscription?.plan || undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen editor-bg text-neutral-300 overflow-hidden">
      <header className="relative z-50 flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-y-1 border-b border-neutral-800 bg-[#111] px-2 py-1 sm:px-4 md:flex-nowrap">
        <div className="flex w-full min-w-0 items-center gap-2 md:w-auto md:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#00ff41] flex items-center justify-center">
              <i className="fas fa-play text-[10px] text-black"></i>
            </div>
            <h1 className="text-sm font-bold tracking-tight uppercase text-white">Live Edit <span className="text-[#00ff41]">v2.5</span></h1>
          </div>

          <nav className="flex min-w-0 flex-1 items-center overflow-x-auto md:flex-none">
            {[
              { id: AppMode.CHAT, label: 'Chat', icon: 'fa-message' },
              { id: AppMode.LIVE, label: 'Live AI', icon: 'fa-bolt' },
              { id: AppMode.IMAGE, label: 'Pulse', icon: 'fa-image' },
              { id: AppMode.GENERATE, label: 'Creative', icon: 'fa-sliders' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleModeChange(item.id)}
                className={`h-10 shrink-0 px-2 text-[10px] font-bold uppercase tracking-widest border-x border-transparent transition-all sm:px-3 sm:text-[11px] md:h-12 md:px-4 ${
                  mode === item.id
                    ? 'bg-[#1a1a1a] text-white border-neutral-800 border-b-2 border-b-[#00ff41]'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-[#1a1a1a]'
                }`}
              >
                <i className={`fas ${item.icon} mr-2`}></i>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex w-full items-center justify-end gap-2 overflow-x-auto md:w-auto md:gap-3">
          <div className="flex shrink-0 items-center gap-2 rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[10px]">
            <span className="text-[8px] text-neutral-500">USER:</span>
            <span className="text-[10px] text-neutral-300 max-w-[120px] truncate">{userEmail}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full ${
              subscription?.status === 'active' ? 'bg-[#00ff41]' : 'bg-orange-500'
            }`}></span>
            {subscription?.status === 'active' ? `${subscription.plan?.toUpperCase()}` : 'FREE_TIER'}
          </div>
          <button
            onClick={() => setShowSubscriptionPlans(true)}
            className="shrink-0 border border-neutral-800 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500 transition-all hover:border-[#00ff41] hover:text-[#00ff41] sm:px-3"
          >
            {subscription?.status === 'active' ? 'Manage' : 'Upgrade'}
          </button>
          <button
            onClick={handleLogout}
            className="shrink-0 border border-neutral-800 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500 transition-all hover:border-[#00ff41] hover:text-[#00ff41] sm:px-3"
          >
            Logout
          </button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <MediaSidebar
          isOpen={isSidebarOpen}
          assets={assets}
          onAddAsset={handleAddAsset}
          onNavigateToProjects={handleNavigateToProjects}
        />

        <main className="flex-1 relative overflow-hidden">
          {mode === AppMode.CHAT && <ChatInterface onAddAsset={handleAddAsset} />}
          {mode === AppMode.LIVE && <LiveInterface />}
          {mode === AppMode.IMAGE && <ImageGenerator onAddAsset={handleAddAsset} />}
          {mode === AppMode.GENERATE && <VideoGenerator onAddAsset={handleAddAsset} />}
        </main>
      </div>

      <footer className="h-6 bg-[#0a0a0a] border-t border-neutral-800 flex items-center justify-between px-3 text-[10px] font-mono text-neutral-600">
        <div className="flex gap-4">
          <span>FPS: 60.0</span>
          <span>MEMORY: 12.4GB / 32GB</span>
          <span className="text-[#00ff41]">STATUS: IDLE</span>
        </div>
        <div>PRO_STATION_ALPHA</div>
      </footer>

      {showPaymentModal && selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          planPrice={selectedPlan.price}
          userEmail={userEmail}
        />
      )}
    </div>
  );
};

export default App;
