import { NextRequest, NextResponse } from 'next/server';

import { isMayaSessionAuthorized } from '@/lib/maya-auth';
import { getLocale } from '@/lib/i18n';
import { buildMayaChatResponse } from '@/lib/maya-engine';
import { readMayaStore, writeMayaStore } from '@/lib/maya-store';
import { ChatMessage } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!(await isMayaSessionAuthorized())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const message = String(body?.message || '').trim();
    const requestedSessionId = String(body?.sessionId || '').trim();
    const language = body?.language === 'en' ? 'en' : 'de';

    if (!message) {
      return NextResponse.json({ error: 'message_required' }, { status: 400 });
    }

    const store = await readMayaStore();
    const sessionId = store.sessions.some((session) => session.id === requestedSessionId) ? requestedSessionId : store.activeSessionId;
    const session = store.sessions.find((entry) => entry.id === sessionId) || store.sessions[0];

    if (!session) {
      return NextResponse.json({ error: 'session_required' }, { status: 400 });
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Intl.DateTimeFormat(getLocale(language), {
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date())
    };

    const payload = buildMayaChatResponse({
      message,
      sessionId: session.id,
      language,
      projects: store.projects,
      memoryItems: store.memoryItems,
      activeProjectId: store.activeProjectId
    });
    const updatedSession = {
      ...session,
      messages: [...session.messages, userMessage, payload.message],
      updatedAt: new Date().toISOString()
    };
    const nextState = await writeMayaStore({
      ...store,
      sessions: store.sessions.map((entry) => (entry.id === updatedSession.id ? updatedSession : entry)),
      activeSessionId: updatedSession.id,
      activeProjectId: payload.activeProjectId,
      language
    });

    return NextResponse.json({
      ...payload,
      state: nextState,
      session: updatedSession
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
}
