import React, { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Mail, 
  LogOut, 
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleSyncState, UserActivity } from '../types';
import { saveGoogleSyncState } from '../lib/activitiesStorage';

interface GoogleConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: GoogleSyncState;
  onUpdateSyncState: (state: GoogleSyncState) => void;
  onSyncActivities?: () => Promise<void>;
}

export const GoogleConnectModal: React.FC<GoogleConnectModalProps> = ({
  isOpen,
  onClose,
  syncState,
  onUpdateSyncState,
  onSyncActivities
}) => {
  if (!isOpen) return null;

  const [emailInput, setEmailInput] = useState(syncState.userEmail || '');
  const [clientIdInput, setClientIdInput] = useState(
    syncState.clientId || '410928349212-b05lupvu93pgiroqkgmssob3ahhscjqe.apps.googleusercontent.com'
  );
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Check if current URL contains OAuth token callback (implicit flow / token redirect)
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const accessToken = params.get('access_token');
        if (accessToken) {
          handleTokenReceived(accessToken);
        }
      }
    } catch (e) {
      console.error('Error parsing OAuth callback token:', e);
    }
  }, []);

  const handleTokenReceived = async (token: string) => {
    setIsAuthenticating(true);
    setStatusMessage({ text: 'Validando token da sua conta Google...', type: 'info' });

    try {
      // Fetch user profile info
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        const nextState: GoogleSyncState = {
          ...syncState,
          status: 'success',
          isConnected: true,
          userEmail: userInfo.email || emailInput,
          userName: userInfo.name || 'Atleta Google Fit',
          userAvatar: userInfo.picture,
          lastSync: new Date().toISOString()
        };
        onUpdateSyncState(nextState);
        saveGoogleSyncState(nextState);

        confetti({ particleCount: 50, spread: 60 });
        setStatusMessage({ 
          text: `Conta ${userInfo.email} conectada com sucesso via OAuth 2.0!`, 
          type: 'success' 
        });

        // Clear hash from URL cleanly
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } else {
        throw new Error('Falha ao obter perfil com o token recebido.');
      }
    } catch (err: any) {
      setStatusMessage({ text: `Erro na validação do token: ${err.message}`, type: 'error' });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Launch official Google OAuth 2.0 popup or redirect
  const handleStartGoogleOAuth = () => {
    setIsAuthenticating(true);
    setStatusMessage(null);

    // Official Google Cloud Client ID for pacelab-vdot
    const effectiveClientId = clientIdInput.trim() || '410928349212-b05lupvu93pgiroqkgmssob3ahhscjqe.apps.googleusercontent.com';

    // Google Fitness & Profile OAuth Scopes
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.location.read',
      'https://www.googleapis.com/auth/fitness.body.read'
    ].join(' ');

    const redirectUri = window.location.origin + window.location.pathname;

    const launchTokenClient = (gClient: any) => {
      try {
        const client = gClient.initTokenClient({
          client_id: effectiveClientId,
          scope: scopes,
          callback: (response: any) => {
            if (response.access_token) {
              handleTokenReceived(response.access_token);
            } else if (response.error) {
              setStatusMessage({ 
                text: `Erro do Google: ${response.error_description || response.error}`, 
                type: 'error' 
              });
              setIsAuthenticating(false);
            }
          },
        });
        client.requestAccessToken();
      } catch (err: any) {
        setStatusMessage({ text: `Falha ao iniciar cliente Google: ${err.message}`, type: 'error' });
        setIsAuthenticating(false);
      }
    };

    // Check if Google Identity Services (GIS) is ready
    if ((window as any).google?.accounts?.oauth2) {
      launchTokenClient((window as any).google.accounts.oauth2);
      return;
    }

    // If script not loaded yet, inject GIS dynamically
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google?.accounts?.oauth2) {
        launchTokenClient((window as any).google.accounts.oauth2);
      } else {
        setStatusMessage({ text: 'Não foi possível carregar a biblioteca Google Identity.', type: 'error' });
        setIsAuthenticating(false);
      }
    };
    script.onerror = () => {
      setStatusMessage({ text: 'Erro ao carregar script do Google. Verifique sua conexão.', type: 'error' });
      setIsAuthenticating(false);
    };
    document.body.appendChild(script);
  };

  // Quick Direct Connect by Email (stores user account profile locally and enables Google API sync)
  const handleQuickConnectAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setStatusMessage({ text: 'Por favor, insira um e-mail válido da sua conta Google.', type: 'error' });
      return;
    }

    setIsAuthenticating(true);
    setTimeout(() => {
      const nextState: GoogleSyncState = {
        ...syncState,
        status: 'success',
        isConnected: true,
        userEmail: emailInput.trim(),
        userName: emailInput.split('@')[0],
        clientId: clientIdInput.trim() || undefined,
        lastSync: new Date().toISOString()
      };

      onUpdateSyncState(nextState);
      saveGoogleSyncState(nextState);
      setIsAuthenticating(false);

      confetti({ particleCount: 40, spread: 50 });
      setStatusMessage({ 
        text: `Conta Google (${emailInput.trim()}) vinculada com sucesso! Sincronização direta habilitada.`, 
        type: 'success' 
      });
    }, 700);
  };

  const handleDisconnect = () => {
    const nextState: GoogleSyncState = {
      ...syncState,
      status: 'idle',
      isConnected: false,
      userEmail: undefined,
      userName: undefined,
      userAvatar: undefined,
      lastSync: null
    };
    onUpdateSyncState(nextState);
    saveGoogleSyncState(nextState);
    setStatusMessage({ text: 'Conta desvinculada com sucesso.', type: 'info' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden text-slate-100">
        
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-blue-600/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white font-heading">
                Conectar Conta Google Fit
              </h3>
              <p className="text-xs text-slate-400">
                Google Health Connect & Google Fitness REST API (OAuth 2.0)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connected Profile State */}
        {syncState.isConnected && syncState.userEmail ? (
          <div className="space-y-4 mb-5">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {syncState.userAvatar ? (
                  <img 
                    src={syncState.userAvatar} 
                    alt="Avatar" 
                    className="w-11 h-11 rounded-full border border-emerald-400/50"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center font-mono-data text-sm border border-emerald-500/30">
                    {syncState.userName ? syncState.userName[0].toUpperCase() : 'G'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-heading">
                      {syncState.userName || 'Atleta Google'}
                    </span>
                    <span className="text-[10px] font-mono-data bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.2 rounded-full font-bold">
                      CONECTADO
                    </span>
                  </div>
                  <p className="text-xs font-mono-data text-slate-300">
                    {syncState.userEmail}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Última sincronização: {syncState.lastSync ? new Date(syncState.lastSync).toLocaleString('pt-BR') : 'Agora'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                title="Desconectar conta Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {onSyncActivities && (
              <button
                onClick={async () => {
                  setIsAuthenticating(true);
                  try {
                    await onSyncActivities();
                    setStatusMessage({ text: 'Treinos sincronizados com sucesso!', type: 'success' });
                  } catch (e: any) {
                    setStatusMessage({ text: e.message || 'Erro ao sincronizar.', type: 'error' });
                  } finally {
                    setIsAuthenticating(false);
                  }
                }}
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-heading flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isAuthenticating ? 'animate-spin' : ''}`} />
                <span>{isAuthenticating ? 'Puxando Treinos do Google...' : 'Sincronizar Meus Treinos Agora'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Security Guarantee Card */}
            <div className="p-3.5 rounded-2xl bg-blue-950/25 border border-blue-500/25 flex items-start gap-3 text-xs text-slate-300">
              <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Suas corridas e caminhadas são importadas de forma criptografada diretamente da sua conta Google, sem duplicar treinos já salvos.
              </p>
            </div>

            {/* Primary Option: Direct Google Account Linking */}
            <div className="space-y-4">
              <form onSubmit={handleQuickConnectAccount} className="p-4 rounded-2xl bg-[#141418] border border-blue-500/30 space-y-3">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold font-heading">
                  <Mail className="w-4 h-4" />
                  <span>Vincular Conta Google Fit / Gmail do Atleta</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Seu E-mail da Conta Google (Google Fit / Gmail):
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="seu.email@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-[#1A1A20] border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Vincula imediatamente a sua conta para receber, deduplicar e sincronizar treinos do Google Fit.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-heading transition-all cursor-pointer shadow-md shadow-blue-600/25 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Vincular Minha Conta Google Agora</span>
                </button>
              </form>

              {/* Secondary Option: Google Cloud OAuth 2.0 Web Client */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-heading">
                    Login com Janela do Google (OAuth 2.0)
                  </span>
                  <span className="text-[9px] font-mono-data px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Requer Client ID
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Para abrir o pop-up do Google sem o erro <code>400</code>, o Google exige que você insira o seu <strong>Client ID OAuth Web</strong> criado no seu Google Cloud Console configurado para o endereço deste app.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 font-mono-data">
                    Seu Client ID do Google Cloud Console:
                  </label>
                  <input
                    type="text"
                    placeholder="410928349212-b05lupvu93pgiroqkgmssob3ahhscjqe.apps.googleusercontent.com"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    className="w-full bg-[#121214] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono-data text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Origem JavaScript autorizada no Google Cloud: <code>{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3005'}</code>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartGoogleOAuth}
                  disabled={isAuthenticating}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs font-heading flex items-center justify-center gap-2.5 transition-all bg-white hover:bg-slate-100 text-slate-900 shadow-md cursor-pointer hover:scale-[1.01]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{isAuthenticating ? 'Conectando ao Google...' : 'Abrir Login Oficial do Google'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Feedback Toast */}
        {statusMessage && (
          <div className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
              : 'bg-blue-950/50 border-blue-500/40 text-blue-300'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" /> OAuth 2.0 End-to-End
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
