describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/faq')
  })
});

it('Faq', function() {
  cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/faq')
  
  cy.get('li:nth-child(1)').should('contain' , 'Open the application and sign in with your company account.').should('be.visible')
  cy.get('li:nth-child(2)').should('contain' , 'In the calendar, click the days you want to mark as vacation.').should('be.visible')
  cy.get('li:nth-child(3)').should('contain' , 'Select the type of vacation (for example regular leave, home office, doctor, sick leave, other).').should('be.visible')
  cy.get('li:nth-child(4)').should('contain' , 'Submit your request and wait for it to be approved by your manager.').should('be.visible')
  
  cy.get('section:nth-child(2) h2').should('contain' , 'Who approves my request?').should('be.visible')
  cy.get('section:nth-child(2) p').should('contain' , 'Your direct manager is always responsible for approving your vacation. You will receive a notification about the status of your request by e‑mail or directly in the app.').should('be.visible')
  
  cy.get('section:nth-child(3) h2').should('contain' , 'Can I change or cancel my reservation?').should('be.visible')
  cy.get('section:nth-child(3) p').should('contain' , 'Yes, as long as it has not been finally approved yet. In that case you can edit your request or ask your manager to cancel it.').should('be.visible')
  cy.get('section:nth-child(4) h2').should('contain' , 'Can my team see my vacation?').should('be.visible')
  cy.get('section:nth-child(4) p').should('contain' , 'Yes, the team overview shows a list of all approved vacations. This helps colleagues plan their work and cover for each other in advance.').should('be.visible')
  cy.get('section:nth-child(5) h2').should('contain' , 'Will I receive a reminder before my vacation?').should('be.visible')
  cy.get('section:nth-child(5) p').should('contain' , 'Yes. A few days before your vacation starts you will receive an e‑mail and/or a notification in the app so that you do not forget about your time off.').should('be.visible')
  cy.get('section:nth-child(6) h2').should('contain' , 'What if I cannot sign in?').should('be.visible')
  cy.get('section:nth-child(6) p').should('contain' , 'First check that you are using the correct company login details. If the problem persists, contact your IT department or reach out to us at it-support@firma.sk.').should('be.visible')
});