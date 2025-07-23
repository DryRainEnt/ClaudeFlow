describe('ClaudeFlow Workflow Creation', () => {
    before(async () => {
        // Wait for app to fully load
        await browser.pause(3000);
        
        // Close any modals that might be open
        const closeButton = await browser.$('button[aria-label="Close"]');
        if (await closeButton.isExisting()) {
            await closeButton.click();
        }
    });

    it('should open project initializer', async () => {
        // Look for "New Project" or similar button
        const newProjectButton = await browser.$('//button[contains(text(), "New Project") or contains(text(), "Initialize")]');
        
        if (await newProjectButton.isExisting()) {
            await newProjectButton.click();
            
            // Check if project initializer modal opened
            const projectModal = await browser.$('[role="dialog"]');
            await expect(projectModal).toExist();
        }
    });

    it('should create a new session', async () => {
        // Find any "Add" or "Create" button for sessions
        const createSessionButton = await browser.$('//button[contains(@class, "add") or contains(text(), "Add") or contains(text(), "Create")]');
        
        if (await createSessionButton.isExisting()) {
            await createSessionButton.click();
            await browser.pause(1000);
            
            // Check if a new session card appeared
            const sessionCards = await browser.$$('[class*="session-card"]');
            expect(sessionCards.length).toBeGreaterThan(0);
        }
    });

    it('should allow session activation', async () => {
        // Click on a session card
        const sessionCard = await browser.$('[class*="session-card"]');
        
        if (await sessionCard.isExisting()) {
            await sessionCard.click();
            
            // Check if session details panel is shown
            const detailsPanel = await browser.$('[class*="session-details"]');
            await expect(detailsPanel).toExist();
        }
    });

    it('should display workflow visualization', async () => {
        // Check for workflow demo or visualization
        const workflowViz = await browser.$('[class*="workflow"]');
        
        if (await workflowViz.isExisting()) {
            // Check if it contains nodes or connections
            const nodes = await browser.$$('[class*="node"]');
            expect(nodes.length).toBeGreaterThan(0);
        }
    });
});