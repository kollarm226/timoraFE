describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/dashboard')
  })
});

it('Dashboard', function() {
  cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/dashboard')
  
  cy.get('h1').should('contain' , 'Upcoming vacations').should('be.visible')
  cy.get('mat-card:nth-child(1) h2').should('contain' , 'Contact').should('be.visible')
  cy.get('mat-card:nth-child(2) h2').should('contain' , 'Announcements').should('be.visible')
  cy.get('mat-card.docs h2').should('contain' , 'Documents').should('be.visible')
  cy.get('div.page').should('contain' , 'This is a overview from this summer.').should('be.visible')
  cy.get('.grid > :nth-child(1) > :nth-child(2)').should('contain' , 'Michael Jisacle').should('be.visible')
  cy.get(':nth-child(2) > .muted').should('contain' , 'No notices').should('be.visible')
  cy.get('.docs > .muted').should('contain' , 'Summer Newsletter').should('be.visible')
  cy.get(':nth-child(1) > .role').should('contain' , 'CEO').should('be.visible')
  cy.get(':nth-child(1) > .avatar').should('be.visible')
  cy.get('.docs > .mat-icon').should('be.visible')
  
});