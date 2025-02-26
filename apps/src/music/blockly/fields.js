// Common field definitions used across multiple music blocks

import {DEFAULT_PATTERN, DEFAULT_CHORD, Triggers} from '../constants';
import Globals from '../globals';
import musicI18n from '../locale';
import MusicLibrary from '../player/MusicLibrary';
import {
  FIELD_REST_DURATION_NAME,
  FIELD_SOUNDS_NAME,
  FIELD_SOUNDS_TYPE,
  FIELD_PATTERN_NAME,
  FIELD_PATTERN_TYPE,
  FIELD_CHORD_TYPE,
  FIELD_CHORD_NAME,
  TRIGGER_FIELD,
} from './constants';

const instrumentCommonOptions = {
  getLibrary: () => MusicLibrary.getInstance(),
  cancelPreviews: () => {
    Globals.getPlayer().cancelPreviews();
  },
  setupSampler: (instrument, onLoadFinished) =>
    Globals.getPlayer().setupSampler(instrument, onLoadFinished),
  isInstrumentLoading: instrument =>
    Globals.getPlayer().isInstrumentLoading(instrument),
  isInstrumentLoaded: instrument =>
    Globals.getPlayer().isInstrumentLoaded(instrument),
  registerInstrumentLoadCallback: callback => {
    Globals.getPlayer().registerCallback('InstrumentLoaded', callback);
  },
};

export const fieldSoundsDefinition = {
  type: FIELD_SOUNDS_TYPE,
  name: FIELD_SOUNDS_NAME,
  getLibrary: () => MusicLibrary.getInstance(),
  playPreview: (id, onStop) => {
    Globals.getPlayer().previewSound(id, onStop);
  },
  currentValue: null,
  getShowSoundFilters: () => Globals.getShowSoundFilters(),
};

export const fieldPatternDefinition = {
  type: FIELD_PATTERN_TYPE,
  name: FIELD_PATTERN_NAME,
  getBPM: () => Globals.getPlayer().getBPM(),
  previewSound: (id, onStop) => {
    Globals.getPlayer().previewSound(id, onStop);
  },
  previewPattern: (patternValue, onStop) => {
    Globals.getPlayer().previewPattern(patternValue, onStop);
  },
  currentValue: DEFAULT_PATTERN,
  ...instrumentCommonOptions,
};

export const fieldChordDefinition = {
  type: FIELD_CHORD_TYPE,
  name: FIELD_CHORD_NAME,
  previewChord: (chordValue, onStop) => {
    Globals.getPlayer().previewChord(chordValue, onStop);
  },
  previewNote: (note, instrument, onStop) => {
    Globals.getPlayer().previewNote(note, instrument, onStop);
  },
  currentValue: DEFAULT_CHORD,
  ...instrumentCommonOptions,
};

export const fieldRestDurationDefinition = {
  type: 'field_dropdown',
  name: FIELD_REST_DURATION_NAME,
  options: [
    [musicI18n.blockly_fieldRestHalfBeat(), '0.125'],
    [musicI18n.blockly_fieldRestOneBeat(), '0.25'],
    [musicI18n.blockly_fieldRestBeats({num: 2}), '0.5'],
    [musicI18n.blockly_fieldRestOneMeasure(), '1'],
    [musicI18n.blockly_fieldRestMeasures({num: 2}), '2'],
  ],
};

export const fieldTriggerDefinition = {
  type: 'field_dropdown',
  name: TRIGGER_FIELD,
  options: Triggers.map(trigger => [trigger.dropdownLabel, trigger.id]),
};
