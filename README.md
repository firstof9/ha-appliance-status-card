# Appliance Card

A custom Home Assistant card for tracking and controlling home appliances — refrigerators, microwaves, ovens, cooktops, dishwashers, washers, dryers, kettles, and coffee makers — from SmartThings, LocalThings, and other integrations.

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=firstof9&repository=ha-appliance-status-card&category=plugin)

![Preview](https://raw.githubusercontent.com/firstof9/ha-appliance-status-card/main/screenshots/smartthings_card.gif)

> [!NOTE]
> `ha-smartthings-card` (briefly renamed to `ha-appliance-card`) has been renamed to **`ha-appliance-status-card`** to reflect its broad multi-brand appliance support beyond SmartThings and to prevent HACS installation directory collisions with existing community cards. The element `custom:smartthings-card` is deprecated and will be removed in a future release. Please update your card configuration to `type: custom:appliance-card`.

## Features

- **Multi-Integration Support**: Works with SmartThings, LocalThings, Govee, GE Home (GE / Café), Bosch / Siemens Home Connect, LG ThinQ, SmartThinQ LGE Sensors, De'Longhi Coffee, Breville+, and custom/template appliances.
- **Visual Editor**: Integrated configuration GUI with automatic device entity discovery.
- **Modern Glassmorphic UI**: Sleek, transparent design elements with vibrant accents and Home Assistant theme support.
- **7-Segment Digital Readouts**: Authentic digital display for timers and temperatures with grey `"88"` placeholders.
- **Responsive Layout**: Fully supports the Home Assistant **Sections** dashboard with dynamic resizing.
- **Live Countdown**: Real-time progress tracking with flexible duration and timestamp parsing.
- **Appliance-Specific Overlays**: Interactive door status, filter health progress bars, cooktop heating coils, and device controls.

## Supported Integrations

| Integration | Domain / ID | Description |
| --- | --- | --- |
| **SmartThings** | `smartthings` | Core Home Assistant SmartThings integration |
| **LocalThings** | `localthings` | Local SmartThings integration |
| **Govee** | `govee`, `govee_ble` | Govee Home / Govee BLE integrations |
| **GE Home** | `ge_home` | GE Appliances / Café integration |
| **Home Connect** | `home_connect`, `home_connect_alt`, `homeconnect`, `homeconnect_ws` | Core & custom Bosch / Siemens Home Connect integrations |
| **LG ThinQ** | `lg_thinq` | Core Home Assistant LG ThinQ integration |
| **SmartThinQ LGE Sensors** | `smartthinq_sensors` | Custom LG ThinQ integration |
| **De'Longhi Coffee** | `delonghi_coffee` | De'Longhi coffee maker integration (read-only status) |
| **Breville+** | `breville_cooking` | Breville+ smart oven integration (read-only status) |

## Installation

### Marketplace (formerly HACS) (Recommended)

1. Click the badge above, or:
2. Open **Marketplace** (formerly HACS) in Home Assistant.
3. Click the three dots in the top-right corner and select **Custom repositories**.
4. Add `https://github.com/firstof9/ha-appliance-status-card` as a **Dashboard** / **Lovelace** repository.
5. Click **Install**.

### Manual

1. Download `appliance-card.js` from the [latest release](https://github.com/firstof9/ha-appliance-status-card/releases/latest) and copy it to your `<config>/www/` directory.
2. Add the resource to your `configuration.yaml` or through **Settings -> Dashboards -> Resources**:

```yaml
lovelace:
  resources:
    - url: /local/appliance-card.js
      type: module
```

## Configuration

This card includes a full Visual Editor in the Home Assistant UI. Add the card, select your appliance device, and the editor will automatically discover and populate the relevant entities.

### General Options

| Name | Type | Requirement | Description |
| --- | --- | --- | --- |
| `type` | string | **Required** | `custom:appliance-card` (deprecated: `custom:smartthings-card`). |
| `device_id` | string | **Optional** | Home Assistant device ID used in the visual editor for automatic entity discovery. |
| `appliance_type` | string | **Optional** | `microwave`, `oven`, `dishwasher`, `washer`, `dryer`, `refrigerator`, `cooktop`, `kettle`, `coffee_maker`. Defaults to `microwave`. |
| `power_entity` | string | **Optional** | Entity ID for power state (`switch` or `binary_sensor`). |
| `mode_entity` | string | **Optional** | Entity ID for the current appliance mode. |
| `machine_state_entity` | string | **Optional** | Entity ID for the machine state. |
| `job_state_entity` | string | **Optional** | Entity ID for the current job state. |
| `time_entity` | string | **Optional** | Entity ID for completion time or time remaining (supports live countdown). |
| `temperature_entity` | string | **Optional** | Entity ID for real-time temperature monitoring (Microwave / Oven / Kettle). |
| `wifi_entity` | string | **Optional** | Entity ID for WiFi connection status. |
| `lock_entity` | string | **Optional** | Entity ID for child lock status. |

### Appliance-Specific Options

#### Refrigerator

| Name | Type | Requirement | Description |
| --- | --- | --- | --- |
| `fridge_temp_entity` | string | **Optional** | Entity ID for the main fridge temperature. |
| `freezer_temp_entity` | string | **Optional** | Entity ID for the freezer temperature. |
| `door_entities` | list | **Optional** | List of `binary_sensor` entity IDs for the doors. Overlays map automatically based on entity name (`cooler`, `coolselect`, `freezer`). |
| `ice_maker_entity` | string | **Optional** | Entity ID for the ice maker switch. |
| `filter_status_entity` | string | **Optional** | Entity ID for the water filter usage/health percentage. |
| `filter_reset_entity` | string | **Optional** | Entity ID for a button to reset the water filter. |

#### Microwave & Oven

| Name | Type | Requirement | Description |
| --- | --- | --- | --- |
| `fan_entity` | string | **Optional** | Entity ID for the microwave fan (supports slider for `fan` or `number` entities). |
| `light_entity` | string | **Optional** | Entity ID for the microwave light toggle. |
| `temperature_entity` | string | **Optional** | Entity ID for the cooking temperature sensor. |

#### Breville+ Smart Oven (Read-Only)

The existing `oven` appliance type supports an optional read-only Breville+ profile. Select the Breville oven device in the editor to map its `breville_cooking` entities automatically, or configure it explicitly:

```yaml
type: custom:appliance-card
appliance_type: oven
breville_status_entity: sensor.breville_oven_status
temperature_entity: sensor.breville_oven_temperature
target_temperature_entity: number.breville_oven_target_temperature
mode_entity: sensor.breville_oven_active_mode
time_entity: sensor.breville_oven_time_remaining
door_entity: binary_sensor.breville_oven_door
```

The profile displays the integration's status, active mode, actual and target temperature, remaining time, and an open-door warning. Unknown or unavailable readings are not presented as live values. It does not expose oven control services; use the Breville+ integration panel for operation. The status entity is mapped only for a device that exposes `sensor.*_breville_oven_status`, so a Breville sous vide device is not selected as an oven.

#### Cooktop

| Name | Type | Requirement | Description |
| --- | --- | --- | --- |
| `burner_<position>_on_entity` | string | **Optional** | Binary sensor for burner flame/power state. |
| `burner_<position>_power_entity` | string | **Optional** | Sensor for burner power percentage (`0-100%`). |
| `burner_<position>_sync_entity` | string | **Optional** | Binary sensor for burner synchronization. |
| `sabbath_mode_entity` | string | **Optional** | Switch or binary sensor for Sabbath mode. |

#### Kettle

Kettles have no kettle-only configuration keys. The stage icon is driven by `job_state_entity`; `stage_map` can translate integration-specific values such as `Black Tea/Boil` and `Green Tea` to recognized stages. Kettles do not use the microwave/oven `mode_entity` fallback.

#### Coffee Maker (Read-Only Status)

`coffee_maker` reuses the card's status presentation and does not expose brew, rinse, or power controls. With a selected device, the editor recognizes the `delonghi_coffee` integration and autofills `machine_state_entity` from `_machine_status`, `power_entity` from `_power`, and `alarm_code_entity` from `_blocking_alarms` (only binding entities registered to the selected device). Review the selected entities and provide explicit mappings when your integration uses different names:

```yaml
type: custom:appliance-card
appliance_type: coffee_maker
device_id: YOUR_DEVICE_ID
machine_state_entity: sensor.your_machine_status
power_entity: switch.your_machine_power
alarm_code_entity: sensor.your_machine_blocking_alarms
stage_map:
  Off: idle
  Brewing: coffee
```

The card shows the integration's own status text (`Ready`, `Off`, `Rinsing`, `Unavailable`, `Unknown`). A missing or unset status entity reads `Not found` or `Not configured`, never `Off` or `Ready`. Brewing and milk stages use the coffee icon, heating and hot water use the boil icon, and `espresso` has its own icon; all are bundled, so no files need to be copied into `www/`.

> [!TIP]
> Do not map `unavailable` or `unknown` states to `ready`. Integration state meanings vary; verify the exact state tokens before configuring `stage_map`.

### Template & Virtual Appliance Options

| Name | Type | Requirement | Description |
| --- | --- | --- | --- |
| `stage_map` | object | **Optional** | Key-value mapping from custom sensor state strings to card stages (e.g. `soaking: wash`). |
| `mode_map` | object | **Optional** | Key-value mapping from custom sensor state strings to card modes. |
| `time_template` | string | **Optional** | Jinja2 template rendering live time remaining or duration (e.g. `{{ states('sensor.washer_secs') }}`). |
| `job_state_template` | string | **Optional** | Jinja2 template rendering active job/cycle state. |
| `mode_template` | string | **Optional** | Jinja2 template rendering active appliance mode. |
| `power_template` | string | **Optional** | Jinja2 template returning `on` or `off` for power state. |
| `temperature_template` | string | **Optional** | Jinja2 template returning temperature value. |
| `alarm_code_template` | string | **Optional** | Jinja2 template returning alarm/fault code. |

## Template & Virtual Appliance Examples

`ha-appliance-status-card` supports non-smart appliances and custom integrations (ESPHome, Shelly, Tuya, Bosch, Miele, MQTT, Virtual Helper Sensors) using flexible duration parsers, stage mapping, and live Jinja2 template evaluation.

### Example 1: Template Washer with Stage Mapping & Seconds Timer

```yaml
type: custom:appliance-card
appliance_type: washer
job_state_entity: sensor.template_washer_status
time_entity: sensor.template_washer_seconds_remaining
stage_map:
  soaking: weight_sensing
  filling: wash
  washing: wash
  deep_rinse: rinse
  extracting: spin
```

### Example 2: Jinja2 Live Template Expressions

```yaml
type: custom:appliance-card
appliance_type: dryer
power_template: "{{ 'on' if is_state('sensor.dryer_power', 'running') else 'off' }}"
job_state_template: >
  {% if is_state('sensor.dryer_phase', 'drying') %}
    dry
  {% elif is_state('sensor.dryer_phase', 'cooling') %}
    cool
  {% else %}
    off
  {% endif %}
time_template: "{{ states('sensor.dryer_remaining_minutes') | int * 60 }}"
```

### Supported Time Formats

Both `time_entity` and `time_template` automatically parse:

- **Raw Seconds**: `3600` &rarr; `01:00:00`
- **Units of Measurement**: `45` with unit `min` &rarr; `00:45:00`
- **Human-Formatted Strings**: `"1h 25m"`, `"45 mins"`, `"90 sec"`
- **Standard Durations**: `"01:15:00"`, `"25:00"` (`MM:SS` &rarr; `00:25:00`)
- **ISO Target Timestamps**: `"2026-08-18T16:30:00Z"` &rarr; Live countdown

## Themes

This card supports Home Assistant themes and uses standard CSS variables for styling. You can customize the look of the card by overriding these variables in your theme:

| CSS Variable | Description | Default |
| --- | --- | --- |
| `--accent-color` | Color for active values, primary highlights, and active buttons. | `#ff9800` |
| `--primary-text-color` | Color for primary text elements. | Theme default |
| `--secondary-text-color` | Color for labels and secondary information. | `#888` |
| `--divider-color` | Color for background "segment" digit placeholders. | `#333` |
| `--ha-card-background` | Background color for control boxes. | `var(--card-background-color)` |
| `--success-color` | Color for healthy filter status (usage `< 50%`). | `#4caf50` |
| `--warning-color` | Color for filter warning state (usage `50-80%`). | `#ff9800` |
| `--error-color` | Color for filter replacement state (usage `> 80%`). | `#f44336` |

## Assets

Images are generated via a build script into the `images/` directory of this repository and are inlined into the bundle at build time. The card resolves each icon from that embedded map; the `/local/community/ha-appliance-status-card/images/` path is only a last-resort fallback for assets that are not bundled.

## Development

1. Install dependencies: `npm install`
2. Typecheck: `npm run typecheck`
3. Run tests: `npx vitest run`
4. Build the project: `npm run build`
5. Watch for changes: `npm run build:watch`
