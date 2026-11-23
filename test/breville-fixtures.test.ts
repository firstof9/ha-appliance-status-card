import { describe, it, expect, beforeEach } from 'vitest';
import '../src/appliance-card';
import { ApplianceCard } from '../src/appliance-card';
import { styles } from '../src/styles/styles';

describe('Breville oven visual fixtures', () => {
  let element: ApplianceCard;
  beforeEach(() => {
    element = document.createElement('appliance-card') as ApplianceCard;
    document.body.appendChild(element);
  });

  const renderFixture = async (fixture: Record<string, any>) => {
    element.setConfig({
      type: 'custom:appliance-card', appliance_type: 'oven',
      breville_status_entity: 'sensor.breville_oven_status',
      temperature_entity: 'sensor.breville_oven_temperature',
      target_temperature_entity: 'number.breville_oven_target_temperature',
      mode_entity: 'sensor.breville_oven_active_mode',
      time_entity: 'sensor.breville_oven_time_remaining',
      door_entity: 'binary_sensor.breville_oven_door',
    });
    element.hass = { states: Object.fromEntries(Object.entries(fixture).map(([key, state]) => [
      key.startsWith('sensor.') || key.startsWith('number.') || key.startsWith('binary_sensor.') ? key : `sensor.breville_oven_${key}`,
      typeof state === 'string' ? { state, attributes: {} } : state,
    ])) } as any;
    await element.updateComplete;
    return element.shadowRoot!;
  };

  it('keeps the readout light on its dark background in either theme', () => {
    const css = styles.cssText;
    expect(css).toMatch(/\.container\s*\{[^}]*background:\s*#1c1c1c/);
    expect(css).toMatch(/\.breville-readout\s*\{[^}]*color:\s*#fff\s*;/);
  });

  it('renders sanitized states across idle, ready, cooking, keep warm, done, and unavailable', async () => {
    for (const [raw, label] of [['idle', 'Idle'], ['ready', 'Ready for food'], ['cooking', 'Cooking'], ['keeping_warm', 'Keeping warm'], ['done', 'Done'], ['unavailable', 'Unavailable']]) {
      const root = await renderFixture({ status: raw });
      expect(root.querySelector('.breville-status')?.textContent).toContain(label);
    }
  });

  it('omits retained temperatures, door state, and countdowns for stale statuses', async () => {
    for (const status of ['offline', 'missing', 'unknown', 'updating', 'waiting_for_button']) {
      const root = await renderFixture({
        status,
        temperature: { state: '212', attributes: { unit_of_measurement: '°F' } },
        target_temperature: { state: '400', attributes: { unit_of_measurement: '°F' } },
        door: 'on',
        time_remaining: '12',
      });
      expect(root.querySelector('.breville-current-temp')).toBeNull();
      expect(root.querySelector('.breville-target-temp')).toBeNull();
      expect(root.querySelector('.breville-door-warning')).toBeNull();
      expect(root.querySelector('.breville-time')).toBeNull();
    }
  });

  it('shows an accessible warning and artwork overlay only for a confirmed open door with valid status', async () => {
    const door = 'binary_sensor.breville_oven_door';
    for (const status of ['idle', 'preheating', 'ready', 'cooking', 'keeping_warm', 'done']) {
      const root = await renderFixture({ status, [door]: 'on' });
      expect(root.querySelector('.breville-door-overlay')?.getAttribute('aria-hidden')).toBe('true');
      expect(root.querySelector('.breville-door-warning[role="status"]')?.textContent).toContain('Door open');
    }
    for (const state of ['off', 'unknown', 'unavailable', 'missing']) {
      const root = await renderFixture({ status: 'cooking', [door]: state });
      expect(root.querySelector('.breville-door-overlay')).toBeNull();
      expect(root.querySelector('.breville-door-warning')).toBeNull();
    }
    const missing = await renderFixture({ status: 'cooking' });
    expect(missing.querySelector('.breville-door-overlay')).toBeNull();
    for (const status of ['offline', 'missing', 'unknown', 'unavailable', 'updating', 'waiting_for_button']) {
      const root = await renderFixture({ status, [door]: 'on' });
      expect(root.querySelector('.breville-door-overlay')).toBeNull();
      expect(root.querySelector('.breville-door-warning')).toBeNull();
    }
    const missingStatus = await renderFixture({ [door]: 'on' });
    expect(missingStatus.querySelector('.breville-door-overlay')).toBeNull();
    element.setConfig({ type: 'custom:appliance-card', appliance_type: 'oven', breville_status_entity: 'sensor.breville_oven_status' });
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('.breville-door-overlay')).toBeNull();
  });

  it('does not present idle presets as live targets and formats each temperature with its own unit', async () => {
    const root = await renderFixture({
      status: 'idle',
      temperature: { state: '25', attributes: { unit_of_measurement: '°C' } },
      target_temperature: { state: '400', attributes: { unit_of_measurement: '°F' } },
      mode: 'bake',
    });
    expect(root.querySelector('.breville-current-temp')?.textContent).toContain('25 °C');
    expect(root.querySelector('.breville-target-temp')).toBeNull();
    expect(root.querySelector('.breville-mode')).toBeNull();
  });
});
