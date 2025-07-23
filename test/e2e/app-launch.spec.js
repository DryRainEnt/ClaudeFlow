describe('ClaudeFlow App Launch', () => {
    it('should launch the application', async () => {
        // Check if app window exists
        const appWindow = await browser.$('body');
        await expect(appWindow).toExist();
    });

    it('should display the main layout', async () => {
        // Wait for React to render
        await browser.pause(2000);
        
        // Check for main app container
        const rootElement = await browser.$('#root');
        await expect(rootElement).toExist();
        
        // Check if the app rendered content (not blank)
        const content = await rootElement.getHTML();
        expect(content.length).toBeGreaterThan(50);
    });

    it('should show API key setup on first run', async () => {
        // Look for settings modal or first-run experience
        const settingsModal = await browser.$('[class*="modal"]');
        const settingsExist = await settingsModal.isExisting();
        
        if (settingsExist) {
            // Check for API key input field
            const apiKeyInput = await browser.$('input[type="password"]');
            await expect(apiKeyInput).toExist();
        }
    });

    it('should have resizable panels', async () => {
        // Check for panel resize handle
        const resizeHandle = await browser.$('[data-panel-resize-handle-id]');
        await expect(resizeHandle).toExist();
    });

    it('should display session hierarchy', async () => {
        // Check for Manager section
        const managerSection = await browser.$('//h3[contains(text(), "Manager")]');
        await expect(managerSection).toExist();
        
        // Check for Supervisor section
        const supervisorSection = await browser.$('//h3[contains(text(), "Supervisor")]');
        await expect(supervisorSection).toExist();
        
        // Check for Worker section  
        const workerSection = await browser.$('//h3[contains(text(), "Worker")]');
        await expect(workerSection).toExist();
    });
});