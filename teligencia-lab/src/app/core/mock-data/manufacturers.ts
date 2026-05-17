/*
 * Mock manufacturer directory — verbatim names from prompt brief.
 * 14 manufacturers across consumer IoT, industrial, medical.
 */

import { Manufacturer, Product } from '../models/domain';

export const MANUFACTURERS: Manufacturer[] = [
  { id: 'm-bosch',      name: 'Bosch' },
  { id: 'm-samsung',    name: 'Samsung' },
  { id: 'm-philips',    name: 'Philips' },
  { id: 'm-siemens',    name: 'Siemens' },
  { id: 'm-tplink',     name: 'TP-Link' },
  { id: 'm-xiaomi',     name: 'Xiaomi' },
  { id: 'm-honeywell',  name: 'Honeywell' },
  { id: 'm-abb',        name: 'ABB' },
  { id: 'm-drager',     name: 'Dräger Medical' },
  { id: 'm-withings',   name: 'Withings' },
  { id: 'm-sonos',      name: 'Sonos' },
  { id: 'm-logitech',   name: 'Logitech' },
  { id: 'm-eve',        name: 'Eve Systems' },
  { id: 'm-schneider',  name: 'Schneider Electric' }
];

export const MANUFACTURERS_BY_ID = Object.fromEntries(MANUFACTURERS.map(m => [m.id, m])) as Record<string, Manufacturer>;

export const PRODUCTS: Product[] = [
  { id: 'p-1',  manufacturerId: 'm-bosch',      name: 'Smart Home Controller Gen-3' },
  { id: 'p-2',  manufacturerId: 'm-samsung',    name: 'SmartThings Hub V4' },
  { id: 'p-3',  manufacturerId: 'm-philips',    name: 'Hue Bridge 2.1' },
  { id: 'p-4',  manufacturerId: 'm-siemens',    name: 'SIMATIC IoT Gateway' },
  { id: 'p-5',  manufacturerId: 'm-tplink',     name: 'Archer AX73 Router' },
  { id: 'p-6',  manufacturerId: 'm-xiaomi',     name: 'Mi Smart Camera 2K Pro' },
  { id: 'p-7',  manufacturerId: 'm-honeywell',  name: 'T6 Pro Thermostat' },
  { id: 'p-8',  manufacturerId: 'm-abb',        name: 'AC500 PLC Module' },
  { id: 'p-9',  manufacturerId: 'm-drager',     name: 'Patient Monitor Vista 300' },
  { id: 'p-10', manufacturerId: 'm-withings',   name: 'BPM Connect Pro' },
  { id: 'p-11', manufacturerId: 'm-sonos',      name: 'Era 300 Smart Speaker' },
  { id: 'p-12', manufacturerId: 'm-logitech',   name: 'Tap IP Conference Controller' },
  { id: 'p-13', manufacturerId: 'm-eve',        name: 'Eve Energy Strip' },
  { id: 'p-14', manufacturerId: 'm-schneider',  name: 'EcoStruxure Building Gateway' },
  { id: 'p-15', manufacturerId: 'm-bosch',      name: 'Cloud-Connected EV Charger' }
];

export const PRODUCTS_BY_ID = Object.fromEntries(PRODUCTS.map(p => [p.id, p])) as Record<string, Product>;
