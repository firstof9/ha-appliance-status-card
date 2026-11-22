import { describe, it, expect, beforeEach } from 'vitest';
import '../src/appliance-card';
import { ApplianceCard } from '../src/appliance-card';
import { ApplianceCardEditor } from '../src/editor';
import { ASSETS } from '../src/assets';
import { getAsset } from '../src/utils';
import { HomeAssistant } from '../src/types';
import { mockHass } from './mocks';

const DATA_URI = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/;

const stateObj = (entity_id: string, state: string, attributes: Record<string, unknown> = {}) => ({
  entity_id,
  state,
  attributes,
  last_changed: '2026-05-12T16:00:00Z',
  last_updated: '2026-05-12T16:00:00Z',
  context: { id: 'c', parent_id: null, user_id: null },
});

const hassWith = (states: Record<string, ReturnType<typeof stateObj>>) =>
  ({ ...mockHass, states: { ...mockHass.states, ...states } }) as unknown as HomeAssistant;

// Stage tokens are ordinary integration status strings; stage_map is deliberately unused so the
// built-in prefix matching is what is exercised. Expected icon names are the bundled base names.
const STAGES: Array<[string, string]> = [
  ['Brewing', 'coffee'],
  ['Coffee', 'coffee'],
  ['Preparing Milk', 'coffee'],
  ['Espresso', 'espresso'],
  ['Heating', 'boil'],
  ['Dispensing Hot Water', 'boil'],
];

describe('Coffee maker stage artwork', () => {
  let card: ApplianceCard;

  beforeEach(() => {
    document.body.innerHTML = '';
    card = document.createElement('appliance-card') as ApplianceCard;
    document.body.appendChild(card);
    card.setConfig({
      type: 'custom:appliance-card',
      appliance_type: 'coffee_maker',
      machine_state_entity: 'sensor.demo_duck_machine_status',
    });
  });

  const render = async (state: string) => {
    card.hass = hassWith({ 'sensor.demo_duck_machine_status': stateObj('sensor.demo_duck_machine_status', state) });
    await card.updateComplete;
    return card.shadowRoot!.querySelector('.job-icon-container')!;
  };

  it('bundles a PNG entry for every icon a coffee stage can request', () => {
    for (const name of ['appliance.png', 'coffee.png', 'boil.png', 'espresso.png']) {
      expect(ASSETS['coffee_maker'][name], name).toMatch(DATA_URI);
    }
  });

  it.each(STAGES)('active "%s" resolves its icon to the bundled %s data URI', async (state, icon) => {
    const container = await render(state);
    expect(container.classList.contains('active')).toBe(true);
    const src = container.querySelector('img.job-icon')!.getAttribute('src')!;
    expect(src).toMatch(DATA_URI);
    // The exact bundled bytes, not merely "some data URI": the -on name falls back to the base art.
    expect(src).toBe(ASSETS['coffee_maker'][`${icon}.png`]);
    expect(src).not.toContain('/local/');
  });

  it.each(STAGES)('inactive artwork for the "%s" stage family also resolves to a data URI', (_state, icon) => {
    expect(getAsset('coffee_maker', `${icon}.png`)).toMatch(DATA_URI);
    expect(getAsset('coffee_maker', `${icon}-on.png`)).toBe(ASSETS['coffee_maker'][`${icon}.png`]);
  });

  it('shows distinct artwork for espresso', () => {
    const { 'espresso.png': espresso, 'coffee.png': coffee, 'boil.png': boil } = ASSETS['coffee_maker'];
    expect(espresso).not.toBe(coffee);
    expect(espresso).not.toBe(boil);
  });

  it('never emits a /local/ fallback path for any coffee stage, active or idle', async () => {
    for (const [state] of [...STAGES, ['Ready', ''], ['Off', ''], ['Rinsing', ''], ['unavailable', '']]) {
      const container = await render(state);
      expect(container.querySelector('img.job-icon')!.getAttribute('src')).toMatch(DATA_URI);
    }
  });
});

describe('Coffee maker status text', () => {
  let card: ApplianceCard;
  beforeEach(() => {
    document.body.innerHTML = '';
    card = document.createElement('appliance-card') as ApplianceCard;
    document.body.appendChild(card);
  });

  const label = async (config: Record<string, unknown>, states: Record<string, ReturnType<typeof stateObj>>) => {
    card.setConfig({ type: 'custom:appliance-card', appliance_type: 'coffee_maker', ...config } as any);
    card.hass = hassWith(states);
    await card.updateComplete;
    return {
      text: card.shadowRoot!.querySelector('.job-label')?.textContent?.trim(),
      active: !!card.shadowRoot!.querySelector('.job-icon-container.active'),
    };
  };
  const ID = 'sensor.demo_duck_machine_status';

  it.each([
    ['Ready', 'Ready', false],
    ['Off', 'Off', false],
    ['Rinsing', 'Rinsing', false],
    ['Going to sleep', 'Going to sleep', false],
    ['Unavailable', 'Unavailable', false],
    ['unknown', 'Unknown', false],
    ['Brewing', 'Brewing', true],
    ['Heating', 'Heating', true],
  ])('machine status "%s" is labelled "%s" (active=%s)', async (state, text, active) => {
    const r = await label({ machine_state_entity: ID }, { [ID]: stateObj(ID, state) });
    expect(r).toEqual({ text, active });
  });

  it('reports a missing status entity as Not found instead of Off or Ready', async () => {
    const r = await label({ machine_state_entity: 'sensor.does_not_exist' }, {});
    expect(r).toEqual({ text: 'Not found', active: false });
  });

  it('reports an unconfigured card as Not configured', async () => {
    const r = await label({}, {});
    expect(r).toEqual({ text: 'Not configured', active: false });
  });

  it('does not draw a placeholder countdown when no time entity is configured', async () => {
    await label({ machine_state_entity: ID }, { [ID]: stateObj(ID, 'Ready') });
    expect(card.shadowRoot!.querySelector('.timer-row')).toBeNull();
  });

  it('exposes no control surface: no buttons, no click handlers, no service calls', async () => {
    const calls: string[] = [];
    card.setConfig({ type: 'custom:appliance-card', appliance_type: 'coffee_maker', machine_state_entity: ID });
    card.hass = { ...hassWith({ [ID]: stateObj(ID, 'Ready') }), callService: async (d: string, s: string) => { calls.push(`${d}.${s}`); } } as any;
    await card.updateComplete;
    expect(card.shadowRoot!.querySelectorAll('button, [role="button"], .microwave-controls').length).toBe(0);
    (card.shadowRoot!.querySelector('ha-card') as HTMLElement).click();
    card.shadowRoot!.querySelectorAll('.job-icon-container, img').forEach((n) => (n as HTMLElement).click());
    expect(calls).toEqual([]);
  });
});

describe('Coffee maker editor autofill scope', () => {
  const editorWith = (entities: Record<string, { device_id: string }>, states: Record<string, string>) => {
    const editor = document.createElement('appliance-card-editor') as ApplianceCardEditor;
    editor.hass = {
      ...mockHass,
      entities,
      states: Object.fromEntries(Object.entries(states).map(([id, s]) => [id, { state: s, attributes: { friendly_name: id } }])),
    } as any;
    return editor;
  };
  const base = { type: 'custom:appliance-card', appliance_type: 'coffee_maker' };

  it('binds only entities registered to the selected device', () => {
    const editor = editorWith(
      {
        'sensor.demo_duck_machine_status': { device_id: 'coffee1' },
        'switch.demo_duck_power': { device_id: 'coffee1' },
        'sensor.demo_duck_blocking_alarms': { device_id: 'coffee1' },
        'switch.other_appliance_power': { device_id: 'other' },
        'sensor.other_appliance_machine_status': { device_id: 'other' },
      },
      {
        'sensor.demo_duck_machine_status': 'Off',
        'switch.demo_duck_power': 'off',
        'sensor.demo_duck_blocking_alarms': '0',
        'switch.other_appliance_power': 'on',
        'sensor.other_appliance_machine_status': 'Washing',
      },
    );
    const r = (editor as any)._autofillConfig({ ...base, device_id: 'coffee1' });
    expect(r.machine_state_entity).toBe('sensor.demo_duck_machine_status');
    expect(r.power_entity).toBe('switch.demo_duck_power');
    expect(r.alarm_code_entity).toBe('sensor.demo_duck_blocking_alarms');
  });

  it('leaves everything unset when no device is selected rather than guessing across HA', () => {
    const editor = editorWith(
      { 'switch.other_appliance_power': { device_id: 'other' }, 'sensor.other_appliance_machine_status': { device_id: 'other' } },
      { 'switch.other_appliance_power': 'on', 'sensor.other_appliance_machine_status': 'Washing' },
    );
    const r = (editor as any)._autofillConfig({ ...base });
    expect(r.machine_state_entity).toBeUndefined();
    expect(r.power_entity).toBeUndefined();
    expect(r.alarm_code_entity).toBeUndefined();
  });

  it('does not fall back to other devices when the selected device has no matching entity', () => {
    const editor = editorWith(
      { 'switch.other_appliance_power': { device_id: 'other' }, 'sensor.demo_duck_machine_status': { device_id: 'coffee1' } },
      { 'switch.other_appliance_power': 'on', 'sensor.demo_duck_machine_status': 'Ready' },
    );
    const r = (editor as any)._autofillConfig({ ...base, device_id: 'coffee1' });
    expect(r.machine_state_entity).toBe('sensor.demo_duck_machine_status');
    expect(r.power_entity).toBeUndefined();
  });

  it('never binds brew, rinse, cancel, or other controls, and no light, fan, lock or time guesses', () => {
    const ids = [
      'sensor.demo_duck_machine_status',
      'button.demo_duck_brew_espresso',
      'button.demo_duck_cancel_brew',
      'button.demo_duck_rinse',
      'light.demo_duck_light',
      'switch.demo_duck_child_lock',
    ];
    const editor = editorWith(
      Object.fromEntries(ids.map((id) => [id, { device_id: 'coffee1' }])),
      Object.fromEntries(ids.map((id) => [id, 'unknown'])),
    );
    const r = (editor as any)._autofillConfig({ ...base, device_id: 'coffee1' });
    const bound = Object.values(r).filter((v) => typeof v === 'string' && /^(button|light|switch|fan)\./.test(v as string));
    expect(bound).toEqual([]);
    expect(r.light_entity).toBeUndefined();
    expect(r.lock_entity).toBeUndefined();
  });
});
