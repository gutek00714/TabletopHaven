const path = require('path');
const dotenvPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: dotenvPath });
const db = require('./db'); // Your database module

async function createGroup() {
    const group = {
        id: 1, // Hardcoded ID
        name: "Example Group",
        description: "This is a test group.",
        owner_id: 1 // Assuming owner_id is 1 for testing purposes
    };

    try {
        await db.none(
            'INSERT INTO groups (id, name, description, owner_id) VALUES (${id}, ${name}, ${description}, ${owner_id}) ON CONFLICT (id) DO NOTHING;',
            group
        );
        console.log('Group created:', group.name);
    } catch (error) {
        console.error('Error creating group:', error);
    }
}

createGroup();
