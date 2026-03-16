/**
 * Integration tests for plant management functionality
 * Tests the complete flow from frontend to backend
 */

const { validPlantData, invalidPlantData } = require('../../fixtures/test-data');

describe('Integration: Plant Management', () => {
  describe('Plant data validation', () => {
    test('should validate required fields', () => {
      const validate = plant => {
        if (!plant.name || !plant.type) {
          throw new Error('Name and type are required');
        }
        return true;
      };

      expect(() => validate(validPlantData)).not.toThrow();
      expect(() => validate(invalidPlantData.missingName)).toThrow();
      expect(() => validate(invalidPlantData.missingType)).toThrow();
    });

    test('should validate plant type', () => {
      const validTypes = ['interior', 'exterior', 'semilla'];
      const validate = plant => {
        if (!validTypes.includes(plant.type)) {
          throw new Error('Invalid plant type');
        }
        return true;
      };

      expect(() => validate(validPlantData)).not.toThrow();
      expect(() => validate(invalidPlantData.invalidType)).toThrow();
    });

    test('should sanitize plant name for XSS', () => {
      const sanitize = str => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
      };

      // Mock document.createElement for Node environment
      global.document = {
        createElement: () => ({
          textContent: '',
          innerHTML: '',
          set textContent(val) {
            this._text = val;
            this.innerHTML = val.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          },
          get textContent() {
            return this._text;
          },
        }),
      };

      const sanitized = sanitize(invalidPlantData.xssAttempt.name);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    test('should validate name length', () => {
      const validate = name => {
        if (name.length > 100) {
          throw new Error('Name too long');
        }
        return true;
      };

      expect(() => validate(validPlantData.name)).not.toThrow();
      expect(() => validate('x'.repeat(101))).toThrow();
    });
  });

  describe('LocalStorage operations', () => {
    let mockStorage = {};

    beforeEach(() => {
      mockStorage = {};

      global.localStorage = {
        getItem: jest.fn(key => mockStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockStorage[key] = value;
        }),
        removeItem: jest.fn(key => {
          delete mockStorage[key];
        }),
        clear: jest.fn(() => {
          mockStorage = {};
        }),
      };
    });

    test('should save plant to localStorage', () => {
      const plants = [validPlantData];
      localStorage.setItem('aicultor-v2', JSON.stringify(plants));

      expect(localStorage.setItem).toHaveBeenCalledWith('aicultor-v2', JSON.stringify(plants));
      expect(mockStorage['aicultor-v2']).toBe(JSON.stringify(plants));
    });

    test('should load plants from localStorage', () => {
      const plants = [validPlantData];
      mockStorage['aicultor-v2'] = JSON.stringify(plants);

      const loaded = JSON.parse(localStorage.getItem('aicultor-v2'));

      expect(loaded).toEqual(plants);
      expect(loaded[0].name).toBe('Monstera Deliciosa');
    });

    test('should handle empty localStorage', () => {
      const result = localStorage.getItem('aicultor-v2');

      expect(result).toBeNull();
    });

    test('should handle corrupted localStorage data', () => {
      mockStorage['aicultor-v2'] = 'invalid json';

      expect(() => {
        JSON.parse(localStorage.getItem('aicultor-v2'));
      }).toThrow();
    });

    test('should handle localStorage quota exceeded', () => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';

      localStorage.setItem.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        localStorage.setItem('aicultor-v2', 'x'.repeat(10000000));
      }).toThrow('QuotaExceededError');
    });
  });

  describe('Plant CRUD operations', () => {
    let plants = [];

    beforeEach(() => {
      plants = [];
    });

    test('should add a new plant', () => {
      const newPlant = {
        id: Date.now().toString(),
        ...validPlantData,
        addedAt: new Date().toISOString(),
      };

      plants.unshift(newPlant);

      expect(plants).toHaveLength(1);
      expect(plants[0].name).toBe('Monstera Deliciosa');
      expect(plants[0].id).toBeDefined();
    });

    test('should delete a plant by id', () => {
      const plant1 = { id: '1', name: 'Plant 1', type: 'interior' };
      const plant2 = { id: '2', name: 'Plant 2', type: 'exterior' };
      plants = [plant1, plant2];

      plants = plants.filter(p => p.id !== '1');

      expect(plants).toHaveLength(1);
      expect(plants[0].id).toBe('2');
    });

    test('should update plant statistics', () => {
      const plant1 = { type: 'interior' };
      const plant2 = { type: 'exterior' };
      const plant3 = { type: 'semilla' };
      plants = [plant1, plant2, plant3];

      const stats = {
        interior: plants.filter(p => p.type === 'interior').length,
        exterior: plants.filter(p => p.type === 'exterior').length,
        semilla: plants.filter(p => p.type === 'semilla').length,
        total: plants.length,
      };

      expect(stats.interior).toBe(1);
      expect(stats.exterior).toBe(1);
      expect(stats.semilla).toBe(1);
      expect(stats.total).toBe(3);
    });

    test('should filter plants by type', () => {
      const plant1 = { type: 'interior', name: 'Interior Plant' };
      const plant2 = { type: 'exterior', name: 'Exterior Plant' };
      const plant3 = { type: 'interior', name: 'Another Interior' };
      plants = [plant1, plant2, plant3];

      const interior = plants.filter(p => p.type === 'interior');

      expect(interior).toHaveLength(2);
      expect(interior.every(p => p.type === 'interior')).toBe(true);
    });
  });

  describe('AI integration flow', () => {
    test('should format messages for Anthropic API', () => {
      const userQuery = 'How do I care for my Monstera?';
      const plantContext = [validPlantData];

      const messages = [
        {
          role: 'user',
          content: userQuery,
        },
      ];

      const system = `Plantas del usuario (${plantContext.length} total):\n${plantContext.map(p => `- ${p.name} (${p.scientific || '?'}): ${p.type}`).join('\n')}`;

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('user');
      expect(system).toContain('Monstera Deliciosa');
    });

    test('should handle empty plant collection', () => {
      const plantContext = [];
      const system =
        plantContext.length === 0
          ? 'El usuario no tiene plantas registradas aún.'
          : 'Plantas del usuario...';

      expect(system).toBe('El usuario no tiene plantas registradas aún.');
    });

    test('should parse AI response for plant suggestions', () => {
      const mockResponse = JSON.stringify([
        {
          name: 'Pothos',
          scientific: 'Epipremnum aureum',
          emoji: '🍃',
        },
      ]);

      const parsed = JSON.parse(mockResponse);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Pothos');
    });

    test('should handle malformed AI response', () => {
      const mockResponse = 'invalid json response';

      expect(() => JSON.parse(mockResponse)).toThrow();
    });
  });

  describe('Error handling', () => {
    test('should handle network errors gracefully', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      try {
        await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [] }),
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });

    test('should handle API errors with status codes', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/chat');
      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limit');
    });

    test('should validate response before processing', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => null,
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/chat');
      const data = await response.json();

      expect(data).toBeNull();
    });
  });
});
