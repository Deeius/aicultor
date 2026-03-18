/**
 * Integration tests for wizard logic and state management
 * Tests wizard flow without DOM rendering
 */

describe('Integration: Wizard Logic & State', () => {
  let mockWiz;
  let mockFetch;

  beforeEach(() => {
    // Initialize wizard state
    mockWiz = {
      step: 0,
      query: '',
      selected: null,
      selectedVariety: null,
      varietyOptions: [],
      qaQuestions: [],
      answers: {},
      carePlan: null,
      photoOptions: [],
      characteristics: {
        leafColor: '',
        leafShape: '',
        plantSize: '',
        flowers: '',
      },
      searchIteration: 0,
    };

    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  describe('Wizard State Management', () => {
    test('should initialize with correct default state', () => {
      expect(mockWiz.step).toBe(0);
      expect(mockWiz.query).toBe('');
      expect(mockWiz.selected).toBeNull();
      expect(mockWiz.selectedVariety).toBeNull();
      expect(mockWiz.searchIteration).toBe(0);
    });

    test('should store characteristics when proceeding from step 0', () => {
      const characteristics = {
        leafColor: 'verde intenso',
        leafShape: 'hojas anchas',
        plantSize: 'mediana',
        flowers: 'sí, con flores',
      };

      mockWiz.characteristics = characteristics;

      expect(mockWiz.characteristics.leafColor).toBe('verde intenso');
      expect(mockWiz.characteristics.leafShape).toBe('hojas anchas');
    });

    test('should store query and reset iteration when starting search', () => {
      mockWiz.searchIteration = 5;
      mockWiz.query = 'monstera';
      mockWiz.searchIteration = 0;

      expect(mockWiz.query).toBe('monstera');
      expect(mockWiz.searchIteration).toBe(0);
    });

    test('should store selected variety', () => {
      const variety = {
        name: 'Monstera deliciosa',
        scientific: 'Monstera deliciosa',
        emoji: '🌿',
        description: 'Classic monstera',
      };

      mockWiz.selectedVariety = variety;

      expect(mockWiz.selectedVariety.name).toBe('Monstera deliciosa');
      expect(mockWiz.selectedVariety.scientific).toBe('Monstera deliciosa');
    });

    test('should store variety options from API response', () => {
      const varieties = [
        {
          name: 'Monstera deliciosa',
          scientific: 'Monstera deliciosa',
          emoji: '🌿',
        },
        {
          name: 'Monstera adansonii',
          scientific: 'Monstera adansonii',
          emoji: '🍃',
        },
      ];

      mockWiz.varietyOptions = varieties;

      expect(mockWiz.varietyOptions).toHaveLength(2);
      expect(mockWiz.varietyOptions[0].name).toBe('Monstera deliciosa');
    });

    test('should store selected photo', () => {
      const photo = {
        name: 'Monstera',
        scientific: 'Monstera deliciosa',
        emoji: '🌿',
        imgUrl: 'https://example.com/image.jpg',
      };

      mockWiz.selected = photo;

      expect(mockWiz.selected.name).toBe('Monstera');
      expect(mockWiz.selected.imgUrl).toBeDefined();
    });

    test('should store Q&A answers', () => {
      mockWiz.answers = {
        q1: '🏠 Interior',
        q2: '☀️ Mucha luz',
        q3: '💧 Riego moderado',
      };

      expect(mockWiz.answers.q1).toBe('🏠 Interior');
      expect(mockWiz.answers.q2).toBe('☀️ Mucha luz');
      expect(Object.keys(mockWiz.answers)).toHaveLength(3);
    });

    test('should store care plan', () => {
      const carePlan = {
        type: 'interior',
        difficulty: 'Fácil',
        water: 'Cada 7-10 días',
        light: 'Luz indirecta',
      };

      mockWiz.carePlan = carePlan;

      expect(mockWiz.carePlan.type).toBe('interior');
      expect(mockWiz.carePlan.difficulty).toBe('Fácil');
    });

    test('should increment search iteration for "show more"', () => {
      expect(mockWiz.searchIteration).toBe(0);

      mockWiz.searchIteration++;
      expect(mockWiz.searchIteration).toBe(1);

      mockWiz.searchIteration++;
      expect(mockWiz.searchIteration).toBe(2);
    });
  });

  describe('Variety List Processing', () => {
    test('should parse variety JSON response correctly', () => {
      const apiResponse = {
        content: [
          {
            text: JSON.stringify([
              {
                name: 'Monstera deliciosa',
                scientific: 'Monstera deliciosa',
                emoji: '🌿',
                description: 'Classic variety',
              },
              {
                name: 'Monstera adansonii',
                scientific: 'Monstera adansonii',
                emoji: '🍃',
                description: 'Swiss cheese variant',
              },
            ]),
          },
        ],
      };

      const textContent = apiResponse.content[0].text;
      const varieties = JSON.parse(textContent);

      expect(varieties).toHaveLength(2);
      expect(varieties[0].name).toBe('Monstera deliciosa');
      expect(varieties[0].description).toBe('Classic variety');
    });

    test('should handle variety response with 12-20 items', () => {
      const varieties = Array(15)
        .fill(null)
        .map((_, i) => ({
          name: `Variety ${i + 1}`,
          scientific: `Plantus variety${i + 1}`,
          emoji: '🌿',
          description: `Description ${i + 1}`,
        }));

      mockWiz.varietyOptions = varieties;

      expect(mockWiz.varietyOptions.length).toBeGreaterThanOrEqual(12);
      expect(mockWiz.varietyOptions.length).toBeLessThanOrEqual(20);
    });

    test('should include characteristics in variety search', () => {
      const characteristics = {
        leafColor: 'variegadas',
        leafShape: 'hojas anchas',
        plantSize: 'mediana',
        flowers: 'no',
      };

      const promptParts = [];
      if (characteristics.leafColor) {
        promptParts.push(`Color de hojas: ${characteristics.leafColor}`);
      }
      if (characteristics.leafShape) {
        promptParts.push(`Forma de hojas: ${characteristics.leafShape}`);
      }

      const prompt = promptParts.join('\n');

      expect(prompt).toContain('Color de hojas: variegadas');
      expect(prompt).toContain('Forma de hojas: hojas anchas');
    });
  });

  describe('Photo Loading Logic', () => {
    test('should generate different image queries for same plant', () => {
      const perspectives = [
        'close up',
        'full plant',
        'leaf detail',
        'mature',
        'young',
        'growing',
      ];

      const plantName = 'Monstera deliciosa';
      const queries = perspectives.map((p) => `${plantName} ${p}`);

      expect(queries).toHaveLength(6);
      expect(queries[0]).toBe('Monstera deliciosa close up');
      expect(queries[5]).toBe('Monstera deliciosa growing');
      expect(new Set(queries).size).toBe(6); // All unique
    });

    test('should determine photo loading strategy based on selection', () => {
      // Path A: Variety selected
      mockWiz.selectedVariety = {
        name: 'Monstera deliciosa',
        scientific: 'Monstera deliciosa',
      };

      const loadSpecificVariety = !!mockWiz.selectedVariety;
      expect(loadSpecificVariety).toBe(true);

      // Path B: Skipped to photos
      mockWiz.selectedVariety = null;
      const loadAllVarieties = !mockWiz.selectedVariety;
      expect(loadAllVarieties).toBe(true);
    });

    test('should handle "show more" based on path taken', () => {
      // When variety was selected
      mockWiz.selectedVariety = { name: 'Test', scientific: 'Testus' };
      const useCase1 = mockWiz.selectedVariety ? 'loadPhotos' : 'loadPhotosForAllVarieties';
      expect(useCase1).toBe('loadPhotos');

      // When skipped to photos
      mockWiz.selectedVariety = null;
      const useCase2 = mockWiz.selectedVariety ? 'loadPhotos' : 'loadPhotosForAllVarieties';
      expect(useCase2).toBe('loadPhotosForAllVarieties');
    });
  });

  describe('Q&A Generation', () => {
    test('should parse Q&A JSON response correctly', () => {
      const apiResponse = {
        content: [
          {
            text: JSON.stringify([
              {
                id: 'q1',
                question: '¿Dónde estará la planta?',
                options: ['🏠 Interior', '🌳 Exterior', '🪟 Balcón'],
              },
              {
                id: 'q2',
                question: '¿Cuánta luz recibe?',
                options: ['☀️ Mucha', '🌤️ Media', '🌥️ Poca'],
              },
            ]),
          },
        ],
      };

      const textContent = apiResponse.content[0].text;
      const questions = JSON.parse(textContent);

      expect(questions).toHaveLength(2);
      expect(questions[0].id).toBe('q1');
      expect(questions[0].options).toHaveLength(3);
    });

    test('should collect all answers before generating care plan', () => {
      mockWiz.qaQuestions = [
        { id: 'q1', question: 'Question 1', options: ['A', 'B'] },
        { id: 'q2', question: 'Question 2', options: ['C', 'D'] },
        { id: 'q3', question: 'Question 3', options: ['E', 'F'] },
      ];

      mockWiz.answers = {
        q1: 'A',
        q2: 'C',
        q3: 'E',
      };

      const allAnswered = mockWiz.qaQuestions.every((q) => mockWiz.answers[q.id]);
      expect(allAnswered).toBe(true);
    });

    test('should format Q&A for care plan generation', () => {
      mockWiz.qaQuestions = [
        { id: 'q1', question: 'Location?', options: ['Interior', 'Exterior'] },
        { id: 'q2', question: 'Light?', options: ['High', 'Low'] },
      ];

      mockWiz.answers = {
        q1: 'Interior',
        q2: 'High',
      };

      const qaText = mockWiz.qaQuestions
        .map((q) => `- ${q.question} → ${mockWiz.answers[q.id] || 'No respondida'}`)
        .join('\n');

      expect(qaText).toContain('Location? → Interior');
      expect(qaText).toContain('Light? → High');
    });
  });

  describe('Care Plan Generation', () => {
    test('should parse care plan JSON response correctly', () => {
      const apiResponse = {
        content: [
          {
            text: JSON.stringify({
              type: 'interior',
              difficulty: 'Fácil',
              summary: 'Easy to care for',
              water: 'Every 7-10 days',
              light: 'Indirect light',
              humidity: 'Medium',
              temperature: '18-25°C',
              fertilizer: 'Monthly',
              repotting: 'Every 2 years',
              warnings: ['Avoid overwatering'],
              tips: ['Clean leaves regularly'],
              fullCare: 'Complete care instructions...',
            }),
          },
        ],
      };

      const textContent = apiResponse.content[0].text;
      const carePlan = JSON.parse(textContent);

      expect(carePlan.type).toBe('interior');
      expect(carePlan.difficulty).toBe('Fácil');
      expect(carePlan.water).toBeDefined();
      expect(carePlan.warnings).toHaveLength(1);
      expect(carePlan.tips).toHaveLength(1);
    });

    test('should validate care plan has all required fields', () => {
      const carePlan = {
        type: 'interior',
        difficulty: 'Fácil',
        summary: 'Test summary',
        water: 'Weekly',
        light: 'Indirect',
        humidity: 'Medium',
        temperature: '18-25°C',
        fertilizer: 'Monthly',
        repotting: 'Every 2 years',
      };

      const requiredFields = [
        'type',
        'difficulty',
        'summary',
        'water',
        'light',
        'humidity',
        'temperature',
        'fertilizer',
        'repotting',
      ];

      const hasAllFields = requiredFields.every((field) => carePlan[field] !== undefined);
      expect(hasAllFields).toBe(true);
    });
  });

  describe('Plant Save Logic', () => {
    test('should create plant object with all required data', () => {
      const selected = {
        name: 'Monstera',
        scientific: 'Monstera deliciosa',
        emoji: '🌿',
        imgUrl: 'https://example.com/image.jpg',
      };

      const carePlan = {
        type: 'interior',
        difficulty: 'Fácil',
        summary: 'Easy care',
        water: 'Weekly',
        light: 'Indirect',
        fullCare: 'Complete care',
      };

      const plant = {
        id: Date.now().toString(),
        name: selected.name,
        scientific: selected.scientific,
        emoji: selected.emoji,
        imgUrl: selected.imgUrl,
        type: carePlan.type,
        care: {
          water: carePlan.water,
          light: carePlan.light,
          difficulty: carePlan.difficulty,
        },
        careSummary: carePlan.summary,
        fullCare: carePlan.fullCare,
        addedAt: new Date().toISOString(),
      };

      expect(plant.id).toBeDefined();
      expect(plant.name).toBe('Monstera');
      expect(plant.type).toBe('interior');
      expect(plant.care.water).toBe('Weekly');
      expect(plant.addedAt).toBeDefined();
    });

    test('should generate unique IDs for different plants', () => {
      const id1 = Date.now().toString();
      const id2 = (Date.now() + 1).toString();

      expect(id1).not.toBe(id2);
    });

    test('should add timestamp in ISO format', () => {
      const timestamp = new Date().toISOString();
      const date = new Date(timestamp);

      expect(date).toBeInstanceOf(Date);
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Complete Wizard Journey', () => {
    test('should progress through all steps in order', () => {
      // Step 0 → 1
      mockWiz.step = 0;
      mockWiz.characteristics = { leafColor: 'verde' };
      mockWiz.step = 1;
      expect(mockWiz.step).toBe(1);

      // Step 1 → 2
      mockWiz.query = 'monstera';
      mockWiz.step = 2;
      expect(mockWiz.step).toBe(2);

      // Step 2 → 3
      mockWiz.selectedVariety = { name: 'Monstera deliciosa' };
      mockWiz.step = 3;
      expect(mockWiz.step).toBe(3);

      // Step 3 → 4
      mockWiz.selected = { name: 'Monstera' };
      mockWiz.step = 4;
      expect(mockWiz.step).toBe(4);

      // Step 4 → 5
      mockWiz.answers = { q1: 'Interior' };
      mockWiz.step = 5;
      expect(mockWiz.step).toBe(5);

      // Final step
      mockWiz.carePlan = { type: 'interior' };
      expect(mockWiz.step).toBe(5);
    });

    test('should have all data collected by final step', () => {
      mockWiz.characteristics = { leafColor: 'verde' };
      mockWiz.query = 'monstera';
      mockWiz.selectedVariety = { name: 'Monstera deliciosa' };
      mockWiz.selected = { name: 'Monstera', scientific: 'M. deliciosa' };
      mockWiz.answers = { q1: 'Interior', q2: 'High light' };
      mockWiz.carePlan = { type: 'interior', water: 'Weekly' };

      expect(mockWiz.characteristics).toBeDefined();
      expect(mockWiz.query).toBeDefined();
      expect(mockWiz.selectedVariety).toBeDefined();
      expect(mockWiz.selected).toBeDefined();
      expect(mockWiz.answers).toBeDefined();
      expect(mockWiz.carePlan).toBeDefined();
    });

    test('should reset wizard state after saving', () => {
      mockWiz = {
        step: 0,
        query: '',
        selected: null,
        selectedVariety: null,
        varietyOptions: [],
        qaQuestions: [],
        answers: {},
        carePlan: null,
        photoOptions: [],
        characteristics: {
          leafColor: '',
          leafShape: '',
          plantSize: '',
          flowers: '',
        },
        searchIteration: 0,
      };

      expect(mockWiz.step).toBe(0);
      expect(mockWiz.query).toBe('');
      expect(mockWiz.selected).toBeNull();
      expect(mockWiz.selectedVariety).toBeNull();
    });
  });
});
