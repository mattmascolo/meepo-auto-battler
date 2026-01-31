import { describe, it, expect } from 'vitest';
import {
  getPassiveEffect,
  getWeaponEffects,
  getAccessoryEffects,
} from './effects';

describe('Effect data', () => {
  describe('PASSIVE_EFFECTS', () => {
    it('should define Pang Frost Aura as enemy debuff', () => {
      const effect = getPassiveEffect('pang');
      expect(effect).toBeDefined();
      expect(effect?.id).toBe('pang-frost-aura');
      expect(effect?.type).toBe('stat_modifier');
      expect(effect?.target).toBe('enemy');
      expect(effect?.trigger).toBe('always');
      expect(effect?.modifiers?.attackMod).toBe(-1);
    });

    it('should define Humphrey Thick Skin as per-turn regen', () => {
      const effect = getPassiveEffect('humphrey');
      expect(effect).toBeDefined();
      expect(effect?.id).toBe('humphrey-thick-skin');
      expect(effect?.type).toBe('heal');
      expect(effect?.trigger).toBe('turn_end');
      expect(effect?.value).toBe(1);
    });

    it('should define Beep-Boop Metal Plating as damage reduction', () => {
      const effect = getPassiveEffect('beep-boop');
      expect(effect).toBeDefined();
      expect(effect?.id).toBe('beep-boop-metal-plating');
      expect(effect?.type).toBe('damage_reduction');
      expect(effect?.trigger).toBe('on_attacked');
      expect(effect?.value).toBe(1);
    });

    it('should define Moo-Man Milk Power as conditional regen', () => {
      const effect = getPassiveEffect('moo-man');
      expect(effect).toBeDefined();
      expect(effect?.id).toBe('moo-man-milk-power');
      expect(effect?.type).toBe('heal');
      expect(effect?.trigger).toBe('hp_below');
      expect(effect?.triggerValue).toBe(50);
      expect(effect?.value).toBe(2);
    });

    it('should define Sarah Hard Shell as damage reduction', () => {
      const effect = getPassiveEffect('sarah');
      expect(effect).toBeDefined();
      expect(effect?.id).toBe('sarah-hard-shell');
      expect(effect?.type).toBe('damage_reduction');
      expect(effect?.trigger).toBe('on_attacked');
      expect(effect?.value).toBe(1);
    });
  });

  describe('WEAPON_EFFECTS', () => {
    it('should define Flame Stick burn proc', () => {
      const effects = getWeaponEffects('flame-stick');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('apply_status');
      expect(effects[0].trigger).toBe('on_hit');
      expect(effects[0].procChance).toBe(40);
      expect(effects[0].status?.type).toBe('burn');
    });

    it('should define Venom Fang poison proc', () => {
      const effects = getWeaponEffects('venom-fang');
      expect(effects).toHaveLength(1);
      expect(effects[0].status?.type).toBe('poison');
    });

    it('should define Sapping Thorn lifesteal', () => {
      const effects = getWeaponEffects('sapping-thorn');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('heal');
      expect(effects[0].trigger).toBe('on_hit');
      expect(effects[0].value).toBe(2);
    });

    it('should return empty array for weapons with no effects', () => {
      const effects = getWeaponEffects('rusty-dagger');
      expect(effects).toHaveLength(0);
    });
  });

  describe('ACCESSORY_EFFECTS', () => {
    it('should define Lucky Pebble stat bonus', () => {
      const effects = getAccessoryEffects('lucky-pebble');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('stat_modifier');
      expect(effects[0].trigger).toBe('always');
      expect(effects[0].modifiers?.attackMod).toBe(1);
    });

    it('should define Spiked Collar reflect damage', () => {
      const effects = getAccessoryEffects('spiked-collar');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('damage');
      expect(effects[0].target).toBe('attacker');
      expect(effects[0].trigger).toBe('on_attacked');
      expect(effects[0].value).toBe(2);
    });

    it('should define Adrenaline Gland conditional attack boost', () => {
      const effects = getAccessoryEffects('adrenaline-gland');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('stat_modifier');
      expect(effects[0].trigger).toBe('hp_below');
      expect(effects[0].triggerValue).toBe(25);
      expect(effects[0].modifiers?.attackMod).toBe(3);
    });

    it('should define Ember Charm burn chance', () => {
      const effects = getAccessoryEffects('ember-charm');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('apply_status');
      expect(effects[0].trigger).toBe('on_hit');
      expect(effects[0].procChance).toBe(20);
    });

    it('should define Iron Acorn HP bonus', () => {
      const effects = getAccessoryEffects('iron-acorn');
      expect(effects).toHaveLength(1);
      expect(effects[0].type).toBe('stat_modifier');
      expect(effects[0].modifiers?.maxHP).toBe(4);
    });
  });
});
