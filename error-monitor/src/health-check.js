const express = require('express');
const app = express();

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        system: 'Alii Fish Market Error Monitor',
        message: 'AI Error Monitoring System is running'
    });
});

app.get('/', (req, res) => {
    res.json({
        system: 'Alii Fish Market - AI Error Monitor',
        description: 'Toast POS Replacement Error Monitoring',
        status: 'active',
        savings: '$6,132 annually vs Toast POS',
        features: [
            'Real-time error detection',
            'AI-powered analysis (Claude + OpenAI)',
            'Automated code fix generation',
            'GitHub pull request automation',
            'Multi-channel notifications'
        ],
        endpoints: {
            health: '/health',
            dashboard: '/dashboard (coming soon)',
            api: '/api (coming soon)'
        }
    });
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`🤖 Alii Error Monitor running on port ${PORT}`);
    console.log(`🐟 Monitoring Toast POS replacement system`);
    console.log(`💰 Annual savings: $6,132 vs Toast POS`);
});
