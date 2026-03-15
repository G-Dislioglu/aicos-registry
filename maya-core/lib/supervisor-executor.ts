import { getAction, updateActionStatus, updateWorkspace, createAnalysisCard } from '@/lib/supervisor-store';
import { ActionType, SupervisorAction } from '@/lib/supervisor-types';

// Whitelisted internal actions - no external side effects
const ALLOWED_ACTION_TYPES: ActionType[] = [
  'update_workspace',
  'create_note',
  'set_focus',
  'resolve_question',
  'archive_card',
  'promote_option_to_plan',
  'create_execution_step'
];

type ExecutionResult = {
  success: boolean;
  error?: string;
  result?: Record<string, unknown>;
};

function parseJsonSafe(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function dispatchAction(actionId: string): Promise<ExecutionResult> {
  const action = await getAction(actionId);

  if (!action) {
    return { success: false, error: 'action_not_found' };
  }

  if (!ALLOWED_ACTION_TYPES.includes(action.actionType)) {
    return { success: false, error: 'action_type_not_allowed' };
  }

  if (action.status !== 'approved') {
    return { success: false, error: 'action_not_approved' };
  }

  // Mark as running
  await updateActionStatus(actionId, 'running');

  try {
    const payload = parseJsonSafe(action.payloadJson);
    let result: Record<string, unknown> = {};

    switch (action.actionType) {
      case 'update_workspace': {
        const updates: Record<string, unknown> = {};
        if (typeof payload.title === 'string') updates.title = payload.title;
        if (typeof payload.goal === 'string') updates.goal = payload.goal;
        if (typeof payload.mode === 'string') updates.mode = payload.mode;
        if (typeof payload.status === 'string') updates.status = payload.status;
        await updateWorkspace(action.workspaceId, updates);
        result = { updated: Object.keys(updates) };
        break;
      }

      case 'set_focus': {
        const focus = typeof payload.focus === 'string' ? payload.focus : null;
        await updateWorkspace(action.workspaceId, { currentFocus: focus });
        result = { focus };
        break;
      }

      case 'create_note': {
        const title = typeof payload.title === 'string' ? payload.title : 'Untitled';
        const body = typeof payload.body === 'string' ? payload.body : '';
        const kind = typeof payload.kind === 'string' ? payload.kind : 'observation';
        const cardId = crypto.randomUUID();
        await createAnalysisCard(cardId, action.workspaceId, kind as 'observation' | 'analysis' | 'risk' | 'option' | 'recommendation' | 'summary', title, body);
        result = { cardId };
        break;
      }

      case 'resolve_question': {
        const questionsJson = await (await import('@/lib/supervisor-store')).getActiveWorkspace().then((w) => w?.openQuestionsJson || '[]');
        const questions = JSON.parse(questionsJson) as Array<{ id: string; question: string; resolved?: boolean }>;
        const questionId = typeof payload.questionId === 'string' ? payload.questionId : null;
        if (questionId) {
          const updated = questions.map((q) => (q.id === questionId ? { ...q, resolved: true } : q));
          await updateWorkspace(action.workspaceId, { openQuestionsJson: JSON.stringify(updated) });
        }
        result = { questionId, resolved: true };
        break;
      }

      case 'archive_card': {
        // For now, just mark as archived in result - full implementation would need card status
        const cardId = typeof payload.cardId === 'string' ? payload.cardId : null;
        result = { cardId, archived: true };
        break;
      }

      case 'promote_option_to_plan': {
        const optionId = typeof payload.optionId === 'string' ? payload.optionId : null;
        const planTitle = typeof payload.title === 'string' ? payload.title : 'Plan';
        const planDescription = typeof payload.description === 'string' ? payload.description : '';
        // Create a new action for the plan step
        const newActionId = crypto.randomUUID();
        const { createAction } = await import('@/lib/supervisor-store');
        await createAction(newActionId, action.workspaceId, 'create_execution_step', planTitle, planDescription, JSON.stringify({ fromOption: optionId }));
        result = { newActionId, fromOption: optionId };
        break;
      }

      case 'create_execution_step': {
        const stepTitle = typeof payload.title === 'string' ? payload.title : 'Step';
        const stepDescription = typeof payload.description === 'string' ? payload.description : '';
        const stepId = crypto.randomUUID();
        await createAction(stepId, action.workspaceId, 'create_execution_step', stepTitle, stepDescription, JSON.stringify(payload));
        result = { stepId };
        break;
      }

      default:
        return { success: false, error: 'unknown_action_type' };
    }

    // Mark as done
    await updateActionStatus(actionId, 'done', undefined, JSON.stringify(result));
    return { success: true, result };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'unknown_error';
    await updateActionStatus(actionId, 'failed', undefined, '{}', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Helper to create action with proper imports
async function createAction(
  id: string,
  workspaceId: string,
  actionType: ActionType,
  title: string,
  description: string,
  payloadJson: string
): Promise<void> {
  const { createAction: createActionInStore } = await import('@/lib/supervisor-store');
  await createActionInStore(id, workspaceId, actionType, title, description, payloadJson, 'medium', false);
}
