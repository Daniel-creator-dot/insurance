const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { verifyToken } = require('./auth');

const router = express.Router();

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Get AI response for dashboard queries
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, role } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!genAI.apiKey) {
      return res.status(500).json({ message: 'AI service not configured' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create role-specific prompt
    const prompt = createPrompt(message, role, req.user);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      message: text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ message: 'AI service temporarily unavailable' });
  }
});

// Get AI insights for dashboard
router.get('/insights', verifyToken, async (req, res) => {
  try {
    const role = req.user.role;
    
    if (!genAI.apiKey) {
      return res.status(500).json({ message: 'AI service not configured' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Get relevant data based on role
    let dataPrompt = '';
    
    if (role === 'SUPER_ADMIN') {
      dataPrompt = 'Provide business insights for an insurance broker system administrator.';
    } else if (role === 'MARKETER') {
      dataPrompt = 'Provide marketing insights and suggestions for an insurance marketer.';
    } else if (role === 'SALES_AGENT') {
      dataPrompt = 'Provide sales insights and client management suggestions for an insurance sales agent.';
    } else if (role === 'ACCOUNTANT') {
      dataPrompt = 'Provide financial insights and accounting suggestions for an insurance accountant.';
    }

    const prompt = `${dataPrompt} Focus on actionable insights and best practices. Keep the response concise and professional.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      insights: text,
      role: role,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ message: 'AI service temporarily unavailable' });
  }
});

// Get AI recommendations for policies
router.get('/policy-recommendations', verifyToken, async (req, res) => {
  try {
    const role = req.user.role;
    
    if (!genAI.apiKey) {
      return res.status(500).json({ message: 'AI service not configured' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Provide policy recommendations for ${role.replace('_', ' ')}. 
    Include suggestions for:
    1. Best-selling policy types
    2. Client targeting strategies
    3. Policy pricing recommendations
    4. Risk assessment guidelines
    
    Format as a structured list with clear recommendations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      recommendations: text,
      role: role,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI policy recommendations error:', error);
    res.status(500).json({ message: 'AI service temporarily unavailable' });
  }
});

// Helper function to create role-specific prompts
function createPrompt(message, role, user) {
  const basePrompt = `
    You are Robort, an AI assistant for Insurify Broker Systems.
    User Role: ${role.replace('_', ' ')}
    User Name: ${user.name}
    
    Current Context: Insurance brokerage management system
    
    User Query: "${message}"
    
    Please provide a helpful, professional response that is relevant to insurance brokerage operations.
    Focus on actionable advice and industry best practices.
    Keep your response concise and to the point.
    
    If the user asks about system features, provide guidance on how to use the system effectively.
    If the user asks for data analysis, provide insights based on typical insurance industry metrics.
    If the user asks for recommendations, provide industry-standard best practices.
    
    Do not make up specific data about the user's actual system or clients.
    Provide general guidance that would be applicable to insurance professionals.
  `;

  return basePrompt;
}

module.exports = router;