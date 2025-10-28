const OpenAI = require('openai');

// Initialize OpenAI with API key from environment variables
let openai = null;
try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn('OpenAI initialization failed:', error.message);
}

class QuizGenerator {
  /**
   * Generate quiz questions based on course content
   * @param {string} topic - The main topic or subject
   * @param {string} content - The course content or lesson text
   * @param {number} difficulty - Difficulty level (1-5)
   * @param {number} numQuestions - Number of questions to generate
   * @returns {Promise<Array>} Array of generated quiz questions
   */
  static async generateQuestions(topic, content, difficulty = 3, numQuestions = 5) {
    try {
      // Check if OpenAI is available
      if (!openai) {
        console.warn('OpenAI not configured. Using fallback questions.');
        return this.generateFallbackQuestions(topic, numQuestions);
      }

      const prompt = `
You are an expert educational content creator. Based on the following course content, generate ${numQuestions} multiple-choice quiz questions about "${topic}".

COURSE CONTENT:
${content}

Requirements:
- Difficulty level: ${difficulty}/5 (1=easy, 5=very difficult)
- Each question should have 4 options (A, B, C, D)
- Only one correct answer per question
- Questions should test understanding, not just memorization
- Include a mix of question types: factual, conceptual, application-based
- Provide detailed explanations for why the correct answer is right
- Questions should be educational and accurate

Return the response in this exact JSON format:
{
  "questions": [
    {
      "text": "Question text here?",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correctAnswer": "A",
      "explanation": "Detailed explanation of why this answer is correct",
      "points": 1
    }
  ]
}

Ensure all questions are based on the provided content and are educationally appropriate.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert educational content creator who generates high-quality, accurate quiz questions based on provided course content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = completion.choices[0].message.content.trim();

      // Parse the JSON response
      const parsedResponse = JSON.parse(response);

      // Validate the response structure
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        throw new Error('Invalid response format from AI');
      }

      // Validate each question
      const validatedQuestions = parsedResponse.questions.map((q, index) => {
        if (!q.text || !q.options || !q.correctAnswer || !q.explanation) {
          throw new Error(`Invalid question format at index ${index}`);
        }

        // Ensure correct answer is one of A, B, C, D
        if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer.toUpperCase())) {
          throw new Error(`Invalid correct answer for question ${index + 1}`);
        }

        return {
          text: q.text,
          options: {
            A: q.options.A || 'Option A',
            B: q.options.B || 'Option B',
            C: q.options.C || 'Option C',
            D: q.options.D || 'Option D'
          },
          correctAnswer: q.correctAnswer.toUpperCase(),
          explanation: q.explanation,
          points: q.points || 1
        };
      });

      return validatedQuestions;

    } catch (error) {
      console.error('Error generating quiz questions:', error);

      // Fallback: return some basic questions if AI fails
      return this.generateFallbackQuestions(topic, numQuestions);
    }
  }

  /**
   * Generate fallback questions when AI fails
   * @param {string} topic - The topic name
   * @param {number} numQuestions - Number of questions needed
   * @returns {Array} Array of basic fallback questions
   */
  static generateFallbackQuestions(topic, numQuestions) {
    const fallbackQuestions = [
      {
        text: `What is the main focus of ${topic}?`,
        options: {
          A: `Understanding the core concepts of ${topic}`,
          B: `Memorizing definitions related to ${topic}`,
          C: `Applying ${topic} in practical scenarios`,
          D: `All of the above aspects of ${topic}`
        },
        correctAnswer: "D",
        explanation: `A comprehensive understanding of ${topic} involves all these aspects: core concepts, definitions, and practical application.`,
        points: 1
      },
      {
        text: `Which of the following best describes the importance of ${topic} in modern education?`,
        options: {
          A: "It provides foundational knowledge for advanced studies",
          B: "It helps develop critical thinking skills",
          C: "It prepares students for real-world applications",
          D: "All of the above"
        },
        correctAnswer: "D",
        explanation: `${topic} plays a crucial role in education by providing foundational knowledge, developing critical thinking, and preparing for practical applications.`,
        points: 1
      }
    ];

    // Return requested number of questions, cycling through fallbacks if needed
    const questions = [];
    for (let i = 0; i < numQuestions && i < fallbackQuestions.length; i++) {
      questions.push(fallbackQuestions[i]);
    }

    // If we need more questions than available fallbacks, create generic ones
    while (questions.length < numQuestions) {
      questions.push({
        text: `What is an important concept to understand in ${topic}?`,
        options: {
          A: "Basic principles and fundamentals",
          B: "Advanced theoretical concepts",
          C: "Practical applications and examples",
          D: "All of the above are important"
        },
        correctAnswer: "D",
        explanation: `Understanding ${topic} requires knowledge of basic principles, theoretical concepts, and practical applications.`,
        points: 1
      });
    }

    return questions;
  }

  /**
   * Generate a complete quiz object for saving to database
   * @param {string} title - Quiz title
   * @param {string} description - Quiz description
   * @param {string} topic - The topic/content for question generation
   * @param {string} content - The course content
   * @param {number} difficulty - Difficulty level (1-5)
   * @param {number} numQuestions - Number of questions
   * @returns {Promise<Object>} Complete quiz object
   */
  static async generateQuiz(title, description, topic, content, difficulty = 3, numQuestions = 5) {
    const questions = await this.generateQuestions(topic, content, difficulty, numQuestions);

    return {
      title,
      description,
      questions,
      timeLimit: Math.max(10, numQuestions * 2), // 2 minutes per question, minimum 10 minutes
      generatedByAI: true,
      generatedAt: new Date()
    };
  }
}

module.exports = QuizGenerator;
