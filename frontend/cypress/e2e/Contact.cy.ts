describe('template spec', () => {
  it('passes', () => {
    cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/contact')
  })
});

it('Contact', function() {
  cy.visit('https://brave-plant-0f5043a03.1.azurestaticapps.net/contact')
  
  cy.get('div:nth-child(1) > button.send-btn > mat-icon.mat-icon').click();
  cy.get('div:nth-child(2) > button.send-btn > mat-icon.mat-icon').click();
  cy.get('div:nth-child(3) mat-icon.mat-icon').click();
  cy.get('div:nth-child(4) mat-icon.mat-icon').click();
  cy.get('div:nth-child(5) mat-icon.mat-icon').click();
  cy.get('div:nth-child(6) mat-icon.mat-icon').click();
  cy.get('div:nth-child(7) mat-icon.mat-icon').click();
  cy.get('div:nth-child(8) mat-icon.mat-icon').click();
  
  cy.get(':nth-child(2) > .contact-left > .text > .name').should('be.visible').should('contain', 'Jasmine Cluy')
  cy.get(':nth-child(2) > .contact-left > .text > .role').should('be.visible').should('contain', 'Sales Director')
  cy.get(':nth-child(2) > .contact-left > .avatar').should('be.visible')
  cy.get('div:nth-child(1) > div.contact-left > div.text > div.name').should('be.visible').should('contain', 'Michael Jisacle')
  cy.get('div:nth-child(1) > div.contact-left > div.text > div.role').should('be.visible').should('contain', 'CEO')
  cy.get('div:nth-child(1) > div.contact-left > div.avatar').should('be.visible')
});