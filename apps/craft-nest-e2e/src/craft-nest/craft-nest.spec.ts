import axios from 'axios';

const baseUrl = process.env['API_BASE_URL'] || 'http://localhost:3000';

describe('GET /api', () => {
  it('should return a message', async () => {
    const res = await axios.get(`${baseUrl}/api`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual('Welcome to Craft Fusion API!');
  });
});
