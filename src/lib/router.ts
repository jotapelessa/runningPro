/**
 * @file router.ts
 * @module lib/router
 * @category Navigation
 * @description Gerenciador de navegação SPA canônica com sincronização bidirecional via HTML5 History API.
 */

import { AppTab } from '../types';

export const TAB_ROUTE_MAP: Record<AppTab, string> = {
  atividades: '/atividades',
  zonas: '/zonas',
  previsoes: '/previsoes',
  planilha: '/planilha',
  corridas: '/corridas',
  importer: '/importer',
  recuperacao: '/recuperacao',
  guide: '/tutorial'
};

export const ROUTE_TAB_MAP: Record<string, AppTab> = {
  '/atividades': 'atividades',
  '/zonas': 'zonas',
  '/previsoes': 'previsoes',
  '/planilha': 'planilha',
  '/corridas': 'corridas',
  '/importer': 'importer',
  '/recuperacao': 'recuperacao',
  '/tutorial': 'guide',
  '/guia': 'guide',
  '/guide': 'guide'
};

/**
 * Obtém a aba correspondente ao pathname atual da janela
 */
export function getTabFromPathname(): { tab: AppTab; openModal?: 'metronomo' | 'relogio' | 'atleta' } {
  if (typeof window === 'undefined') {
    return { tab: 'atividades' };
  }

  const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';

  if (path === '/relogio' || path === '/metronomo') {
    return { tab: 'atividades', openModal: 'metronomo' };
  }

  if (path === '/atleta' || path === '/perfil') {
    return { tab: 'atividades', openModal: 'atleta' };
  }

  const matchedTab = ROUTE_TAB_MAP[path];
  if (matchedTab) {
    return { tab: matchedTab };
  }

  return { tab: 'atividades' };
}

/**
 * Atualiza o histórico do navegador para refletir a aba ativa sem recarregar a página
 */
export function syncPathWithTab(tab: AppTab, modal?: string) {
  if (typeof window === 'undefined') return;

  let targetPath = TAB_ROUTE_MAP[tab] || '/atividades';
  if (modal === 'metronomo') targetPath = '/relogio';

  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  if (currentPath !== targetPath) {
    window.history.pushState({ tab, modal }, '', targetPath);
  }
}
