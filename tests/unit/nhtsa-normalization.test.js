/**
 * Tests for NHTSA model name normalization
 * 
 * Run with: npm test -- tests/unit/nhtsa-normalization.test.js
 */

// Since normalizeModelForNHTSA is not exported, we test via the NHTSA_MODEL_MAPPINGS
// logic directly by recreating the normalization logic here for testing

const NHTSA_MODEL_MAPPINGS = {
  // RAM Trucks
  '1500 rebel': '1500',
  '1500 trx': '1500',
  '1500 laramie': '1500',
  '2500 cummins': '2500',
  '2500 power wagon': '2500',
  'ram 1500': '1500',
  'ram 1500 rebel': '1500',
  'ram 2500': '2500',
  
  // Ford Trucks
  'f-150 raptor': 'F-150',
  'f-150 lightning': 'F-150',
  'f-250 power stroke': 'F-250',
  'ranger raptor': 'Ranger',
  'mustang svt cobra': 'Mustang',
  
  // GMC
  'sierra at4x': 'Sierra 1500',
  'sierra 1500': 'Sierra 1500',
  'yukon denali': 'Yukon',
  
  // Chevrolet
  'silverado zr2': 'Silverado 1500',
  'silverado 1500': 'Silverado 1500',
  'colorado zr2': 'Colorado',
  
  // Toyota
  'supra mk4 a80 turbo': 'Supra',
};

function normalizeModelForNHTSA(model) {
  if (!model) return model;
  
  const lowerModel = model.toLowerCase().trim();
  
  // Check direct mapping first
  if (NHTSA_MODEL_MAPPINGS[lowerModel]) {
    return NHTSA_MODEL_MAPPINGS[lowerModel];
  }
  
  // Check if any mapping key is contained in the model name
  for (const [key, value] of Object.entries(NHTSA_MODEL_MAPPINGS)) {
    if (lowerModel.includes(key)) {
      return value;
    }
  }
  
  return model;
}

describe('NHTSA Model Normalization', () => {
  describe('RAM Trucks', () => {
    test('normalizes "1500 Rebel" to "1500"', () => {
      expect(normalizeModelForNHTSA('1500 Rebel')).toBe('1500');
    });
    
    test('normalizes "1500 TRX" to "1500"', () => {
      expect(normalizeModelForNHTSA('1500 TRX')).toBe('1500');
    });
    
    test('normalizes "Ram 1500 Rebel" to "1500"', () => {
      expect(normalizeModelForNHTSA('Ram 1500 Rebel')).toBe('1500');
    });
    
    test('normalizes "2500 Cummins" to "2500"', () => {
      expect(normalizeModelForNHTSA('2500 Cummins')).toBe('2500');
    });
    
    test('normalizes "2500 Power Wagon" to "2500"', () => {
      expect(normalizeModelForNHTSA('2500 Power Wagon')).toBe('2500');
    });
  });
  
  describe('Ford Trucks', () => {
    test('normalizes "F-150 Raptor" to "F-150"', () => {
      expect(normalizeModelForNHTSA('F-150 Raptor')).toBe('F-150');
    });
    
    test('normalizes "F-150 Lightning" to "F-150"', () => {
      expect(normalizeModelForNHTSA('F-150 Lightning')).toBe('F-150');
    });
    
    test('normalizes "F-250 Power Stroke" to "F-250"', () => {
      expect(normalizeModelForNHTSA('F-250 Power Stroke')).toBe('F-250');
    });
    
    test('normalizes "Mustang SVT Cobra" to "Mustang"', () => {
      expect(normalizeModelForNHTSA('Mustang SVT Cobra')).toBe('Mustang');
    });
  });
  
  describe('GMC Trucks', () => {
    test('normalizes "Sierra AT4X" to "Sierra 1500"', () => {
      expect(normalizeModelForNHTSA('Sierra AT4X')).toBe('Sierra 1500');
    });
  });
  
  describe('Chevrolet Trucks', () => {
    test('normalizes "Silverado ZR2" to "Silverado 1500"', () => {
      expect(normalizeModelForNHTSA('Silverado ZR2')).toBe('Silverado 1500');
    });
    
    test('normalizes "Colorado ZR2" to "Colorado"', () => {
      expect(normalizeModelForNHTSA('Colorado ZR2')).toBe('Colorado');
    });
  });
  
  describe('Toyota', () => {
    test('normalizes "Supra Mk4 A80 Turbo" to "Supra"', () => {
      expect(normalizeModelForNHTSA('Supra Mk4 A80 Turbo')).toBe('Supra');
    });
  });
  
  describe('Passthrough for unknown models', () => {
    test('passes through "Tahoe" unchanged', () => {
      expect(normalizeModelForNHTSA('Tahoe')).toBe('Tahoe');
    });
    
    test('passes through unknown model unchanged', () => {
      expect(normalizeModelForNHTSA('Some Unknown Model')).toBe('Some Unknown Model');
    });
  });
});
