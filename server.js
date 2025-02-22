const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.post('/api/estimate-price', async (req, res) => {
    const { service } = req.body;
    
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: "deepseek/deepseek-r1:free",
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional handyman pricing assistant for UK services. Use these guidelines for consistent pricing:

Basic Services (£30-40/hr):
- Basic repairs
- Furniture assembly
- Picture hanging
- Simple installations

Standard Services (£40-70/hr):
- General plumbing work
- Basic electrical work
- Painting and decorating
- Door/window repairs
- Basic shelving

Complex Services (£70-120/hr):
- Custom carpentry
- Complex installations
- Loft ladder installation
- Multiple trade skills required
- Emergency callouts

Specialized Services (£120-200/hr):
- Custom loft conversions
- Complex electrical work
- Specialized installations
- Multi-day projects
- Custom building work

Analyze the requested service, match it to the appropriate category, and provide a consistent price within that range. Return ONLY the hourly rate in £XX format.`
                    },
                    {
                        role: 'user',
                        content: `Based on this service description, what is the appropriate hourly rate: "${service}"`
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'https://github.com/handyed/pricing',
                    'X-Title': 'HandyEd Pricing Calculator',
                    'Content-Type': 'application/json'
                }
            }
        );

        let price = response.data.choices[0].message.content.trim();
        
        // Extract only the first number found after £ symbol
        const priceMatch = price.match(/£(\d+)/);
        if (priceMatch) {
            let numericPrice = parseInt(priceMatch[1]);
            
            // Only validate for extremely unreasonable prices
            if (numericPrice < 30) numericPrice = 30; // Minimum reasonable rate
            if (numericPrice > 3000) numericPrice = 3000; // Prevent extremely unreasonable rates
            
            price = `£${numericPrice}`;
        } else {
            // Default fallback price if no valid price format is found
            price = '£75';
        }
        
        res.json({ price });
    } catch (error) {
        console.error('Error details:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to estimate price. Please try again.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 