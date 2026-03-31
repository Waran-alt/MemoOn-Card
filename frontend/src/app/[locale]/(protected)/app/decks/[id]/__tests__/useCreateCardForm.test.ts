import { describe, it, expect } from 'vitest';
import {
  createCardFormReducer,
  CREATE_CARD_FORM_INITIAL,
  type CreateCardFormState,
} from '../useCreateCardForm';

describe('createCardFormReducer', () => {
  it('CLOSE resets to initial', () => {
    const dirty: CreateCardFormState = {
      ...CREATE_CARD_FORM_INITIAL,
      open: true,
      recto: 'x',
      verso: 'y',
      showReversedZone: true,
      creating: true,
      error: 'e',
    };
    expect(createCardFormReducer(dirty, { type: 'CLOSE' })).toEqual(CREATE_CARD_FORM_INITIAL);
  });

  it('OPEN sets open and clears error only', () => {
    const s = createCardFormReducer(
      { ...CREATE_CARD_FORM_INITIAL, error: 'bad', recto: 'keep' },
      { type: 'OPEN' }
    );
    expect(s.open).toBe(true);
    expect(s.error).toBe('');
    expect(s.recto).toBe('keep');
  });

  it('ADD_REVERSED_ZONE copies A sides into B and toggles zone', () => {
    const s = createCardFormReducer(
      {
        ...CREATE_CARD_FORM_INITIAL,
        recto: 'front',
        verso: 'back',
        comment: 'c',
      },
      { type: 'ADD_REVERSED_ZONE' }
    );
    expect(s.showReversedZone).toBe(true);
    expect(s.rectoB).toBe('back');
    expect(s.versoB).toBe('front');
    expect(s.commentB).toBe('c');
  });
});
