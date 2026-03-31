'use client';

import { useCallback, useReducer } from 'react';

export type CreateCardFormState = {
  open: boolean;
  recto: string;
  verso: string;
  comment: string;
  knowledgeContent: string;
  showReversedZone: boolean;
  rectoB: string;
  versoB: string;
  commentB: string;
  creating: boolean;
  creatingA: boolean;
  creatingB: boolean;
  error: string;
  errorB: string;
};

export const CREATE_CARD_FORM_INITIAL: CreateCardFormState = {
  open: false,
  recto: '',
  verso: '',
  comment: '',
  knowledgeContent: '',
  showReversedZone: false,
  rectoB: '',
  versoB: '',
  commentB: '',
  creating: false,
  creatingA: false,
  creatingB: false,
  error: '',
  errorB: '',
};

type FormTextField =
  | 'recto'
  | 'verso'
  | 'comment'
  | 'knowledgeContent'
  | 'rectoB'
  | 'versoB'
  | 'commentB';

export type CreateCardFormAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_FIELD'; field: FormTextField; value: string }
  | { type: 'SET_CREATING'; value: boolean }
  | { type: 'SET_CREATING_A'; value: boolean }
  | { type: 'SET_CREATING_B'; value: boolean }
  | { type: 'SET_ERROR'; value: string }
  | { type: 'SET_ERROR_B'; value: string }
  | { type: 'ADD_REVERSED_ZONE' };

export function createCardFormReducer(
  state: CreateCardFormState,
  action: CreateCardFormAction
): CreateCardFormState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, open: true, error: '' };
    case 'CLOSE':
      return { ...CREATE_CARD_FORM_INITIAL };
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_CREATING':
      return { ...state, creating: action.value };
    case 'SET_CREATING_A':
      return { ...state, creatingA: action.value };
    case 'SET_CREATING_B':
      return { ...state, creatingB: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.value };
    case 'SET_ERROR_B':
      return { ...state, errorB: action.value };
    case 'ADD_REVERSED_ZONE':
      return {
        ...state,
        showReversedZone: true,
        rectoB: state.verso,
        versoB: state.recto,
        commentB: state.comment,
      };
    default:
      return state;
  }
}

export function useCreateCardForm() {
  const [state, dispatch] = useReducer(createCardFormReducer, CREATE_CARD_FORM_INITIAL);

  const openCreateModal = useCallback(() => {
    dispatch({ type: 'OPEN' });
  }, []);

  const closeCreateModal = useCallback(() => {
    dispatch({ type: 'CLOSE' });
  }, []);

  const addReversedZone = useCallback(() => {
    dispatch({ type: 'ADD_REVERSED_ZONE' });
  }, []);

  const setCreateRecto = useCallback((value: string) => {
    dispatch({ type: 'SET_FIELD', field: 'recto', value });
  }, []);

  const setCreateVerso = useCallback((value: string) => {
    dispatch({ type: 'SET_FIELD', field: 'verso', value });
  }, []);

  const setCreateComment = useCallback((value: string) => {
    dispatch({ type: 'SET_FIELD', field: 'comment', value });
  }, []);

  const setCreateKnowledgeContent = useCallback((value: string) => {
    dispatch({ type: 'SET_FIELD', field: 'knowledgeContent', value });
  }, []);

  const setCreateRectoB = useCallback((value: string) => {
    dispatch({ type: 'SET_FIELD', field: 'rectoB', value });
  }, []);

  const setCreateVersoB = useCallback((value: string) => {
    dispatch({ type: 'SET_FIELD', field: 'versoB', value });
  }, []);

  const setCreateCommentB = useCallback((value: string) => {
    dispatch({ type: 'SET_FIELD', field: 'commentB', value });
  }, []);

  const setCreateError = useCallback((value: string) => {
    dispatch({ type: 'SET_ERROR', value });
  }, []);

  const setCreateErrorB = useCallback((value: string) => {
    dispatch({ type: 'SET_ERROR_B', value });
  }, []);

  const setCreating = useCallback((value: boolean) => {
    dispatch({ type: 'SET_CREATING', value });
  }, []);

  const setCreatingA = useCallback((value: boolean) => {
    dispatch({ type: 'SET_CREATING_A', value });
  }, []);

  const setCreatingB = useCallback((value: boolean) => {
    dispatch({ type: 'SET_CREATING_B', value });
  }, []);

  return {
    showCreateCard: state.open,
    createRecto: state.recto,
    createVerso: state.verso,
    createComment: state.comment,
    createKnowledgeContent: state.knowledgeContent,
    showReversedZone: state.showReversedZone,
    createRectoB: state.rectoB,
    createVersoB: state.versoB,
    createCommentB: state.commentB,
    creating: state.creating,
    creatingA: state.creatingA,
    creatingB: state.creatingB,
    createError: state.error,
    createErrorB: state.errorB,
    openCreateModal,
    closeCreateModal,
    addReversedZone,
    setCreateRecto,
    setCreateVerso,
    setCreateComment,
    setCreateKnowledgeContent,
    setCreateRectoB,
    setCreateVersoB,
    setCreateCommentB,
    setCreateError,
    setCreateErrorB,
    setCreating,
    setCreatingA,
    setCreatingB,
  };
}
