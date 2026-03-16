/**
 * Test fixtures and sample data
 */

const validMessages = [
  {
    role: 'user',
    content: 'What is a Monstera plant?',
  },
];

const invalidMessages = {
  empty: [],
  notArray: 'not an array',
  missingRole: [{ content: 'test' }],
  missingContent: [{ role: 'user' }],
  invalidRole: [{ role: 'invalid', content: 'test' }],
  tooLong: Array(51).fill({ role: 'user', content: 'test' }),
  contentTooLong: [
    {
      role: 'user',
      content: 'x'.repeat(50001),
    },
  ],
};

const validPlantData = {
  name: 'Monstera Deliciosa',
  scientific: 'Monstera deliciosa',
  type: 'interior',
  emoji: '🌿',
  care: {
    water: 'Cada 7-10 días',
    light: 'Luz indirecta brillante',
    difficulty: 'Fácil',
  },
};

const invalidPlantData = {
  missingName: { type: 'interior' },
  missingType: { name: 'Test Plant' },
  invalidType: { name: 'Test', type: 'invalid' },
  xssAttempt: {
    name: '<script>alert("xss")</script>',
    type: 'interior',
  },
};

module.exports = {
  validMessages,
  invalidMessages,
  validPlantData,
  invalidPlantData,
};
