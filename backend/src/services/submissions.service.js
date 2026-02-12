import { v4 as uuidv4 } from 'uuid';

class SubmissionsService {
  constructor() {
    this.submissions = new Map();
    this.submissionsList = [];
  }

  /**
   * 
   * @param {Object} data 
   * @param {string} data.email 
   * @param {number} data.amount 
   * @param {string} data.idempotencyKey 
   * @returns {Promise<Object>} 
   */
  async create(data) {
    const { email, amount, idempotencyKey } = data;

    if (this.submissions.has(idempotencyKey)) {

      console.log(`✅ Duplicate submission detected for key: ${idempotencyKey}`);
      return this.submissions.get(idempotencyKey);
    }
    const random = Math.random();
    if (random < 0.3) {
      console.log('❌ Simulating 503 - Temporary Failure');
      const error = new Error('Service temporarily unavailable');
      error.status = 503;
      throw error;
    }

    if (random < 0.6) {
      const delay = Math.floor(Math.random() * 5000) + 5000; 
      console.log(`⏳ Simulating delayed success - waiting ${delay}ms`);
      await this.delay(delay);
    }

    const submission = {
      id: uuidv4(),
      email,
      amount,
      idempotencyKey,
      createdAt: new Date().toISOString(),
      status: 'success',
    };

    this.submissions.set(idempotencyKey, submission);
    this.submissionsList.push(submission);

    console.log(`✅ Submission created successfully: ${submission.id}`);
    return submission;
  }

  /**
   * @returns {Array} 
   */

  findAll() {
    return [...this.submissionsList].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  /**
   * @param {string} idempotencyKey 
   * @returns {Object|undefined}
   */
  findByIdempotencyKey(idempotencyKey) {
    return this.submissions.get(idempotencyKey);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clear() {
    this.submissions.clear();
    this.submissionsList = [];
    console.log('🗑️  All submissions cleared');
  }
}

export default new SubmissionsService();