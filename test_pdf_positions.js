const PlaceholderPositionHelper = require('./backend/utils/placeholderPositionHelper');
const path = require('path');

async function main() {
    const helper = new PlaceholderPositionHelper();
    try {
        const guidePath = await helper.createPositionGuide();
        console.log('Position guide created at:', guidePath);
        
        const configPath = await helper.generateConfigFile();
        console.log('Config file created at:', configPath);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
