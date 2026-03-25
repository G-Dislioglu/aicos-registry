'use client';

import { MayaEmptyState, type ContextAnchorEntry } from './maya-empty-state';
import { type WorkMode } from './maya-local-response';

type MayaPresenceState = 'idle' | 'thinking' | 'retrieving' | 'streaming';

type MayaMessageFeedMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: string;
  model?: string;
  tokenInput?: number;
  tokenOutput?: number;
  costCents?: number;
  contextUsed?: boolean;
};

type MayaMessageFeedProps = {
  messages: MayaMessageFeedMessage[];
  loading: boolean;
  mayaState: MayaPresenceState;
  streamingText: string;
  contextAnchors: ContextAnchorEntry[];
  isFileMode?: boolean;
  onSendStarter: (text: string, mode: WorkMode) => void;
};

export function MayaMessageFeed({
  messages,
  loading,
  mayaState,
  streamingText,
  contextAnchors,
  isFileMode,
  onSendStarter
}: MayaMessageFeedProps) {
  if (messages.length === 0 && !loading) {
    return (
      <MayaEmptyState
        onSendStarter={onSendStarter}
        anchors={contextAnchors}
        isFileMode={isFileMode}
      />
    );
  }

  return (
    <>
      {messages.map((msg) => (
        <div key={msg.id} className={`maya-message ${msg.role}`}>
          <div className="msg-bubble">
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            {msg.role === 'assistant' && (msg.provider || msg.model) && (
              <div className="msg-meta">
                {msg.contextUsed && <span className="msg-chip">🧠 Kontext</span>}
                {msg.provider && <span className="msg-chip">{msg.provider}</span>}
                {msg.model && <span className="msg-chip">{msg.model}</span>}
                {msg.costCents !== undefined && msg.costCents > 0 && (
                  <span>{msg.costCents}¢</span>
                )}
                {msg.tokenInput !== undefined && msg.tokenOutput !== undefined && (
                  <span>{msg.tokenInput + msg.tokenOutput} tok</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {mayaState === 'streaming' && streamingText && (
        <div className="maya-message assistant">
          <div className="msg-bubble">
            <span style={{ whiteSpace: 'pre-wrap' }}>{streamingText}</span>
            <span className="stream-cursor" />
          </div>
        </div>
      )}

      {mayaState === 'thinking' && !streamingText && (
        <div className="thinking-indicator">
          <div className="think-dot" />
          <div className="think-dot" />
          <div className="think-dot" />
        </div>
      )}
    </>
  );
}
